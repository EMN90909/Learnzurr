"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import PortalLayout from "@/components/layout/PortalLayout";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Car, ClipboardList, Info, Loader2, MessageSquare, RefreshCw, Users } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";

type ErpCase = { id: string; organization_id: string; organization_type?: string; deceased_name?: string; family_email?: string | null; burial_date?: string | null; budget?: number | null; service_type?: string | null; status: string; created_at: string; };
type ErpTask = { id: string; case_id?: string | null; home_id?: string | null; organization_id: string; assigned_to?: string | null; assigned_role?: string | null; assigned_staff_id?: string | null; task_type?: string; title: string; status: string; due_at?: string | null; due_date?: string | null; erp_cases?: ErpCase; };
type ErpStaff = { id: string; home_id: string; user_id?: string | null; name: string; email?: string | null; phone?: string | null; role?: string | null; roles?: string[] | null; is_active?: boolean | null; status?: string | null; last_login_at?: string | null; };
type Vehicle = { id: string; organization_id: string; organization_type?: string; vehicle_type?: string; plate_number?: string; capacity?: number | null; status: string; assigned_driver_id?: string | null; notes?: string | null; };
type Permissions = { invite_staff: boolean; create_case: boolean; view_all_cases: boolean; update_tasks: boolean; view_reports: boolean; delete_cases: boolean; chat: boolean; vehicles: boolean; };

const managerRoles = new Set(["operations", "marketplace", "manager", "owner / manager", "admin"]);
const roleLabel = (role?: string | null) => String(role || "Staff");
const normalizedRole = (role?: string | null) => roleLabel(role).toLowerCase();
const isActiveStaff = (s: ErpStaff) => s.is_active === true || String(s.status || "").toLowerCase() === "active";
const defaultPermissions = (canManage: boolean, isCoordinator: boolean, isDriver: boolean): Permissions => ({ invite_staff: canManage, create_case: canManage, view_all_cases: canManage || isCoordinator, update_tasks: true, view_reports: canManage, delete_cases: canManage, chat: true, vehicles: canManage || isDriver });

export default function ManagerDashboard({ forcedTab }: { forcedTab?: string } = {}) {
  const { user, profile } = useAuth();
  const location = useLocation();
  const portalType = profile?.staff_business_type === "vendor" || profile?.role === "marketplace" ? "marketplace" : "operations";
  const organizationId = profile?.organization_id || profile?.business_id || profile?.manager_id || profile?.id;
  const currentRole = roleLabel(profile?.staff_role || profile?.role);
  const roleKey = normalizedRole(profile?.staff_role || profile?.role);
  const canManage = managerRoles.has(normalizedRole(profile?.role)) || managerRoles.has(normalizedRole(profile?.staff_role));
  const isCoordinator = roleKey === "coordinator";
  const isDriver = roleKey === "driver";
  const staffDisplayName = profile?.is_staff_session ? profile?.full_name : (profile?.full_name || profile?.home_name || profile?.business_name || "Struta User");
  const orgName = profile?.business_name || profile?.home_name || profile?.business_name;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cases, setCases] = useState<ErpCase[]>([]);
  const [tasks, setTasks] = useState<ErpTask[]>([]);
  const [staff, setStaff] = useState<ErpStaff[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [generalCode, setGeneralCode] = useState("");
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions(canManage, isCoordinator, isDriver));
  const [activeTab, setActiveTab] = useState(forcedTab || (canManage ? "cases" : "my-work"));
  const [contextCaseId, setContextCaseId] = useState<string | null>(null);
  const [contextRequestId, setContextRequestId] = useState<string | null>(null);
  const [assignStaffId, setAssignStaffId] = useState("");
  const [newStaff, setNewStaff] = useState({ name: "", email: "", phone: "", role: "Secretary" });
  const [newVehicle, setNewVehicle] = useState({ vehicle_type: "Van", plate_number: "", assigned_driver_id: "" });

  const canCoordinate = permissions.view_all_cases;
  const canSeeVehicles = permissions.vehicles;
  const drivers = useMemo(() => staff.filter((s) => normalizedRole(s.role).includes("driver") || (s.roles || []).some((r) => normalizedRole(r).includes("driver"))), [staff]);
  const activeStaff = useMemo(() => staff.filter(isActiveStaff), [staff]);
  const visibleTabs = useMemo(() => [
    { value: "cases", label: "Cases", show: true, tip: canCoordinate ? "View all cases in this organization." : "View only cases linked to your assigned tasks." },
    { value: "my-work", label: "My Work", show: true, tip: "Live assigned tasks for this staff member." },
    { value: "staff", label: "Staff", show: permissions.invite_staff, tip: "Add and review staff access." },
    { value: "vehicles", label: "Vehicles", show: canSeeVehicles, tip: "Add, assign, edit, and delete vehicles." },
    { value: "requests", label: "Requests", show: canManage, tip: "Incoming requests; right-click for actions." },
    { value: "reports", label: "Reports", show: permissions.view_reports, tip: "Admin-only organization reports." },
  ].filter((tab) => tab.show), [canCoordinate, canManage, canSeeVehicles, permissions.invite_staff, permissions.view_reports]);

  useEffect(() => {
    const path = location.pathname;
    const requested = path.includes("/staff") ? "staff" : path.includes("/vehicles") ? "vehicles" : path.includes("/requests") ? "requests" : path.includes("/reports") ? "reports" : path.includes("/tasks") || path.includes("/schedule") ? "my-work" : path.includes("/cases") ? "cases" : forcedTab;
    const fallback = canManage ? "cases" : "my-work";
    setActiveTab(visibleTabs.some((tab) => tab.value === (requested || fallback)) ? (requested || fallback) : fallback);
  }, [canManage, forcedTab, location.pathname, visibleTabs]);

  const myTasks = useMemo(() => {
    if (canManage || isCoordinator) return tasks;
    return tasks.filter((task) => task.assigned_to === user?.id || task.assigned_to === profile?.id || task.assigned_staff_id === profile?.id || normalizedRole(task.assigned_role) === roleKey || task.assigned_role === profile?.role || task.assigned_role === profile?.staff_role);
  }, [canManage, isCoordinator, profile?.id, profile?.role, profile?.staff_role, roleKey, tasks, user?.id]);

  const assignedCases = useMemo(() => {
    if (canCoordinate) return cases;
    const ids = new Set(myTasks.map((t) => t.case_id).filter(Boolean));
    return cases.filter((c) => ids.has(c.id));
  }, [canCoordinate, cases, myTasks]);

  const metrics = useMemo(() => {
    const visibleCases = canManage ? cases : assignedCases;
    const doneRequests = requests.filter((item) => ["done", "completed", "archived"].includes(String(item.status || "").toLowerCase())).length;
    const driversTotal = drivers.length;
    const driversWorking = drivers.filter((driver) => vehicles.some((v) => v.assigned_driver_id === driver.id && String(v.status).toLowerCase() === "in_use")).length;
    return {
      activeCases: visibleCases.filter((item) => item.status !== "Done").length,
      pendingRequests: canManage ? requests.filter((item) => String(item.status || "").toLowerCase() === "pending").length : 0,
      doneRequests,
      upcoming: visibleCases.filter((item) => item.burial_date && new Date(item.burial_date).getTime() - Date.now() >= 0 && new Date(item.burial_date).getTime() - Date.now() <= 7 * 24 * 60 * 60 * 1000).length,
      revenue: canManage ? visibleCases.reduce((sum, item) => sum + Number(item.budget || 0), 0) : 0,
      staffActive: canManage ? activeStaff.length : 0,
      staffTotal: canManage ? staff.length : 0,
      vehiclesAvailable: canSeeVehicles ? vehicles.filter((v) => String(v.status || "").toLowerCase() === "available").length : 0,
      driversTotal,
      driversWorking,
    };
  }, [activeStaff.length, assignedCases, canManage, canSeeVehicles, cases, drivers, requests, staff.length, vehicles]);

  const loadData = async (silent = false) => {
    if (!organizationId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      if (profile?.is_staff_session) {
        const { data, error } = await supabase.rpc("staff_erp_dashboard_data", { staff_id_input: profile.id, organization_id_input: organizationId });
        if (error) throw error;
        const payload = data as any;
        if (!payload?.success) throw new Error(payload?.error || "Could not load staff ERP data.");
        const caseRows = (payload.cases || []) as ErpCase[];
        const caseMap = new Map(caseRows.map((item) => [item.id, item]));
        setCases(caseRows);
        setTasks(((payload.tasks || []) as ErpTask[]).map((task) => ({ ...task, erp_cases: task.case_id ? caseMap.get(task.case_id) : undefined })));
        setStaff((payload.staff || []) as ErpStaff[]);
        setVehicles((payload.vehicles || []) as Vehicle[]);
        setRequests(payload.requests || []);
        setGeneralCode(payload.settings?.general_code || "");
        setPermissions({ ...defaultPermissions(canManage, isCoordinator, isDriver), ...(payload.permissions || {}) });
        return;
      }
      const [casesRes, tasksRes, staffRes, vehiclesRes, requestsRes, settingsRes] = await Promise.all([
        supabase.from("erp_cases").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).range(0, 49),
        supabase.from("erp_tasks").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).range(0, 99),
        supabase.from("erp_staff").select("*").eq("home_id", organizationId).order("created_at", { ascending: false }).range(0, 49),
        supabase.from("erp_vehicles").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).range(0, 49),
        supabase.from("service_requests").select("*").eq("provider_id", organizationId).order("created_at", { ascending: false }).range(0, 49),
        supabase.from("erp_organization_settings").select("*").eq("organization_id", organizationId).maybeSingle(),
      ]);
      const firstError = [casesRes.error, tasksRes.error, staffRes.error, vehiclesRes.error, requestsRes.error, settingsRes.error].find(Boolean);
      if (firstError) throw firstError;
      const caseRows = (casesRes.data || []) as ErpCase[];
      const caseMap = new Map(caseRows.map((item) => [item.id, item]));
      setCases(caseRows);
      setTasks(((tasksRes.data || []) as ErpTask[]).map((task) => ({ ...task, erp_cases: task.case_id ? caseMap.get(task.case_id) : undefined })));
      setStaff(staffRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setRequests(requestsRes.data || []);
      setGeneralCode(settingsRes.data?.general_code || "");
      setPermissions(defaultPermissions(true, true, true));
    } catch (error: any) {
      console.warn("[ManagerDashboard] loadData failed", error);
      if (!silent) showError("Could not load ERP data.");
    } finally { if (!silent) setLoading(false); }
  };

  useEffect(() => { void loadData(); }, [organizationId, profile?.is_staff_session, profile?.id]);
  useEffect(() => {
    if (!organizationId) return;
    const timer = window.setInterval(() => void loadData(true), 8000);
    const channel = supabase.channel(`erp-live-${organizationId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "erp_tasks" }, () => void loadData(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "erp_cases" }, () => void loadData(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "erp_vehicles" }, () => void loadData(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, () => void loadData(true))
      .subscribe();
    return () => { window.clearInterval(timer); void supabase.removeChannel(channel); };
  }, [organizationId, profile?.id, profile?.is_staff_session]);

  const updateCase = async (caseId: string, status: string, staffId?: string) => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("erp_update_case_status", { case_id_input: caseId, staff_id_input: profile.id, status_input: status, assigned_staff_id_input: staffId || null, note_input: staffId ? `Assigned to staff for ${status}` : status });
      if (error) throw error;
      if (!(data as any)?.success) throw new Error((data as any)?.error || "Action failed.");
      showSuccess("Case updated.");
      setContextCaseId(null);
      setAssignStaffId("");
      await loadData(true);
    } catch (error: any) { showError(error.message || "Could not update case."); } finally { setSaving(false); }
  };

  const updateRequest = async (requestId: string, status: string) => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("erp_update_request_status", { request_id_input: requestId, staff_id_input: profile.id, status_input: status });
      if (error) throw error;
      if (!(data as any)?.success) throw new Error((data as any)?.error || "Request update failed.");
      showSuccess("Request updated.");
      setContextRequestId(null);
      await loadData(true);
    } catch (error: any) { showError(error.message || "Could not update request."); } finally { setSaving(false); }
  };

  const deleteCase = async (caseId: string) => {
    if (!permissions.delete_cases) return showError("Only admin can delete cases.");
    setSaving(true);
    try { const { error } = await supabase.from("erp_cases").delete().eq("id", caseId); if (error) throw error; showSuccess("Case deleted."); await loadData(true); }
    catch (error: any) { showError(error.message || "Could not delete case."); } finally { setSaving(false); }
  };

  const addStaff = async () => {
    if (!profile?.id || !organizationId || !newStaff.name.trim() || !newStaff.email.trim()) return showError("Enter staff name and email.");
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("erp_add_staff", { actor_id_input: profile.id, organization_id_input: organizationId, name_input: newStaff.name.trim(), email_input: newStaff.email.trim(), phone_input: newStaff.phone.trim() || null, role_input: newStaff.role });
      if (error) throw error;
      if (!(data as any)?.success) throw new Error((data as any)?.error || "Could not add staff.");
      setNewStaff({ name: "", email: "", phone: "", role: "Secretary" });
      showSuccess("Staff added.");
      await loadData(true);
    } catch (error: any) { showError(error.message || "Could not add staff."); } finally { setSaving(false); }
  };

  const addVehicle = async () => {
    if (!profile?.id || !organizationId || !newVehicle.plate_number.trim()) return showError("Enter the vehicle plate number.");
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("erp_add_vehicle", { actor_id_input: profile.id, organization_id_input: organizationId, vehicle_type_input: newVehicle.vehicle_type, plate_number_input: newVehicle.plate_number.trim(), assigned_driver_id_input: newVehicle.assigned_driver_id || null, notes_input: null });
      if (error) throw error;
      if (!(data as any)?.success) throw new Error((data as any)?.error || "Could not add vehicle.");
      setNewVehicle({ vehicle_type: "Van", plate_number: "", assigned_driver_id: "" });
      showSuccess("Vehicle added.");
      await loadData(true);
    } catch (error: any) { showError(error.message || "Could not add vehicle."); } finally { setSaving(false); }
  };

  const updateVehicle = async (vehicleId: string, status: string, driverId?: string) => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("erp_update_vehicle_status", { vehicle_id_input: vehicleId, staff_id_input: profile.id, status_input: status, assigned_driver_id_input: driverId || null });
      if (error) throw error;
      if (!(data as any)?.success) throw new Error((data as any)?.error || "Vehicle update failed.");
      showSuccess("Vehicle updated.");
      await loadData(true);
    } catch (error: any) { showError(error.message || "Could not update vehicle."); } finally { setSaving(false); }
  };

  const deleteVehicle = async (vehicleId: string) => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("erp_delete_vehicle", { vehicle_id_input: vehicleId, actor_id_input: profile.id });
      if (error) throw error;
      if (!(data as any)?.success) throw new Error((data as any)?.error || "Vehicle delete failed.");
      showSuccess("Vehicle deleted.");
      await loadData(true);
    } catch (error: any) { showError(error.message || "Could not delete vehicle."); } finally { setSaving(false); }
  };

  const WithTip = ({ tip, children }: { tip: string; children: React.ReactNode }) => <Tooltip><TooltipTrigger asChild>{children}</TooltipTrigger><TooltipContent className="max-w-xs">{tip}</TooltipContent></Tooltip>;
  const StatCard = ({ title, value, icon: Icon, tip }: { title: string; value: React.ReactNode; icon: any; tip?: string }) => <Card className="rounded-2xl border-[var(--border)] shadow-sm"><CardContent className="p-5 flex items-center justify-between"><div><div className="flex items-center gap-2"><p className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">{title}</p>{tip && <WithTip tip={tip}><Info className="w-3.5 h-3.5 text-[var(--muted)] cursor-help" /></WithTip>}</div><p className="text-2xl font-black text-[var(--ink)] mt-1">{value}</p></div><div className="w-11 h-11 rounded-xl bg-[var(--gold-bg)] flex items-center justify-center"><Icon className="w-5 h-5 text-[var(--gold)]" /></div></CardContent></Card>;
  const Row = ({ title, sub, badge, action, onContextMenu }: { title: string; sub?: string; badge?: string; action?: React.ReactNode; onContextMenu?: React.MouseEventHandler }) => <div onContextMenu={onContextMenu} className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3"><div><p className="font-bold text-[var(--ink)]">{title}</p>{sub && <p className="text-sm text-[var(--muted)] mt-1">{sub}</p>}</div><div className="flex items-center gap-2 flex-wrap justify-end">{badge && <Badge variant="outline">{badge}</Badge>}{action}</div></div>;

  return (
    <TooltipProvider delayDuration={150}>
      <PortalLayout portalType={portalType as any}>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)] mb-2">{canManage ? "ADMIN" : currentRole.toUpperCase()} Dashboard</p><h1 className="text-3xl font-black text-[var(--ink)]">{staffDisplayName}</h1><p className="text-[var(--muted)] mt-1">Live cases, staff tasks, requests, and operations updates{orgName ? ` for ${orgName}` : ""}.</p></div><WithTip tip="Reload live cases, assigned tasks, vehicles, requests, and permission state from Supabase."><Button variant="outline" onClick={() => loadData()} disabled={loading || saving}>{loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}Refresh</Button></WithTip></div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-6 gap-4"><StatCard title="Active Cases" value={metrics.activeCases} icon={ClipboardList} />{canManage && <StatCard title="Pending Requests" value={metrics.pendingRequests} icon={ClipboardList} />}{canManage && <StatCard title="Requests Done" value={metrics.doneRequests} icon={ClipboardList} />}{canManage && <StatCard title="Drivers Working" value={`${metrics.driversWorking}/${metrics.driversTotal}`} icon={Users} />}{canManage && <StatCard title="Staff Active" value={`${metrics.staffActive}/${metrics.staffTotal}`} icon={Users} />}{canSeeVehicles && <StatCard title="Vehicles Available" value={metrics.vehiclesAvailable} icon={Car} />}</div>
          {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" /></div> : <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4"><TabsList className="flex flex-wrap h-auto justify-start">{visibleTabs.map((tab) => <WithTip key={tab.value} tip={tab.tip}><TabsTrigger value={tab.value}>{tab.label}</TabsTrigger></WithTip>)}</TabsList>
            <TabsContent value="cases"><Card><CardHeader><CardTitle>Cases</CardTitle><CardDescription>{assignedCases.length} case(s). Right-click a case to set New, Assign, Done, Transport, or Delete.</CardDescription></CardHeader><CardContent className="space-y-3">{assignedCases.map((c) => <div key={c.id} className="space-y-2"><Row onContextMenu={(e) => { e.preventDefault(); if (canManage || isCoordinator) setContextCaseId(contextCaseId === c.id ? null : c.id); }} title={c.deceased_name || "Unnamed case"} sub={`${c.family_email || "No family email"} • ${c.service_type || c.created_at}`} badge={c.status} />{contextCaseId === c.id && <div className="rounded-2xl border border-[var(--border)] bg-[var(--cream)] p-3 flex flex-wrap gap-2 items-end"><Button size="sm" variant="outline" onClick={() => updateCase(c.id, "New")}>New</Button><Button size="sm" variant="outline" onClick={() => updateCase(c.id, "Transport")}>Transport</Button><Button size="sm" variant="outline" onClick={() => updateCase(c.id, "Done")}>Done</Button><div className="min-w-48"><Label className="text-xs">Assign to staff</Label><Select value={assignStaffId} onValueChange={setAssignStaffId}><SelectTrigger><SelectValue placeholder="Choose staff" /></SelectTrigger><SelectContent>{activeStaff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name || s.email} — {s.role || "staff"}</SelectItem>)}</SelectContent></Select></div><Button size="sm" onClick={() => assignStaffId ? updateCase(c.id, "Assigned", assignStaffId) : showError("Choose staff first.")}>Assign</Button>{permissions.delete_cases && <Button size="sm" variant="destructive" onClick={() => deleteCase(c.id)}>Delete</Button>}</div>}</div>)}{!assignedCases.length && <p className="text-sm text-[var(--muted)]">No visible cases yet.</p>}</CardContent></Card></TabsContent>
            <TabsContent value="my-work"><Card><CardHeader><CardTitle>My Work</CardTitle><CardDescription>{myTasks.length} live assigned task(s). Updates refresh automatically.</CardDescription></CardHeader><CardContent className="space-y-3">{myTasks.map((t) => <Row key={t.id} title={t.title} sub={t.assigned_role || t.task_type} badge={t.status} action={<Button size="sm" variant="outline" onClick={() => updateCase(t.case_id || "", "In Progress")}>Update</Button>} />)}{!myTasks.length && <p className="text-sm text-[var(--muted)]">No assigned tasks yet.</p>}</CardContent></Card></TabsContent>
            {permissions.invite_staff && <TabsContent value="staff"><Card><CardHeader><CardTitle>Staff</CardTitle><CardDescription>{metrics.staffActive}/{metrics.staffTotal} active. Add staff and assign work.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid md:grid-cols-5 gap-3 p-3 rounded-2xl border border-[var(--border)] bg-[var(--cream)]"><Input value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} placeholder="Name" /><Input value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} placeholder="Email" /><Input value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} placeholder="Phone" /><Select value={newStaff.role} onValueChange={(role) => setNewStaff({ ...newStaff, role })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Secretary">Secretary</SelectItem><SelectItem value="Driver">Driver</SelectItem><SelectItem value="Embalmer">Embalmer</SelectItem><SelectItem value="Coordinator">Coordinator</SelectItem></SelectContent></Select><Button onClick={addStaff} disabled={saving}>Add staff</Button></div>{staff.map((s) => <Row key={s.id} title={s.name || s.email || "Staff"} sub={s.email || undefined} badge={s.role || s.status || "staff"} />)}{!staff.length && <p className="text-sm text-[var(--muted)]">No staff yet.</p>}</CardContent></Card></TabsContent>}
            {canSeeVehicles && <TabsContent value="vehicles"><Card><CardHeader><CardTitle>Vehicles</CardTitle><CardDescription>Add vehicles, assign drivers, change status, or delete.</CardDescription></CardHeader><CardContent className="space-y-4">{canManage && <div className="grid md:grid-cols-4 gap-3 p-3 rounded-2xl border border-[var(--border)] bg-[var(--cream)]"><div><Label className="text-xs">Vehicle type</Label><Select value={newVehicle.vehicle_type} onValueChange={(vehicle_type) => setNewVehicle({ ...newVehicle, vehicle_type })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Van">Van</SelectItem><SelectItem value="Pickup Truck">Pickup Truck</SelectItem><SelectItem value="Hearse">Hearse</SelectItem><SelectItem value="Bus">Bus</SelectItem></SelectContent></Select></div><div><Label className="text-xs">Registration</Label><Input value={newVehicle.plate_number} onChange={(e) => setNewVehicle({ ...newVehicle, plate_number: e.target.value })} placeholder="KAA 000A" /></div><div><Label className="text-xs">Driver</Label><Select value={newVehicle.assigned_driver_id} onValueChange={(assigned_driver_id) => setNewVehicle({ ...newVehicle, assigned_driver_id })}><SelectTrigger><SelectValue placeholder="Available driver" /></SelectTrigger><SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name || d.email}</SelectItem>)}</SelectContent></Select></div><div className="flex items-end"><Button className="w-full" onClick={addVehicle} disabled={saving}>Add vehicle</Button></div></div>}{vehicles.map((v) => <Row key={v.id} title={`${v.vehicle_type || "Vehicle"} ${v.plate_number || ""}`} sub={`${v.assigned_driver_id ? "Driver assigned" : "No driver"}${v.notes ? ` • ${v.notes}` : ""}`} badge={v.status} action={<div className="flex gap-1 flex-wrap"><Select onValueChange={(driverId) => updateVehicle(v.id, "in_use", driverId)}><SelectTrigger className="w-36 h-8"><SelectValue placeholder="Assign driver" /></SelectTrigger><SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name || d.email}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="outline" onClick={() => updateVehicle(v.id, "available")}>Available</Button><Button size="sm" variant="outline" onClick={() => updateVehicle(v.id, "in_use")}>In use</Button><Button size="sm" variant="outline" onClick={() => updateVehicle(v.id, "not_working")}>Not working</Button>{canManage && <Button size="sm" variant="destructive" onClick={() => deleteVehicle(v.id)}>Delete</Button>}</div>} />)}{!vehicles.length && <p className="text-sm text-[var(--muted)]">No vehicles yet.</p>}</CardContent></Card></TabsContent>}
            {canManage && <TabsContent value="requests"><Card><CardHeader><CardTitle>Requests</CardTitle><CardDescription>{requests.length} request(s). Right-click to assign, archive, or delete.</CardDescription></CardHeader><CardContent className="space-y-3">{requests.map((r) => <div key={r.id} className="space-y-2"><Row onContextMenu={(e) => { e.preventDefault(); setContextRequestId(contextRequestId === r.id ? null : r.id); }} title={r.request_title || r.deceased_name || "Service request"} sub={r.requester_email || r.family_email || r.email || r.created_at} badge={r.status || r.request_status} action={<Button size="sm" variant="outline" onClick={() => setContextRequestId(contextRequestId === r.id ? null : r.id)}>Actions</Button>} />{contextRequestId === r.id && <div className="rounded-2xl border border-[var(--border)] bg-[var(--cream)] p-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => updateRequest(r.id, "assigned")}>Assign</Button><Button size="sm" variant="outline" onClick={() => updateRequest(r.id, "archived")}>Archive</Button><Button size="sm" variant="destructive" onClick={() => updateRequest(r.id, "deleted")}>Delete</Button></div>}</div>)}{!requests.length && <p className="text-sm text-[var(--muted)]">No requests yet.</p>}</CardContent></Card></TabsContent>}
            {permissions.view_reports && <TabsContent value="reports"><Card><CardHeader><CardTitle>Reports</CardTitle><CardDescription>Admin/manager organization reports.</CardDescription></CardHeader><CardContent className="grid md:grid-cols-4 gap-4"><StatCard title="Total Staff" value={staff.length} icon={Users} /><StatCard title="Drivers Working" value={`${metrics.driversWorking}/${metrics.driversTotal}`} icon={Users} /><StatCard title="Requests Done" value={metrics.doneRequests} icon={ClipboardList} /><StatCard title="Tasks" value={tasks.length} icon={MessageSquare} /></CardContent></Card></TabsContent>}
          </Tabs>}
        </div>
      </PortalLayout>
    </TooltipProvider>
  );
}
