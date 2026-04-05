import type { StateStorage } from "zustand/middleware";

function createMemoryStorage(): StateStorage {
  const memoryStore: Record<string, string> = {};

  return {
    getItem: (name) => memoryStore[name] ?? null,
    setItem: (name, value) => {
      memoryStore[name] = value;
    },
    removeItem: (name) => {
      delete memoryStore[name];
    },
  };
}

const memoryStorage = createMemoryStorage();

function getWebStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const persistStorage: StateStorage = {
  getItem: (name) => {
    const storage = getWebStorage();
    return storage ? storage.getItem(name) : memoryStorage.getItem(name);
  },
  setItem: (name, value) => {
    const storage = getWebStorage();

    if (storage) {
      storage.setItem(name, value);
      return;
    }

    memoryStorage.setItem(name, value);
  },
  removeItem: (name) => {
    const storage = getWebStorage();

    if (storage) {
      storage.removeItem(name);
      return;
    }

    memoryStorage.removeItem(name);
  },
};
