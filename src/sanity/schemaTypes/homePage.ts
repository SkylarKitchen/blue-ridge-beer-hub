import { defineArrayMember, defineField, defineType } from "sanity";

interface Sec {
  _type?: string;
}

export const homePage = defineType({
  name: "homePage",
  title: "Home Page",
  type: "document",
  fields: [
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      description:
        "The page, top to bottom. Drag to reorder. Add sections with the + button; open one to change its words or hide it.",
      of: [
        defineArrayMember({ type: "heroBlock" }),
        defineArrayMember({ type: "eventsBlock" }),
        defineArrayMember({ type: "onTapBlock" }),
        defineArrayMember({ type: "offeringsBlock" }),
        defineArrayMember({ type: "galleryBlock" }),
        defineArrayMember({ type: "aboutBlock" }),
        defineArrayMember({ type: "dividerBlock" }),
      ],
      validation: (rule) => [
        rule.min(1).error("The page needs at least one section."),
        rule
          .custom((sections?: Sec[]) => {
            const counts = new Map<string, number>();
            for (const s of sections ?? []) {
              if (s._type === "eventsBlock" || s._type === "galleryBlock") {
                counts.set(s._type, (counts.get(s._type) ?? 0) + 1);
              }
            }
            const dup = [...counts].find(([, n]) => n > 1)?.[0];
            return dup
              ? `${dup === "eventsBlock" ? "Events" : "Photos"} is on the page twice — both copies show the same list.`
              : true;
          })
          .warning(),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Home Page" }) },
});
