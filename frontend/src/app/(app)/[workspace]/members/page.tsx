"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Member, Invite } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Trash2, Crown } from "lucide-react";

const roleBadgeColor: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  member: "bg-slate-100 text-slate-600",
};

export default function MembersPage() {
  const params = useParams();
  const workspace = params.workspace as string;
  const queryClient = useQueryClient();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "invites">("members");

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["members", workspace],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${workspace}/members`);
      return data;
    },
  });

  const { data: invites = [] } = useQuery<Invite[]>({
    queryKey: ["invites", workspace],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${workspace}/invites`);
      return data;
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/workspaces/${workspace}/invites`, {
        email: inviteEmail,
        role: inviteRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites", workspace] });
      setInviteEmail("");
      setDialogOpen(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/workspaces/${workspace}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", workspace] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Members</h2>
          <p className="text-sm text-slate-500 mt-1">{members.length} members in this workspace</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <UserPlus className="w-4 h-4" />
              Invite member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Email address</Label>
                <Input
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button
                className="w-full"
                onClick={() => inviteMutation.mutate()}
                disabled={!inviteEmail || inviteMutation.isPending}
              >
                {inviteMutation.isPending ? "Sending..." : "Send invite"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(["members", "invites"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab}
            {tab === "invites" && invites.length > 0 && (
              <span className="ml-2 bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 rounded-full">
                {invites.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {activeTab === "members" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Member</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                          {member.user_full_name?.[0]?.toUpperCase() ?? "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{member.user_full_name}</p>
                          <p className="text-xs text-slate-500">{member.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleBadgeColor[member.role]}`}>
                        {member.role === "owner" && <Crown className="w-3 h-3 inline mr-1" />}
                        {member.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">
                      {new Date(member.joined_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {member.role !== "owner" && (
                        <button
                          onClick={() => removeMutation.mutate(member.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Invites tab */}
      {activeTab === "invites" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {invites.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No pending invites</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Email</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Expires</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3 text-sm text-slate-700">{invite.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleBadgeColor[invite.role]}`}>
                        {invite.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}