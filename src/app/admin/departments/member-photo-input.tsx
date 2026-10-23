"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const inputClass = "block w-full text-sm text-[#475467] file:mr-3 file:min-h-10 file:rounded-full file:border-0 file:bg-[#101B33] file:px-4 file:text-xs file:font-semibold file:text-white hover:file:bg-[#263653]";

export function MemberPhotoInput({ id, initialPreview = null }: { id: string; initialPreview?: string | null }) {
  const [preview, setPreview] = useState<string | null>(initialPreview);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className="sm:col-span-2 rounded-xl border border-dashed border-[#D0D5DD] bg-[#FCFCFD] p-3">
      <div className="flex items-center gap-3">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border border-[#EAECF0] bg-[#F8F4E9] text-sm font-semibold text-[#9A772E]">
          {preview ? <Image src={preview} alt="Member photo preview" width={64} height={64} unoptimized className="size-16 object-cover" /> : <span aria-hidden="true">Photo</span>}
        </div>
        <div className="min-w-0 flex-1">
          <label className="mb-2 block text-xs font-semibold text-[#344054]" htmlFor={id}>Profile picture</label>
          <input
            id={id}
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={inputClass}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (!file) return;
              if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
              setPreview(URL.createObjectURL(file));
            }}
          />
          <p className="mt-2 text-[11px] leading-4 text-[#667085]">JPG, PNG, or WebP · maximum 5 MB. The photo stays private until the profile is approved for public display.</p>
        </div>
      </div>
    </div>
  );
}
