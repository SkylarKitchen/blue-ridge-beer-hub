import type { ExtractedEvent } from "./extract";

const TZ = "America/New_York";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatWhen(iso: string, endIso?: string): string {
  const start = new Date(iso);
  const day = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: TZ,
  });
  const time = (d: Date) =>
    d
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: TZ,
      })
      .replace(":00", "");
  return endIso
    ? `${day} · ${time(start)}–${time(new Date(endIso))}`
    : `${day} · ${time(start)}`;
}

export function renderApprovalEmail(
  events: ExtractedEvent[],
  approveUrl: string,
  studioUrl: string,
): string {
  const rows = events
    .map(
      (event) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e0d5;font-weight:600">${escapeHtml(event.title)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e0d5">${formatWhen(event.start, event.endTime)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e0d5;color:#6b6b6b">${escapeHtml(event.category)}</td>
      </tr>`,
    )
    .join("");
  return `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:16px">
    <h1 style="font-size:20px">Found ${events.length} event${events.length === 1 ? "" : "s"} on your new flyer 🍻</h1>
    <p>Here's what the robot read. One tap puts them on the website.</p>
    <table style="border-collapse:collapse;width:100%">${rows}</table>
    <p style="margin:24px 0">
      <a href="${escapeHtml(approveUrl)}"
         style="background:#1d3557;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700">
        Publish all
      </a>
    </p>
    <p style="color:#6b6b6b;font-size:14px">
      Something's off — a wrong date or time? Fix it in the
      <a href="${escapeHtml(studioUrl)}">editing screen</a> instead, then publish there.
      This link works for 7 days. Nothing appears on the site until you tap.
    </p>
  </div>`;
}

async function postToResend(payload: object): Promise<Response> {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function sendEmail(opts: {
  to: string[];
  subject: string;
  html: string;
}): Promise<void> {
  const res = await postToResend({
    from: process.env.PIPELINE_FROM_EMAIL,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  if (!res.ok) {
    throw new Error(
      `Resend ${res.status}: ${(await res.text()).slice(0, 300)}`,
    );
  }
}

/** Maintainer alert. Never throws — an alert failure must not mask the original error. */
export async function sendAlert(
  subject: string,
  detail: string,
): Promise<void> {
  const to = process.env.PIPELINE_ALERT_EMAIL;
  if (!to) return;
  try {
    await sendEmail({
      to: [to],
      subject: `[beer-hub pipeline] ${subject}`,
      html: `<pre style="font-family:monospace;white-space:pre-wrap">${detail
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")}</pre>`,
    });
  } catch (error) {
    console.error("Alert email failed", error);
  }
}
