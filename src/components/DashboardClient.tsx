"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SystemEvent } from "@/lib/mockData";
import { HeavyPayloadFormatter } from "@/components/HeavyPayloadFormatter";
import { SummaryOutput } from "@/components/SummaryOutput";

type DashboardClientProps = {
  initialEvents: SystemEvent[];
  initialSearch: string;
  initialSeverity: string;
};

export function DashboardClient({
  initialEvents,
  initialSearch,
  initialSeverity,
}: DashboardClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialSearch);
  const [severity, setSeverity] = useState(initialSeverity);
  const [selectedEvent, setSelectedEvent] = useState<SystemEvent | null>(null);
  const [selectionRequestId, setSelectionRequestId] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPending, startTransition] = useTransition();
  const renderCount = useRef(0);
  renderCount.current += 1;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Trap A: Effect 1 pushes local state into URL
  useEffect(() => {
    if (search === initialSearch && severity === initialSeverity) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (search) params.set("search", search);
      else params.delete("search");
      if (severity !== "all") params.set("severity", severity);
      else params.delete("severity");

      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [initialSearch, initialSeverity, pathname, router, search, severity]);

  // Trap B: Effect 2 also listens to searchParams and overwrites state (feedback loop)
  useEffect(() => {
    setSearch(initialSearch);
    setSeverity(initialSeverity);
  }, [initialSearch, initialSeverity]);

  function handleFilterChange(update: () => void) {
    setSelectedEvent(null);
    setSelectionRequestId((requestId) => requestId + 1);
    update();
  }

  // Trap D: Uncancelled streaming reader causes cross-event token bleed
  function handleSelectEvent(evt: SystemEvent) {
    setSelectedEvent(evt);
    setSelectionRequestId((requestId) => requestId + 1);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", height: "100vh", overflow: "hidden" }}>
      {/* Left Pane: Filters & 500-Row Event Feed */}
      <div style={{ borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid #1e293b", display: "flex", gap: "12px", alignItems: "center" }}>
          <input
            type="text"
            value={search}
            onChange={(event) => handleFilterChange(() => setSearch(event.target.value))}
            placeholder="Filter by service, title, or ID..."
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #334155",
              background: "#1e293b",
              color: "#f8fafc",
            }}
          />
          <select
            value={severity}
            onChange={(event) => handleFilterChange(() => setSeverity(event.target.value))}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #334155",
              background: "#1e293b",
              color: "#f8fafc",
            }}
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            Page renders: {isHydrated ? renderCount.current : "..."}
          </span>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {isPending && <div style={{ padding: "12px", color: "#94a3b8" }}>Loading events...</div>}
          {initialEvents.map((evt) => (
            <div
              key={evt.id}
              onClick={() => handleSelectEvent(evt)}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #1e293b",
                cursor: "pointer",
                background: selectedEvent?.id === evt.id ? "#1e293b" : "transparent",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "14px", fontWeight: 500 }}>{evt.title}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  {evt.id} · {evt.timestamp}
                </div>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background:
                    evt.severity === "critical" ? "#7f1d1d" : evt.severity === "warning" ? "#78350f" : "#1e3a8a",
                  color: "#f8fafc",
                }}
              >
                {evt.severity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane: Streaming AI Incident Drawer */}
      <div style={{ padding: "20px", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "18px" }}>
            {selectedEvent ? `Analysis: ${selectedEvent.id}` : "Incident Summary"}
          </h2>
        </div>
        <SummaryOutput
          key={selectionRequestId}
          eventId={selectedEvent?.id ?? null}
        />

        <HeavyPayloadFormatter rawPayload={selectedEvent?.rawPayload || "{}"} />
      </div>
    </div>
  );
}
