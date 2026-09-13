import { draftMode } from "next/headers";

import type { EditScope } from "@/lib/edit-scope";

import { EditableField, type EditableFieldProps } from "./EditableField";

export type EditableProps = EditableFieldProps & {
  /**
   * Block-aware alternative to `path`/`documentId`/`documentType`: the
   * scope knows which document the block lives in and how to spell the
   * field's full path. `field` is the block-relative name, e.g. "heading"
   * or "perks[2]". Resolved here, on the server — `EditScope` carries a
   * function, which can't cross into the client component's props.
   */
  scope?: EditScope;
  field?: string;
};

/**
 * Wraps a piece of Sanity copy so editors can type it straight into the page
 * inside the Studio's visual editor.
 *
 * On the live site this renders nothing of its own — just the text — so
 * visitors get the same markup as before and none of the editing bundle.
 * Next only ships a client component's JavaScript when it actually renders,
 * so gating on draft mode here keeps the public page exactly as light as it
 * was.
 *
 *   <h2>
 *     <Editable value={block.heading} label="About heading" />
 *   </h2>
 *
 * Pass `children` when the read-only rendering isn't just the string — the
 * hero headline, say, which splits into staggered lines.
 *
 * Inside a section that knows its scope, pass that instead of a raw path:
 *
 *   <Editable value={block.heading} scope={scope} field="heading" />
 */
export async function Editable({ scope, field, ...props }: EditableProps) {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return <>{props.children ?? props.value}</>;
  if (scope && field) {
    return (
      <EditableField
        {...props}
        documentId={scope.documentId}
        documentType={scope.documentType}
        path={scope.field(field)}
      />
    );
  }
  return <EditableField {...props} />;
}
