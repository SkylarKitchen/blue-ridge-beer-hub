"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";

import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { resolve } from "./src/sanity/presentation";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";

// One document each, addressed by a fixed _id (see structure.ts and
// lib/pipeline/state.ts). Hide them from the global "create" menu and strip
// the actions that would orphan or duplicate them.
const SINGLETONS = new Set(["siteSettings", "pipelineState"]);
const SINGLETON_BLOCKED_ACTIONS = new Set(["unpublish", "delete", "duplicate"]);

export default defineConfig({
  basePath: "/studio",
  title: "Blue Ridge Beer Hub",
  projectId,
  dataset,
  schema: { types: schemaTypes },
  document: {
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === "global"
        ? prev.filter((template) => !SINGLETONS.has(template.templateId))
        : prev,
    actions: (prev, { schemaType }) =>
      SINGLETONS.has(schemaType)
        ? prev.filter(
            ({ action }) => !action || !SINGLETON_BLOCKED_ACTIONS.has(action),
          )
        : prev,
  },
  plugins: [
    // First plugin = the tab /studio opens on: the visual editor.
    presentationTool({
      resolve,
      previewUrl: {
        previewMode: { enable: "/api/draft-mode/enable" },
      },
    }),
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
