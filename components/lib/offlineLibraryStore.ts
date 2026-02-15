import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export type OfflineLibraryItem = {
  id: string;
  title: string;
  remoteUrl: string;
  localUri: string;
  updatedAt: number;
  sizeBytes?: number;
};

type OfflineLibraryStore = Record<string, OfflineLibraryItem>;

const STORAGE_FILE_NAME = 'mamo-offline-library-v1.json';
const WEB_STORAGE_KEY = 'mamo-offline-library-v1';
const DOWNLOAD_DIR_NAME = 'mamo-offline-videos';

const isWeb = Platform.OS === 'web';

let memoryStore: OfflineLibraryStore | null = null;
let readPromise: Promise<OfflineLibraryStore> | null = null;
let writeQueue = Promise.resolve();

const createEmptyStore = (): OfflineLibraryStore => ({});

const normalizeStore = (input: unknown): OfflineLibraryStore => {
  if (!input || typeof input !== 'object') return createEmptyStore();

  const nextStore: OfflineLibraryStore = {};

  for (const [key, value] of Object.entries(input)) {
    if (!value || typeof value !== 'object') continue;

    const raw = value as Partial<OfflineLibraryItem>;
    if (
      typeof raw.id !== 'string' ||
      typeof raw.title !== 'string' ||
      typeof raw.remoteUrl !== 'string' ||
      typeof raw.localUri !== 'string'
    ) {
      continue;
    }

    const updatedAt = Number(raw.updatedAt);
    const sizeBytes = raw.sizeBytes == null ? undefined : Number(raw.sizeBytes);

    if (!Number.isFinite(updatedAt)) continue;

    nextStore[key] = {
      id: raw.id,
      title: raw.title,
      remoteUrl: raw.remoteUrl,
      localUri: raw.localUri,
      updatedAt,
      sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : undefined,
    };
  }

  return nextStore;
};

const getStorageFilePath = () => {
  const baseDir = FileSystem.documentDirectory;
  if (!baseDir) return null;
  return `${baseDir}${STORAGE_FILE_NAME}`;
};

const readStore = async (): Promise<OfflineLibraryStore> => {
  if (memoryStore) return memoryStore;
  if (readPromise) return readPromise;

  readPromise = (async () => {
    try {
      if (isWeb && typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(WEB_STORAGE_KEY);
        memoryStore = normalizeStore(raw ? JSON.parse(raw) : createEmptyStore());
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
      memoryStore = normalizeStore(raw ? JSON.parse(raw) : createEmptyStore());
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

const writeStore = async (store: OfflineLibraryStore) => {
  memoryStore = { ...store };

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

const getDownloadDirectory = () => {
  const baseDir = FileSystem.documentDirectory;
  if (!baseDir) return null;
  return `${baseDir}${DOWNLOAD_DIR_NAME}/`;
};

const toSafeFileName = (input: string) => {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return `video-${Date.now()}`;
  return normalized.replace(/[^a-z0-9_-]/g, '-').slice(0, 80);
};

const getFileExtension = (url: string) => {
  const cleanUrl = url.split('?')[0];
  const maybeExtension = cleanUrl.split('.').pop();
  if (!maybeExtension || maybeExtension.length > 5) return 'mp4';
  return maybeExtension;
};

const ensureDownloadDirectory = async () => {
  const directory = getDownloadDirectory();
  if (!directory) throw new Error('Storage directory is not available.');

  const info = await FileSystem.getInfoAsync(directory);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  }

  return directory;
};

const deleteFileIfExists = async (uri: string) => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch {
    // no-op
  }
};

const getSortedItems = (store: OfflineLibraryStore): OfflineLibraryItem[] => {
  return Object.values(store).sort((left, right) => right.updatedAt - left.updatedAt);
};

export const getOfflineLibraryItems = async (): Promise<OfflineLibraryItem[]> => {
  const store = await readStore();

  if (!isWeb) {
    let mutated = false;
    for (const [key, value] of Object.entries(store)) {
      const info = await FileSystem.getInfoAsync(value.localUri);
      if (!info.exists) {
        delete store[key];
        mutated = true;
      }
    }
    if (mutated) {
      await writeStore(store);
    }
  }

  return getSortedItems(store);
};

export const getOfflineItemById = async (id: string): Promise<OfflineLibraryItem | null> => {
  if (!id?.trim()) return null;
  const store = await readStore();
  return store[id] ?? null;
};

export const downloadVideoToLibrary = async (input: {
  id: string;
  title: string;
  remoteUrl: string;
}): Promise<OfflineLibraryItem> => {
  if (!input.id.trim() || !input.remoteUrl.trim()) {
    throw new Error('A valid id and remote URL are required.');
  }

  if (isWeb) {
    throw new Error('Offline download is not supported on web.');
  }

  const directory = await ensureDownloadDirectory();
  const extension = getFileExtension(input.remoteUrl);
  const fileName = `${toSafeFileName(input.id)}.${extension}`;
  const targetUri = `${directory}${fileName}`;

  const store = await readStore();
  const existing = store[input.id];
  if (existing?.localUri && existing.localUri !== targetUri) {
    await deleteFileIfExists(existing.localUri);
  }

  await deleteFileIfExists(targetUri);

  const result = await FileSystem.downloadAsync(input.remoteUrl, targetUri);
  const fileInfo = await FileSystem.getInfoAsync(result.uri, { size: true });

  const item: OfflineLibraryItem = {
    id: input.id,
    title: input.title,
    remoteUrl: input.remoteUrl,
    localUri: result.uri,
    updatedAt: Date.now(),
    sizeBytes: fileInfo.exists && typeof fileInfo.size === 'number' ? fileInfo.size : undefined,
  };

  store[input.id] = item;
  await writeStore(store);

  return item;
};

export const removeOfflineVideo = async (id: string): Promise<void> => {
  if (!id?.trim()) return;

  const store = await readStore();
  const existing = store[id];
  if (!existing) return;

  if (!isWeb) {
    await deleteFileIfExists(existing.localUri);
  }

  delete store[id];
  await writeStore(store);
};
