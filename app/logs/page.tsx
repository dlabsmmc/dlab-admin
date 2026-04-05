import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "@/app/ui/admin-shell";
import { LogsClient } from "./ui/logs-client";

export default async function LogsPage() {
  await requireAdminSession();

  return (
    <AdminShell activePath="/logs" searchPlaceholder="Search logs...">
      <LogsClient />
    </AdminShell>
  );
}
