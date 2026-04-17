"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">

      {/* Navbar */}
      <nav className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 sticky top-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto flex items-center gap-8">
          <span className="text-xl font-semibold text-slate-900 dark:text-white">NexusHQ</span>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</a>
            <a href="#docs" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Docs</a>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/register">
              <Button size="sm">Start free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          Now in public beta
        </div>
        <h1 className="text-5xl font-semibold text-slate-900 dark:text-white leading-tight mb-6">
          The workspace your team<br />actually uses
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Manage your team, track usage, and scale your plan — all in one place.
          Built for modern teams who move fast.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="px-8">Start for free</Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="outline" className="px-8 dark:border-slate-700 dark:text-slate-300">
              See features
            </Button>
          </a>
        </div>
        <p className="text-sm text-slate-400 mt-5">
          Free 14-day trial · No credit card required
        </p>
      </section>


      {/* Dashboard preview */}
<section className="max-w-5xl mx-auto px-6 pb-24">
  <div className="bg-slate-900 rounded-2xl p-1 shadow-2xl">
    <div className="bg-slate-800 rounded-xl overflow-hidden">
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border-b border-slate-700">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <div className="flex-1 bg-slate-700 rounded-md h-6 mx-4 flex items-center px-3">
          <span className="text-slate-400 text-xs">app.nexushq.com/acme-corp</span>
        </div>
      </div>

      <div className="flex h-72">
        {/* Sidebar */}
        <div className="w-48 bg-slate-900 border-r border-slate-700 p-4 flex flex-col gap-1 flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-slate-600 flex items-center justify-center text-white text-xs font-bold">A</div>
            <span className="text-slate-300 text-xs font-medium">acme-corp</span>
          </div>
          {[
            { label: "Dashboard", active: true },
            { label: "Members", active: false },
            { label: "Analytics", active: false },
            { label: "Billing", active: false },
            { label: "Settings", active: false },
          ].map((item) => (
            <div
              key={item.label}
              className={`px-3 py-1.5 rounded-lg text-xs ${
                item.active
                  ? "bg-white text-slate-900 font-medium"
                  : "text-slate-400"
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 overflow-hidden">
          {/* Topbar */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-white text-sm font-semibold">Dashboard</span>
            <div className="bg-white text-slate-900 text-xs px-3 py-1 rounded-lg font-medium">
              Invite member
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: "Total members", value: "24", color: "bg-blue-500" },
              { label: "Active this week", value: "18", color: "bg-emerald-500" },
              { label: "API calls", value: "128k", color: "bg-purple-500" },
              { label: "Current plan", value: "Pro", color: "bg-amber-500" },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-900 rounded-lg p-2.5">
                <div className={`w-4 h-4 ${stat.color} rounded mb-1.5 opacity-90`} />
                <div className="text-slate-400 text-[9px] mb-0.5">{stat.label}</div>
                <div className="text-white text-sm font-semibold">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Chart + actions */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 bg-slate-900 rounded-lg p-3">
              <div className="text-slate-400 text-[9px] mb-2">API usage — last 30 days</div>
              <div className="flex items-end gap-0.5 h-16">
                {[30, 50, 35, 65, 45, 80, 55, 90, 60, 75, 50, 85, 40, 70, 95, 60, 80, 45, 70, 88].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-slate-600 rounded-t-sm"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="bg-slate-900 rounded-lg p-3">
              <div className="text-slate-400 text-[9px] mb-2">Quick actions</div>
              <div className="space-y-1.5">
                {["Invite a member", "View analytics", "Manage billing", "Settings"].map((a) => (
                  <div key={a} className="flex items-center justify-between bg-slate-800 rounded px-2 py-1">
                    <span className="text-slate-300 text-[9px]">{a}</span>
                    <span className="text-slate-500 text-[9px]">→</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* Features */}
      <section id="features" className="bg-slate-50 dark:bg-slate-900 py-24 transition-colors">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white mb-4">
              Everything your team needs
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
              Built with the same architecture used by production SaaS companies.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Multi-workspace", desc: "Each team gets a fully isolated workspace. Data is separated at the database level using Row-Level Security.", icon: "🏢" },
              { title: "Role-based access", desc: "Owner, Admin, and Member roles control exactly what each person can do. Invite members via signed email tokens.", icon: "🔐" },
              { title: "Usage analytics", desc: "Track API calls per workspace with daily breakdowns. Counted in Redis and flushed to Postgres every hour.", icon: "📊" },
              { title: "Stripe billing", desc: "Starter, Pro, and Enterprise plans. Upgrades go through Stripe Checkout. Subscription state via webhooks.", icon: "💳" },
              { title: "Audit logging", desc: "Every significant action — invites, role changes, member removal — is written to an audit log.", icon: "📋" },
              { title: "Real-time ready", desc: "Redis-backed usage tracking and background job processing with Celery Beat. Built to scale.", icon: "⚡" },
            ].map((f) => (
              <div key={f.title} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-3">
                <div className="text-2xl">{f.icon}</div>
                <h3 className="font-semibold text-slate-800 dark:text-white">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Docs */}
      <section id="docs" className="py-24 dark:bg-slate-950">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white mb-4">
              Built for developers
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
              A clean REST API with auto-generated docs. Integrate in minutes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* API example */}
            <div className="bg-slate-900 rounded-xl p-6 font-mono text-sm">
              <div className="text-slate-400 mb-4 text-xs">POST /api/auth/login</div>
              <div className="space-y-1">
                <div><span className="text-slate-500">{"{"}</span></div>
                <div className="pl-4"><span className="text-emerald-400">"email"</span><span className="text-slate-400">: </span><span className="text-amber-300">"you@company.com"</span><span className="text-slate-500">,</span></div>
                <div className="pl-4"><span className="text-emerald-400">"password"</span><span className="text-slate-400">: </span><span className="text-amber-300">"••••••••"</span></div>
                <div><span className="text-slate-500">{"}"}</span></div>
              </div>
              <div className="border-t border-slate-700 mt-4 pt-4 text-slate-400 text-xs mb-2">Response</div>
              <div className="space-y-1">
                <div><span className="text-slate-500">{"{"}</span></div>
                <div className="pl-4"><span className="text-blue-400">"access_token"</span><span className="text-slate-400">: </span><span className="text-slate-300">"eyJhbGci..."</span><span className="text-slate-500">,</span></div>
                <div className="pl-4"><span className="text-blue-400">"refresh_token"</span><span className="text-slate-400">: </span><span className="text-slate-300">"eyJhbGci..."</span><span className="text-slate-500">,</span></div>
                <div className="pl-4"><span className="text-blue-400">"token_type"</span><span className="text-slate-400">: </span><span className="text-amber-300">"bearer"</span></div>
                <div><span className="text-slate-500">{"}"}</span></div>
              </div>
            </div>

            {/* Endpoint list */}
            <div className="space-y-3">
              {[
                { method: "POST", path: "/api/auth/register", desc: "Create account + workspace" },
                { method: "POST", path: "/api/auth/login", desc: "Get access + refresh tokens" },
                { method: "GET", path: "/api/workspaces/{slug}", desc: "Fetch workspace details" },
                { method: "GET", path: "/api/workspaces/{slug}/members", desc: "List workspace members" },
                { method: "POST", path: "/api/workspaces/{slug}/invites", desc: "Send email invite" },
                { method: "GET", path: "/api/workspaces/{slug}/analytics", desc: "Usage analytics" },
                { method: "POST", path: "/api/billing/checkout", desc: "Start Stripe checkout" },
                { method: "POST", path: "/api/webhooks/stripe", desc: "Stripe webhook handler" },
              ].map((e) => (
                <div key={e.path} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                    e.method === "GET"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  }`}>
                    {e.method}
                  </span>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300 flex-1">{e.path}</span>
                  <span className="text-xs text-slate-400 hidden md:block">{e.desc}</span>
                </div>
              ))}

               <a> href="http://localhost:8000/docs"
                target="_blank"
                className="block text-center text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white mt-2 transition-colors"
                View full API docs →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-50 dark:bg-slate-900 py-24 transition-colors">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white mb-4">Simple pricing</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Start free, scale when you need to.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Starter", price: "Free", desc: "For small teams getting started",
                features: ["3 members", "10k API calls/month", "1 GB storage", "Community support"],
                cta: "Get started", href: "/register", featured: false,
              },
              {
                name: "Pro", price: "$29", desc: "For growing teams",
                features: ["20 members", "500k API calls/month", "10 GB storage", "Priority support", "Audit logs"],
                cta: "Start free trial", href: "/register", featured: true,
              },
              {
                name: "Enterprise", price: "$99", desc: "For large organizations",
                features: ["Unlimited members", "10M API calls/month", "100 GB storage", "Dedicated support", "SLA"],
                cta: "Contact us", href: "/register", featured: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 space-y-5 bg-white dark:bg-slate-800 ${
                  plan.featured
                    ? "border-slate-900 dark:border-white ring-2 ring-slate-900 dark:ring-white"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                {plan.featured && (
                  <div className="text-xs font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2.5 py-1 rounded-full w-fit">
                    Most popular
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-semibold text-slate-900 dark:text-white">{plan.price}</span>
                    {plan.price !== "Free" && <span className="text-slate-500 dark:text-slate-400 text-sm">/month</span>}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{plan.desc}</p>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <Button className="w-full" variant={plan.featured ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 dark:bg-slate-800 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl font-semibold text-white">Ready to get started?</h2>
          <p className="text-slate-400 text-lg">Join thousands of teams already using NexusHQ.</p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="px-10">
              Create your workspace
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800 py-8 px-6 dark:bg-slate-950">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-sm font-medium text-slate-800 dark:text-white">NexusHQ</span>
          <p className="text-sm text-slate-400">© 2026 NexusHQ. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">Terms</a>
            <a href="https://github.com/Azamatjohn/Multi-Tenant-Saas-Dashboard" className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}