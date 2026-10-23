export type SermonFormValues = {
  title: string;
  description: string | null;
  preacher: string | null;
  sermonDate: string | null;
  series: string | null;
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

export function validateSermonForm(form: FormData): SermonValidationResult {
  const title = readText(form, "title");
  const description = readText(form, "description");
  const preacher = readText(form, "preacher");
  const sermonDate = readText(form, "sermonDate");
  const series = readText(form, "series");
  const errors: SermonFieldErrors = {};

  if (!title) errors.title = "Enter a sermon title.";
  else if (title.length > 200) errors.title = "Use 200 characters or fewer.";
  if (description.length > 5000) errors.description = "Use 5,000 characters or fewer.";
  if (preacher.length > 200) errors.preacher = "Use 200 characters or fewer.";
  if (series.length > 200) errors.series = "Use 200 characters or fewer.";
  if (sermonDate && !validDate(sermonDate)) errors.sermonDate = "Enter a valid date.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      title,
      description: description || null,
      preacher: preacher || null,
      sermonDate: sermonDate || null,
      series: series || null,
    },
  };
}
