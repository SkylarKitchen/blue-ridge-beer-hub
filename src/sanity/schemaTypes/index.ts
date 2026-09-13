import type { SchemaTypeDefinition } from "sanity";

import { aboutBlock } from "./blocks/aboutBlock";
import { dividerBlock } from "./blocks/dividerBlock";
import { eventsBlock } from "./blocks/eventsBlock";
import { featureBlock } from "./blocks/featureBlock";
import { galleryBlock } from "./blocks/galleryBlock";
import { heroBlock } from "./blocks/heroBlock";
import { offeringsBlock } from "./blocks/offeringsBlock";
import { onTapBlock } from "./blocks/onTapBlock";
import { event } from "./event";
import { galleryImage } from "./galleryImage";
import { homePage } from "./homePage";
import { pipelineState } from "./pipelineState";
import { siteSettings } from "./siteSettings";
import { weeklyEvent } from "./weeklyEvent";

export const schemaTypes: SchemaTypeDefinition[] = [
  siteSettings,
  event,
  weeklyEvent,
  galleryImage,
  pipelineState,
  heroBlock,
  eventsBlock,
  onTapBlock,
  offeringsBlock,
  galleryBlock,
  aboutBlock,
  featureBlock,
  dividerBlock,
  homePage,
];
