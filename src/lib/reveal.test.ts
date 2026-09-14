import assert from "node:assert/strict";
import { test } from "node:test";

import {
  startReveals,
  type IntersectionEntryLike,
  type RevealElement,
  type RevealEnv,
} from "./reveal.ts";

/* ---------- Fakes ---------- */

class FakeEl implements RevealElement {
  attrs = new Map<string, string>();
  name: string;
  private top: number;
  private bottom: number;
  constructor(name: string, top: number, bottom: number) {
    this.name = name;
    this.top = top;
    this.bottom = bottom;
  }
  getBoundingClientRect() {
    return { top: this.top, bottom: this.bottom };
  }
  setAttribute(name: string, value: string) {
    this.attrs.set(name, value);
  }
  get inView() {
    return this.attrs.has("data-inview");
  }
}

function fakeEnv(initial: FakeEl[]) {
  const targets = [...initial];
  const html = new FakeEl("html", 0, 0);
  const observed = new Set<FakeEl>();
  let onIntersect: ((entries: IntersectionEntryLike[]) => void) | undefined;
  let onMutate: (() => void) | undefined;
  let intersectionDisconnected = false;
  let mutationDisconnected = false;

  const env: RevealEnv = {
    document: {
      documentElement: html,
      body: {},
      querySelectorAll: () => targets,
    },
    viewportHeight: () => 800,
    createIntersectionObserver(cb) {
      onIntersect = cb;
      return {
        observe: (el) => observed.add(el as FakeEl),
        unobserve: (el) => observed.delete(el as FakeEl),
        disconnect: () => {
          intersectionDisconnected = true;
        },
      };
    },
    createMutationObserver(cb) {
      onMutate = cb;
      return {
        observe: () => {},
        disconnect: () => {
          mutationDisconnected = true;
        },
      };
    },
  };

  return {
    env,
    html,
    observed,
    /** The element scrolls into view. */
    enter: (el: FakeEl) => onIntersect?.([{ isIntersecting: true, target: el }]),
    /** React commits new DOM (a Sanity Live refresh) containing `el`. */
    add: (el: FakeEl) => {
      targets.push(el);
      onMutate?.();
    },
    get disconnected() {
      return { intersection: intersectionDisconnected, mutation: mutationDisconnected };
    },
  };
}

const onScreen = (name: string) => new FakeEl(name, 100, 500);
const belowFold = (name: string) => new FakeEl(name, 2000, 2400);

/* ---------- Existing behavior ---------- */

test("targets on screen at start are marked in-view; others wait for the observer", () => {
  const seen = onScreen("hero");
  const later = belowFold("about");
  const { env, html, observed, enter } = fakeEnv([seen, later]);

  startReveals(env);

  assert.ok(html.attrs.has("data-reveals"), "hidden state is switched on");
  assert.ok(seen.inView);
  assert.ok(!later.inView);
  assert.ok(observed.has(later));

  enter(later);
  assert.ok(later.inView);
  assert.ok(!observed.has(later), "revealed once, then released");
});

/* ---------- The bug ----------
   Sanity Live re-renders the page in place when the owners add a section.
   RevealObserver stays mounted, so its one-time snapshot of targets never
   includes the new section. With html[data-reveals] already set, the new
   section's children stay at opacity 0: the owners see its background
   color and nothing else. */

test("a target added after start is revealed like any other", () => {
  const { env, observed, add, enter } = fakeEnv([onScreen("hero")]);
  startReveals(env);

  const addedOnScreen = onScreen("to-go");
  add(addedOnScreen);
  assert.ok(addedOnScreen.inView, "already on screen: marked in-view at once");

  const addedBelow = belowFold("kegs");
  add(addedBelow);
  assert.ok(!addedBelow.inView);
  assert.ok(observed.has(addedBelow), "below the fold: watched until it scrolls in");
  enter(addedBelow);
  assert.ok(addedBelow.inView);
});

test("a page with no targets at start still reveals ones added later", () => {
  const { env, html, add } = fakeEnv([]);
  startReveals(env);

  const late = onScreen("late");
  add(late);
  assert.ok(html.attrs.has("data-reveals"));
  assert.ok(late.inView);
});

test("an element is only handled once, however many mutations follow", () => {
  const { env, observed, add } = fakeEnv([onScreen("hero")]);
  startReveals(env);

  const el = belowFold("about");
  add(el);
  add(belowFold("kegs"));
  add(belowFold("cans"));
  assert.equal(observed.size, 3, "each target observed once");
  assert.ok(observed.has(el));
});

test("stop disconnects both observers", () => {
  const box = fakeEnv([onScreen("hero")]);
  const stop = startReveals(box.env);
  stop();
  assert.deepEqual(box.disconnected, { intersection: true, mutation: true });
});
