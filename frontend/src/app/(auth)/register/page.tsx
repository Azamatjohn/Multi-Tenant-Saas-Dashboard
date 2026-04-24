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
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const registerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  workspace_name: z.string().min(2, "Workspace name must be at least 2 characters"),
  workspace_slug: z.string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const handleWorkspaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setValue("workspace_slug", slug);
  };

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError("");

    try {
      const { data: tokens } = await api.post("/auth/register", data);

      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);

      const { data: user } = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      setAuth(user, tokens.access_token, tokens.refresh_token);
      router.push(`/${data.workspace_slug}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="space-y-6">
    <div className="space-y-1">
      <div className="lg:hidden text-2xl font-semibold mb-4 text-slate-900 dark:text-white">NexusHQ</div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Create your account</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">Start your 14-day free trial, no credit card required</p>
    </div>

    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="full_name" className="text-slate-700 dark:text-slate-300">Full name</Label>
        <Input id="full_name" placeholder="Max Johnson" {...register("full_name")}
          className="dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder-slate-500" />
        {errors.full_name && <p className="text-sm text-red-500">{errors.full_name.message}</p>}
      </div>

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

      <div className="space-y-1.5">
        <Label htmlFor="workspace_name" className="text-slate-700 dark:text-slate-300">Workspace name</Label>
        <Input
          id="workspace_name"
          placeholder="Acme Corp"
          {...register("workspace_name")}
          onChange={handleWorkspaceNameChange}
          className="dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
        />
        {errors.workspace_name && <p className="text-sm text-red-500">{errors.workspace_name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="workspace_slug" className="text-slate-700 dark:text-slate-300">Workspace URL</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">nexushq.com/</span>
          <Input id="workspace_slug" placeholder="acme-corp" {...register("workspace_slug")}
            className="dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder-slate-500" />
        </div>
        {errors.workspace_slug && <p className="text-sm text-red-500">{errors.workspace_slug.message}</p>}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </Button>
    </form>

    <p className="text-center text-sm text-slate-500 dark:text-slate-400">
      Already have an account?{" "}
      <Link href="/login" className="text-slate-900 dark:text-white font-medium hover:underline">
        Sign in
      </Link>
    </p>
  </div>
);
}