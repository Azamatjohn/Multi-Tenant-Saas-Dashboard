"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const pageTitles: Record<string, string> = {
  "": "Dashboard",
  "members": "Members",
  "analytics": "Analytics",
  "billing": "Billing & plan",
  "settings": "Settings",
};

const actionLabels: Record<string, string> = {
  member_invited: "Member invited",
  member_removed: "Member removed",
  member_role_changed: "Role changed",
  invite_accepted: "Invite accepted",
  workspace_updated: "Workspace updated",
  plan_upgraded: "Plan upgraded",
  plan_cancelled: "Plan cancelled",
};

export default function Topbar({ workspace }: { workspace: string }) {
  const pathname = usePathname();
  const segment = pathname.split("/").pop() ?? "";
  const title = pageTitles[segment] ?? "Dashboard";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["notifications", workspace],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${workspace}/notifications`);
      return data;
    },
    refetchInterval: 30000,
  });

  // close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <h1 className="text-base font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-3">

        {/* Notifications */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="relative text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-10 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">Notifications</span>
                <span className="text-xs text-slate-400">{notifications.length} recent</span>
              </div>

              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  No activity yet
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {actionLabels[n.action] ?? n.action}
                          </p>
                          {n.detail && (
                            <p className="text-xs text-slate-500 mt-0.5">{n.detail}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap mt-0.5">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="px-4 py-2 border-t border-slate-100">
                <Link
                  href={`/${workspace}/audit`}
                  className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  View full audit log →
                </Link>
              </div>
            </div>
          )}
        </div>

        <Button size="sm" asChild>
          <Link href={`/${workspace}/members`}>Invite member</Link>
        </Button>
      </div>
    </header>
  );
}