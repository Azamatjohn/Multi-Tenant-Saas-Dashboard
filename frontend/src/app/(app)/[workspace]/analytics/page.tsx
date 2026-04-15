"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { AnalyticsResponse } from "@/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsPage() {
  const params = useParams();
  const workspace = params.workspace as string;
  const [days, setDays] = useState(30);

  const { data: analytics, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: ["analytics", workspace, days],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${workspace}/analytics?days=${days}`);
      return data;
    },
  });

  const summary = analytics?.summary;
  const chartData = analytics?.daily_usage.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    calls: d.api_calls,
  })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">Usage metrics for your workspace.</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                days === d ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total API calls", value: summary?.total_api_calls.toLocaleString() ?? "0" },
          { label: "Avg calls / day", value: summary?.avg_calls_per_day.toFixed(1) ?? "0" },
          { label: "Peak day calls", value: summary?.peak_calls.toLocaleString() ?? "0" },
          { label: "Active members", value: `${summary?.active_members ?? 0} of ${summary?.total_members ?? 0}` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className="text-2xl font-semibold text-slate-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-6">API calls over time</h3>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-sm text-slate-400">Loading...</div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-slate-400">
            No data yet — API calls will appear here once tracked.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={chartData} barSize={8}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="calls" fill="#0f172a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Member usage table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Top members by usage</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Member</th>
              <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">API calls</th>
              <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Share</th>
            </tr>
          </thead>
          <tbody>
            {analytics?.member_usage.map((m) => (
              <tr key={m.user_id} className="border-b border-slate-100 last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                      {m.full_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{m.full_name}</p>
                      <p className="text-xs text-slate-500">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-slate-700">{m.api_calls.toLocaleString()}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 rounded-full"
                        style={{ width: `${m.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{m.percentage.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}