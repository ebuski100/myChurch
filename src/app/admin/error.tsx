"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function AdminError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorState onRetry={retry} admin />;
}
