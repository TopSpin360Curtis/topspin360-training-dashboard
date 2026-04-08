"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/dataUtils";
import type { DashboardTenant, LoginAuditEvent } from "@/lib/types";

type AdminAccessModalProps = {
  open: boolean;
  onClose: () => void;
};

type AdminOverviewPayload = {
  accounts: DashboardTenant[];
  loginEvents: LoginAuditEvent[];
  auditConfigured: boolean;
};

export default function AdminAccessModal({ open, onClose }: AdminAccessModalProps) {
  const [payload, setPayload] = useState<AdminOverviewPayload | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadOverview() {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/admin/overview", {
        credentials: "same-origin",
        cache: "no-store"
      });
      const nextPayload = (await response.json().catch(() => null)) as
        | AdminOverviewPayload
        | { error?: string }
        | null;

      if (cancelled) {
        return;
      }

      if (!response.ok) {
        setError(nextPayload && "error" in nextPayload ? nextPayload.error ?? "Unable to load admin data." : "Unable to load admin data.");
        setIsLoading(false);
        return;
      }

      setPayload(nextPayload as AdminOverviewPayload);
      setIsLoading(false);
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <div className="max-h-[85vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/70 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
              Admin
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-brand-ink">Access & Login Activity</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Close
          </button>
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
            Loading admin access data...
          </div>
        ) : error ? (
          <div className="mt-6 rounded-3xl border border-rose-100 bg-rose-50 p-5 text-sm text-rose-700">
            {error}
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.25fr]">
            <article className="rounded-3xl border border-slate-100 bg-slate-50/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
                Account Access
              </p>
              <div className="mt-4 space-y-3">
                {payload?.accounts.length ? (
                  payload.accounts.map((account) => (
                    <div key={account.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-brand-ink">{account.label}</p>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {account.role}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">Username: {account.username}</p>
                      <p className="mt-1 text-sm text-slate-500">Route: /login/{account.loginRoute}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Export access: {account.canExport ? "Yes" : "No"}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                    No accounts are configured for this dataset scope.
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Need more users? Send the requested usernames and permissions and we can add them.
              </p>
            </article>

            <article className="rounded-3xl border border-slate-100 bg-slate-50/60 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
                    Login Activity
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Latest successful sign-ins for this dataset
                  </p>
                </div>
                {!payload?.auditConfigured ? (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    Audit sheet not configured
                  </span>
                ) : null}
              </div>
              <div className="mt-4 space-y-3">
                {payload?.loginEvents.length ? (
                  payload.loginEvents.map((event) => (
                    <div key={`${event.tenantId}-${event.username}-${event.timestamp}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold text-brand-ink">{event.username}</p>
                        <p className="text-sm text-slate-500">{formatDate(event.timestamp.slice(0, 10))} · {new Date(event.timestamp).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}</p>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {event.tenantLabel} · {event.role} · Export {event.canExport ? "enabled" : "disabled"}
                      </p>
                      {event.ipAddress ? (
                        <p className="mt-1 text-xs text-slate-400">{event.ipAddress}</p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                    {payload?.auditConfigured
                      ? "No successful sign-ins have been logged yet for this dataset."
                      : "Add LOGIN_AUDIT_SHEET_ID and LOGIN_AUDIT_SHEET_RANGE in Vercel to track successful sign-ins across devices."}
                  </div>
                )}
              </div>
            </article>
          </div>
        )}
      </div>
    </div>
  );
}
