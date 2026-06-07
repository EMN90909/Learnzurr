"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { requestNotificationPermission } from "@/utils/notifications";
import { mapProfileRoleToPushRole } from "@/lib/push-role";
import { isMemorialPro as checkMemorialPro } from "@/lib/memorial-plans";

interface AuthContextType { session: Session | null; user: User | any | null; profile: any | null; loading: boolean; signOut: () => Promise<void>; refreshProfile: () => Promise<void>; applyPreferences: (settings: { theme_mode?: string; accent_color?: string }) => void; }
const AuthContext = createContext<AuthContextType>({ session: null, user: null, profile: null, loading: true, signOut: async () => {}, refreshProfile: async () => {}, applyPreferences: () => {} });
const withTimeout = async <T,>(promise: Promise<T>, ms = 2500, label = "Request timeout"): Promise<T> => { let timeoutId: ReturnType<typeof setTimeout>; const timeout = new Promise<never>((_, reject) => { timeoutId = setTimeout(() => reject(new Error(label)), ms); }); try { return await Promise.race([promise, timeout]); } finally { clearTimeout(timeoutId!); } };
const isRefreshTokenError = (error: any) => { const message = String(error?.message || error?.error_description || error || "").toLowerCase(); return message.includes("invalid refresh token") || message.includes("refresh token not found") || message.includes("refresh_token_not_found") || message.includes("session_not_found"); };
const clearSupabaseAuthStorage = () => { try { Object.keys(localStorage).filter((key) => key.startsWith("sb-") || key.includes("supabase.auth.token")).forEach((key) => localStorage.removeItem(key)); } catch {} try { Object.keys(sessionStorage).filter((key) => key.startsWith("sb-") || key.includes("supabase.auth.token")).forEach((key) => sessionStorage.removeItem(key)); } catch {} };
const clearStaffSession = () => { try { localStorage.removeItem("struta_staff_session"); } catch {} };
const readStaffSession = () => {
  try {
    const raw = localStorage.getItem("struta_staff_session");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const createdAt = new Date(parsed?.created_at || 0).getTime();
    if (!parsed?.profile?.id || !createdAt || Date.now() - createdAt > 12 * 60 * 60 * 1000) {
      clearStaffSession();
      return null;
    }
    return parsed.profile;
  } catch {
    clearStaffSession();
    return null;
  }
};
const makeStaffSession = (staffProfile: any) => ({ user: { id: staffProfile.id, email: staffProfile.email, user_metadata: staffProfile }, access_token: "staff-code-session", token_type: "staff", expires_at: Math.floor(Date.now() / 1000) + 12 * 60 * 60 } as any as Session);
const getPlanExpiry = (subData: any, userProfile: any) => userProfile?.plan_expires_at || userProfile?.plan_original_expires_at || subData?.expires_at || subData?.current_period_end || subData?.original_expires_at || null;
const isExpired = (expiresAt?: string | null) => !!expiresAt && new Date(expiresAt).getTime() <= Date.now();
const isPaidPlan = (subData: any, userProfile: any) => {
  const planCode = String(userProfile?.plan_code || subData?.plan_code || subData?.plan_name || "free").toLowerCase();
  const planStatus = String(userProfile?.plan_status || subData?.payment_status || subData?.status || "free").toLowerCase();
  const expiresAt = getPlanExpiry(subData, userProfile);
  const activeStatus = ["paid", "active", "trialing"].includes(planStatus);
  const cancelledButStillPaid = ["cancelled", "canceled"].includes(planStatus) && !!expiresAt && !isExpired(expiresAt);
  return planCode !== "free" && (activeStatus || cancelledButStillPaid) && !isExpired(expiresAt);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchInProgress = useRef(false);
  const lastFetchedUserId = useRef<string | null>(null);

  const applyPreferences = useCallback((settings: { theme_mode?: string; accent_color?: string }) => {
    let theme = settings.theme_mode || localStorage.getItem("struta_theme_mode") || "light";
    if (theme === "system") theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const resolvedTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    const accent = settings.accent_color || localStorage.getItem("struta_accent_color") || "gold";
    document.documentElement.dataset.accent = accent;
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
    localStorage.setItem("struta_theme_mode", resolvedTheme);
    localStorage.setItem("struta_accent_color", accent);
  }, []);

  const applyStaffSession = useCallback((staffProfile: any) => {
    const enriched = { ...staffProfile, is_staff_session: true, isPro: true, is_pro: true, freeTier: false, hasAccess: true, plan_code: staffProfile.plan_code || "staff-pro", plan_status: "active", subscription_status: "active" };
    setProfile(enriched);
    const fakeSession = makeStaffSession(enriched);
    setSession(fakeSession);
    setUser(fakeSession.user);
    setLoading(false);
    applyPreferences({ theme_mode: enriched.theme_mode || "light", accent_color: enriched.accent_color || "gold" });
  }, [applyPreferences]);

  const fetchProfile = useCallback(async (userId: string, metadata: any = {}, force = false) => {
    if (!force && lastFetchedUserId.current === userId) { setLoading(false); return; }
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    lastFetchedUserId.current = userId;
    try {
      const profilePromise = (async () => {
        const cacheKey = `struta_profile_cache_${userId}`;
        const cachedProfile = localStorage.getItem(cacheKey);
        if (cachedProfile) { try { setProfile(JSON.parse(cachedProfile)); setLoading(false); } catch {} }
        let profileRes = await supabase.from("user_profiles").select("id, full_name, home_name, business_name, email, phone, country, business_country, county, sub_county, town, address, role, staff_role, staff_business_type, organization_id, manager_id, general_code, active, created_at, is_home, is_vendor, is_banned, ban_reason, banned_until, ban_count, account_flagged, is_pro, plan_code, plan_status, plan_expires_at, plan_original_expires_at, plan_cancels_at_period_end").eq("id", userId).maybeSingle();
        if (profileRes.error) { console.warn("[AuthProvider] Full profile fetch failed, retrying with minimal columns:", profileRes.error.message); profileRes = await supabase.from("user_profiles").select("id, full_name, email, role, is_banned, ban_reason, banned_until, ban_count, account_flagged, is_pro, plan_code, plan_status, plan_expires_at").eq("id", userId).maybeSingle(); }
        const userProfile = profileRes.data;
        const email = userProfile?.email || metadata?.email || "";
        const userRole = userProfile?.role || metadata?.role || "family";
        const isProvider = userRole === "operations" || userRole === "marketplace";
        let isAdmin = false;
        try { const { data: adminCheck } = await supabase.from("admin_emails").select("id").ilike("email", email).maybeSingle(); isAdmin = !!adminCheck || userRole === "admin"; } catch (e) { console.warn("[AuthProvider] Admin check failed:", e); }
        const settingsRes = await supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle();
        const settings = settingsRes.data;
        let subData: any = null;
        const subByUserIdRes = await supabase.from("subscriptions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (subByUserIdRes.data) subData = subByUserIdRes.data;
        const localTheme = localStorage.getItem("struta_theme_mode") || settings?.theme_mode || metadata?.theme_mode || "light";
        const localAccent = localStorage.getItem("struta_accent_color") || settings?.accent_color || "gold";
        applyPreferences({ theme_mode: localTheme, accent_color: localAccent });
        const planExpiresAt = getPlanExpiry(subData, userProfile);
        const planExpired = isExpired(planExpiresAt);
        const paidPlan = isPaidPlan(subData, userProfile);
        const providerIsPro = isProvider && paidPlan;
        const familyIsPro = userRole === "family" && (paidPlan || (!planExpired && checkMemorialPro({ isPro: paidPlan, subscription_status: paidPlan ? "active" : subData?.status, plan_name: subData?.plan_name || userProfile?.plan_code })));
        const anyPro = isProvider ? providerIsPro : familyIsPro;
        const pushRole = mapProfileRoleToPushRole(userRole, userProfile?.staff_business_type || userProfile?.organization_type);
        if (pushRole && "Notification" in window && Notification.permission === "granted") void requestNotificationPermission(userId, pushRole);
        const resultProfile = { id: userId, full_name: userProfile?.full_name || metadata?.full_name || metadata?.name || "User", role: userRole, country: userProfile?.country || userProfile?.business_country || metadata?.country, county: userProfile?.county || metadata?.county, sub_county: userProfile?.sub_county || metadata?.sub_county, town: userProfile?.town || metadata?.town, email: userProfile?.email || metadata?.email, ...(userProfile || {}), isPro: anyPro, plan_name: userRole === "family" ? "" : anyPro ? subData?.plan_name || "Struta Professional" : "Free Tier", plan_code: userRole === "family" ? "" : userProfile?.plan_code || subData?.plan_code || (anyPro ? "pro" : "free"), plan_expires_at: planExpiresAt, planExpired, freeTier: isProvider && !providerIsPro, freeTierLimits: isProvider && !providerIsPro ? { activeCases: 5, staff: 5, badge: false, erp: false } : null, isTrialing: false, trialExpired: false, isAdmin, isGracePeriod: false, isLockedOut: false, daysLeft: null, trial_started_at: null, trial_ends_at: null, subscription_status: userRole === "family" ? "" : anyPro ? "active" : "free", hasAccess: !userProfile?.is_banned, needsTrialOnboarding: isProvider && !providerIsPro && !localStorage.getItem(`struta_receiving_setup_done_${userId}`), subscription_id: subData?.id, subscription: subData, theme_mode: localTheme, accent_color: localAccent };
        localStorage.setItem(cacheKey, JSON.stringify(resultProfile));
        if (userProfile?.is_banned && window.location.pathname !== "/account-banned") window.location.href = "/account-banned";
        return resultProfile;
      })();
      const result = await withTimeout(profilePromise, 2500, "Profile fetch timeout");
      if (result) setProfile(result);
    } catch (err: any) {
      const cacheKey = `struta_profile_cache_${userId}`;
      const cachedProfile = localStorage.getItem(cacheKey);
      if (cachedProfile) { try { setProfile(JSON.parse(cachedProfile)); setLoading(false); return; } catch {} }
      const localTheme = localStorage.getItem("struta_theme_mode") || "light";
      const localAccent = localStorage.getItem("struta_accent_color") || "gold";
      setProfile({ id: userId, full_name: metadata?.full_name || metadata?.name || "User", role: metadata?.role || "family", email: metadata?.email, isPro: false, freeTier: false, hasAccess: true, plan_name: "", plan_code: "", subscription_status: "", theme_mode: localTheme, accent_color: localAccent });
    } finally { fetchInProgress.current = false; setLoading(false); }
  }, [applyPreferences]);

  const refreshProfile = async () => {
    const staffProfile = readStaffSession();
    if (staffProfile) { applyStaffSession(staffProfile); return; }
    if (user?.id) await fetchProfile(user.id, user.user_metadata, true);
  };
  useEffect(() => {
    let mounted = true;
    const resetAuthState = async () => { clearSupabaseAuthStorage(); try { await supabase.auth.signOut({ scope: "local" }); } catch {} if (!mounted) return; setSession(null); setUser(null); setProfile(null); lastFetchedUserId.current = null; setLoading(false); };
    const initAuth = async () => {
      const staffProfile = readStaffSession();
      if (staffProfile) { if (mounted) applyStaffSession(staffProfile); return; }
      try { localStorage.removeItem("struta_pending_signin_otp"); } catch {}
      try { const { data: { session: supabaseSession }, error } = await withTimeout(supabase.auth.getSession(), 2500, "Session fetch timeout"); if (error && isRefreshTokenError(error)) { await resetAuthState(); return; } if (!mounted) return; if (supabaseSession) { setSession(supabaseSession); setUser(supabaseSession.user); await fetchProfile(supabaseSession.user.id, supabaseSession.user.user_metadata); } else { setLoading(false); } } catch (error) { if (isRefreshTokenError(error)) { await resetAuthState(); return; } if (mounted) setLoading(false); }
    };
    void initAuth();
    const handleStaffUpdate = () => { const staffProfile = readStaffSession(); if (staffProfile) applyStaffSession(staffProfile); };
    window.addEventListener("struta_staff_session_updated", handleStaffUpdate);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => { if (!mounted) return; if (readStaffSession()) return; if (event === "SIGNED_OUT" || (!session && event === "TOKEN_REFRESHED")) { setSession(null); setUser(null); setProfile(null); lastFetchedUserId.current = null; clearSupabaseAuthStorage(); setLoading(false); } else if (session) { setSession(session); setUser(session.user); await fetchProfile(session.user.id, session.user_metadata); } });
    return () => { mounted = false; window.removeEventListener("struta_staff_session_updated", handleStaffUpdate); subscription.unsubscribe(); };
  }, [fetchProfile, applyStaffSession]);
  const signOut = async () => { setSession(null); setUser(null); setProfile(null); lastFetchedUserId.current = null; clearStaffSession(); localStorage.removeItem("struta_pending_signin_otp"); clearSupabaseAuthStorage(); try { await supabase.auth.signOut({ scope: "local" }); } catch (error) { if (!isRefreshTokenError(error)) console.warn("[AuthProvider] Sign out ignored stale session error:", error); } finally { clearStaffSession(); clearSupabaseAuthStorage(); } };
  return <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile, applyPreferences }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
