import { supabaseAdmin } from "../supabase-admin";
import { moderateText, shouldRestrict } from "./moderationPolicy";

const nowIso = () => new Date().toISOString();

async function applyRestriction(userId: string, adminUserId: string | null, reason: string, durationDays: number, violationType: string, metadata: Record<string, unknown>) {
  const until = new Date(Date.now() + durationDays * 86400000).toISOString();
  await supabaseAdmin.from("policy_violations").insert({
    user_id: userId,
    admin_user_id: adminUserId,
    violation_type: violationType,
    reason,
    action_taken: "system_restriction",
    duration_days: durationDays,
    starts_at: nowIso(),
    ends_at: until,
    metadata,
  }).throwOnError();

  const { data: profile } = await supabaseAdmin.from("user_profiles").select("ban_count").eq("id", userId).maybeSingle();
  const banCount = Number(profile?.ban_count || 0) + 1;
  await supabaseAdmin.from("user_profiles").update({
    is_banned: true,
    active: false,
    ban_reason: reason,
    banned_until: until,
    ban_count: banCount,
    account_flagged: banCount >= 3,
    updated_at: nowIso(),
  }).eq("id", userId).throwOnError();
}

export async function enqueuePolicyScan(input: { userId: string; sourceType: "chat" | "memorial" | "visit" | "listing" | "account"; sourceId?: string | null; content: string; metadata?: Record<string, unknown> }) {
  const decision = moderateText(input.content, input.sourceType);
  const { data } = await supabaseAdmin.from("policy_review_queue").insert({
    user_id: input.userId,
    source_type: input.sourceType,
    source_id: input.sourceId || null,
    content_excerpt: input.content.slice(0, 1000),
    severity: decision.severity,
    action: decision.action,
    reason: decision.reason,
    status: shouldRestrict(decision) ? "action_required" : decision.severity === "LOW" ? "tracked" : "cleared",
    metadata: { ...(input.metadata || {}), matchedTerms: decision.matchedTerms },
  }).select("id").maybeSingle();

  if (shouldRestrict(decision)) {
    await applyRestriction(input.userId, null, decision.reason, decision.durationDays, decision.severity.toLowerCase(), {
      queueId: data?.id,
      sourceType: input.sourceType,
      sourceId: input.sourceId || null,
      matchedTerms: decision.matchedTerms,
    });
  }

  return { queueId: data?.id, decision };
}

export async function runDailyModerationScan() {
  const since = new Date(Date.now() - 24 * 86400000).toISOString();
  const jobs: Array<Promise<unknown>> = [];

  const { data: requests } = await supabaseAdmin.from("service_requests").select("id,requester_id,provider_id,request_title,request_details,notes,created_at").gte("updated_at", since).limit(300);
  for (const req of requests || []) {
    if (req.requester_id) jobs.push(enqueuePolicyScan({ userId: req.requester_id, sourceType: "chat", sourceId: req.id, content: `${req.request_title || ""}\n${req.request_details || ""}\n${req.notes || ""}` }));
  }

  const { data: profiles } = await supabaseAdmin.from("user_profiles").select("id,full_name,home_name,business_name,bio,description,address,town,created_at").gte("updated_at", since).limit(300);
  for (const profile of profiles || []) {
    jobs.push(enqueuePolicyScan({ userId: profile.id, sourceType: "account", sourceId: profile.id, content: `${profile.full_name || ""}\n${profile.home_name || ""}\n${profile.business_name || ""}\n${profile.bio || ""}\n${profile.description || ""}\n${profile.address || ""}\n${profile.town || ""}` }));
  }

  const settled = await Promise.allSettled(jobs);
  return { scanned: settled.length, failed: settled.filter((r) => r.status === "rejected").length };
}
