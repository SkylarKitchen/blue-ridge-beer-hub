import { defineType } from "sanity";

import { sectionFields } from "./common";

export const dividerBlock = defineType({
  name: "dividerBlock",
  title: "Mountain divider",
  type: "object",
  fields: [...sectionFields()],
  preview: {
    select: { hidden: "hiddenOnSite" },
    prepare: ({ hidden }: { hidden?: boolean }) => ({
      title: "Mountain divider",
      subtitle: hidden ? "Hidden" : undefined,
    }),
  },
});
