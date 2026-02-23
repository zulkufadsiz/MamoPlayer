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

const WEB_STORAGE_KEY = 'mamo-offline-library-v1';
let memoryStore: OfflineLibraryStore = {};

const readStore = (): OfflineLibraryStore => {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') {
    return memoryStore;
  }

  try {
    const raw = localStorage.getItem(WEB_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeStore = (store: OfflineLibraryStore) => {
  memoryStore = store;
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // no-op
  }
};

export const getOfflineLibraryItems = async (): Promise<OfflineLibraryItem[]> => {
  return Object.values(readStore()).sort((a, b) => b.updatedAt - a.updatedAt);
};

export const getOfflineItemById = async (id: string): Promise<OfflineLibraryItem | null> => {
  if (!id?.trim()) return null;
  return readStore()[id] ?? null;
};

export const downloadVideoToLibrary = async (input: {
  id: string;
  title: string;
  remoteUrl: string;
}): Promise<OfflineLibraryItem> => {
  if (!input.id?.trim() || !input.remoteUrl?.trim()) {
    throw new Error('A valid id and remote URL are required.');
  }

  const store = readStore();
  const item: OfflineLibraryItem = {
    id: input.id,
    title: input.title,
    remoteUrl: input.remoteUrl,
    localUri: input.remoteUrl,
    updatedAt: Date.now(),
  };

  store[input.id] = item;
  writeStore(store);
  return item;
};

export const removeOfflineVideo = async (id: string): Promise<void> => {
  if (!id?.trim()) return;
  const store = readStore();
  delete store[id];
  writeStore(store);
};
