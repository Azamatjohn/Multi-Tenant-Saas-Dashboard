"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParams, useRouter } from "next/navigation";

export default function SettingsPage() {
  const params = useParams();
  const workspace = params.workspace as string;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: workspaceData } = useQuery({
    queryKey: ["workspace", workspace],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${workspace}`);
      setName(data.name);
      setSlug(data.slug);
      return data;
    },
  });

  const router = useRouter();

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/workspaces/${workspace}`, { name, slug });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspace] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (slug !== workspace) {
        router.push(`/${slug}/settings`);
      }
    },
  });

  const tabs = [
    { id: "general", label: "General" },
    { id: "security", label: "Security" },
    { id: "danger", label: "Danger zone" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Settings</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your workspace configuration.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            } ${tab.id === "danger" ? "text-red-500 hover:text-red-600" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General tab */}
      {activeTab === "general" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-700">Workspace details</h3>

          <div className="space-y-1.5">
            <Label>Workspace name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Workspace URL</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 whitespace-nowrap">nexushq.com/</span>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <p className="text-xs text-slate-400">
              Changing the URL will redirect you to the new address.
            </p>
          </div>

          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            {saved ? "Saved!" : updateMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      )}

      {/* Security tab */}
      {activeTab === "security" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-700">Security</h3>
          <p className="text-sm text-slate-500">
            Password changes and two-factor authentication will be available in a future update.
          </p>
        </div>
      )}

      {/* Danger zone */}
      {activeTab === "danger" && (
        <div className="bg-white rounded-xl border border-red-200 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-red-600">Danger zone</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">Delete this workspace</p>
              <p className="text-xs text-slate-500 mt-0.5">
                This action is permanent and cannot be undone.
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete workspace
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}