"use client";

import React, { useEffect, useMemo, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { showError, showSuccess } from "@/utils/toast";

const roleOptions = [
  { value: "family", label: "Family" },
  { value: "operations", label: "Funeral Home" },
  { value: "marketplace", label: "Vendor" },
  { value: "admin", label: "Platform Team" },
];

type AdminBranchesProps = {
  initialRoleFilter?: "all" | "family" | "operations" | "marketplace";
  title?: string;
  description?: string;
};

const normalizeRole = (role?: string) => {
  const value = String(role || "family").toLowerCase();
  if (["bereaved", "family", "families", "client", "customer"].includes(value)) return "family";
  if (["home", "funeral_home", "funeral-home", "operations", "funeralhome"].includes(value)) return "operations";
  if (["vendor", "vendors", "marketplace", "supplier"].includes(value)) return "marketplace";
  if (value === "admin") return "admin";
  return value;
};

const roleLabel = (role?: string) => roleOptions.find((item) => item.value === normalizeRole(role))?.label || "Family";

const displayName = (user: any) => user.home_name || user.business_name || user.full_name || user.email || "Unnamed";

const normalizeUser = (user: any) => {
  const role = normalizeRole(user.role);
  const planCode = user.plan_code || user.subscription?.plan_code || "free";
  const rawPlanStatus = String(user.plan_status || user.subscription?.status || (user.is_pro ? "paid" : "free")).toLowerCase();
  const banned = !!user.is_banned || user.active === false;
  const paid = !!user.is_pro || ["paid", "active", "pro"].includes(rawPlanStatus) || !["", "free", "cancelled"].includes(String(planCode || "free").toLowerCase());
  return { ...user, role, plan_code: planCode, plan_status: banned ? "restricted" : paid ? "paid" : "free", isPro: paid && !banned, isBanned: banned };
};

const statusBadge = (user: any) => {
  if (user.isBanned) return <Badge variant="outline" className="border-[var(--border)] bg-transparent text-[var(--error)] rounded-none">Restricted</Badge>;
  if (user.isPro) return <Badge variant="outline" className="border-[var(--border)] bg-transparent text-[var(--gold)] rounded-none">Paid</Badge>;
  return <Badge variant="outline" className="border-[var(--border)] bg-transparent text-[var(--muted)] rounded-none">Free</Badge>;
};

const AdminBranches = ({ initialRoleFilter = "all", title = "User & Provider Directory", description = "Manage registered families, funeral homes, vendors, and platform team accounts." }: AdminBranchesProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState(initialRoleFilter);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/admin/users/plans");
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not load users directory.");
      setUsers((result.users || []).map(normalizeUser));
    } catch (error: any) {
      showError(error.message || "Could not load users directory.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadUsers(); }, []);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesSearch = !q || `${displayName(user)} ${user.email || ""} ${user.phone || ""} ${user.county || ""} ${user.role || ""} ${user.plan_status || ""}`.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, searchTerm, roleFilter]);

  const updateLocalUser = (userId: string, updates: Record<string, any>) => {
    setUsers((prev) => prev.map((item) => item.id === userId ? normalizeUser({ ...item, ...updates }) : item));
  };

  const handleChangePlan = async (user: any, nextPlanCode: string) => {
    setActionLoading(`plan-${user.id}`);
    try {
      const response = await apiFetch(`/api/admin/users/${user.id}/plan`, { method: "POST", body: JSON.stringify({ planCode: nextPlanCode, durationDays: 30, durationHours: 0 }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Action failed.");
      updateLocalUser(user.id, { plan_code: nextPlanCode, plan_status: nextPlanCode === "free" ? "free" : "paid", is_pro: nextPlanCode !== "free", plan_expires_at: result.plan_expires_at || result.result?.plan_expires_at || user.plan_expires_at, active: true, is_banned: false });
      showSuccess(`Plan changed to ${nextPlanCode === "free" ? "Free" : "Paid"} for ${displayName(user)}.`);
      void loadUsers();
    } catch (error: any) {
      showError(error.message || "Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleBan = async (user: any) => {
    const currentlyBanned = user.isBanned;
    setActionLoading(`ban-${user.id}`);
    try {
      const response = await apiFetch(`/api/admin/users/${user.id}/${currentlyBanned ? "unban" : "ban"}`, { method: "POST", body: JSON.stringify(currentlyBanned ? { reason: "Restored." } : { reason: "Restricted.", violationType: "restriction", permanent: true }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Action failed.");
      updateLocalUser(user.id, { active: currentlyBanned, is_banned: !currentlyBanned });
      showSuccess(`User ${currentlyBanned ? "restored" : "restricted"}.`);
      void loadUsers();
    } catch (error: any) {
      showError(error.message || "Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const totals = useMemo(() => ({
    all: users.length,
    free: users.filter((user) => user.plan_status === "free").length,
    paid: users.filter((user) => user.plan_status === "paid").length,
    restricted: users.filter((user) => user.plan_status === "restricted").length,
  }), [users]);

  return (
    <PortalLayout portalType="admin">
      <div className="max-w-7xl mx-auto space-y-8 bg-[var(--paper)] px-2 md:px-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-[var(--ink)]">{title}</h1>
            <p className="text-sm text-[var(--muted)] max-w-3xl">{description}</p>
          </div>
          <Button variant="outline" onClick={loadUsers} disabled={loading} className="rounded-none border-[var(--border)] bg-transparent shadow-none">Refresh</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 border border-[var(--border)] bg-[var(--surface)]">
          <div className="p-4 border-r border-b md:border-b-0 border-[var(--border)]"><p className="text-xs text-[var(--muted)] font-bold uppercase tracking-wide">All users</p><p className="text-2xl font-black">{totals.all}</p></div>
          <div className="p-4 border-r md:border-r border-b md:border-b-0 border-[var(--border)]"><p className="text-xs text-[var(--muted)] font-bold uppercase tracking-wide">Free</p><p className="text-2xl font-black">{totals.free}</p></div>
          <div className="p-4 border-r border-[var(--border)]"><p className="text-xs text-[var(--muted)] font-bold uppercase tracking-wide">Paid</p><p className="text-2xl font-black">{totals.paid}</p></div>
          <div className="p-4"><p className="text-xs text-[var(--muted)] font-bold uppercase tracking-wide">Restricted</p><p className="text-2xl font-black">{totals.restricted}</p></div>
        </div>

        <Card className="rounded-none border-[var(--border)] bg-[var(--surface)] shadow-none">
          <CardHeader className="border-b border-[var(--border)]">
            <CardTitle className="text-xl">Directory controls</CardTitle>
            <CardDescription>Supabase users and providers with plan and restriction controls.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col md:flex-row gap-3">
              <Input className="rounded-none border-[var(--border)] shadow-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search name, email, phone, county, role, status" />
              <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}><SelectTrigger className="md:w-56 rounded-none border-[var(--border)] shadow-none"><SelectValue /></SelectTrigger><SelectContent className="rounded-none"> <SelectItem value="all">All roles</SelectItem>{roleOptions.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}</SelectContent></Select>
            </div>
            {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--gold)]" /></div> : <div className="overflow-x-auto border border-[var(--border)]"><Table><TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Location</TableHead><TableHead>Plan</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filteredUsers.map((user) => { const changingPlan = actionLoading === `plan-${user.id}`; const banning = actionLoading === `ban-${user.id}`; return <TableRow key={user.id}><TableCell><div className="font-bold text-[var(--ink)]">{displayName(user)}</div><div className="text-xs text-[var(--muted)]">{user.email || user.id}</div></TableCell><TableCell><span className="text-sm text-[var(--ink)]">{roleLabel(user.role)}</span></TableCell><TableCell>{[user.town, user.county].filter(Boolean).join(", ") || "—"}</TableCell><TableCell><div className="space-y-1">{user.isPro ? <span className="text-sm font-bold text-[var(--gold)]">Paid</span> : <span className="text-sm text-[var(--muted)]">Free</span>}<div className="text-[10px] text-[var(--muted)] capitalize">{user.plan_code || "free"}</div></div></TableCell><TableCell>{statusBadge(user)}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Select value={user.isPro ? "paid" : "free"} onValueChange={(value) => handleChangePlan(user, value === "paid" ? "pro_30d" : "free")} disabled={changingPlan}><SelectTrigger className="inline-flex w-28 h-8 rounded-none border-[var(--border)] shadow-none"><SelectValue /></SelectTrigger><SelectContent className="rounded-none"><SelectItem value="free">Free</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent></Select><Button size="sm" variant="outline" className="rounded-none border-[var(--border)] bg-transparent shadow-none" onClick={() => handleToggleBan(user)} disabled={banning}>{banning ? <Loader2 className="w-4 h-4 animate-spin" /> : user.isBanned ? "Restore" : "Restrict"}</Button></div></TableCell></TableRow>; })}{filteredUsers.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-10 text-[var(--muted)]">No matching Supabase records loaded.</TableCell></TableRow>}</TableBody></Table></div>}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default AdminBranches;
