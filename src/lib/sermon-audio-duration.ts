export const MAX_AUDIO_DURATION_SECONDS = 2_147_483_647;

export function normalizeDetectedAudioDuration(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > MAX_AUDIO_DURATION_SECONDS) {
    return null;
  }
  const seconds = Math.round(value);
  return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : null;
}

export function parseUploadedAudioDuration(value: string | null): number | null {
  if (value === null || !/^\d{1,10}$/.test(value)) return null;
  const seconds = Number(value);
  return Number.isSafeInteger(seconds) && seconds > 0 && seconds <= MAX_AUDIO_DURATION_SECONDS
    ? seconds
    : null;
}
