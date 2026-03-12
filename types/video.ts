// TODO: App-level loose type used before MamoPlayerSource was formalised.
// Prefer importing MamoPlayerSource from @mamoplayer/core in new code.
export type VideoSource =
  | string
  | number
  | {
      uri?: string;
      [key: string]: unknown;
    };
