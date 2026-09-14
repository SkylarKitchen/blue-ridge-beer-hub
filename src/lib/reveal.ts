/**
 * The scroll-reveal driver behind RevealObserver, with the DOM injected so
 * it can be tested under `node --test` without a browser.
 *
 * Marks [data-reveal] / [data-reveal-group] elements with data-inview as
 * they enter the viewport. The hidden state in globals.css only applies once
 * html[data-reveals] is set here, so content is never blanked for no-JS
 * visitors — and anything already on screen when this starts is marked
 * in-view in the same synchronous pass, so it neither blinks nor
 * re-animates.
 *
 * Targets are not snapshotted once. Sanity Live re-renders the page in place
 * when the owners add a section in the Studio: React commits the new DOM
 * without remounting RevealObserver, so a one-time snapshot would never see
 * it, and with html[data-reveals] already set its children would sit at
 * opacity 0 for good. A MutationObserver on the body re-queries after every
 * DOM change and handles anything new the same way as the initial targets.
 */

export const REVEAL_SELECTOR = "[data-reveal], [data-reveal-group]";

export interface RevealElement {
  getBoundingClientRect(): { top: number; bottom: number };
  setAttribute(name: string, value: string): void;
}

export interface RevealDocument {
  documentElement: { setAttribute(name: string, value: string): void };
  body: object;
  querySelectorAll(selector: string): Iterable<RevealElement>;
}

export interface IntersectionEntryLike {
  isIntersecting: boolean;
  target: RevealElement;
}

export interface IntersectionObserverLike {
  observe(el: RevealElement): void;
  unobserve(el: RevealElement): void;
  disconnect(): void;
}

export interface MutationObserverLike {
  observe(
    target: object,
    options: { childList: boolean; subtree: boolean },
  ): void;
  disconnect(): void;
}

export interface RevealEnv {
  document: RevealDocument;
  viewportHeight(): number;
  createIntersectionObserver(
    onChange: (entries: ReadonlyArray<IntersectionEntryLike>) => void,
    options: { rootMargin: string },
  ): IntersectionObserverLike;
  createMutationObserver(onChange: () => void): MutationObserverLike;
}

/** Starts the reveals. Returns a function that stops them. */
export function startReveals(env: RevealEnv): () => void {
  const observer = env.createIntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.setAttribute("data-inview", "");
          observer.unobserve(entry.target);
        }
      }
    },
    // Fire once the element clears the bottom ~12% of the viewport.
    { rootMargin: "0px 0px -12% 0px" },
  );

  const handled = new WeakSet<RevealElement>();
  let revealsOn = false;

  // Mark on-screen targets in-view right away, watch the rest. The hidden
  // state is switched on with the first target so a page with none at start
  // still reveals ones added later.
  const handleNewTargets = () => {
    const viewportBottom = env.viewportHeight();
    for (const el of env.document.querySelectorAll(REVEAL_SELECTOR)) {
      if (handled.has(el)) continue;
      handled.add(el);
      if (!revealsOn) {
        revealsOn = true;
        env.document.documentElement.setAttribute("data-reveals", "");
      }
      const rect = el.getBoundingClientRect();
      if (rect.top < viewportBottom && rect.bottom > 0) {
        el.setAttribute("data-inview", "");
      } else {
        observer.observe(el);
      }
    }
  };

  handleNewTargets();

  const mutations = env.createMutationObserver(handleNewTargets);
  mutations.observe(env.document.body, { childList: true, subtree: true });

  return () => {
    mutations.disconnect();
    observer.disconnect();
  };
}
