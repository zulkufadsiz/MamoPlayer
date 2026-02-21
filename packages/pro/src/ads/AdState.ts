export type AdBreakType = 'preroll' | 'midroll' | 'postroll';

export interface AdBreak {
  type: AdBreakType;
  offset?: number;
}

export class AdStateMachine {
  currentAdBreak: AdBreak | null = null;
  isAdPlaying = false;
  hasPlayedPreroll = false;
  playedMidrolls = new Set<number>();
  hasPlayedPostroll = false;

  private prerollBreak: AdBreak | null = null;
  private midrollBreaks: AdBreak[] = [];
  private postrollBreak: AdBreak | null = null;

  setAdBreaks(adBreaks: AdBreak[]) {
    this.prerollBreak = adBreaks.find((adBreak) => adBreak.type === 'preroll') ?? null;

    this.midrollBreaks = adBreaks
      .filter(
        (adBreak) =>
          adBreak.type === 'midroll' &&
          typeof adBreak.offset === 'number' &&
          Number.isFinite(adBreak.offset) &&
          adBreak.offset >= 0,
      )
      .sort((a, b) => (a.offset ?? 0) - (b.offset ?? 0));

    this.postrollBreak = adBreaks.find((adBreak) => adBreak.type === 'postroll') ?? null;
  }

  getNextAd(position: number, isAtEnd: boolean): AdBreak | null {
    if (this.isAdPlaying) {
      return null;
    }

    if (!this.hasPlayedPreroll && this.prerollBreak) {
      return this.prerollBreak;
    }

    const midroll = this.midrollBreaks.find((adBreak) => {
      const offset = adBreak.offset;

      if (typeof offset !== 'number') {
        return false;
      }

      return position >= offset && !this.playedMidrolls.has(offset);
    });

    if (midroll) {
      return midroll;
    }

    if (isAtEnd && !this.hasPlayedPostroll && this.postrollBreak) {
      return this.postrollBreak;
    }

    return null;
  }

  markAdStarted(adBreak: AdBreak) {
    this.currentAdBreak = adBreak;
    this.isAdPlaying = true;
  }

  markAdCompleted(adBreak: AdBreak) {
    if (adBreak.type === 'preroll') {
      this.hasPlayedPreroll = true;
    }

    if (adBreak.type === 'midroll' && typeof adBreak.offset === 'number') {
      this.playedMidrolls.add(adBreak.offset);
    }

    if (adBreak.type === 'postroll') {
      this.hasPlayedPostroll = true;
    }

    if (this.currentAdBreak === adBreak) {
      this.currentAdBreak = null;
    }

    this.isAdPlaying = false;
  }

  reset() {
    this.currentAdBreak = null;
    this.isAdPlaying = false;
    this.hasPlayedPreroll = false;
    this.playedMidrolls = new Set<number>();
    this.hasPlayedPostroll = false;
  }
}
