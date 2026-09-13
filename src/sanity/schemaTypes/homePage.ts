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
        defineArrayMember({ type: "featureBlock" }),
        defineArrayMember({ type: "dividerBlock" }),
      ],
      validation: (rule) => [
        rule.min(1).error("The page needs at least one section."),
        // Events reads one shared list, so two copies show the same thing.
        // (Photos used to as well; its photos now live on the section.)
        rule
          .custom((sections?: Sec[]) => {
            const events = (sections ?? []).filter(
              (s) => s._type === "eventsBlock",
            ).length;
            return events > 1
              ? "Events is on the page twice — both copies show the same list."
              : true;
          })
          .warning(),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Home Page" }) },
});
