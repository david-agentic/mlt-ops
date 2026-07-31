"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";
import { logger } from "@/lib/logger";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("route error boundary", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <ErrorState onRetry={reset} />
      </div>
    </div>
  );
}
