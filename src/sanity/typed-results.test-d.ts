/**
 * Type-level check, run by `npm run typecheck` (tsconfig includes every .ts
 * file): a `sanityFetch` result must carry the shape TypeGen generated for
 * its query. It broke silently once — next-sanity installed its own nested
 * copy of `@sanity/client`, so the `declare module "@sanity/client"` in
 * sanity.types.ts augmented a copy next-sanity never read and every `data`
 * typed as `{}`. The `overrides` entry in package.json is what keeps the
 * two on one copy; if it goes, this file stops compiling.
 */
import { sanityFetch } from "./live";
import { SITE_SETTINGS_QUERY } from "./queries";

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

type Result = Awaited<ReturnType<typeof probe>>;
export async function probe() {
  const { data } = await sanityFetch({
    query: SITE_SETTINGS_QUERY,
    stega: false,
  });
  return data;
}

// The generated projection: `phone` is a projected string field.
export type _phoneIsTyped = Expect<
  Equal<NonNullable<Result>["phone"], string | null>
>;
