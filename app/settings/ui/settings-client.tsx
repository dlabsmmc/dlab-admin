"use client";

import { Save } from "lucide-react";
import { useState } from "react";

type SettingsTab = "general" | "seo" | "billing" | "security";

const tabOptions: Array<{ id: SettingsTab; label: string }> = [
  { id: "general", label: "General" },
  { id: "seo", label: "SEO & Marketing" },
  { id: "billing", label: "Billing & Rates" },
  { id: "security", label: "Security & Auth" },
];

export function SettingsClient() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">Configuration &amp; System Settings</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
            Restore Defaults
          </button>
          <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            <Save size={15} /> Save Global Changes
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {tabOptions.map((tab) => (
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

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-sky-100 bg-sky-50/30 p-4">
            <h3 className="mb-3 text-base font-semibold text-slate-900">Site Identity</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Store Name</label>
                <input defaultValue="D. LAB Electronics Store" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Contact Email</label>
                <input defaultValue="support@dlab.com" type="email" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Support Phone</label>
                <input defaultValue="+1 234 567 8900" />
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-sky-100 bg-sky-50/30 p-4">
            <h3 className="mb-3 text-base font-semibold text-slate-900">Logo &amp; Branding</h3>
            <div className="mb-3 flex h-30 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white text-sm text-slate-500">
              DLab Logo Preview
            </div>
            <button type="button" className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              Change Logo
            </button>
            <p className="mt-2 text-xs text-slate-500">Recommended: 240x100 PNG or SVG</p>
          </article>

          <article className="rounded-xl border border-sky-100 bg-sky-50/30 p-4">
            <h3 className="mb-3 text-base font-semibold text-slate-900">Regional &amp; Local</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Primary Currency</label>
                <select defaultValue="USD">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Timezone</label>
                <select defaultValue="UTC">
                  <option value="UTC">UTC (Universal Time)</option>
                  <option value="GMT+1">GMT+1</option>
                  <option value="EST">EST (US Eastern)</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-slate-700">Date Format</label>
              <select defaultValue="MMM DD, YYYY">
                <option value="MMM DD, YYYY">MMM DD, YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM-DD-YYYY">MM-DD-YYYY</option>
              </select>
            </div>
          </article>

          <article className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
            <h3 className="mb-3 text-base font-semibold text-emerald-700">Maintenance Mode</h3>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-slate-600">
                Disable public access to the storefront while performing system updates.
              </p>
              <button
                type="button"
                role="switch"
                aria-checked={maintenanceEnabled}
                onClick={() => setMaintenanceEnabled((value) => !value)}
                className={`relative h-6 w-12 rounded-full p-0 transition-colors ${maintenanceEnabled ? "bg-emerald-500" : "bg-slate-300"}`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${maintenanceEnabled ? "translate-x-7" : "translate-x-1"}`}
                />
              </button>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
