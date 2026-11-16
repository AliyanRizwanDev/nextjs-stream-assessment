"use client";

import React from "react";

/**
 * Simulates an expensive markdown / syntax highlighting component.
 * Intentionally un-memoized in starter code so parent re-renders cause noticeable lag.
 */
export function HeavyPayloadFormatter({ rawPayload }: { rawPayload: string }) {
  // Simulate ~12ms of synchronous formatting work per render
  const start = performance.now();
  let checksum = 0;
  while (performance.now() - start < 12) {
    checksum = (checksum + 1) % 1000;
  }

  return (
    <div data-checksum={checksum} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <details open>
        <summary style={{ cursor: "pointer", color: "#94a3b8", fontSize: "13px" }}>Raw Telemetry Payload</summary>
        <pre
          style={{
            background: "#020617",
            padding: "12px",
            borderRadius: "6px",
            fontSize: "12px",
            overflowX: "auto",
          }}
        >
          {rawPayload}
        </pre>
      </details>
    </div>
  );
}
