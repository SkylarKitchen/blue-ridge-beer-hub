import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { startOfTodayIso } from "@/lib/format";

import {
  FlyerExtractionSchema,
  refineExtraction,
  type ExtractedEvent,
} from "./extract";
import type { FbPost } from "./facebook";

const SYSTEM = `You read social media posts from Blue Ridge Beer Hub, a taproom in Waynesville, NC (America/New_York timezone), and decide whether the post is an event flyer or event announcement. If it is, extract every distinct dated event.

Rules:
- isEventFlyer is true only when the post announces one or more events on specific dates. Photos, general announcements, and menu posts are false.
- start/end are full ISO 8601 datetimes WITH the correct America/New_York UTC offset. Resolve dates without a year to the NEXT future occurrence relative to today's date given in the message.
- If a time is missing, use 18:00 local. If the end time is not stated, set end to null.
- category: music (live acts, vinyl, karaoke), art (markets, craft nights), games (trivia, bingo), party (anniversaries, holiday bashes), community (fundraisers, clubs, meetups).
- When you cannot read a date confidently, OMIT that event. Fewer correct events beats guessed ones — a human approves this list, and wrong dates erode their trust.`;

export async function extractEventsFromPost(
  post: FbPost,
): Promise<ExtractedEvent[]> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 16000,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          ...post.imageUrls
            .slice(0, 4)
            .map(
              (url) =>
                ({ type: "image", source: { type: "url", url } }) as const,
            ),
          {
            type: "text",
            text: `Post caption:\n${post.message ?? "(no caption)"}\n\nToday is ${startOfTodayIso()}.`,
          },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(FlyerExtractionSchema) },
  });
  const parsed = response.parsed_output;
  if (!parsed) return [];
  return refineExtraction(parsed, startOfTodayIso());
}
