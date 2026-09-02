/** Bump when Meta sunsets this version (~2-year cycle). */
export const GRAPH_VERSION = "v23.0";

export interface FbPost {
  id: string;
  createdTime: string;
  message?: string;
  imageUrls: string[];
}

type Attachment = {
  media?: { image?: { src?: string } };
  subattachments?: { data?: Attachment[] };
};

function imagesFrom(attachment: Attachment): string[] {
  const subs = attachment.subattachments?.data;
  if (subs?.length) {
    return subs
      .map((sub) => sub.media?.image?.src)
      .filter((src): src is string => Boolean(src));
  }
  const src = attachment.media?.image?.src;
  return src ? [src] : [];
}

export function parsePostsResponse(json: unknown): FbPost[] {
  const data = (json as { data?: unknown[] } | null)?.data;
  if (!Array.isArray(data)) return [];
  const posts: FbPost[] = [];
  for (const raw of data) {
    const post = raw as {
      id?: string;
      created_time?: string;
      message?: string;
      attachments?: { data?: Attachment[] };
    };
    if (!post.id || !post.created_time) continue;
    const imageUrls = [
      ...new Set((post.attachments?.data ?? []).flatMap(imagesFrom)),
    ];
    posts.push({
      id: post.id,
      createdTime: post.created_time,
      ...(post.message ? { message: post.message } : {}),
      imageUrls,
    });
  }
  return posts;
}

export async function fetchNewPosts(opts: {
  pageId: string;
  token: string;
  sinceIso?: string;
}): Promise<FbPost[]> {
  const url = new URL(
    `https://graph.facebook.com/${GRAPH_VERSION}/${opts.pageId}/published_posts`,
  );
  url.searchParams.set(
    "fields",
    "id,message,created_time,attachments{media,subattachments}",
  );
  url.searchParams.set("limit", "25");
  if (opts.sinceIso) url.searchParams.set("since", opts.sinceIso);
  url.searchParams.set("access_token", opts.token);
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) {
    const code = (body as { error?: { code?: number } })?.error?.code;
    throw new Error(
      code === 190
        ? "FB_TOKEN_DEAD: Page token rejected (code 190) — re-run the OAuth dance."
        : `Graph API error ${res.status}: ${JSON.stringify(body).slice(0, 500)}`,
    );
  }
  return parsePostsResponse(body);
}
