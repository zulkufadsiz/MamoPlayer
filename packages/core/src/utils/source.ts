import type { MamoPlayerSource } from '../MamoPlayer';
import type { PlaybackSourceType } from '../types/playback';

/**
 * Returns true when the URI refers to a local/offline resource that does not
 * require a network connection (file, asset, content, or iOS photo URIs as well
 * as bare absolute file-system paths).
 */
function isOfflineUri(uri: string): boolean {
  return (
    uri.startsWith('file://') ||
    uri.startsWith('asset://') ||
    uri.startsWith('content://') || // Android content-provider URIs
    uri.startsWith('ph://') || // iOS Photos framework URIs
    uri.startsWith('/') // bare absolute path
  );
}

/**
 * Inspects a `MamoPlayerSource` and returns whether it points to a local
 * (offline) file or a remote (streaming) resource.
 *
 * Handles all three source shapes accepted by react-native-video:
 *   - Numeric `require()` asset reference  → offline
 *   - String URI                            → checked against offline schemes
 *   - Object `{ uri: string; ... }`        → `uri` field is checked
 *   - Array of source objects              → first item's `uri` is checked
 */
export function detectSourceType(source: MamoPlayerSource): PlaybackSourceType {
  if (typeof source === 'number') {
    // React Native bundled asset (e.g. require('./video.mp4'))
    return 'offline';
  }

  if (typeof source === 'string') {
    return isOfflineUri(source) ? 'offline' : 'streaming';
  }

  if (Array.isArray(source)) {
    const first = source[0];
    if (first && typeof first === 'object' && 'uri' in first && typeof first.uri === 'string') {
      return isOfflineUri(first.uri) ? 'offline' : 'streaming';
    }
    return 'streaming';
  }

  if (source && typeof source === 'object') {
    const uri = (source as { uri?: string }).uri;
    if (typeof uri === 'string') {
      return isOfflineUri(uri) ? 'offline' : 'streaming';
    }
  }

  return 'streaming';
}

/**
 * Returns a stable string identifier for the source that can be used to detect
 * when the media content has changed (requiring a full player reset) vs when
 * only metadata/props have updated.
 */
export function getSourceId(source: MamoPlayerSource | undefined): string {
  if (source === undefined || source === null) {
    return '';
  }
  if (typeof source === 'number') {
    return String(source);
  }
  if (typeof source === 'string') {
    return source;
  }
  if (Array.isArray(source)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return source.map((s: any) => s.uri).join(',');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uri = (source as any).uri;
  return typeof uri === 'string' ? uri : '';
}
