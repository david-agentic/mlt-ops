"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The root layout itself failed to render, so we can't rely on the
    // regular design system here — log via console directly.
    console.error("global error boundary:", error.message, error.digest);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Something went wrong</h1>
            <p style={{ color: "#666", marginTop: "0.5rem" }}>
              A critical error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                background: "#111",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
