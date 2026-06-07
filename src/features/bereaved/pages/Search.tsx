"use client";

import React, { useEffect, useMemo, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { MapPin, Phone, Mail, Search, Loader2, Building2, RefreshCw, Store, Star, ImageIcon, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { showError, showSuccess } from "@/utils/toast";
import { useLocationDetection } from "@/hooks/use-location";
import { useAuth } from "@/components/auth/AuthProvider";
import { getServiceLabel } from "@/lib/services-catalog";
import { enrichProviderFromProfile } from "@/lib/provider-business";

type ServiceMap = Record<string, { enabled: boolean; price: number }>;

type ProviderBase = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  county?: string | null;
  sub_county?: string | null;
  town?: string | null;
  address?: string | null;
  listing_images?: string[];
  services_offered?: ServiceMap;
  rating?: number;
  reviews_count?: number;
  country?: string;
  active?: boolean | null;
  is_banned?: boolean | null;
};

type FuneralHome = ProviderBase & { home_name?: string | null };
type Vendor = ProviderBase & { business_name?: string | null; vendor_category?: string | null; service_area?: string; availability?: string };

const getCurrencySymbol = (country?: string) => ({ Kenya: "KSh", Uganda: "USh", Tanzania: "TSh", Rwanda: "RWF", Other: "USD" }[country || "Kenya"] || "KSh");
const PROFILE_SELECT = "id, full_name, home_name, email, phone, county, sub_county, town, address, services_offered, listing_images, business_country, provider_rating, reviews_count, active, is_banned";
const VENDOR_SELECT = "id, full_name, business_name, email, phone, county, sub_county, town, address, vendor_category, services_offered, listing_images, business_country, provider_rating, reviews_count, active, is_banned";

const SearchHomes = () => {
  const { user, profile } = useAuth();
  const { location, message, detectLocation } = useLocationDetection("family");
  const [activeTab, setActiveTab] = useState<"homes" | "vendors">("homes");
  const [homes, setHomes] = useState<FuneralHome[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [county, setCounty] = useState("");
  const [subCounty, setSubCounty] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedHome, setSelectedHome] = useState<FuneralHome | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestText, setRequestText] = useState("");
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({});

  const detectedCounty = location?.county || "";
  const detectedSubCounty = location?.sub_county || location?.town || "";
  const selectedProvider = selectedHome || selectedVendor;
  const selectedName = selectedHome ? selectedHome.home_name || selectedHome.full_name || "Funeral Home" : selectedVendor ? selectedVendor.business_name || selectedVendor.full_name || "Vendor" : "Provider";
  const selectedIsHome = !!selectedHome;
  const selectedIsSuspended = !!selectedProvider && (selectedProvider.active === false || selectedProvider.is_banned === true);
  const offeredServices = useMemo(() => Object.entries(selectedProvider?.services_offered || {}).filter(([, s]) => s?.enabled), [selectedProvider]);

  const fetchHomes = async (searchCounty: string, searchSubCounty?: string) => {
    const runQuery = (select: string) => {
      let q = supabase.from("user_profiles").select(select).eq("is_home", true).eq("role", "operations").order("created_at", { ascending: false });
      if (searchCounty.trim() && searchSubCounty?.trim()) q = q.ilike("county", searchCounty.trim()).ilike("sub_county", searchSubCounty.trim());
      else if (searchCounty.trim()) q = q.ilike("county", searchCounty.trim());
      return q;
    };
    let res = await runQuery(PROFILE_SELECT);
    if (res.error) res = await runQuery("id, full_name, home_name, email, phone, county, sub_county, town, address, active, is_banned");
    if (res.error) throw res.error;
    return res.data || [];
  };

  const fetchVendors = async (searchCounty: string, searchSubCounty?: string) => {
    const runQuery = (select: string) => {
      let q = supabase.from("user_profiles").select(select).eq("is_vendor", true).eq("role", "marketplace").order("created_at", { ascending: false });
      if (searchCounty.trim() && searchSubCounty?.trim()) q = q.ilike("county", searchCounty.trim()).ilike("sub_county", searchSubCounty.trim());
      else if (searchCounty.trim()) q = q.ilike("county", searchCounty.trim());
      return q;
    };
    let res = await runQuery(VENDOR_SELECT);
    if (res.error) res = await runQuery("id, full_name, business_name, email, phone, county, sub_county, town, address, vendor_category, active, is_banned");
    if (res.error) throw res.error;
    return res.data || [];
  };

  const searchAll = async (searchCounty: string, searchSubCounty?: string) => {
    setLoading(true);
    setSearched(true);
    try {
      if (activeTab === "homes") {
        let data: FuneralHome[] = await fetchHomes(searchCounty, searchSubCounty);
        if (data.length === 0 && searchSubCounty?.trim()) data = await fetchHomes(searchCounty);
        if (data.length === 0) {
          const allMatch = await supabase.from("user_profiles").select(PROFILE_SELECT).eq("is_home", true).eq("role", "operations").order("created_at", { ascending: false });
          if (allMatch.error) throw allMatch.error;
          data = allMatch.data || [];
        }
        let finalHomes = data.map((home) => enrichProviderFromProfile(home, "home"));
        if (searchText.trim()) {
          const query = searchText.trim().toLowerCase();
          finalHomes = finalHomes.filter((home) => `${home.home_name || home.full_name || ""} ${home.county || ""} ${home.sub_county || ""} ${home.town || ""}`.toLowerCase().includes(query));
        }
        setHomes(finalHomes);
      } else {
        let data: Vendor[] = await fetchVendors(searchCounty, searchSubCounty);
        if (data.length === 0 && searchSubCounty?.trim()) data = await fetchVendors(searchCounty);
        if (data.length === 0) {
          const allMatch = await supabase.from("user_profiles").select(VENDOR_SELECT).eq("is_vendor", true).eq("role", "marketplace").order("created_at", { ascending: false });
          if (allMatch.error) throw allMatch.error;
          data = allMatch.data || [];
        }
        let finalVendors = data.map((vendor) => ({ ...enrichProviderFromProfile(vendor, "vendor"), service_area: "Within 50km radius", availability: "Always Available" }));
        if (searchText.trim()) {
          const query = searchText.trim().toLowerCase();
          finalVendors = finalVendors.filter((vendor) => `${vendor.business_name || vendor.full_name || ""} ${vendor.county || ""} ${vendor.sub_county || ""} ${vendor.town || ""} ${vendor.vendor_category || ""}`.toLowerCase().includes(query));
        }
        setVendors(finalVendors);
      }
    } catch (error: any) {
      console.error("Find providers error:", error);
      showError(error.message || "Could not load providers near you.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (detectedCounty && !searched) searchAll(detectedCounty, detectedSubCounty);
    else if (!searched) searchAll("", "");
  }, [detectedCounty, detectedSubCounty, searched, activeTab]);

  const openPdp = (provider: FuneralHome | Vendor, type: "home" | "vendor") => {
    if (type === "home") { setSelectedHome(provider as FuneralHome); setSelectedVendor(null); }
    else { setSelectedVendor(provider as Vendor); setSelectedHome(null); }
    setSelectedServices({});
    setRequestText("");
    setRequestOpen(true);
  };

  const useDetectedLocation = async () => {
    setManualMode(false);
    setCounty("");
    setSubCounty("");
    const detected = await detectLocation(true);
    if (!detected || !detected.county) { showError("Location not detected yet. Please search manually."); setManualMode(true); return; }
    searchAll(detected.county, detected.sub_county || detected.town);
  };

  const handleRequestService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return showError("Please sign in to request services.");
    if (!selectedProvider) return showError("No provider selected.");
    if (selectedIsSuspended) return showError("This account is suspended and cannot receive requests.");
    const activeServices = Object.keys(selectedServices).filter((k) => selectedServices[k]);
    if (offeredServices.length > 0 && activeServices.length === 0) return showError("Please tick at least one service you want.");
    setRequesting(true);
    try {
      const requestId = crypto.randomUUID();
      const providerType = selectedIsHome ? "home" : "vendor";
      const providerOffer = selectedIsHome ? "Funeral Home Services" : selectedVendor?.vendor_category || "General Vendor Services";
      const providerDescription = selectedProvider.address || "No address provided";
      const servicesList = selectedProvider.services_offered || {};
      const totalPrice = activeServices.reduce((sum, id) => sum + Number(servicesList[id]?.price || 0), 0);
      const currency = getCurrencySymbol(selectedProvider.country);
      const serviceNames = activeServices.map((id) => getServiceLabel(id, selectedIsHome ? "home" : "vendor"));
      const requestTitle = `${selectedIsHome ? "Funeral Service" : "Vendor Service"} Request: ${selectedName}`;
      const requestDetails = `Requested from: ${selectedName}\nSelected Services: ${serviceNames.length ? serviceNames.join(", ") : "Custom request"}\nEstimated Total: ${currency} ${totalPrice.toLocaleString()}\nRequest Notes: ${requestText.trim() || "None"}`;
      const laborItems = activeServices.map((id) => ({ id: crypto.randomUUID(), service_name: getServiceLabel(id, selectedIsHome ? "home" : "vendor"), description: "Selected by family during request", hours: 1, rate: servicesList[id]?.price || 0, total_price: servicesList[id]?.price || 0 }));
      const initialPlanningBoard = { work_summary: requestTitle, scope_details: serviceNames.map((s) => `- ${s}`).join("\n"), included_items: serviceNames.join(", "), excluded_items: "", assumptions: requestText.trim(), proposed_start_date: "", proposed_end_date: "", estimated_duration: "", preferred_time: "", materials: [], labor: laborItems, extra_charges: 0, discount: 0, tax: 0, final_total: totalPrice, currency, status: "not_started", attachments: [] };
      const notesPayload = JSON.stringify({ custom_notes: requestText.trim(), requester_name: profile?.full_name || user.email, payment_requested: false, payment_amount: totalPrice, payment_currency: currency, payment_status: "unpaid", chat_messages: [], planning_tasks: [], planning_board: initialPlanningBoard, status: "pending" });
      const requestPayload = { id: requestId, requester_id: user.id, requester_email: user.email, provider_type: providerType, provider_id: selectedProvider.id, request_title: requestTitle, request_details: requestDetails, notes: notesPayload, provider_name: selectedName, provider_offer: providerOffer, provider_description: providerDescription, status: "pending" };
      const { error } = await supabase.from("service_requests").insert(requestPayload);
      if (error) throw error;
      const sharedRequestsKey = "struta_shared_service_requests";
      const existingRequests = JSON.parse(localStorage.getItem(sharedRequestsKey) || "[]");
      existingRequests.push({ ...requestPayload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      localStorage.setItem(sharedRequestsKey, JSON.stringify(existingRequests));
      showSuccess(`Request sent to ${selectedName}!`);
      setRequestOpen(false);
      setRequestText("");
      setSelectedServices({});
    } catch (err: any) {
      console.error("Request send error:", err);
      showError(err.message || "Failed to send request.");
    } finally {
      setRequesting(false);
    }
  };

  const toggleService = (id: string) => setSelectedServices((prev) => ({ ...prev, [id]: !prev[id] }));

  const ProviderCard = ({ provider, type }: { provider: FuneralHome | Vendor; type: "home" | "vendor" }) => {
    const name = type === "home" ? (provider as FuneralHome).home_name || provider.full_name || "Funeral Home" : (provider as Vendor).business_name || provider.full_name || "Vendor";
    const isSuspended = provider.active === false || provider.is_banned === true;
    return <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm flex flex-col hover:border-[var(--gold)] transition-all cursor-pointer" onClick={() => openPdp(provider, type)}><div className={`aspect-video w-full ${type === "home" ? "bg-gradient-to-br from-amber-50 to-amber-100/50" : "bg-gradient-to-br from-emerald-50 to-emerald-100/50"} relative flex items-center justify-center`}>{provider.listing_images?.[0] ? <img src={provider.listing_images[0]} className="w-full h-full object-cover" alt={name} /> : <div className={`flex flex-col items-center ${type === "home" ? "text-[var(--gold)]" : "text-emerald-600"}`}>{type === "home" ? <Building2 className="w-12 h-12 stroke-[1.5]" /> : <Store className="w-12 h-12 stroke-[1.5]" />}<span className="text-xs font-bold mt-2">{type === "home" ? "Verified Funeral Home" : "Verified Service Vendor"}</span></div>}{isSuspended && <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-black text-sm">Suspended</div>}{provider.rating != null && provider.rating > 0 && <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-bold text-amber-600 shadow-sm"><Star className="w-3.5 h-3.5 fill-current" />{provider.rating.toFixed(1)}{provider.reviews_count ? ` (${provider.reviews_count})` : ""}</div>}</div><div className="p-6 flex-1 flex flex-col justify-between"><div><h2 className="text-xl font-bold text-[var(--ink)]">{name}</h2>{type === "vendor" && (provider as Vendor).vendor_category && <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-wider mt-1">{(provider as Vendor).vendor_category}</span>}<div className="mt-3 flex items-center gap-2 text-sm text-[var(--muted)]"><MapPin className="w-4 h-4" /><span>{provider.county || "Unknown county"}{provider.sub_county ? `, ${provider.sub_county}` : ""}{provider.town ? `, ${provider.town}` : ""}</span></div></div><Button className={`w-full btn-struta-primary mt-6 ${type === "vendor" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}>View Details & Request</Button></div></div>;
  };

  return <PortalLayout portalType="family"><div className="max-w-7xl mx-auto space-y-8"><div><span className="section-tag">Find Support</span><h1 className="text-3xl md:text-5xl font-bold text-[var(--ink)] mt-2">Find Funeral Services Near You</h1><p className="text-[var(--muted)] mt-3 max-w-2xl">We’ll use your detected county and sub-county to show registered funeral homes and service vendors near you.</p></div><div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex gap-1 w-fit border border-slate-200 dark:border-slate-700"><Button variant="ghost" size="sm" className={`rounded-lg px-6 h-9 text-xs font-bold transition-all ${activeTab === "homes" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"}`} onClick={() => { setActiveTab("homes"); setSearched(false); }}><Building2 className="w-4 h-4 mr-2" />Funeral Homes</Button><Button variant="ghost" size="sm" className={`rounded-lg px-6 h-9 text-xs font-bold transition-all ${activeTab === "vendors" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"}`} onClick={() => { setActiveTab("vendors"); setSearched(false); }}><Store className="w-4 h-4 mr-2" />Service Vendors</Button></div><div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4"><div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-[var(--gold)] mt-1" /><div className="flex-1"><p className="font-bold text-[var(--ink)]">Detected location</p><p className="text-sm text-[var(--muted)]">{detectedCounty ? `${detectedCounty}${detectedSubCounty ? `, ${detectedSubCounty}` : ""}` : "Detecting your location..."}</p>{message && <p className="text-xs text-[var(--muted)] mt-1">{message}</p>}</div><Button variant="outline" onClick={useDetectedLocation}><RefreshCw className="w-4 h-4 mr-2" />Use detected</Button></div><div className="flex flex-col sm:flex-row gap-3"><Input placeholder={activeTab === "homes" ? "Search by home name" : "Search by vendor name or category"} value={searchText} onChange={(e) => setSearchText(e.target.value)} /><Button onClick={() => searchAll(manualMode ? county : detectedCounty, manualMode ? subCounty : detectedSubCounty)} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}Search</Button><Button variant="ghost" onClick={() => setManualMode((current) => !current)}>{manualMode ? "Hide manual search" : "Change location"}</Button></div>{manualMode && <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[var(--border)]"><Input placeholder="County" value={county} onChange={(e) => setCounty(e.target.value)} /><Input placeholder="Sub-county" value={subCounty} onChange={(e) => setSubCounty(e.target.value)} /><Button onClick={() => searchAll(county, subCounty)} disabled={loading}>Search Manually</Button></div>}</div>{loading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1, 2, 3].map((i) => <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm flex flex-col animate-pulse"><div className="aspect-video w-full bg-slate-200 dark:bg-slate-800" /><div className="p-6 space-y-4"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-2/3" /><div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" /><div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-full" /></div></div>)}</div>}{!loading && searched && (activeTab === "homes" ? homes.length === 0 : vendors.length === 0) && <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 text-center"><Building2 className="w-10 h-10 mx-auto text-[var(--muted)] mb-4" /><h2 className="text-xl font-bold text-[var(--ink)]">No providers found</h2><p className="text-[var(--muted)] mt-2">No registered providers found near your location yet.</p></div>}{!loading && activeTab === "homes" && homes.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{homes.map((home) => <ProviderCard key={home.id} provider={home} type="home" />)}</div>}{!loading && activeTab === "vendors" && vendors.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{vendors.map((vendor) => <ProviderCard key={vendor.id} provider={vendor} type="vendor" />)}</div>}<Dialog open={requestOpen} onOpenChange={setRequestOpen}><DialogContent aria-describedby={undefined} className="max-w-2xl w-[96vw] bg-[var(--surface)] border-[var(--border)] text-[var(--ink)] max-h-[92vh] overflow-y-auto p-0 rounded-3xl"><div className="min-h-[320px] bg-gradient-to-br from-slate-100 to-slate-200 relative flex items-center justify-center">{selectedProvider?.listing_images?.[0] ? <img src={selectedProvider.listing_images[0]} className="absolute inset-0 w-full h-full object-cover" alt={selectedName} /> : <div className="flex flex-col items-center text-[var(--gold)]"><ImageIcon className="w-16 h-16 stroke-[1.5]" /><span className="text-xs font-black mt-2 uppercase tracking-widest">Service Profile</span></div>}<div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white"><p className="text-xs font-black uppercase tracking-widest opacity-80">{selectedIsHome ? "Funeral Home" : selectedVendor?.vendor_category || "Service Vendor"}</p><h2 className="text-3xl font-black mt-1">{selectedName}</h2></div></div><div className="p-5 md:p-7 space-y-6">{selectedIsSuspended ? <div className="min-h-[260px] flex items-center justify-center text-center"><div className="max-w-md space-y-4"><div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto"><ShieldAlert className="w-7 h-7" /></div><h3 className="text-xl font-black text-[var(--ink)]">Service account suspended</h3><p className="text-sm text-[var(--muted)] leading-relaxed">Service {selectedName} account has been suspended by Struta due to violation activities related to this account.</p><p className="text-sm text-[var(--muted)]">Can contact us to get help in <a href="mailto:info@emtra.top" className="font-bold text-[var(--gold)]">info@emtra.top</a> or see our <a href="/help" className="font-bold text-[var(--gold)]">help page</a>.</p></div></div> : <><div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm"><div className="p-4 rounded-2xl bg-[var(--cream)] border border-[var(--border)]"><p className="text-xs font-black uppercase text-[var(--muted)]">Name</p><p className="font-black mt-1">{selectedName}</p></div><div className="p-4 rounded-2xl bg-[var(--cream)] border border-[var(--border)]"><p className="text-xs font-black uppercase text-[var(--muted)]">Number</p>{selectedProvider?.phone ? <a href={`tel:${selectedProvider.phone}`} className="font-black mt-1 block text-[var(--gold)]">{selectedProvider.phone}</a> : <p className="font-black mt-1">Not provided</p>}</div><div className="p-4 rounded-2xl bg-[var(--cream)] border border-[var(--border)]"><p className="text-xs font-black uppercase text-[var(--muted)]">Location</p><p className="font-black mt-1">{selectedProvider?.town || selectedProvider?.county || "Not provided"}</p></div></div>{selectedProvider?.email && <div className="flex items-center gap-2 text-sm text-[var(--muted)]"><Mail className="w-4 h-4" /><span>{selectedProvider.email}</span></div>}<div className="space-y-3"><h3 className="text-lg font-black text-[var(--ink)]">Services offered</h3>{offeredServices.length ? <div className="space-y-2">{offeredServices.map(([id, s]) => <label key={id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] p-4 cursor-pointer hover:bg-[var(--cream)]"><span className="flex items-center gap-3"><input type="checkbox" checked={!!selectedServices[id]} onChange={() => toggleService(id)} className="w-4 h-4 rounded border-slate-300" /><span className="font-bold">{getServiceLabel(id, selectedIsHome ? "home" : "vendor")}</span></span><span className="font-black text-[var(--gold)]">{getCurrencySymbol(selectedProvider?.country)} {Number(s.price || 0).toLocaleString()}</span></label>)}</div> : <p className="text-sm text-[var(--muted)] rounded-2xl border border-dashed p-4">No fixed services have been enabled yet. You can still write what you want below and send a custom request.</p>}</div><form onSubmit={handleRequestService} className="space-y-4"><div className="space-y-2"><Label htmlFor="requestText">Write what you want <span className="text-[var(--muted)] font-normal">(optional)</span></Label><Textarea id="requestText" value={requestText} onChange={(e) => setRequestText(e.target.value)} placeholder={selectedIsHome ? "Example: I need transport, chapel setup, and guidance for burial arrangements..." : "Example: I need 100 chairs, 2 tents, flowers, transport, or setup details..."} className="min-h-[120px] rounded-2xl" /></div><Button type="submit" disabled={requesting} className="w-full btn-struta-gold font-black h-12 rounded-2xl">{requesting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{requesting ? "Sending..." : "Send Request"}</Button></form></>}</div></DialogContent></Dialog></div></PortalLayout>;
};

export default SearchHomes;
