"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Subscription } from "@/types";
import { Button } from "@/components/ui/button";
import { CreditCard, Zap, Building2 } from "lucide-react";

const planLimits = {
  starter: { members: 3, api_calls: "10k", storage: "1 GB" },
  pro: { members: 20, api_calls: "500k", storage: "10 GB" },
  enterprise: { members: 999, api_calls: "10M", storage: "100 GB" },
};

const planColors: Record<string, string> = {
  starter: "bg-slate-100 text-slate-700",
  pro: "bg-purple-100 text-purple-700",
  enterprise: "bg-amber-100 text-amber-700",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  trialing: "bg-blue-100 text-blue-700",
  past_due: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};

export default function BillingPage() {
  const params = useParams();
  const workspace = params.workspace as string;

  const { data: subscription, isLoading } = useQuery<Subscription>({
    queryKey: ["billing", workspace],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${workspace}/billing`);
      return data;
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (plan: string) => {
      const { data } = await api.post(`/workspaces/${workspace}/billing/checkout`, { plan });
      return data;
    },
    onSuccess: (data) => {
      window.location.href = data.checkout_url;
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/workspaces/${workspace}/billing/portal`);
      return data;
    },
    onSuccess: (data) => {
      window.location.href = data.portal_url;
    },
  });

  if (isLoading) {
    return <div className="text-sm text-slate-400 p-8">Loading...</div>;
  }

  const plan = subscription?.plan ?? "starter";
  const limits = planLimits[plan as keyof typeof planLimits];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Billing & plan</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your subscription and payment details.</p>
      </div>

      {/* Current plan */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Current plan</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-slate-800 capitalize">{plan}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${planColors[plan]}`}>
                {plan}
              </span>
              {subscription?.status && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[subscription.status]}`}>
                  {subscription.status}
                </span>
              )}
            </div>
            {subscription?.current_period_end && (
              <p className="text-sm text-slate-500">
                Renews {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {subscription?.stripe_customer_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
              >
                Manage billing
              </Button>
            )}
          </div>
        </div>

        {/* Usage bars */}
        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Team members</span>
              <span>1 of {limits.members}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 rounded-full"
                style={{ width: `${Math.min((1 / limits.members) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>API calls</span>
              <span>0 of {limits.api_calls}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-slate-900 rounded-full" style={{ width: "0%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Plan upgrade cards */}
      {plan === "starter" && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Upgrade your plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pro */}
            <div className="bg-white rounded-xl border-2 border-purple-200 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Pro</p>
                  <p className="text-xs text-slate-500">$29/month</p>
                </div>
              </div>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li>✓ 20 team members</li>
                <li>✓ 500k API calls/month</li>
                <li>✓ 10 GB storage</li>
                <li>✓ Priority support</li>
              </ul>
              <Button
                className="w-full"
                onClick={() => checkoutMutation.mutate("pro")}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? "Loading..." : "Upgrade to Pro"}
              </Button>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Enterprise</p>
                  <p className="text-xs text-slate-500">$99/month</p>
                </div>
              </div>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li>✓ Unlimited members</li>
                <li>✓ 10M API calls/month</li>
                <li>✓ 100 GB storage</li>
                <li>✓ Dedicated support</li>
              </ul>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => checkoutMutation.mutate("enterprise")}
                disabled={checkoutMutation.isPending}
              >
                Upgrade to Enterprise
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}