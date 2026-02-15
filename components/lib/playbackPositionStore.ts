import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

type PlaybackEntry = {
  position: number;
  duration: number;
  updatedAt: number;
};

type PlaybackStore = Record<string, PlaybackEntry>;

const STORAGE_FILE_NAME = 'mamo-playback-positions-v1.json';
const WEB_STORAGE_KEY = 'mamo-playback-positions-v1';
const MAX_STORED_ITEMS = 200;
const MIN_RESUME_SECONDS = 2;
const END_CLEAR_THRESHOLD_SECONDS = 3;

let memoryStore: PlaybackStore | null = null;
let readPromise: Promise<PlaybackStore> | null = null;
let writeQueue = Promise.resolve();

const isWeb = Platform.OS === 'web';

const createEmptyStore = (): PlaybackStore => ({});

const normalizeStore = (input: unknown): PlaybackStore => {
  if (!input || typeof input !== 'object') return createEmptyStore();

  const nextStore: PlaybackStore = {};
  for (const [key, value] of Object.entries(input)) {
    if (!value || typeof value !== 'object') continue;

    const raw = value as Partial<PlaybackEntry>;
    const position = Number(raw.position);
    const duration = Number(raw.duration);
    const updatedAt = Number(raw.updatedAt);

    if (
      Number.isFinite(position) &&
      Number.isFinite(duration) &&
      Number.isFinite(updatedAt) &&
      duration > 0 &&
      position >= 0
    ) {
      nextStore[key] = {
        position,
        duration,
        updatedAt,
      };
    }
  }

  return nextStore;
};

const getStorageFilePath = () => {
  const baseDir = FileSystem.documentDirectory;
  if (!baseDir) return null;
  return `${baseDir}${STORAGE_FILE_NAME}`;
};

const pruneStore = (store: PlaybackStore): PlaybackStore => {
  const entries = Object.entries(store);
  if (entries.length <= MAX_STORED_ITEMS) return store;

  const sorted = entries.sort(([, left], [, right]) => right.updatedAt - left.updatedAt);
  return Object.fromEntries(sorted.slice(0, MAX_STORED_ITEMS));
};

const readStore = async (): Promise<PlaybackStore> => {
  if (memoryStore) return memoryStore;
  if (readPromise) return readPromise;

  readPromise = (async () => {
    try {
      if (isWeb && typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(WEB_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : createEmptyStore();
        memoryStore = normalizeStore(parsed);
        return memoryStore;
      }

      const filePath = getStorageFilePath();
      if (!filePath) {
        memoryStore = createEmptyStore();
        return memoryStore;
      }

      const info = await FileSystem.getInfoAsync(filePath);
      if (!info.exists) {
        memoryStore = createEmptyStore();
        return memoryStore;
      }

      const raw = await FileSystem.readAsStringAsync(filePath);
      const parsed = raw ? JSON.parse(raw) : createEmptyStore();
      memoryStore = normalizeStore(parsed);
      return memoryStore;
    } catch {
      memoryStore = createEmptyStore();
      return memoryStore;
    } finally {
      readPromise = null;
    }
  })();

  return readPromise;
};

const writeStore = async (store: PlaybackStore) => {
  memoryStore = pruneStore(store);

  writeQueue = writeQueue
    .catch(() => undefined)
    .then(async () => {
      try {
        if (isWeb && typeof localStorage !== 'undefined') {
          localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(memoryStore));
          return;
        }

        const filePath = getStorageFilePath();
        if (!filePath) return;

        await FileSystem.writeAsStringAsync(filePath, JSON.stringify(memoryStore));
      } catch {
        // no-op
      }
    });

  await writeQueue;
};

const getStoreKey = (mediaUrl: string) => mediaUrl.trim();

export const getPlaybackPosition = async (mediaUrl: string): Promise<number | null> => {
  if (!mediaUrl?.trim()) return null;

  const store = await readStore();
  const entry = store[getStoreKey(mediaUrl)];
  if (!entry) return null;

  const remaining = entry.duration - entry.position;
  if (entry.position < MIN_RESUME_SECONDS || remaining <= END_CLEAR_THRESHOLD_SECONDS) {
    return null;
  }

  return entry.position;
};

export const savePlaybackPosition = async (
  mediaUrl: string,
  position: number,
  duration: number,
): Promise<void> => {
  if (!mediaUrl?.trim()) return;
  if (!Number.isFinite(position) || !Number.isFinite(duration) || duration <= 0) return;

  const clampedPosition = Math.max(0, Math.min(position, duration));
  const remaining = duration - clampedPosition;

  if (clampedPosition < MIN_RESUME_SECONDS || remaining <= END_CLEAR_THRESHOLD_SECONDS) {
    await clearPlaybackPosition(mediaUrl);
    return;
  }

  const store = await readStore();
  store[getStoreKey(mediaUrl)] = {
    position: clampedPosition,
    duration,
    updatedAt: Date.now(),
  };
  await writeStore(store);
};

export const clearPlaybackPosition = async (mediaUrl: string): Promise<void> => {
  if (!mediaUrl?.trim()) return;

  const store = await readStore();
  const key = getStoreKey(mediaUrl);
  if (!store[key]) return;

  delete store[key];
  await writeStore(store);
};
