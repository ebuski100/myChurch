export type AdminNoticeTimerHost = {
  setTimeout(callback: () => void, milliseconds: number): unknown;
  clearTimeout(handle: unknown): void;
};

export function createAdminNoticeTimer(
  onDismiss: () => void,
  host: AdminNoticeTimerHost,
  milliseconds = 3000,
) {
  let handle: unknown;

  return {
    start() {
      if (handle !== undefined) host.clearTimeout(handle);
      handle = host.setTimeout(() => {
        handle = undefined;
        onDismiss();
      }, milliseconds);
    },
    clear() {
      if (handle === undefined) return;
      host.clearTimeout(handle);
      handle = undefined;
    },
  };
}
