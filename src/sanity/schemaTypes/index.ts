import type { SchemaTypeDefinition } from "sanity";

import { event } from "./event";
import { galleryImage } from "./galleryImage";
import { siteSettings } from "./siteSettings";
import { weeklyEvent } from "./weeklyEvent";

export const schemaTypes: SchemaTypeDefinition[] = [
  siteSettings,
  event,
  weeklyEvent,
  galleryImage,
];
