/**
 * Where a block's copy is written when the rendered string carries no stega
 * (a default, or the fallback page). `Editable` resolves a target from the
 * stega on the string first; this is the second choice.
 *
 * Two scopes exist because the page can render from two places:
 * - the Home Page document's `sections[]` (after migration), and
 * - the legacy flat fields on Site Settings (before migration, via the
 *   adapter in `sections.ts`).
 */
export interface EditScope {
  documentId: string;
  documentType: string;
  /** Turns a block-relative field name into a full Studio path. */
  field: (name: string) => string;
}

export const HOME_PAGE_ID = "homePage";
export const HOME_PAGE_TYPE = "homePage";
export const SITE_SETTINGS_ID = "siteSettings";
export const SITE_SETTINGS_TYPE = "siteSettings";

export function blockScope(key: string): EditScope {
  return {
    documentId: HOME_PAGE_ID,
    documentType: HOME_PAGE_TYPE,
    field: (name) => `sections[_key=="${key}"].${name}`,
  };
}

/**
 * `map` is block field → legacy Site Settings field. Anything after the
 * first `[` or `.` (array index, key selector, nested field) is kept.
 */
export function legacyScope(map: Record<string, string>): EditScope {
  return {
    documentId: SITE_SETTINGS_ID,
    documentType: SITE_SETTINGS_TYPE,
    field: (name) => {
      const match = /^([^[.]+)(.*)$/.exec(name);
      const head = match?.[1] ?? name;
      const tail = match?.[2] ?? "";
      return (map[head] ?? head) + tail;
    },
  };
}
