export type ParsedSubtitle = {
  start: number;
  end: number;
  text: string;
};

const parseTimeToSeconds = (value: string): number => {
  const normalized = value.trim().replace(',', '.');
  const parts = normalized.split(':');
  if (parts.length < 2 || parts.length > 3) return NaN;

  const seconds = Number.parseFloat(parts[parts.length - 1]);
  const minutes = Number.parseInt(parts[parts.length - 2], 10);
  const hours =
    parts.length === 3
      ? Number.parseInt(parts[0], 10)
      : 0;

  if (![seconds, minutes, hours].every((part) => Number.isFinite(part))) {
    return NaN;
  }

  return Math.max(0, hours * 3600 + minutes * 60 + seconds);
};

const parseCueTimeRange = (line: string): { start: number; end: number } | null => {
  const segments = line.split('-->');
  if (segments.length !== 2) return null;

  const startRaw = segments[0].trim();
  const endRaw = segments[1].trim().split(/\s+/)[0];

  const start = parseTimeToSeconds(startRaw);
  const end = parseTimeToSeconds(endRaw);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null;
  }

  return { start, end };
};

export const parseSrtOrVtt = (content: string): ParsedSubtitle[] => {
  if (!content?.trim()) return [];

  const normalized = content
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const lines = normalized.split('\n');
  const subtitles: ParsedSubtitle[] = [];
  let currentStart = NaN;
  let currentEnd = NaN;
  let currentText: string[] = [];

  const flushCue = () => {
    if (
      Number.isFinite(currentStart) &&
      Number.isFinite(currentEnd) &&
      currentEnd > currentStart &&
      currentText.length > 0
    ) {
      subtitles.push({
        start: currentStart,
        end: currentEnd,
        text: currentText.join('\n').trim(),
      });
    }

    currentStart = NaN;
    currentEnd = NaN;
    currentText = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushCue();
      continue;
    }

    if (line.toUpperCase() === 'WEBVTT') {
      continue;
    }

    const maybeRange = parseCueTimeRange(line);
    if (maybeRange) {
      flushCue();
      currentStart = maybeRange.start;
      currentEnd = maybeRange.end;
      continue;
    }

    if (!Number.isFinite(currentStart) && /^\d+$/.test(line)) {
      continue;
    }

    if (Number.isFinite(currentStart)) {
      currentText.push(rawLine.trim());
    }
  }

  flushCue();

  return subtitles;
};