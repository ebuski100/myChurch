"use client";

import { useActionState, useState } from "react";
import { AdminNotice } from "../../../admin-notice";
import {
  updateSermonAudioDownloadAction,
  type AudioDownloadActionState,
} from "../../actions";

const initialState: AudioDownloadActionState = {};

export function AudioDownloadSetting({
  resourceId,
  hasAudioAsset,
  downloadAllowed,
}: {
  resourceId: string;
  hasAudioAsset: boolean;
  downloadAllowed: boolean;
}) {
  const action = updateSermonAudioDownloadAction.bind(
    null,
    resourceId,
  );
  const [state, formAction, pending] = useActionState(
    action,
    initialState,
  );
  const [enabled, setEnabled] = useState(downloadAllowed);
  const savedValue =
    state.success && typeof state.downloadAllowed === "boolean"
      ? state.downloadAllowed
      : downloadAllowed;

  return (
    <form
      action={formAction}
      className="mt-5 border-t border-[#EAECF0] pt-5"
    >
      <input
        type="hidden"
        name="downloadAllowed"
        value={enabled ? "true" : "false"}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <label
            htmlFor="allow-sermon-downloads"
            className="flex cursor-pointer items-start gap-3 text-sm font-semibold text-[#344054]"
          >
            <input
              id="allow-sermon-downloads"
              type="checkbox"
              checked={enabled}
              onChange={(event) =>
                setEnabled(event.currentTarget.checked)
              }
              disabled={!hasAudioAsset || pending}
              className="mt-0.5 size-4 accent-[#9A772E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] disabled:cursor-not-allowed"
            />
            <span>Allow official audio downloads</span>
          </label>
          <p className="ml-7 mt-1.5 max-w-xl text-xs leading-5 text-[#667085]">
            This controls downloads through the authorized sermon
            endpoint. The audio remains in private storage.
            {!hasAudioAsset &&
              " Upload an audio recording before changing this setting."}
          </p>
          <p className="ml-7 mt-1 text-xs text-[#667085]">
            Current saved setting:{" "}
            {savedValue ? "downloads enabled" : "downloads disabled"}.
          </p>
        </div>
        <button
          type="submit"
          disabled={
            !hasAudioAsset || pending || enabled === savedValue
          }
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-[#101B33] px-4 text-sm font-semibold text-white hover:bg-[#263653] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
        >
          {pending ? "Saving…" : "Save download setting"}
        </button>
      </div>
      {state.message && (
        <AdminNotice
          message={state.message}
          kind={state.success === false ? "error" : "success"}
          resetKey={state}
          className="mt-4"
        />
      )}
    </form>
  );
}
