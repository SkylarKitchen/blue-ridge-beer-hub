import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

/** Clears the draft-mode cookie; the "Previewing drafts" banner links here. */
export async function GET(request: Request) {
  (await draftMode()).disable();
  return NextResponse.redirect(new URL("/", request.url));
}
