import { DashboardClient } from "@/components/DashboardClient";
import { getFilteredEvents } from "@/lib/mockData";

type DashboardPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    severity?: string | string[];
  }>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const search = firstValue(params.search) ?? "";
  const severity = firstValue(params.severity) ?? "all";
  const events = getFilteredEvents(search, severity);

  return (
    <DashboardClient
      initialEvents={events}
      initialSearch={search}
      initialSeverity={severity}
    />
  );
}
