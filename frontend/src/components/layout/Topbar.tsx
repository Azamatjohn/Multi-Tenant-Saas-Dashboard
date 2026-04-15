"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "": "Dashboard",
  "members": "Members",
  "analytics": "Analytics",
  "billing": "Billing & plan",
  "settings": "Settings",
};

export default function Topbar({ workspace }: { workspace: string }) {
  const pathname = usePathname();
  const segment = pathname.split("/").pop() ?? "";
  const title = pageTitles[segment] ?? "Dashboard";

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <h1 className="text-base font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <Button size="sm" asChild>
          <a href={`/${workspace}/members`}>Invite member</a>
        </Button>
      </div>
    </header>
  );
}