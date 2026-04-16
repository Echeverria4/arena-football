import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

export interface ImportedVideoAsset {
  fileName: string;
  fileSizeBytes: number;
  mimeType?: string | null;
  storageKey: string;
  videoUrl: string;
}

// ─── Web: IndexedDB storage ──────────────────────────────────────────────────

const DB_NAME = "arena-local-video-assets";
const STORE_NAME = "videos";

function canUseBrowserVideoImport() {
  return (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof indexedDB !== "undefined"
  );
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!canUseBrowserVideoImport()) {
      reject(new Error("Importação de vídeo indisponível fora do navegador."));
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Falha ao abrir o banco local de vídeos."));
  });
}

async function persistVideoFile(storageKey: string, file: File) {
  const database = await openDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.put(file, storageKey);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Falha ao salvar o vídeo no armazenamento local."));
    };
  });
}

async function readPersistedVideoFile(storageKey: string) {
  const database = await openDatabase();

  return new Promise<File | null>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(storageKey);

    request.onsuccess = () => {
      database.close();
      resolve((request.result as File | undefined) ?? null);
    };
    request.onerror = () => {
      database.close();
      reject(request.error ?? new Error("Falha ao carregar o vídeo salvo localmente."));
    };
  });
}

function pickFileFromBrowser() {
  return new Promise<File | null>((resolve) => {
    if (!canUseBrowserVideoImport()) {
      resolve(null);
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.style.position = "fixed";
    input.style.left = "-9999px";

    input.onchange = () => {
      const file = input.files?.[0] ?? null;
      input.remove();
      resolve(file);
    };

    input.oncancel = () => {
      input.remove();
      resolve(null);
    };

    document.body.appendChild(input);
    input.click();
  });
}

async function pickVideoFromBrowser(): Promise<ImportedVideoAsset | null> {
  const file = await pickFileFromBrowser();

  if (!file) {
    return null;
  }

  const storageKey = `video-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await persistVideoFile(storageKey, file);

  return {
    fileName: file.name,
    fileSizeBytes: file.size,
    mimeType: file.type || null,
    storageKey,
    videoUrl: `local-video://${storageKey}`,
  };
}

// ─── Native: expo-image-picker ───────────────────────────────────────────────

async function pickVideoFromNative(): Promise<ImportedVideoAsset | null> {
  // Request permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Permissão para acessar a galeria negada. Acesse as configurações do celular para permitir.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "videos",
    allowsEditing: false,
    quality: 1,
    videoMaxDuration: 300, // 5 minutes max
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const fileName = asset.fileName ?? asset.uri.split("/").pop() ?? `video-${Date.now()}.mp4`;
  const storageKey = `native-video-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    fileName,
    fileSizeBytes: asset.fileSize ?? 0,
    mimeType: asset.mimeType ?? "video/mp4",
    storageKey,
    // On native, the uri is a file:// path usable directly by expo-av
    videoUrl: asset.uri,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function pickLocalVideoAsset(): Promise<ImportedVideoAsset | null> {
  if (Platform.OS === "web") {
    return pickVideoFromBrowser();
  }

  return pickVideoFromNative();
}

export async function deleteLocalVideoAsset(storageKey?: string | null) {
  if (!storageKey || !canUseBrowserVideoImport()) {
    return;
  }

  const database = await openDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.delete(storageKey);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Falha ao remover o vídeo do armazenamento local."));
    };
  });
}

export async function deleteLocalVideoAssets(storageKeys: Array<string | null | undefined>) {
  await Promise.all(storageKeys.filter((value): value is string => Boolean(value)).map(deleteLocalVideoAsset));
}

export function isLocalVideoImportAvailable() {
  // Available on web (IndexedDB) and on native (expo-image-picker)
  return Platform.OS !== "web" || canUseBrowserVideoImport();
}

export async function resolvePlayableVideoUrl(videoUrl: string) {
  // Native file:// URIs are already directly playable
  if (videoUrl.startsWith("file://")) {
    return videoUrl;
  }

  if (!videoUrl.startsWith("local-video://")) {
    return videoUrl;
  }

  if (!canUseBrowserVideoImport()) {
    return videoUrl;
  }

  const storageKey = videoUrl.replace("local-video://", "");
  const file = await readPersistedVideoFile(storageKey);

  if (!file) {
    return "";
  }

  return URL.createObjectURL(file);
}

export function formatImportedVideoSize(fileSizeBytes: number) {
  if (fileSizeBytes >= 1024 * 1024 * 1024) {
    return `${(fileSizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  if (fileSizeBytes >= 1024 * 1024) {
    return `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (fileSizeBytes >= 1024) {
    return `${Math.round(fileSizeBytes / 1024)} KB`;
  }

  return `${fileSizeBytes} B`;
}
