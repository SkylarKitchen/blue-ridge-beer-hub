import { defineField } from "sanity";

/** Fields every section shares. Sanity objects don't inherit, so spread these. */
export function sectionFields() {
  return [
    defineField({
      name: "hiddenOnSite",
      title: "Hide for now",
      type: "boolean",
      initialValue: false,
      description:
        "Keeps the section but takes it off the site. Handy for seasonal things you’ll bring back.",
    }),
    defineField({
      name: "menuLabel",
      title: "Menu label",
      type: "string",
      description:
        "What the top-of-page menu calls this section. Leave empty to use the usual name (or, for sections that aren’t in the menu by default, to keep them out).",
    }),
  ];
}

export function sectionPreview(title: string, headingField = "heading") {
  return {
    select: { heading: headingField, hidden: "hiddenOnSite" },
    prepare({ heading, hidden }: { heading?: string; hidden?: boolean }) {
      return {
        title: heading || title,
        subtitle: [title, hidden ? "Hidden" : null].filter(Boolean).join(" · "),
      };
    },
  };
}
