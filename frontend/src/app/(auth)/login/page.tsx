"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError("");

    try {
      const { data: tokens } = await api.post("/auth/login", data);

      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);

      const { data: user } = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      setAuth(user, tokens.access_token, tokens.refresh_token);

      const { data: workspaces } = await api.get("/workspaces", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (workspaces && workspaces.length > 0) {
        router.push(`/${workspaces[0].slug}`);
      } else {
        setError("No workspace found. Please register first.");
      }

    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

    return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="lg:hidden text-2xl font-semibold mb-4 text-slate-900 dark:text-white">NexusHQ</div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Welcome back</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Work email</Label>
          <Input id="email" type="email" placeholder="you@company.com" {...register("email")}
            className="dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder-slate-500" />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" {...register("password")}
            className="dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder-slate-500" />
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-950 px-2 text-slate-400">or</span>
        </div>
      </div>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-slate-900 dark:text-white font-medium hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}