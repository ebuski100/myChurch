"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "victorycity.listen-later.v1";

type ListenLaterContextValue = {
  savedIds: string[];
  isReady: boolean;
  isSaved: (sermonId: string) => boolean;
  toggleSaved: (sermonId: string) => void;
};

const ListenLaterContext =
  createContext<ListenLaterContextValue | null>(null);

export function ListenLaterProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed: unknown = JSON.parse(stored);

        if (
          Array.isArray(parsed) &&
          parsed.every(
            (item): item is string => typeof item === "string",
          )
        ) {
          setSavedIds([...new Set(parsed)]);
        }
      }
    } catch {
      // Storage may be unavailable; the feature can still work for this page session.
    } finally {
      setIsReady(true);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY && event.key !== null) return;

      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const parsed: unknown = stored ? JSON.parse(stored) : [];

        if (
          Array.isArray(parsed) &&
          parsed.every(
            (item): item is string => typeof item === "string",
          )
        ) {
          setSavedIds([...new Set(parsed)]);
        } else {
          setSavedIds([]);
        }
      } catch {
        setSavedIds([]);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const isSaved = useCallback(
    (sermonId: string) => savedIds.includes(sermonId),
    [savedIds],
  );

  const toggleSaved = useCallback(
    (sermonId: string) => {
      const nextIds = savedIds.includes(sermonId)
        ? savedIds.filter((id) => id !== sermonId)
        : [sermonId, ...savedIds];

      setSavedIds(nextIds);

      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(nextIds),
        );
      } catch {
        // Keep the updated state in memory if browser storage is unavailable.
      }
    },
    [savedIds],
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
