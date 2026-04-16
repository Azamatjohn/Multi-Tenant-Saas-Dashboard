"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const actionLabels: Record<string, string> = {
  member_invited: "Member invited",
  member_removed: "Member removed",
  member_role_changed: "Role changed",
  invite_accepted: "Invite accepted",
  workspace_updated: "Workspace updated",
  plan_upgraded: "Plan upgraded",
  plan_cancelled: "Plan cancelled",
};

const actionColors: Record<string, string> = {
  member_invited: "bg-emerald-100 text-emerald-700",
  member_removed: "bg-red-100 text-red-700",
  member_role_changed: "bg-blue-100 text-blue-700",
  invite_accepted: "bg-purple-100 text-purple-700",
  workspace_updated: "bg-amber-100 text-amber-700",
  plan_upgraded: "bg-emerald-100 text-emerald-700",
  plan_cancelled: "bg-red-100 text-red-700",
};

export default function AuditPage() {
  const params = useParams();
  const workspace = params.workspace as string;

  const { data: logs = [], isLoading } = useQuery<any[]>({
    queryKey: ["audit", workspace],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${workspace}/audit`);
      return data;
    },
  });

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "just now";
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Audit log</h2>
        <p className="text-sm text-slate-500 mt-1">
          A record of all significant actions in this workspace.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No activity recorded yet.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Action</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Detail</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${actionColors[log.action] ?? "bg-slate-100 text-slate-600"}`}>
                      {actionLabels[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {log.detail ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-400">
                    {timeAgo(log.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}