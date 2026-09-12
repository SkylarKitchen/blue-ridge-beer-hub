"use client";

import type { SanityDocument } from "@sanity/client";
import { getDraftId, getPublishedId } from "@sanity/client/csm";
import { at, set } from "@sanity/mutate";
import {
  useDocuments,
  useOptimistic as useSanityOptimistic,
  useOptimisticActor,
} from "@sanity/visual-editing/react";
import { stegaClean } from "next-sanity";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import {
  decodeEditTarget,
  normalizeEditedText,
  SITE_SETTINGS_ID,
  valueAtPath,
} from "@/lib/editable";

/** How long typing pauses before the draft is written to Content Lake. */
const COMMIT_DEBOUNCE = 700;

type Actor = ReturnType<typeof useOptimisticActor>;

/**
 * Reference counting for `observe`. The optimistic mutator only tracks
 * documents something has asked it to watch, and the overlay only asks for
 * documents it found stega on — which our fields deliberately don't carry
 * (see the comment in `EditableField`). So each field registers its own
 * document, and the count keeps one field unmounting from cutting the
 * others off. Keyed by actor because it flips from empty to real once the
 * Presentation connection is up.
 */
const observed = new WeakMap<object, Map<string, number>>();

function retain(actor: Actor, ids: string[]): void {
  let counts = observed.get(actor);
  if (!counts) observed.set(actor, (counts = new Map()));
  for (const id of ids) {
    const next = (counts.get(id) ?? 0) + 1;
    counts.set(id, next);
    if (next === 1) actor.send({ type: "observe", documentId: id });
  }
}

function release(actor: Actor, ids: string[]): void {
  const counts = observed.get(actor);
  if (!counts) return;
  for (const id of ids) {
    const next = (counts.get(id) ?? 1) - 1;
    if (next > 0) {
      counts.set(id, next);
    } else {
      counts.delete(id);
      actor.send({ type: "unobserve", documentId: id });
    }
  }
}

export interface EditableFieldProps {
  /** The rendered Sanity string, stega payload still attached. */
  value?: string | null;
  /** What to render when the string isn't editable (no stega on it). */
  children?: ReactNode;
  /**
   * Field path to write to when `value` carries no stega — an empty field
   * showing its baked-in default, or a page served from `lib/fallback.ts`.
   * Without this, copy the owners have never touched would be the one thing
   * they couldn't edit on the page. Defaults to the Site Settings singleton;
   * pass `documentId`/`documentType` for anything else.
   */
  path?: string;
  documentId?: string;
  documentType?: string;
  /** Keep newlines — the hero headline breaks across three lines. */
  multiline?: boolean;
  className?: string;
  /** Announced to screen readers; falls back to the field path. */
  label?: string;
}

/**
 * A field the editor types straight into on the page. Rendered only inside
 * a draft-mode preview (see `Editable`), so none of this reaches visitors.
 *
 * Two things make it work:
 *
 * - **Reading.** `useOptimistic` subscribes to the Studio's in-memory copy
 *   of the document, so a change made in the Studio form lands here without
 *   a server round trip.
 * - **Writing.** `useDocuments().patch` mutates that same in-memory draft,
 *   then commits on a debounce.
 *
 * The text rendered here is `stegaClean`ed. It has to be: the invisible
 * characters live inside the element's text, so typing would write them
 * back into the document. Cleaning also hides the element from the
 * click-to-edit overlay — which is what we want, since an intercepted click
 * could never place a caret — and is why the document is observed by hand.
 */
export function EditableField({
  value,
  children,
  path,
  documentId = SITE_SETTINGS_ID,
  documentType = "siteSettings",
  multiline = false,
  className,
  label,
}: EditableFieldProps) {
  const target = useMemo(
    () =>
      decodeEditTarget(value) ??
      (path
        ? { id: getPublishedId(documentId), type: documentType, path }
        : null),
    [value, path, documentId, documentType],
  );
  const clean = stegaClean(value ?? "");

  const live = useSanityOptimistic<string, SanityDocument>(
    clean,
    (state, action) => {
      if (!target || action.id !== target.id) return state;
      const next = valueAtPath(action.document, target.path);
      return typeof next === "string" ? next : state;
    },
  );

  const actor = useOptimisticActor();
  const { getDocument } = useDocuments();
  const ref = useRef<HTMLSpanElement>(null);
  const [focused, setFocused] = useState(false);

  // React renders the text once (see `initial` below) and never touches it
  // again; after that this ref is the record of what's in the DOM.
  const written = useRef(clean);
  const [initial] = useState(clean);

  // Depends on the id, not the target object: re-decoding on every server
  // refresh yields a new object, and churning observe/unobserve would tear
  // the document mutator down mid-edit.
  const observedId = target?.id;
  useEffect(() => {
    if (!observedId) return undefined;
    const ids = [getDraftId(observedId), getPublishedId(observedId)];
    retain(actor, ids);
    return () => release(actor, ids);
  }, [actor, observedId]);

  // Pull Studio-side edits in — but never while the caret is here, or the
  // browser would drop the selection mid-word.
  useEffect(() => {
    const el = ref.current;
    if (!el || focused || written.current === live) return;
    el.textContent = live;
    written.current = live;
  }, [live, focused]);

  if (!target) return <>{children ?? clean}</>;

  const push = (commit: boolean) => {
    const el = ref.current;
    if (!el) return;
    const text = normalizeEditedText(el.innerText, multiline);
    if (text === written.current) return;
    written.current = text;
    try {
      // Typed as void, implemented as async — surface a rejection as a
      // warning rather than letting it escape unhandled.
      const pending: unknown = getDocument(target.id).patch(
        [at(target.path, set(text))],
        { commit: commit ? true : { debounce: COMMIT_DEBOUNCE } },
      );
      if (pending instanceof Promise) pending.catch(reportFailure);
    } catch (error) {
      reportFailure(error);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      const el = ref.current;
      if (el) {
        el.textContent = live;
        written.current = live;
      }
      el?.blur();
    }
    // Enter commits a single-line field rather than smuggling in a <div>.
    if (event.key === "Enter" && !multiline) {
      event.preventDefault();
      ref.current?.blur();
    }
  };

  // Browsers paste markup into contentEditable by default; force plain text.
  const onPaste = (event: ClipboardEvent<HTMLSpanElement>) => {
    event.preventDefault();
    const text = stegaClean(event.clipboardData.getData("text/plain"));
    document.execCommand(
      "insertText",
      false,
      multiline ? text : text.replace(/\s*\n+\s*/g, " "),
    );
  };

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={label ?? `Edit ${target.path}`}
      aria-multiline={multiline || undefined}
      tabIndex={0}
      data-editable={target.path}
      spellCheck
      style={multiline ? { whiteSpace: "pre-line" } : undefined}
      className={[
        "rounded-[3px] outline-2 outline-offset-2 outline-transparent",
        "cursor-text hover:outline-dashed hover:outline-current/40",
        "focus:outline-solid focus:outline-current",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        push(true);
      }}
      onInput={() => push(false)}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
    >
      {initial}
    </span>
  );
}

function reportFailure(error: unknown) {
  // A field can render before Presentation has the document ready; the next
  // keystroke retries, so this is a breadcrumb rather than an error state.
  console.warn("[visual editing] could not patch draft", error);
}
