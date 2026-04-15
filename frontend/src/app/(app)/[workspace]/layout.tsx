"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const { user, accessToken, setWorkspace } = useAuthStore();
  const workspace = params.workspace as string;

  useEffect(() => {
    if (!accessToken) {
      router.push("/login");
      return;
    }
    setWorkspace(workspace);
  }, [accessToken, workspace]);

  if (!accessToken) return null;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar workspace={workspace} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar workspace={workspace} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}