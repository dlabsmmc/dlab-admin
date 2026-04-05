import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "@/app/ui/admin-shell";
import { SettingsClient } from "./ui/settings-client";

export default async function SettingsPage() {
  await requireAdminSession();

  return (
    <AdminShell activePath="/settings" searchPlaceholder="Search settings...">
      <SettingsClient />
    </AdminShell>
  );
}
