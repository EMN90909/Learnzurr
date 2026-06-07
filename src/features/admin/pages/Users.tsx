"use client";

import React, { useEffect, useMemo, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Search, Shield, Users as UsersIcon } from "lucide-react";
import { showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  phone?: string;
  country?: string;
  created_at?: string;
  last_sign_in_at?: string;
  banned_until?: string | null;
  is_banned?: boolean;
  plan_code?: string;
  plan_status?: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) => [user.email, user.full_name, user.role, user.phone, user.country, user.plan_code].filter(Boolean).join(" ").toLowerCase().includes(needle));
  }, [users, query]);

  const loadUsers = async (targetPage = page) => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const response = await fetch(`/api/admin/users?page=${targetPage}&perPage=50`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load users.");
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setPage(targetPage);
    } catch (error: any) {
      showError(error.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadUsers(1); }, []);

  return (
    <PortalLayout portalType="admin">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <Badge className="bg-[var(--gold-bg)] text-[var(--gold)] border-[var(--gold)]/20"><Shield className="w-3 h-3 mr-1" />Admin</Badge>
            <h1 className="mt-3 text-4xl font-black text-[var(--ink)]">All Supabase Users</h1>
            <p className="text-sm text-[var(--muted)] font-semibold mt-1">Reads Supabase Auth users and joins matching user profile data.</p>
          </div>
          <Button className="btn-struta-gold" onClick={() => loadUsers(page)} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}Refresh</Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="rounded-3xl border-[var(--border)]"><CardContent className="p-5"><p className="text-sm font-bold text-[var(--muted)]">Total users</p><p className="text-3xl font-black">{total || users.length}</p></CardContent></Card>
          <Card className="rounded-3xl border-[var(--border)]"><CardContent className="p-5"><p className="text-sm font-bold text-[var(--muted)]">Loaded page</p><p className="text-3xl font-black">{users.length}</p></CardContent></Card>
          <Card className="rounded-3xl border-[var(--border)]"><CardContent className="p-5"><p className="text-sm font-bold text-[var(--muted)]">Filtered</p><p className="text-3xl font-black">{filtered.length}</p></CardContent></Card>
        </div>

        <Card className="rounded-3xl border-[var(--border)] bg-[var(--surface)]">
          <CardHeader><CardTitle className="flex items-center gap-2"><UsersIcon className="w-5 h-5 text-[var(--gold)]" />Users</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" /><Input className="pl-11 h-12 rounded-2xl bg-[var(--paper)]" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, role, phone, country..." /></div>
            <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--paper)] text-[var(--muted)]"><tr><th className="p-3 text-left">User</th><th className="p-3 text-left">Role</th><th className="p-3 text-left">Plan</th><th className="p-3 text-left">Phone/Country</th><th className="p-3 text-left">Last sign in</th><th className="p-3 text-left">Status</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--gold)]" /></td></tr> : filtered.map((user) => (
                    <tr key={user.id} className="border-t border-[var(--border)]">
                      <td className="p-3"><p className="font-black text-[var(--ink)]">{user.full_name || "Unnamed user"}</p><p className="text-xs text-[var(--muted)]">{user.email}</p></td>
                      <td className="p-3"><Badge variant="outline">{user.role || "unknown"}</Badge></td>
                      <td className="p-3"><p className="font-bold">{user.plan_code || "free"}</p><p className="text-xs text-[var(--muted)]">{user.plan_status || "free"}</p></td>
                      <td className="p-3"><p>{user.phone || "—"}</p><p className="text-xs text-[var(--muted)]">{user.country || "—"}</p></td>
                      <td className="p-3 text-xs text-[var(--muted)]">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Never"}</td>
                      <td className="p-3">{user.is_banned ? <Badge className="bg-red-100 text-red-700">Banned</Badge> : <Badge className="bg-green-100 text-green-700">Active</Badge>}</td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-[var(--muted)]">No users found.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center"><Button variant="outline" disabled={loading || page <= 1} onClick={() => loadUsers(page - 1)}>Previous</Button><p className="text-xs font-bold text-[var(--muted)]">Page {page}</p><Button variant="outline" disabled={loading || users.length < 50} onClick={() => loadUsers(page + 1)}>Next</Button></div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
