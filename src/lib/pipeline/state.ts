import { writeClient } from "@/sanity/serverClient";

const STATE_ID = "pipelineState";
const MAX_IDS = 200;

export interface PipelineState {
  cursor?: string;
  processedPostIds: string[];
}

export async function getPipelineState(): Promise<PipelineState> {
  const doc = await writeClient.getDocument(STATE_ID);
  return {
    cursor: (doc?.cursor as string | undefined) ?? undefined,
    processedPostIds: (doc?.processedPostIds as string[] | undefined) ?? [],
  };
}

export async function savePipelineState(state: PipelineState): Promise<void> {
  await writeClient.createOrReplace({
    _id: STATE_ID,
    _type: "pipelineState",
    cursor: state.cursor,
    processedPostIds: state.processedPostIds.slice(-MAX_IDS),
  });
}
