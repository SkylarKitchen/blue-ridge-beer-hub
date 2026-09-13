/**
 * Where a block's copy is written when the rendered string carries no stega
 * (a default, or the fallback page). `Editable` resolves a target from the
 * stega on the string first; this is the second choice.
 *
 * Blocks live in the Home Page document's `sections[]`; the fixed chrome
 * (header, hours footer) still writes to Site Settings, which is why both
 * document ids are exported.
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
