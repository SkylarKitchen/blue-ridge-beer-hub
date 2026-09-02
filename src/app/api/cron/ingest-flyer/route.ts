import {
  renderApprovalEmail,
  sendAlert,
  sendEmail,
} from "@/lib/pipeline/email";
import { extractEventsFromPost } from "@/lib/pipeline/claude";
import { createDraftsForNewEvents, getRecipients } from "@/lib/pipeline/drafts";
import { fetchNewPosts } from "@/lib/pipeline/facebook";
import { getPipelineState, savePipelineState } from "@/lib/pipeline/state";
import { signApprovalToken } from "@/lib/pipeline/token";
import { SITE_URL } from "@/lib/site";
import { writeClient } from "@/sanity/serverClient";

export const maxDuration = 60;

const APPROVAL_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_POSTS_PER_RUN = 5;

export async function GET(request: Request) {
  if (
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const state = await getPipelineState();
    const posts = await fetchNewPosts({
      pageId: process.env.FB_PAGE_ID!,
      token: process.env.FB_PAGE_TOKEN!,
      sinceIso: state.cursor,
    });
    const eligiblePosts = posts
      .filter((post) => !state.processedPostIds.includes(post.id))
      .filter((post) => post.imageUrls.length > 0);
    const candidates = eligiblePosts.slice(0, MAX_POSTS_PER_RUN);
    const truncated = eligiblePosts.length > MAX_POSTS_PER_RUN;

    const allDraftIds: string[] = [];
    let eventCount = 0;
    for (const post of candidates) {
      const events = await extractEventsFromPost(post);
      const draftIds = await createDraftsForNewEvents(events, post.id);
      allDraftIds.push(...draftIds);
      eventCount += draftIds.length;
    }

    if (allDraftIds.length > 0) {
      const recipients = await getRecipients();
      if (recipients.length === 0) {
        await sendAlert(
          "No recipients configured",
          "Drafts were created but pipelineEmails and PIPELINE_FALLBACK_EMAIL are both empty.",
        );
      } else {
        const token = signApprovalToken(
          { draftIds: allDraftIds, exp: Date.now() + APPROVAL_TTL_MS },
          process.env.PIPELINE_SECRET!,
        );
        await sendEmail({
          to: recipients,
          subject: `New flyer spotted — ${eventCount} event${eventCount === 1 ? "" : "s"} ready to publish`,
          html: renderApprovalEmail(
            // Re-fetch the drafts so the email reflects exactly what was
            // written to Sanity.
            allDraftIds.length ? await draftsForEmail(allDraftIds) : [],
            `${SITE_URL}/api/pipeline/approve?token=${encodeURIComponent(token)}`,
            `${SITE_URL}/studio`,
          ),
        });
      }
    }

    // Every post seen this run is now processed — parsed, skipped (no image),
    // or beyond the per-run cap gets retried tomorrow (not marked).
    const processedNow = candidates.map((post) => post.id);
    const skippedNoImage = posts
      .filter((post) => post.imageUrls.length === 0)
      .map((post) => post.id);
    const newestTime = posts[0]?.createdTime;
    await savePipelineState({
      // If more image-bearing candidates existed than the per-run cap
      // allowed, don't advance the cursor past them — otherwise tomorrow's
      // since= query would skip the truncated posts forever. processedPostIds
      // already prevents double-processing when tomorrow re-fetches them.
      cursor: truncated ? state.cursor : (newestTime ?? state.cursor),
      processedPostIds: [
        ...state.processedPostIds,
        ...processedNow,
        ...skippedNoImage,
      ],
    });

    return Response.json({
      posts: candidates.length,
      drafts: allDraftIds.length,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    await sendAlert(
      detail.includes("FB_TOKEN_DEAD")
        ? "Facebook Page token is dead — re-auth needed"
        : "Pipeline run failed",
      detail,
    );
    return new Response("Pipeline error", { status: 500 });
  }
}

async function draftsForEmail(draftIds: string[]) {
  return writeClient.fetch<
    {
      title: string;
      start: string;
      endTime?: string;
      category: "music" | "art" | "games" | "party" | "community";
    }[]
  >(`*[_id in $ids]{title, start, endTime, category} | order(start asc)`, {
    ids: draftIds,
  });
}
