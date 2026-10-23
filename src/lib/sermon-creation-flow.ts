export type SermonCreationIntent = "draft" | "publish" | "schedule";
export type SermonCreationStep = "missing_audio" | "create_draft" | "draft_saved" | "upload_audio" | "save_download_permission" | "publish" | "schedule";

export function getSermonCreationStep(input: {
  intent: SermonCreationIntent;
  resourceId: string | null;
  fileSelected: boolean;
  audioAttached: boolean;
  downloadSettingSaved: boolean;
}): SermonCreationStep {
  if ((input.intent === "publish" || input.intent === "schedule") && !input.fileSelected && !input.audioAttached) return "missing_audio";
  if (!input.resourceId) return "create_draft";
  if (!input.audioAttached && !input.fileSelected) return "draft_saved";
  if (!input.audioAttached) return "upload_audio";
  if (!input.downloadSettingSaved) return "save_download_permission";
  return input.intent === "draft" ? "draft_saved" : input.intent;
}

export function getSermonCreationDestination(intent: SermonCreationIntent, durationWarning = false): string {
  const destination = intent === "publish" ? "/admin/sermons?published=1" : intent === "schedule" ? "/admin/sermons?scheduled=1" : "/admin/sermons?created=1";
  return durationWarning ? `${destination}&durationWarning=1` : destination;
}
