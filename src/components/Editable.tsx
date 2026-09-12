import { draftMode } from "next/headers";

import { EditableField, type EditableFieldProps } from "./EditableField";

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
 *     <Editable value={settings.aboutHeading} label="About heading" />
 *   </h2>
 *
 * Pass `children` when the read-only rendering isn't just the string — the
 * hero headline, say, which splits into staggered lines.
 */
export async function Editable(props: EditableFieldProps) {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return <>{props.children ?? props.value}</>;
  return <EditableField {...props} />;
}
