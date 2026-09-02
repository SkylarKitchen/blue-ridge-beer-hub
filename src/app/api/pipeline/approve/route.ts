import { publishDrafts } from "@/lib/pipeline/drafts";
import { verifyApprovalToken } from "@/lib/pipeline/token";
import { writeClient } from "@/sanity/serverClient";
import { SITE_URL } from "@/lib/site";

export const maxDuration = 30;

function page(title: string, body: string): Response {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;background:#faf6ec;color:#1d3557;max-width:480px;margin:48px auto;padding:0 16px">
${body}
</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

function expiredPage(): Response {
  return page(
    "Link expired",
    `<h1>This link has expired</h1>
     <p>No worries — nothing was lost. You can publish the events yourself in the
     <a href="${SITE_URL}/studio">editing screen</a> (they're saved there as drafts),
     or wait for the next email.</p>`,
  );
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const payload = verifyApprovalToken(token, process.env.PIPELINE_SECRET!);
  if (!payload) return expiredPage();

  const drafts = await writeClient.fetch<{ title: string; start: string }[]>(
    `*[_id in $ids]{title, start} | order(start asc)`,
    {
      ids: payload.draftIds,
    },
  );
  if (drafts.length === 0) {
    return page(
      "Already published",
      `<h1>All set 🍻</h1><p>These events are already live on the site.</p>
       <p><a href="${SITE_URL}">See the site</a></p>`,
    );
  }

  const rows = drafts
    .map((d) => {
      const when = new Date(d.start).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "America/New_York",
      });
      const title = d.title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
      return `<li style="margin:6px 0"><strong>${title}</strong> — ${when}</li>`;
    })
    .join("");

  return page(
    "Publish events?",
    `<h1>Publish ${drafts.length} event${drafts.length === 1 ? "" : "s"}?</h1>
     <ul style="padding-left:20px">${rows}</ul>
     <form method="POST">
       <input type="hidden" name="token" value="${token.replace(/"/g, "&quot;")}">
       <button type="submit" style="background:#1d3557;color:#fff;border:0;padding:12px 24px;border-radius:6px;font-size:16px;font-weight:700;cursor:pointer">
         Yes, publish
       </button>
     </form>
     <p style="color:#6b6b6b;font-size:14px">Wrong date or time on one of these?
     Fix it in the <a href="${SITE_URL}/studio">editing screen</a> and publish there instead.</p>`,
  );
}

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const payload = verifyApprovalToken(token, process.env.PIPELINE_SECRET!);
  if (!payload) return expiredPage();

  const count = await publishDrafts(payload.draftIds);
  return page(
    "Published",
    `<h1>Done — ${count} event${count === 1 ? "" : "s"} published 🎉</h1>
     <p>They're live on <a href="${SITE_URL}">the website</a> now.
     Past events clean themselves up automatically.</p>`,
  );
}
