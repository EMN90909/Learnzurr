"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Store, ShieldCheck, Bell, Search, LogOut, User as UserIcon, Settings, UserCircle, Loader2, CreditCard, Package, Menu, X, Sparkles, FileText, Trash2, MessageSquare, ClipboardList, DollarSign, SlidersHorizontal, BarChart3, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { showSuccess } from "@/utils/toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getNotifications, markAllAsRead, clearNotifications, deleteNotification, requestNotificationPermission, StrutaNotification } from "@/utils/notifications";
import { mapProfileRoleToPushRole } from "@/lib/push-role";
import { StrutaLogo } from "@/components/StrutaLogo";
import { TrialOnboardingDialog } from "@/components/TrialOnboardingDialog";
import { MadeWithDyad } from "@/components/made-with-dyad";

type PortalType = "family" | "operations" | "marketplace" | "admin";
interface PortalLayoutProps { children: React.ReactNode; portalType: PortalType; }
type NavItem = { label: string; icon: any; path: string; proOnly?: boolean; hiddenForStaff?: boolean };

const baseNavItems: Record<PortalType, NavItem[]> = {
  family: [{ label: "Dashboard", icon: LayoutDashboard, path: "/family" }, { label: "Find Funeral Home", icon: Search, path: "/family/search" }, { label: "Requests", icon: FileText, path: "/family/requests" }, { label: "Chats", icon: MessageSquare, path: "/family/chats" }, { label: "Memorials", icon: Users, path: "/family/memorials" }, { label: "Settings", icon: Settings, path: "/family/settings" }],
  operations: [{ label: "Operations", icon: LayoutDashboard, path: "/operations" }, { label: "Case Management", icon: Users, path: "/operations/cases" }, { label: "Chats", icon: MessageSquare, path: "/operations/chats" }, { label: "Staff", icon: Users, path: "/operations/staff", proOnly: true }, { label: "Inventory", icon: Package, path: "/operations/inventory", proOnly: true }, { label: "Billing", icon: CreditCard, path: "/operations/billing", hiddenForStaff: true }, { label: "Settings", icon: Settings, path: "/operations/settings" }],
  marketplace: [{ label: "Dashboard", icon: LayoutDashboard, path: "/marketplace" }, { label: "Orders", icon: Store, path: "/marketplace/orders" }, { label: "Chats", icon: MessageSquare, path: "/marketplace/chats" }, { label: "Staff", icon: Users, path: "/marketplace/staff", proOnly: true }, { label: "Inventory", icon: Package, path: "/marketplace/inventory", proOnly: true }, { label: "Billing", icon: CreditCard, path: "/marketplace/billing", hiddenForStaff: true }, { label: "Settings", icon: Settings, path: "/marketplace/settings" }],
  admin: [{ label: "ERP Overview", icon: ShieldCheck, path: "/admin" }, { label: "Users", icon: Users, path: "/admin/users" }, { label: "Requests", icon: ClipboardList, path: "/admin/requests" }, { label: "Payments", icon: DollarSign, path: "/admin/payments" }, { label: "Reports", icon: BarChart3, path: "/admin/reports" }, { label: "Financials", icon: LayoutDashboard, path: "/admin/finance" }, { label: "Branches", icon: Building2, path: "/admin/branches" }, { label: "Compliance", icon: ShieldCheck, path: "/admin/compliance" }, { label: "Customise", icon: SlidersHorizontal, path: "/admin/customise" }],
};

const PortalLayout = ({ children, portalType }: PortalLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, loading, refreshProfile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<StrutaNotification[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<string>("default");
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [freeTierSetupOpen, setFreeTierSetupOpen] = useState(false);

  const accentColorClass = profile?.accent_color === "emerald" ? "text-emerald-600" : profile?.accent_color === "indigo" ? "text-indigo-600" : profile?.accent_color === "rose" ? "text-rose-600" : "text-[var(--gold)]";
  const accentBgClass = profile?.accent_color === "emerald" ? "bg-emerald-50 dark:bg-emerald-950/20" : profile?.accent_color === "indigo" ? "bg-indigo-50 dark:bg-indigo-950/20" : profile?.accent_color === "rose" ? "bg-rose-50 dark:bg-rose-950/20" : "bg-[var(--gold-bg)]";
  const isProviderPortal = portalType === "operations" || portalType === "marketplace";
  const isStaffSession = Boolean(profile?.is_staff_session);
  const setupComplete = !isProviderPortal || Boolean(profile?.setup_completed_at || profile?.provider_setup?.setup_completed_at);
  const showNotifications = !isProviderPortal || setupComplete;
  const showFreeTierBanner = isProviderPortal && setupComplete && profile?.freeTier && !isStaffSession;
  const currentNav = useMemo(() => baseNavItems[portalType].filter((item) => !(item.proOnly && profile?.freeTier) && !(isStaffSession && item.hiddenForStaff)), [portalType, profile?.freeTier, isStaffSession]);
  const unreadCount = showNotifications ? notifications.filter((n) => !n.read).length : 0;
  const profileMenuPath = `/${portalType}/profile`;
  const settingsMenuPath = `/${portalType}/settings`;

  useEffect(() => { if (showFreeTierBanner && profile?.id && !localStorage.getItem(`struta_receiving_setup_done_${profile.id}`)) setFreeTierSetupOpen(true); }, [showFreeTierBanner, profile?.id]);
  useEffect(() => { if (!profile?.id || !showNotifications) return; const load = async () => setNotifications(await getNotifications(profile.id)); void load(); const handler = () => void load(); window.addEventListener("struta_notifications_updated", handler); return () => window.removeEventListener("struta_notifications_updated", handler); }, [profile?.id, showNotifications]);
  useEffect(() => { if (showNotifications && "Notification" in window) setNotificationPermission(Notification.permission); }, [showNotifications]);

  const handleLogout = async () => { await signOut(); showSuccess("Logged out successfully."); navigate("/login", { replace: true }); };
  const handleNotificationPermission = async () => { if (!profile?.id || !showNotifications) return; const role = mapProfileRoleToPushRole(portalType, profile?.staff_business_type || profile?.organization_type); const ok = await requestNotificationPermission(profile.id, role); setNotificationPermission(ok ? "granted" : Notification.permission); };

  if (loading && !profile) return <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" /></div>;

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = location.pathname === item.path;
    return <Link to={item.path} onClick={() => setIsMobileMenuOpen(false)} className={cn("flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all", active ? `${accentBgClass} ${accentColorClass}` : "text-[var(--muted)] hover:bg-[var(--cream)] hover:text-[var(--ink)]")}><Icon className="w-4 h-4" />{item.label}{item.proOnly && <Sparkles className="w-3 h-3 ml-auto text-[var(--gold)]" />}</Link>;
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex">
      <aside className="hidden lg:flex w-72 bg-[var(--surface)] border-r border-[var(--border)] flex-col fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-[var(--border)]"><StrutaLogo size="medium" /></div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">{currentNav.map((item) => <NavLink key={item.path} item={item} />)}</nav>
        <div className="p-4 border-t border-[var(--border)] space-y-3"><div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--cream)]"><Avatar className="w-9 h-9"><AvatarFallback>{profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "S"}</AvatarFallback></Avatar><div className="min-w-0"><p className="font-bold text-sm truncate">{profile?.full_name || user?.email}</p><p className="text-xs text-[var(--muted)] capitalize">{profile?.staff_role || profile?.role || portalType}</p></div></div><Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" />Logout</Button><p className="pt-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)] text-center">Struta v0.6</p></div>
      </aside>
      <div className="flex-1 lg:ml-72">
        <header className="sticky top-0 z-20 bg-[var(--surface)] border-b border-[var(--border)] h-16 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileMenuOpen(true)}><Menu className="w-5 h-5" /></Button><h1 className="font-head text-xl font-bold capitalize hidden sm:block">{portalType} Portal</h1></div>
          <div className="flex items-center gap-2">{showNotifications && notificationPermission !== "granted" && <Button variant="outline" size="sm" onClick={handleNotificationPermission} className="hidden sm:flex">Enable Alerts</Button>}{showNotifications && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="relative"><Bell className="w-5 h-5" />{unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{unreadCount}</span>}</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-80"><DropdownMenuLabel className="flex items-center justify-between">Notifications<Button variant="ghost" size="sm" onClick={async () => { if (profile?.id) { await markAllAsRead(profile.id); await refreshProfile(); } }}>Mark read</Button></DropdownMenuLabel><DropdownMenuSeparator />{notifications.slice(0, 6).map((n) => (<DropdownMenuItem key={n.id} className="flex items-start gap-2"><div className={cn("w-2 h-2 rounded-full mt-2", n.read ? "bg-gray-300" : "bg-[var(--gold)]")} /><div className="flex-1"><p className="text-sm font-bold">{n.title}</p><p className="text-xs text-[var(--muted)] line-clamp-2">{n.body || n.message}</p></div><Button variant="ghost" size="icon" onClick={async (e) => { e.preventDefault(); if (profile?.id) await deleteNotification(profile.id, n.id); }}><Trash2 className="w-3 h-3" /></Button></DropdownMenuItem>))}{!notifications.length && <div className="p-4 text-sm text-[var(--muted)] text-center">No notifications yet.</div>}<DropdownMenuSeparator /><DropdownMenuItem onClick={async () => { if (profile?.id) await clearNotifications(profile.id); }}>Clear all</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}<DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="gap-2"><UserCircle className="w-5 h-5" /><span className="hidden md:inline max-w-32 truncate">{profile?.full_name || "Account"}</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>My Account</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem asChild><Link to={profileMenuPath}><UserIcon className="w-4 h-4 mr-2" />Profile</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to={settingsMenuPath}><Settings className="w-4 h-4 mr-2" />Settings</Link></DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={handleLogout} className="text-red-600"><LogOut className="w-4 h-4 mr-2" />Logout</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
        </header>
        {showFreeTierBanner && !isBannerDismissed && <div className="bg-[var(--gold-bg)] border-b border-[var(--gold)]/20 px-4 lg:px-8 py-3 flex items-center justify-between gap-4"><p className="text-sm text-[var(--ink)]"><strong>Free plan:</strong> You can receive up to 5 active requests and manage basic tools. Upgrade to unlock ERP, staff, and verified badge.</p><div className="flex gap-2"><Button size="sm" className="btn-struta-gold" onClick={() => navigate(`/${portalType}/billing`)}>Upgrade</Button><Button size="sm" variant="ghost" onClick={() => setIsBannerDismissed(true)}>Dismiss</Button></div></div>}
        <main className="p-4 lg:p-8">{children}</main><MadeWithDyad />
      </div>
      {isMobileMenuOpen && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileMenuOpen(false)} /><aside className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[var(--surface)] shadow-xl flex flex-col"><div className="p-5 border-b border-[var(--border)] flex items-center justify-between"><StrutaLogo size="small" /><Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}><X className="w-5 h-5" /></Button></div><nav className="flex-1 p-4 space-y-1">{currentNav.map((item) => <NavLink key={item.path} item={item} />)}</nav><p className="px-4 pb-4 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)] text-center">Struta v0.6</p></aside></div>}
      {showFreeTierBanner && <TrialOnboardingDialog open={freeTierSetupOpen} onOpenChange={setFreeTierSetupOpen} userType={portalType === "marketplace" ? "vendor" : "funeral_home"} />}
    </div>
  );
};

export default PortalLayout;