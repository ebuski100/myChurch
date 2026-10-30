// export type SermonMediaType = "audio" | "video";

// export type SermonFormValues = {
//   title: string;
//   description: string | null;
//   preacher: string | null;
//   sermonDate: string | null;
//   series: string | null;
//   mediaType: SermonMediaType;
//   youtubeUrl: string | null;
// };

// export type SermonFieldErrors = Partial<
//   Record<keyof SermonFormValues, string>
// >;

// export type SermonValidationResult =
//   | { ok: true; value: SermonFormValues }
//   | { ok: false; errors: SermonFieldErrors };

// function readText(form: FormData, field: string): string {
//   const value = form.get(field);
//   return typeof value === "string" ? value.trim() : "";
// }

// function validDate(value: string): boolean {
//   if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

//   const date = new Date(`${value}T00:00:00.000Z`);

//   return (
//     Number.isFinite(date.getTime()) &&
//     date.toISOString().slice(0, 10) === value
//   );
// }

// function readMediaType(form: FormData): SermonMediaType | null {
//   const value = readText(form, "mediaType");

//   return value === "audio" || value === "video" ? value : null;
// }

// export function validateSermonForm(
//   form: FormData,
//   expectedMediaType?: SermonMediaType,
// ): SermonValidationResult {
//   const title = readText(form, "title");
//   const description = readText(form, "description");
//   const preacher = readText(form, "preacher");
//   const sermonDate = readText(form, "sermonDate");
//   const series = readText(form, "series");
//   const mediaType = readMediaType(form);
//   const youtubeUrl = readText(form, "youtubeUrl");

//   const errors: SermonFieldErrors = {};

//   if (!title) {
//     errors.title = "Enter a sermon title.";
//   } else if (title.length > 200) {
//     errors.title = "Use 200 characters or fewer.";
//   }

//   if (description.length > 5000) {
//     errors.description = "Use 5,000 characters or fewer.";
//   }

//   if (preacher.length > 200) {
//     errors.preacher = "Use 200 characters or fewer.";
//   }

//   if (series.length > 200) {
//     errors.series = "Use 200 characters or fewer.";
//   }

//   if (sermonDate && !validDate(sermonDate)) {
//     errors.sermonDate = "Enter a valid date.";
//   }

//   if (!mediaType) {
//     errors.mediaType = "Choose Audio or YouTube video.";
//   } else if (expectedMediaType && mediaType !== expectedMediaType) {
//     errors.mediaType =
//       "The sermon media type cannot be changed after creation.";
//   }

//   // Full YouTube URL validation happens in sermon-video.ts.
//   if (mediaType === "video") {
//     if (!youtubeUrl) {
//       errors.youtubeUrl = "Enter a YouTube URL.";
//     } else if (
//       youtubeUrl.length > 2048 ||
//       !/^https:\/\//i.test(youtubeUrl) ||
//       /<\s*\/?\s*(iframe|embed|object|script|video)\b/i.test(
//         youtubeUrl,
//       )
//     ) {
//       errors.youtubeUrl = "Enter a valid YouTube URL.";
//     }
//   }

//   if (Object.keys(errors).length > 0 || !mediaType) {
//     return { ok: false, errors };
//   }

//   return {
//     ok: true,
//     value: {
//       title,
//       description: description || null,
//       preacher: preacher || null,
//       sermonDate: sermonDate || null,
//       series: series || null,
//       mediaType,
//       youtubeUrl: mediaType === "video" ? youtubeUrl : null,
//     },
//   };
// }

export type SermonMediaType = "audio" | "video";

export type SermonFormValues = {
  title: string;
  description: string | null;
  preacher: string | null;
  sermonDate: string | null;
  series: string | null;
  mediaType: SermonMediaType;
  youtubeUrl: string | null;
  durationHours: number;
  durationMinutes: number;
  durationSeconds: number;
  durationTotalSeconds: number | null;
};

export type SermonFieldErrors = Partial<
  Record<keyof SermonFormValues, string>
>;

export type SermonValidationResult =
  | { ok: true; value: SermonFormValues }
  | { ok: false; errors: SermonFieldErrors };

function readText(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function readDurationPart(
  form: FormData,
  field: string,
): number | null {
  const value = readText(form, field);

  // Treat an empty duration box as zero.
  if (value === "") return 0;

  // Accept whole, non-negative integers only.
  if (!/^\d+$/.test(value)) return null;

  const number = Number(value);

  return Number.isSafeInteger(number) ? number : null;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
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

  const durationHours = readDurationPart(form, "durationHours");
  const durationMinutes = readDurationPart(form, "durationMinutes");
  const durationSeconds = readDurationPart(form, "durationSeconds");

  if (!title) {
    errors.title = "Enter a sermon title.";
  } else if (title.length > 200) {
    errors.title = "Use 200 characters or fewer.";
  }

  if (description.length > 5000) {
    errors.description = "Use 5,000 characters or fewer.";
  }

  if (preacher.length > 200) {
    errors.preacher = "Use 200 characters or fewer.";
  }

  if (series.length > 200) {
    errors.series = "Use 200 characters or fewer.";
  }

  if (sermonDate && !validDate(sermonDate)) {
    errors.sermonDate = "Enter a valid date.";
  }

  if (!mediaType) {
    errors.mediaType = "Choose Audio or YouTube video.";
  } else if (expectedMediaType && mediaType !== expectedMediaType) {
    errors.mediaType =
      "The sermon media type cannot be changed after creation.";
  }

  if (mediaType === "video") {
    if (!youtubeUrl) {
      errors.youtubeUrl = "Enter a YouTube URL.";
    } else if (
      youtubeUrl.length > 2048 ||
      !/^https:\/\//i.test(youtubeUrl) ||
      /<\s*\/?\s*(iframe|embed|object|script|video)\b/i.test(
        youtubeUrl,
      )
    ) {
      errors.youtubeUrl = "Enter a valid YouTube URL.";
    }

    if (durationHours === null) {
      errors.durationHours = "Enter a whole number of hours.";
    }

    if (durationMinutes === null) {
      errors.durationMinutes = "Enter a whole number of minutes.";
    } else if (durationMinutes > 59) {
      errors.durationMinutes = "Minutes must be between 0 and 59.";
    }

    if (durationSeconds === null) {
      errors.durationSeconds = "Enter a whole number of seconds.";
    } else if (durationSeconds > 59) {
      errors.durationSeconds = "Seconds must be between 0 and 59.";
    }

    if (
      durationHours !== null &&
      durationMinutes !== null &&
      durationSeconds !== null &&
      durationMinutes <= 59 &&
      durationSeconds <= 59
    ) {
      const total =
        durationHours * 3600 + durationMinutes * 60 + durationSeconds;

      if (!Number.isSafeInteger(total)) {
        errors.durationHours = "The duration is too large.";
      } else if (total <= 0) {
        errors.durationSeconds =
          "Enter a duration greater than zero.";
      }
    }
  }

  if (Object.keys(errors).length > 0 || !mediaType) {
    return { ok: false, errors };
  }

  const safeHours = mediaType === "video" ? durationHours! : 0;
  const safeMinutes = mediaType === "video" ? durationMinutes! : 0;
  const safeSeconds = mediaType === "video" ? durationSeconds! : 0;

  const durationTotalSeconds =
    mediaType === "video"
      ? safeHours * 3600 + safeMinutes * 60 + safeSeconds
      : null;

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
      durationHours: safeHours,
      durationMinutes: safeMinutes,
      durationSeconds: safeSeconds,
      durationTotalSeconds,
    },
  };
}
