import { defineField, defineType } from "sanity";

/**
 * Hidden singleton (`_id: "pipelineState"`) tracking what the flyer
 * pipeline has already processed. Written only by the cron route; not
 * listed in the Studio structure.
 */
export const pipelineState = defineType({
  name: "pipelineState",
  title: "Pipeline State",
  type: "document",
  readOnly: true,
  fields: [
    defineField({
      name: "cursor",
      title: "Newest processed post time",
      type: "string",
    }),
    defineField({
      name: "processedPostIds",
      title: "Processed post IDs",
      type: "array",
      of: [{ type: "string" }],
    }),
  ],
});
