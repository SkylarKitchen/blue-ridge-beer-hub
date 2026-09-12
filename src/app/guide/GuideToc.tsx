"use client";

import { useEffect, useState } from "react";

type Item = { id: string; text: string };

/**
 * "On this page" navigation for the owners' guide. A sticky list on wide
 * screens, a collapsible one above the article on phones. Tracks which
 * section is on screen so the owners can tell where they are in a long page.
 */
export function GuideToc({ items }: { items: Item[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!headings.length) return;

    // The heading nearest the top of the viewport (but not below its top
    // third) is the current one; falling back to the first heading.
    const update = () => {
      const line = window.innerHeight / 3;
      let current = headings[0].id;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= line) current = heading.id;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items]);

  const list = (
    <ol className="guide-toc__list">
      {items.map((item) => (
        <li key={item.id}>
          <a href={`#${item.id}`} aria-current={active === item.id ? "location" : undefined}>
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <nav aria-label="On this page" className="guide-toc hidden lg:block print:hidden">
        <div className="sticky top-24">
          <p className="guide-toc__title">On this page</p>
          {list}
        </div>
      </nav>
      <details className="guide-toc guide-toc--mobile lg:hidden print:hidden">
        <summary>On this page</summary>
        {list}
      </details>
    </>
  );
}
