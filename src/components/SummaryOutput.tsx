"use client";

import { useEffect, useState } from "react";

export function SummaryOutput({ eventId }: { eventId: string | null }) {
  const [summaryText, setSummaryText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setSummaryText("");
      setIsStreaming(false);
      setStreamError(null);
      return;
    }

    const selectedEventId = eventId;
    const controller = new AbortController();
    let active = true;
    setSummaryText("");
    setIsStreaming(true);
    setStreamError(null);

    async function readSummary() {
      try {
        const response = await fetch(`/api/stream-summary?eventId=${encodeURIComponent(selectedEventId)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Summary request failed (${response.status})`);
        }
        if (!response.body) {
          throw new Error("Summary response did not contain a stream");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done || !active) break;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            setSummaryText((text) => text + chunk);
          }
        }

        if (active) {
          const remaining = decoder.decode();
          if (remaining) {
            setSummaryText((text) => text + remaining);
          }
        }
      } catch (error) {
        if (active && !controller.signal.aborted) {
          setStreamError(error instanceof Error ? error.message : "Unable to load summary");
        }
      } finally {
        if (active) {
          setIsStreaming(false);
        }
      }
    }

    void readSummary();

    return () => {
      active = false;
      controller.abort();
    };
  }, [eventId]);

  return (
    <>
      {isStreaming && <p style={{ fontSize: "12px", color: "#38bdf8" }}>Streaming tokens...</p>}
      {streamError && <p role="alert">{streamError}</p>}
      <div
        style={{
          background: "#1e293b",
          padding: "14px",
          borderRadius: "8px",
          border: "1px solid #334155",
          whiteSpace: "pre-wrap",
          lineHeight: 1.55,
          minHeight: "180px",
        }}
      >
        {summaryText || "Select an event to generate an AI incident analysis..."}
      </div>
    </>
  );
}
