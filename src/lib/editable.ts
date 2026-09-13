import { getPublishedId } from "@sanity/client/csm";
import { parse as parsePath } from "@sanity/mutate/path";
import { decodeSanityNodeData } from "@sanity/visual-editing-csm";
import { vercelStegaDecode } from "@vercel/stega";
import { createDataAttribute } from "next-sanity";

import type { EditScope } from "./edit-scope.ts";

export { SITE_SETTINGS_ID } from "./edit-scope.ts";

/**
 * `data-sanity` for values that carry no stega (numbers, booleans) inside a
 * block. Click-to-edit then opens the right field in the Studio pane.
 */
export function editAttribute(scope: EditScope, field: string): string {
  return createDataAttribute({
    id: scope.documentId,
    type: scope.documentType,
  })(scope.field(field));
}

/**
 * Where a rendered string came from in Sanity. In draft-mode previews every
 * string carries an invisible stega payload pointing at the document and
 * field that produced it — which is exactly what an in-canvas editor needs
 * to write the edit back. Published pages carry no stega, so `null` there.
 */
export interface EditTarget {
  /** Published document id; the mutator resolves the draft from it. */
  id: string;
  type?: string;
  /** Studio path string, e.g. `offerings[_key=="a1"].title`. */
  path: string;
}

/**
 * Decodes the stega payload on a rendered string. Returns null for plain
 * strings — published pages, fallback copy, or anything Sanity didn't encode
 * (numbers, GROQ-computed values) — which is the signal to render read-only.
 */
export function decodeEditTarget(value: unknown): EditTarget | null {
  if (typeof value !== "string" || value === "") return null;

  let payload: unknown;
  try {
    payload = vercelStegaDecode(value);
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") return null;

  // decodeSanityNodeData understands every href shape the encoder emits,
  // including studio base URLs that carry their own query string.
  const node = decodeSanityNodeData(
    payload as Parameters<typeof decodeSanityNodeData>[0],
  );
  if (!node || !("id" in node) || !node.id || !node.path) return null;

  return { id: getPublishedId(node.id), type: node.type, path: node.path };
}

function isKeyedSegment(segment: unknown): segment is { _key: string } {
  return (
    typeof segment === "object" &&
    segment !== null &&
    !Array.isArray(segment) &&
    "_key" in segment
  );
}

/**
 * Reads a Studio path out of a document snapshot. Used to pull the freshly
 * mutated value back out of the optimistic document the Studio pushes down,
 * so a field can re-render from a keystroke with no network round trip.
 */
export function valueAtPath(doc: unknown, path: string): unknown {
  let cursor: unknown = doc;

  for (const segment of parsePath(path) as unknown[]) {
    if (cursor === null || cursor === undefined) return undefined;

    if (typeof segment === "string") {
      cursor = (cursor as Record<string, unknown>)[segment];
    } else if (typeof segment === "number") {
      cursor = Array.isArray(cursor) ? cursor[segment] : undefined;
    } else if (isKeyedSegment(segment)) {
      cursor = Array.isArray(cursor)
        ? cursor.find(
            (item) => (item as { _key?: string })?._key === segment._key,
          )
        : undefined;
    } else {
      // Index tuples (`[0,2]` slices) never address a single editable field.
      return undefined;
    }
  }

  return cursor;
}

/**
 * The text of a Portable Text block that's a single unformatted run — the
 * shape every About paragraph has today. Those can be edited on the page as
 * plain text, because the stega on the span points straight at
 * `aboutBody[_key=="…"].children[_key=="…"].text`. Anything richer (a link,
 * bold, a list) returns null and falls back to read-only rendering rather
 * than risk flattening formatting the owners can't get back.
 */
export function simpleBlockText(block: unknown): string | null {
  if (!block || typeof block !== "object") return null;
  const candidate = block as {
    _type?: string;
    style?: string;
    children?: unknown[];
    markDefs?: unknown[];
  };
  if (candidate._type !== "block") return null;
  if (candidate.style && candidate.style !== "normal") return null;
  if (candidate.markDefs?.length) return null;
  if (!Array.isArray(candidate.children) || candidate.children.length !== 1) {
    return null;
  }
  const span = candidate.children[0] as {
    _type?: string;
    marks?: unknown[];
    text?: unknown;
  };
  if (span?._type !== "span" || span.marks?.length) return null;
  return typeof span.text === "string" ? span.text : null;
}

/**
 * Collapses a contentEditable's text back to what the field should hold.
 * Single-line fields flatten pasted newlines; multiline ones keep them but
 * drop the trailing newline browsers leave behind after a block break.
 */
export function normalizeEditedText(text: string, multiline: boolean): string {
  if (!multiline) return text.replace(/\s*\n+\s*/g, " ");
  return text.replace(/\n$/, "");
}
