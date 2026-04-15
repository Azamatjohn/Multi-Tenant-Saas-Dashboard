"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = (workspace: string) => [
  { label: "Dashboard", href: `/${workspace}`, icon: LayoutDashboard },
  { label: "Members", href: `/${workspace}/members`, icon: Users },
  { label: "Analytics", href: `/${workspace}/analytics`, icon: BarChart3 },
  { label: "Billing", href: `/${workspace}/billing`, icon: CreditCard },
  { label: "Settings", href: `/${workspace}/settings`, icon: Settings },
];

export default function Sidebar({ workspace }: { workspace: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router_logout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Logo + workspace */}
      <div className="p-5 border-b border-slate-200">
        <p className="text-xs text-slate-500 mb-1">Workspace</p>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
            {workspace[0].toUpperCase()}
          </div>
          <span className="font-medium text-sm text-slate-800 truncate">{workspace}</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems(workspace).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-slate-900 text-white font-medium"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t border-slate-200">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
            {user?.full_name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={router_logout}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}