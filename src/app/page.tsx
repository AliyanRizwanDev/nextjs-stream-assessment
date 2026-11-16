"use client";


import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SystemEvent } from "@/lib/mockData";
import { HeavyPayloadFormatter } from "@/components/HeavyPayloadFormatter";
import { SummaryOutput } from "@/components/SummaryOutput";

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get("search") || "";
  const urlSeverity = searchParams.get("severity") || "all";
  const currentParams = searchParams.toString();
  const [search, setSearch] = useState(urlSearch);
  const [severity, setSeverity] = useState(urlSeverity);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<SystemEvent | null>(null);
  const [selectionRequestId, setSelectionRequestId] = useState(0);

  const [isHydrated, setIsHydrated] = useState(false);
  const renderCount = useRef(0);
  renderCount.current += 1;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Trap A: Effect 1 pushes local state into URL
  useEffect(() => {
    if (search === urlSearch && severity === urlSeverity) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(currentParams);
      if (search) params.set("search", search);
      else params.delete("search");
      if (severity !== "all") params.set("severity", severity);
      else params.delete("severity");

      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [currentParams, pathname, router, search, severity, urlSearch, urlSeverity]);

  // Trap B: Effect 2 also listens to searchParams and overwrites state (feedback loop)
  useEffect(() => {
    setSearch(urlSearch);
    setSeverity(urlSeverity);
  }, [urlSearch, urlSeverity]);

  // Trap C: Un-debounced fetch with no race-condition cancellation
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoadingEvents(true);
    setEventsError(null);
    const params = new URLSearchParams();
    if (urlSearch) params.set("search", urlSearch);
    if (urlSeverity !== "all") params.set("severity", urlSeverity);

    async function loadEvents() {
      try {
        const response = await fetch(`/api/events?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Event request failed (${response.status})`);
        }
        const data: { events?: SystemEvent[] } = await response.json();
        if (active) {
          setEvents(data.events || []);
        }
      } catch (error) {
        if (active) {
          setEventsError(error instanceof Error ? error.message : "Unable to load events");
        }
      } finally {
        if (active) {
          setLoadingEvents(false);
        }
      }
    }

    void loadEvents();

    return () => {
      active = false;
      controller.abort();
    };
  }, [urlSearch, urlSeverity]);

  // Trap D: Uncancelled streaming reader causes cross-event token bleed
  async function handleSelectEvent(evt: SystemEvent) {
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
            onChange={(e) => setSearch(e.target.value)}
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
            onChange={(e) => setSeverity(e.target.value)}
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
          {loadingEvents && <div style={{ padding: "12px", color: "#94a3b8" }}>Loading events...</div>}
          {eventsError && <p role="alert">{eventsError}</p>}
          {events.map((evt) => (
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
