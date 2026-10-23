export type EventCalendarDetails = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  url?: string;
};

function escapeCalendarText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldCalendarLine(value: string): string {
  const encoder = new TextEncoder();
  let output = "";
  let line = "";
  let byteLength = 0;

  for (const character of value) {
    const characterBytes = encoder.encode(character).length;
    if (byteLength + characterBytes > 75) {
      output += `${line}\r\n `;
      line = character;
      byteLength = characterBytes + 1;
    } else {
      line += character;
      byteLength += characterBytes;
    }
  }

  return output + line;
}

function formatUtcCalendarDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("Event calendar date is invalid.");
  }
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export function buildEventCalendarFile(
  event: EventCalendarDetails,
  stampedAt = new Date(),
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VictoryCity Revival Ministry//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@victorycity-revival-ministry`,
    `DTSTAMP:${formatUtcCalendarDate(stampedAt.toISOString())}`,
    `DTSTART:${formatUtcCalendarDate(event.startsAt)}`,
  ];

  if (event.endsAt)
    lines.push(`DTEND:${formatUtcCalendarDate(event.endsAt)}`);
  lines.push(`SUMMARY:${escapeCalendarText(event.title)}`);
  if (event.description) {
    lines.push(
      `DESCRIPTION:${escapeCalendarText(event.description)}`,
    );
  }
  if (event.location)
    lines.push(`LOCATION:${escapeCalendarText(event.location)}`);
  if (event.url) lines.push(`URL:${event.url}`);
  lines.push("END:VEVENT", "END:VCALENDAR");

  return `${lines.map(foldCalendarLine).join("\r\n")}\r\n`;
}

export function buildEventDirectionsUrl(
  location: string | null,
): string | null {
  if (!location) return null;
  const normalized = location.trim();
  if (
    !normalized ||
    normalized.length > 300 ||
    /[\u0000-\u001f\u007f]/.test(normalized)
  ) {
    return null;
  }
  if (
    /^(online|virtual|tba|to be announced|not provided|n\/?a)$/i.test(
      normalized,
    )
  ) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalized)}`;
}
