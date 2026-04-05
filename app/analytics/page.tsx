import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "@/app/ui/admin-shell";
import { AnalyticsClient } from "./ui/analytics-client";

export default async function AnalyticsPage() {
  await requireAdminSession();

  return (
    <AdminShell activePath="/analytics" searchPlaceholder="Search analytics...">
      <AnalyticsClient />
    </AdminShell>
  );
}
