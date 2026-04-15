"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";




const acceptSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type AcceptForm = z.infer<typeof acceptSchema>;

interface InviteInfo {
  email: string;
  role: string;
  workspace_name: string;
  workspace_slug: string;
}

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { setAuth } = useAuthStore();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [existingPassword, setExistingPassword] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<AcceptForm>({
    resolver: zodResolver(acceptSchema),
  });

  // fetch invite info from token
  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const { data } = await api.get(`/invites/${token}/info`);
        setInviteInfo(data);
      } catch {
        setError("This invite link is invalid or has expired.");
      }
    };
    fetchInvite();
  }, [token]);

  const handleAcceptExisting = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: tokens } = await api.post("/auth/login", {
        email: inviteInfo?.email,
        password: existingPassword,
      });

      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);

      const { data: user } = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      // accept invite
      await api.post(
        `/workspaces/${inviteInfo?.workspace_slug}/invites/${token}/accept`,
        {},
        { headers: { Authorization: `Bearer ${tokens.access_token}` } }
      );

      setAuth(user, tokens.access_token, tokens.refresh_token);
      router.push(`/${inviteInfo?.workspace_slug}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to accept invite");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AcceptForm) => {
  setLoading(true);
  setError("");
  try {
    const { data: tokens } = await api.post("/auth/register", {
      full_name: data.full_name,
      email: inviteInfo?.email,
      password: data.password,
      workspace_name: inviteInfo?.workspace_name ?? "workspace",
      workspace_slug: `${inviteInfo?.workspace_slug}-${Date.now()}`,
    });

    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);

    const { data: user } = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    await api.post(
      `/workspaces/${inviteInfo?.workspace_slug}/invites/${token}/accept`,
      {},
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    setAuth(user, tokens.access_token, tokens.refresh_token);
    router.push(`/${inviteInfo?.workspace_slug}`);
  } catch (err: any) {
    const detail = err.response?.data?.detail || "";
    if (detail === "Email already registered") {
      setIsExistingUser(true);
      setError("This email already has an account. Please sign in instead.");
    } else {
      setError(detail || "Something went wrong");
    }
  } finally {
    setLoading(false);
  }
};

  if (error && !inviteInfo) {
    return (
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-red-500 text-xl">✕</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-800">Invalid invite</h1>
        <p className="text-sm text-slate-500">{error}</p>
        <Button variant="outline" onClick={() => router.push("/login")}>
          Go to login
        </Button>
      </div>
    );
  }

  if (!inviteInfo) {
    return (
      <div className="text-center text-sm text-slate-400">
        Loading invite...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invite header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mx-auto text-white font-bold text-lg">
          {inviteInfo.workspace_slug[0].toUpperCase()}
        </div>
        <h1 className="text-2xl font-semibold text-slate-800">Accept your invitation</h1>
        <p className="text-sm text-slate-500">
          You&apos;ve been invited to join{" "}
          <span className="font-medium text-slate-700">{inviteInfo.workspace_slug}</span>{" "}
          as a <span className="font-medium text-slate-700">{inviteInfo.role}</span>.
        </p>
        <div className="inline-block bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full">
          {inviteInfo.email}
        </div>
      </div>

      {/* Toggle — new or existing user */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setIsExistingUser(false)}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
            !isExistingUser ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          New account
        </button>
        <button
          onClick={() => setIsExistingUser(true)}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
            isExistingUser ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          I have an account
        </button>
      </div>

      {/* New user form */}
      {!isExistingUser && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input placeholder="Your name" {...register("full_name")} />
            {errors.full_name && (
              <p className="text-sm text-red-500">{errors.full_name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={inviteInfo.email} disabled className="bg-slate-50" />
          </div>
          <div className="space-y-1.5">
            <Label>Create password</Label>
            <Input type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Joining..." : "Accept & join workspace"}
          </Button>
        </form>
      )}

      {/* Existing user form */}
      {isExistingUser && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={inviteInfo.email} disabled className="bg-slate-50" />
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={existingPassword}
              onChange={(e) => setExistingPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}
          <Button
            className="w-full"
            onClick={handleAcceptExisting}
            disabled={loading || !existingPassword}
          >
            {loading ? "Joining..." : "Sign in & join workspace"}
          </Button>
        </div>
      )}
    </div>
  );
}