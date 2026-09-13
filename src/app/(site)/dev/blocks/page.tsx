import { notFound } from "next/navigation";

import { FeatureSection, type TrioLayout } from "@/components/FeatureSection";
import { RevealObserver } from "@/components/RevealObserver";
import { blockScope } from "@/lib/edit-scope";
import {
  toGoSeedSection,
  type FeatureBlock,
  type GalleryPhoto,
  type Section,
} from "@/lib/sections";
import { sanityFetch } from "@/sanity/live";
import { HOME_PAGE_QUERY } from "@/sanity/queries";

/** Renders every Feature layout with real photos. Development only. */
export default async function BlocksPreview() {
  if (process.env.NODE_ENV !== "development") notFound();

  // Borrow the first three photos from the Home Page's Photos section.
  const { data } = await sanityFetch({ query: HOME_PAGE_QUERY });
  const sections = ((data as { sections?: Section[] } | null)?.sections ??
    []) as Section[];
  const gallery = sections.find((s) => s._type === "galleryBlock");
  const photos = ((gallery?.photos ?? []) as GalleryPhoto[])
    .slice(0, 3)
    .map((photo, i) => ({ ...photo, _key: `p${i}` }));
  const seed = toGoSeedSection();
  // The seeded list is empty (owners fill it); the preview shows a sample.
  const sample: FeatureBlock = {
    ...seed,
    hiddenOnSite: false,
    listItems: [
      "Burial 4-packs, back on the shelf",
      "Cases of Highland Gaelic Ale",
      "Noble cider tallboys",
    ],
    listAsOf: "2026-09-12",
    ctaLabel: "Call ahead for a case",
    ctaUrl: "tel:+18282469320",
  };

  const variants: Array<[string, FeatureBlock, TrioLayout?]> = [
    [
      "one-right",
      { ...sample, photos: photos.slice(0, 1), photoSide: "right" },
    ],
    ["two-left", { ...sample, photos: photos.slice(0, 2), photoSide: "left" }],
    [
      "three-right",
      { ...sample, photos: photos.slice(0, 3), photoSide: "right" },
    ],
    [
      "three-right-grid",
      { ...sample, photos: photos.slice(0, 3), photoSide: "right" },
      "grid",
    ],
  ];

  return (
    <main>
      {variants.map(([key, block, trio]) => (
        <FeatureSection
          key={key}
          id={key}
          block={{ ...block, _key: key }}
          scope={blockScope(key)}
          trio={trio}
        />
      ))}
      {/* Same scroll reveal the homepage mounts, so the preview moves like the real page. */}
      <RevealObserver />
    </main>
  );
}
