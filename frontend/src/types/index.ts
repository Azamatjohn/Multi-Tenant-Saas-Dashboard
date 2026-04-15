export interface User {
  id: string;
  email: string;
  full_name: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
}

export interface Member {
  id: string;
  user_id: string;
  workspace_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  user_email: string;
  user_full_name: string;
}

export interface Invite {
  id: string;
  email: string;
  role: "owner" | "admin" | "member";
  expires_at: string;
  is_accepted: boolean;
}

export interface Subscription {
  id: string;
  workspace_id: string;
  plan: "starter" | "pro" | "enterprise";
  status: "active" | "trialing" | "past_due" | "cancelled";
  current_period_end: string | null;
  stripe_customer_id: string | null;
}

export interface DailyUsage {
  date: string;
  api_calls: number;
}

export interface AnalyticsSummary {
  total_api_calls: number;
  avg_calls_per_day: number;
  peak_day: string | null;
  peak_calls: number;
  active_members: number;
  total_members: number;
}

export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  daily_usage: DailyUsage[];
  member_usage: MemberUsage[];
}

export interface MemberUsage {
  user_id: string;
  full_name: string;
  email: string;
  api_calls: number;
  percentage: number;
}