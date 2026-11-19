export type DownloadStatus = "not-downloaded" | "downloading" | "complete" | "failed";

export type DownloadRecord = {
  id: string;
  title: string;
  mediaType: "audio";
  mimeType: string | null;
  size: number | null;
  status: "downloading" | "complete" | "failed";
  downloadedAt: number | null;
  error: string | null;
};

const DB_NAME = "vc-downloads-db";
const DB_VERSION = 1;
const STORE = "downloads";
const CACHE_NAME = "vc-downloads-v1";
const MAX_DOWNLOAD_BYTES = 200 * 1024 * 1024;

const inFlight = new Map<string, Promise<void>>();

function syntheticKey(id: string): string {
  return `https://offline-download.local/sermon-audio/${encodeURIComponent(id)}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getRecord(id: string): Promise<DownloadRecord | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.get(id);
    req.onsuccess = () => resolve((req.result as DownloadRecord) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function putRecord(record: DownloadRecord): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function deleteRecord(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getDownloadStatus(id: string): Promise<DownloadStatus> {
  try {
    const rec = await getRecord(id);
    if (!rec) return "not-downloaded";
    if (rec.status === "complete") return "complete";
    if (rec.status === "downloading") return "downloading";
    return "failed";
  } catch {
    return "not-downloaded";
  }
}

export async function getDownloadRecord(id: string): Promise<DownloadRecord | null> {
  try {
    return await getRecord(id);
  } catch {
    return null;
  }
}

export async function removeDownload(id: string): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(syntheticKey(id));
  } catch {
    // ignore
  }
  try {
    await deleteRecord(id);
  } catch {
    // ignore
  }
}

export type ProgressCallback = (loaded: number, total: number | null) => void;

export async function downloadSermonAudio(
  id: string,
  title: string,
  onProgress?: ProgressCallback,
): Promise<void> {
  if (inFlight.has(id)) {
    return inFlight.get(id)!;
  }

  const task = (async () => {
    await putRecord({
      id,
      title,
      mediaType: "audio",
      mimeType: null,
      size: null,
      status: "downloading",
      downloadedAt: null,
      error: null,
    });

    try {
      const res = await fetch(`/api/sermons/${encodeURIComponent(id)}/audio`, {
        credentials: "same-origin",
      });

      if (!res.ok) {
        throw new Error(`Download failed (${res.status})`);
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.toLowerCase().startsWith("audio/")) {
        throw new Error("Unexpected content type");
      }

      const totalHeader = res.headers.get("content-length");
      const total = totalHeader ? Number(totalHeader) : null;

      if (!res.body) {
        throw new Error("Streaming not supported");
      }

      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.byteLength;
          if (loaded > MAX_DOWNLOAD_BYTES) {
            throw new Error("File too large");
          }
          onProgress?.(loaded, total);
        }
      }

      const blob = new Blob(chunks as BlobPart[], { type: contentType });
      const cache = await caches.open(CACHE_NAME);
      await cache.put(
        syntheticKey(id),
        new Response(blob, {
          headers: { "Content-Type": contentType },
        }),
      );

      await putRecord({
        id,
        title,
        mediaType: "audio",
        mimeType: contentType,
        size: loaded,
        status: "complete",
        downloadedAt: Date.now(),
        error: null,
      });
    } catch (err) {
      await putRecord({
        id,
        title,
        mediaType: "audio",
        mimeType: null,
        size: null,
        status: "failed",
        downloadedAt: null,
        error: err instanceof Error ? err.message : "Download failed",
      }).catch(() => {});
      throw err;
    }
  })();

  inFlight.set(id, task);
  try {
    await task;
  } finally {
    inFlight.delete(id);
  }
}

export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage && navigator.storage.persist) {
      await navigator.storage.persist();
    }
  } catch {
    // ignore
  }
}
