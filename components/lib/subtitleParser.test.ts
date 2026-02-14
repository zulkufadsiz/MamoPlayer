import { parseSrtOrVtt } from '@/components/lib/subtitleParser';

describe('subtitleParser', () => {
  it('parses valid SRT cues', () => {
    const content = `1
00:00:01,000 --> 00:00:03,500
Hello world

2
00:00:04,000 --> 00:00:06,000
Second line`;

    const cues = parseSrtOrVtt(content);

    expect(cues).toEqual([
      { start: 1, end: 3.5, text: 'Hello world' },
      { start: 4, end: 6, text: 'Second line' },
    ]);
  });

  it('parses WEBVTT and ignores invalid ranges', () => {
    const content = `WEBVTT

00:00:10.000 --> 00:00:09.000
Invalid

00:00:11.500 --> 00:00:13.000
Valid cue`;

    const cues = parseSrtOrVtt(content);

    expect(cues).toEqual([{ start: 11.5, end: 13, text: 'Valid cue' }]);
  });

  it('returns empty array for blank content', () => {
    expect(parseSrtOrVtt('   ')).toEqual([]);
  });
});
