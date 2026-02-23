export type VideoSource =
  | string
  | number
  | {
      uri?: string;
      [key: string]: unknown;
    };
