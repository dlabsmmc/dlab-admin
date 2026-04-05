"use client";

import { Download, Filter, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type LogType = "all" | "login" | "error" | "product";

type LogItem = {
  id: string;
  timestamp: string;
  type: Exclude<LogType, "all">;
  user: string;
  description: string;
  ipAddress: string;
  status: "Success" | "Critical";
};

const allLogsSeed: LogItem[] = [
  {
    id: "1",
    timestamp: "Oct 24, 2023 - 14:22:15",
    type: "login",
    user: "Admin User",
    description: "Successful login to dashboard",
    ipAddress: "192.168.1.5",
    status: "Success",
  },
  {
    id: "2",
    timestamp: "Oct 24, 2023 - 13:50:02",
    type: "product",
    user: "Admin User",
    description: "Updated product: Wireless Earbuds",
    ipAddress: "192.168.1.5",
    status: "Success",
  },
  {
    id: "3",
    timestamp: "Oct 24, 2023 - 11:20:44",
    type: "error",
    user: "System",
    description: "Failed to connect to primary mail server for notifications.",
    ipAddress: "Localhost",
    status: "Critical",
  },
  {
    id: "4",
    timestamp: "Oct 23, 2023 - 10:15:22",
    type: "login",
    user: "Manager X",
    description: "User logged out session ending",
    ipAddress: "172.16.0.42",
    status: "Success",
  },
];

const tabs: Array<{ id: LogType; label: string }> = [
  { id: "all", label: "All Activity" },
  { id: "login", label: "Login Attempts" },
  { id: "error", label: "System Errors" },
  { id: "product", label: "Product Updates" },
];

const eventTypeClasses: Record<LogItem["type"], string> = {
  login: "bg-sky-100 text-sky-700",
  product: "bg-amber-100 text-amber-700",
  error: "bg-rose-100 text-rose-700",
};

export function LogsClient() {
  const [activeTab, setActiveTab] = useState<LogType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState<LogItem[]>(allLogsSeed);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("none");

  const filteredLogs = useMemo(() => {
    return logs.filter((row) => {
      const tabMatch = activeTab === "all" || row.type === activeTab;
      if (!tabMatch) return false;

      if (!searchQuery.trim()) return true;
      const normalizedQuery = searchQuery.toLowerCase();

      return (
        row.user.toLowerCase().includes(normalizedQuery) ||
        row.description.toLowerCase().includes(normalizedQuery) ||
        row.ipAddress.toLowerCase().includes(normalizedQuery) ||
        row.timestamp.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [activeTab, logs, searchQuery]);

  const allVisibleSelected = filteredLogs.length > 0 && filteredLogs.every((row) => selectedIds.includes(row.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((previous) => previous.filter((id) => !filteredLogs.some((log) => log.id === id)));
      return;
    }

    setSelectedIds((previous) => Array.from(new Set([...previous, ...filteredLogs.map((row) => row.id)])));
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((previous) => (previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]));
  };

  const exportCsv = (rows: LogItem[]) => {
    const header = "Timestamp,Event Type,User,Description,IP Address,Status";
    const content = rows
      .map((row) =>
        [row.timestamp, row.type, row.user, row.description, row.ipAddress, row.status]
          .map((value) => `\"${value.replace(/\"/g, "\"\"")}\"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([`${header}\n${content}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "system-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const applyBulkAction = () => {
    if (!selectedIds.length || bulkAction === "none") return;

    if (bulkAction === "delete") {
      setLogs((previous) => previous.filter((row) => !selectedIds.includes(row.id)));
      setSelectedIds([]);
      return;
    }

    const selectedRows = logs.filter((row) => selectedIds.includes(row.id));
    if (selectedRows.length) {
      exportCsv(selectedRows);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">System Activity Logs</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportCsv(filteredLogs)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
          >
            <Download size={15} /> Download CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setLogs([]);
              setSelectedIds([]);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white"
          >
            <Trash2 size={15} /> Clear All Logs
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select value={bulkAction} onChange={(event) => setBulkAction(event.target.value)} className="w-44">
              <option value="none">Bulk Actions</option>
              <option value="export">Export Selected</option>
              <option value="delete">Delete Selected</option>
            </select>
            <button
              type="button"
              onClick={applyBulkAction}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              disabled={!selectedIds.length || bulkAction === "none"}
            >
              Apply
            </button>
          </div>

          <div className="flex w-full max-w-md items-center gap-2">
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search logs..." />
            <button type="button" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700">
              <Filter size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="w-10 px-2 py-2">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} aria-label="Select all visible logs" />
                </th>
                <th className="px-2 py-2 font-medium">Timestamp</th>
                <th className="px-2 py-2 font-medium">Event Type</th>
                <th className="px-2 py-2 font-medium">User</th>
                <th className="px-2 py-2 font-medium">Description</th>
                <th className="px-2 py-2 font-medium">IP Address</th>
                <th className="px-2 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-8 text-center text-sm text-slate-500">
                    No logs found for the current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-2 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleSelectRow(row.id)}
                        aria-label={`Select log ${row.id}`}
                      />
                    </td>
                    <td className="px-2 py-3 text-slate-500">{row.timestamp}</td>
                    <td className="px-2 py-3">
                      <span className={`rounded-md px-2 py-1 text-xs font-medium capitalize ${eventTypeClasses[row.type]}`}>{row.type}</span>
                    </td>
                    <td className="px-2 py-3 text-slate-800">{row.user}</td>
                    <td className="px-2 py-3 text-slate-700">{row.description}</td>
                    <td className="px-2 py-3 text-slate-500">{row.ipAddress}</td>
                    <td className="px-2 py-3">
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          row.status === "Success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
