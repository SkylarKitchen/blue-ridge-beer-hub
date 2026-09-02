import { randomUUID } from "node:crypto";

import { writeClient } from "@/sanity/serverClient";

import { dedupeNewEvents } from "./dedupe";
import type { ExtractedEvent } from "./extract";

/** Create drafts for events not already present (drafts or published). */
export async function createDraftsForNewEvents(
  events: ExtractedEvent[],
  fbPostId: string,
): Promise<string[]> {
  const existing = await writeClient.fetch<{ title: string; start: string }[]>(
    `*[_type == "event"]{title, start}`,
  );
  const fresh = dedupeNewEvents(events, existing);
  const draftIds: string[] = [];
  for (const event of fresh) {
    const _id = `drafts.${randomUUID()}`;
    await writeClient.create({
      _id,
      _type: "event",
      title: event.title,
      start: event.start,
      ...(event.endTime ? { endTime: event.endTime } : {}),
      category: event.category,
      source: { fbPostId, ingestedAt: new Date().toISOString() },
    });
    draftIds.push(_id);
  }
  return draftIds;
}

/** Publish by copying each draft to its published ID and deleting the draft. */
export async function publishDrafts(draftIds: string[]): Promise<number> {
  let published = 0;
  for (const draftId of draftIds) {
    const doc = await writeClient.getDocument(draftId);
    if (!doc) continue; // already published or hand-deleted — idempotent no-op
    const { _rev, _updatedAt, _createdAt, ...rest } = doc;
    void _rev;
    void _updatedAt;
    void _createdAt;
    await writeClient
      .transaction()
      .createOrReplace({ ...rest, _id: draftId.replace(/^drafts\./, "") })
      .delete(draftId)
      .commit();
    published += 1;
  }
  return published;
}

export async function getRecipients(): Promise<string[]> {
  const emails = await writeClient.fetch<string[] | null>(
    `*[_type == "siteSettings" && _id == "siteSettings"][0].pipelineEmails`,
  );
  if (emails?.length) return emails;
  const fallback = process.env.PIPELINE_FALLBACK_EMAIL;
  return fallback ? [fallback] : [];
}
