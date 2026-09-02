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

export const maxDuration = 300;

const APPROVAL_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_POSTS_PER_RUN = 5;

interface PendingDraft {
  _id: string;
  title: string;
  start: string;
  endTime?: string;
  category: "music" | "art" | "games" | "party" | "community";
}

export async function GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
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
    for (const post of candidates) {
      const events = await extractEventsFromPost(post);
      const draftIds = await createDraftsForNewEvents(events, post.id);
      allDraftIds.push(...draftIds);
    }

    // Email over the FULL pending backlog, not just this run's drafts. A run
    // that creates drafts for post A and then throws (Claude/Resend error)
    // returns 500 before saving state, so tomorrow's run re-processes post A,
    // dedupe suppresses its events, and allDraftIds comes back empty — that
    // gate would skip the email forever and orphan A's drafts. Re-fetching
    // every pending draft here self-heals partial-failure runs: the token is
    // signed over (and the email lists) whatever is actually still waiting,
    // regardless of which run created it. Only do this when the run found
    // candidates at all — a quiet day with nothing to process shouldn't nag
    // about drafts someone has deliberately parked.
    if (candidates.length > 0) {
      const pendingDrafts = await writeClient.fetch<PendingDraft[]>(
        `*[_id in path("drafts.**") && _type == "event" && defined(source)]{_id, title, start, endTime, category} | order(start asc)`,
      );

      if (pendingDrafts.length > 0) {
        const recipients = await getRecipients();
        if (recipients.length === 0) {
          await sendAlert(
            "No recipients configured",
            "Drafts were created but pipelineEmails and PIPELINE_FALLBACK_EMAIL are both empty.",
          );
        } else {
          const token = signApprovalToken(
            {
              draftIds: pendingDrafts.map((draft) => draft._id),
              exp: Date.now() + APPROVAL_TTL_MS,
            },
            process.env.PIPELINE_SECRET!,
          );
          await sendEmail({
            to: recipients,
            subject: `New flyer spotted — ${pendingDrafts.length} event${pendingDrafts.length === 1 ? "" : "s"} ready to publish`,
            html: renderApprovalEmail(
              pendingDrafts,
              `${SITE_URL}/api/pipeline/approve?token=${encodeURIComponent(token)}`,
              `${SITE_URL}/studio`,
            ),
          });
        }
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
