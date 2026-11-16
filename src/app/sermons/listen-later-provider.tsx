"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "victorycity.listen-later.v1";

type ListenLaterSnapshot = {
  savedIds: string[];
  isReady: boolean;
};

const SERVER_SNAPSHOT: ListenLaterSnapshot = {
  savedIds: [],
  isReady: false,
};

let snapshot = SERVER_SNAPSHOT;
let hasReadStorage = false;
const listeners = new Set<() => void>();

type ListenLaterContextValue = {
  savedIds: string[];
  isReady: boolean;
  isSaved: (sermonId: string) => boolean;
  toggleSaved: (sermonId: string) => void;
};

const ListenLaterContext =
  createContext<ListenLaterContextValue | null>(null);

function readSavedIds(): string[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    if (
      !Array.isArray(parsed) ||
      !parsed.every((item): item is string => typeof item === "string")
    ) {
      return [];
    }

    return [...new Set(parsed)];
  } catch {
    return [];
  }
}

function publish(savedIds: string[], isReady = true) {
  if (
    snapshot.isReady === isReady &&
    snapshot.savedIds.length === savedIds.length &&
    snapshot.savedIds.every((id, index) => id === savedIds[index])
  ) {
    return;
  }

  snapshot = { savedIds, isReady };
  listeners.forEach((listener) => listener());
}

function initializeFromStorage() {
  if (hasReadStorage) return;
  hasReadStorage = true;
  publish(readSavedIds());
}

function handleStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return;

  hasReadStorage = true;
  publish(readSavedIds());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (listeners.size === 1) {
    window.addEventListener("storage", handleStorage);
    initializeFromStorage();
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorage);
      hasReadStorage = false;
    }
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

export function ListenLaterProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { savedIds, isReady } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const isSaved = useCallback(
    (sermonId: string) => savedIds.includes(sermonId),
    [savedIds],
  );

  const toggleSaved = useCallback(
    (sermonId: string) => {
      if (!hasReadStorage) initializeFromStorage();

      const currentIds = snapshot.savedIds;
      const nextIds = currentIds.includes(sermonId)
        ? currentIds.filter((id) => id !== sermonId)
        : [sermonId, ...currentIds];

      publish(nextIds);

      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(nextIds),
        );
      } catch {
        // Keep the updated state in memory if browser storage is unavailable.
      }
    },
    [],
  );

  return (
    <ListenLaterContext.Provider
      value={{ savedIds, isReady, isSaved, toggleSaved }}
    >
      {children}
    </ListenLaterContext.Provider>
  );
}

export function useListenLater() {
  const context = useContext(ListenLaterContext);

  if (!context) {
    throw new Error(
      "useListenLater must be used inside ListenLaterProvider.",
    );
  }

  return context;
}
