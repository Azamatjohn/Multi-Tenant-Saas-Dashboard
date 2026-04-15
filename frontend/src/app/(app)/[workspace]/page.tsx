"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { AnalyticsResponse } from "@/types";
import { Users, Activity, BarChart3, CreditCard } from "lucide-react";

export default function DashboardPage() {
  const params = useParams();
  const workspace = params.workspace as string;

  const { data: analytics } = useQuery<AnalyticsResponse>({
    queryKey: ["analytics", workspace],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${workspace}/analytics?days=30`);
      return data;
    },
  });

  const { data: workspaceData } = useQuery({
    queryKey: ["workspace", workspace],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${workspace}`);
      return data;
    },
  });

  const stats = [
    {
      label: "Total members",
      value: analytics?.summary.total_members ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Active this week",
      value: analytics?.summary.active_members ?? 0,
      icon: Activity,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "API calls this month",
      value: analytics?.summary.total_api_calls.toLocaleString() ?? 0,
      icon: BarChart3,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Current plan",
      value: "Starter",
      icon: CreditCard,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Welcome to {workspaceData?.name ?? workspace}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Here&apos;s what&apos;s happening in your workspace.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4"
          >
            <div className={`${stat.bg} ${stat.color} p-2.5 rounded-lg`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-semibold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">API usage — last 30 days</h3>
          {analytics?.daily_usage && analytics.daily_usage.length > 0 ? (
            <div className="h-48 flex items-end gap-1">
              {analytics.daily_usage.slice(-20).map((d, i) => {
                const max = Math.max(...analytics.daily_usage.map(x => x.api_calls));
                const height = max > 0 ? (d.api_calls / max) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <div
                      className="bg-slate-900 rounded-t-sm min-h-[2px]"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${d.date}: ${d.api_calls} calls`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No usage data yet — make some API calls to see activity here.
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Quick actions</h3>
          <div className="space-y-2">
            {[
              { label: "Invite a member", href: `/${workspace}/members` },
              { label: "View analytics", href: `/${workspace}/analytics` },
              { label: "Manage billing", href: `/${workspace}/billing` },
              { label: "Workspace settings", href: `/${workspace}/settings` },
            ].map((action) => (

              <a  key={action.label}
                href={action.href}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-colors text-sm text-slate-700"
              >

                {action.label}
                <span className="text-slate-400">→</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}