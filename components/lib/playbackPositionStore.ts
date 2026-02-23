import { Platform } from 'react-native';

type PlaybackEntry = {
  position: number;
  duration: number;
};

const WEB_STORAGE_KEY = 'mamo-playback-positions-v1';
const memoryStore = new Map<string, PlaybackEntry>();

const readWebStore = (): Record<string, PlaybackEntry> => {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(WEB_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeWebStore = (store: Record<string, PlaybackEntry>) => {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // no-op
  }
};

export const getPlaybackPosition = async (mediaUrl: string): Promise<number | null> => {
  const key = mediaUrl?.trim();
  if (!key) return null;

  if (Platform.OS === 'web') {
    const entry = readWebStore()[key];
    return typeof entry?.position === 'number' ? entry.position : null;
  }

  const entry = memoryStore.get(key);
  return entry ? entry.position : null;
};

export const savePlaybackPosition = async (
  mediaUrl: string,
  position: number,
  duration: number,
): Promise<void> => {
  const key = mediaUrl?.trim();
  if (!key || !Number.isFinite(position) || !Number.isFinite(duration)) return;

  const entry: PlaybackEntry = {
    position: Math.max(0, position),
    duration: Math.max(0, duration),
  };

  if (Platform.OS === 'web') {
    const store = readWebStore();
    store[key] = entry;
    writeWebStore(store);
    return;
  }

  memoryStore.set(key, entry);
};

export const clearPlaybackPosition = async (mediaUrl: string): Promise<void> => {
  const key = mediaUrl?.trim();
  if (!key) return;

  if (Platform.OS === 'web') {
    const store = readWebStore();
    delete store[key];
    writeWebStore(store);
    return;
  }

  memoryStore.delete(key);
};
