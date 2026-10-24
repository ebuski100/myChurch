export type SermonMediaType = "audio" | "video";

export type SermonFormValues = {
  title: string;
  description: string | null;
  preacher: string | null;
  sermonDate: string | null;
  series: string | null;
  mediaType: SermonMediaType;
  youtubeUrl: string | null;
};

export type SermonFieldErrors = Partial<Record<keyof SermonFormValues, string>>;

export type SermonValidationResult =
  | { ok: true; value: SermonFormValues }
  | { ok: false; errors: SermonFieldErrors };

function readText(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function readMediaType(form: FormData): SermonMediaType | null {
  const value = readText(form, "mediaType");
  return value === "audio" || value === "video" ? value : null;
}

export function validateSermonForm(
  form: FormData,
  expectedMediaType?: SermonMediaType,
): SermonValidationResult {
  const title = readText(form, "title");
  const description = readText(form, "description");
  const preacher = readText(form, "preacher");
  const sermonDate = readText(form, "sermonDate");
  const series = readText(form, "series");
  const mediaType = readMediaType(form);
  const youtubeUrl = readText(form, "youtubeUrl");
  const errors: SermonFieldErrors = {};

  if (!title) errors.title = "Enter a sermon title.";
  else if (title.length > 200) errors.title = "Use 200 characters or fewer.";
  if (description.length > 5000) errors.description = "Use 5,000 characters or fewer.";
  if (preacher.length > 200) errors.preacher = "Use 200 characters or fewer.";
  if (series.length > 200) errors.series = "Use 200 characters or fewer.";
  if (sermonDate && !validDate(sermonDate)) errors.sermonDate = "Enter a valid date.";

  if (!mediaType) {
    errors.mediaType = "Choose Audio or YouTube video.";
  } else if (expectedMediaType && mediaType !== expectedMediaType) {
    errors.mediaType = "The sermon media type cannot be changed after creation.";
  }

  // YouTube URLs are validated byte-for-byte at save time by sermon-video.ts.
  // Here we only enforce presence, length, and an HTTPS shape so the field
  // cannot smuggle iframe HTML past the form.
  if (mediaType === "video") {
    if (!youtubeUrl) {
      errors.youtubeUrl = "Enter a YouTube URL.";
    } else if (
      youtubeUrl.length > 2048 ||
      !/^https:\/\//i.test(youtubeUrl) ||
      /<\s*\/?\s*(iframe|embed|object|script|video)\b/i.test(youtubeUrl)
    ) {
      errors.youtubeUrl = "Enter a valid YouTube URL.";
    }
  }

  if (Object.keys(errors).length || !mediaType) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      title,
      description: description || null,
      preacher: preacher || null,
      sermonDate: sermonDate || null,
      series: series || null,
      mediaType,
      youtubeUrl: mediaType === "video" ? youtubeUrl : null,
    },
  };
}
