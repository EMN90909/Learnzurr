"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Loader2, 
  Calendar, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Check, 
  MessageSquare, 
  Send, 
  User, 
  Building2, 
  Store, 
  ChevronRight,
  Phone,
  Mail,
  ClipboardList,
  Info,
  FileText,
  Settings,
  Plus,
  X,
  Sparkles,
  Paperclip,
  Bell,
  Upload,
  Archive
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { addNotification, requestNotificationPermission } from "@/utils/notifications";
import { createPaypalOrder, getPaypalClientId } from "@/lib/payments";
import { useNavigate } from "react-router-dom";
import RequestPaymentPanel from "@/components/RequestPaymentPanel";

export type ProgressUpdate = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  updated_at: string;
};

export type PlanningBoardData = {
  work_summary: string;
  scope_details: string;
  included_items: string;
  excluded_items: string;
  assumptions: string;
  proposed_start_date: string;
  proposed_end_date: string;
  estimated_duration: string;
  preferred_time: string;
  materials: { id: string; item_name: string; quantity: number; unit_price: number; total_price: number; supplier?: string; notes?: string }[];
  labor: { id: string; service_name: string; description: string; hours: number; rate: number; total_price: number }[];
  extra_charges: number;
  discount: number;
  tax: number;
  final_total: number;
  currency: string;
  status: 'not_started' | 'in_progress' | 'submitted_for_approval' | 'changes_requested' | 'approved' | 'completed';
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  attachments: { id: string; file_name: string; file_type: string; uploaded_by: string; uploaded_date: string; file_url: string }[];
};

export type ServiceRequest = {
  id: string;
  requester_id: string | null;
  requester_email: string;
  requester_name?: string;
  provider_type: "home" | "vendor";
  provider_id: string;
  request_title: string;
  request_details: string;
  notes: string | null;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled" | "planning_completed" | "paid";
  created_at: string;
  updated_at: string;
  payment_requested?: boolean;
  payment_amount?: number;
  payment_currency?: string;
  payment_status?: "unpaid" | "pending" | "paid" | "failed";
  paypal_email?: string;
  mpesa_phone?: string;
  provider_name?: string;
  chat_messages?: ChatMessage[];
  planning_tasks?: { id: string; title: string; description: string; assigned_to: string; status: 'not_started' | 'in_progress' | 'completed' | 'blocked'; estimated_time: string; due_date: string }[];
  planning_board?: PlanningBoardData;
  progress_updates?: ProgressUpdate[];
  archived?: boolean;
};

type ChatMessage = {
  id: string;
  requestId: string;
  sender: "family" | "provider";
  text: string;
  timestamp: string;
  attachment_url?: string;
  attachment_name?: string;
  seen?: boolean;
  sender_name?: string;
};

export const enrichRequest = (req: any): ServiceRequest => {
  let custom_notes = req.notes || "";
  let payment_requested = req.payment_requested || false;
  let payment_amount = req.payment_amount || 0;
  let payment_currency = req.payment_currency || "USD";
  let payment_status = req.payment_status || "unpaid";
  let chat_messages: ChatMessage[] = [];
  let planning_tasks: any[] = [];
  let progress_updates: ProgressUpdate[] = [];
  let archived = false;
  let status = req.status; // Default to DB status
  let planning_board: PlanningBoardData = {
    work_summary: "",
    scope_details: "",
    included_items: "",
    excluded_items: "",
    assumptions: "",
    proposed_start_date: "",
    proposed_end_date: "",
    estimated_duration: "",
    preferred_time: "",
    materials: [],
    labor: [],
    extra_charges: 0,
    discount: 0,
    tax: 0,
    final_total: 0,
    currency: "USD",
    status: 'not_started',
    attachments: []
  };

  if (req.notes && req.notes.startsWith("{") && req.notes.endsWith("}")) {
    try {
      const parsed = JSON.parse(req.notes);
      req.requester_name = parsed.requester_name || req.requester_name;
      custom_notes = parsed.custom_notes || "";
      payment_requested = parsed.payment_requested || false;
      payment_amount = parsed.payment_amount || 0;
      payment_currency = parsed.payment_currency || "USD";
      payment_status = parsed.payment_status || "unpaid";
      chat_messages = parsed.chat_messages || [];
      planning_tasks = parsed.planning_tasks || [];
      progress_updates = parsed.progress_updates || [];
      archived = parsed.archived || false;
      if (parsed.status) {
        status = parsed.status; // Override with rich status!
      }
      if (parsed.planning_board) {
        planning_board = { ...planning_board, ...parsed.planning_board };
      }
    } catch (e) {
      console.warn("Failed to parse JSON notes:", e);
    }
  }

  return {
    ...req,
    status, // Use rich status
    notes: custom_notes,
    payment_requested,
    payment_amount,
    payment_currency,
    payment_status,
    chat_messages,
    planning_tasks,
    progress_updates,
    planning_board,
    archived
  };
};

export default function MySentRequests() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerRatings, setProviderRatings] = useState<Record<string, number>>({});
  const [notificationPermission, setNotificationPermission] = useState<string>("default");
  const [showArchived, setShowArchived] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; requestId: string } | null>(null);

  // Custom Delete Confirmation Dialog State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Large Detail Popup State
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "chat" | "payments" | "planning" | "progress">("overview");

  // Payment State
  const [paying, setPaying] = useState(false);

  // Real-time Chat State
  const [newMessage, setNewMessage] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchMyRequests = useCallback(async () => {
    if (!user?.email) return;

    setLoading(true);
    let dbRequests: ServiceRequest[] = [];

    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("requester_email", user.email)
        .order("created_at", { ascending: false });

      if (!error && data) {
        dbRequests = data;
      }
    } catch (error) {
      console.warn("Supabase fetch failed, relying on localStorage fallback.");
    }

    const sharedRequestsKey = "struta_shared_service_requests";
    const localRequests = JSON.parse(localStorage.getItem(sharedRequestsKey) || "[]");
    const filteredLocal = localRequests.filter((r: any) => r.requester_email === user.email);

    const mergedMap = new Map();
    dbRequests.forEach((r) => mergedMap.set(r.id, r));
    filteredLocal.forEach((r: any) => {
      if (!mergedMap.has(r.id)) {
        mergedMap.set(r.id, r);
      }
    });

    const mergedList = Array.from(mergedMap.values())
      .map(enrichRequest)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setRequests(mergedList);

    // Fetch provider ratings and payment details from local storage
    const ratings: Record<string, number> = {};
    mergedList.forEach(r => {
      const homeInfo = localStorage.getItem(`business_info_home_${r.provider_id}`);
      const vendorInfo = localStorage.getItem(`business_info_vendor_${r.provider_id}`);
      if (homeInfo) {
        try {
          const parsed = JSON.parse(homeInfo);
          ratings[r.provider_id] = Number(parsed.rating) || 0;
          r.paypal_email = parsed.paypal_email || r.paypal_email;
          r.mpesa_phone = parsed.mpesa_phone || r.mpesa_phone;
          r.provider_name = parsed.home_name || r.provider_name;
        } catch {}
      } else if (vendorInfo) {
        try {
          const parsed = JSON.parse(vendorInfo);
          ratings[r.provider_id] = Number(parsed.rating) || 0;
          r.paypal_email = parsed.paypal_email || r.paypal_email;
          r.mpesa_phone = parsed.mpesa_phone || r.mpesa_phone;
          r.provider_name = parsed.business_name || r.provider_name;
        } catch {}
      } else {
        ratings[r.provider_id] = 0;
      }
    });
    setProviderRatings(ratings);

    setLoading(false);
  }, [user?.email]);

  useEffect(() => {
    fetchMyRequests();
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }

    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener("click", handleCloseMenu);
    return () => {
      window.removeEventListener("click", handleCloseMenu);
    };
  }, [fetchMyRequests]);

  // Real-time subscription for service requests
  useEffect(() => {
    if (!user?.email || !user?.id) return;

    const channel = supabase
      .channel('realtime-service-requests-client')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `requester_email=eq.${user.email}`
        },
        (payload) => {
          const enriched = enrichRequest(payload.new);
          
          setRequests((prev) => {
            const oldReq = prev.find(r => r.id === enriched.id);
            if (oldReq) {
              // 1. Status changed (e.g. accepted, rejected, completed)
              if (oldReq.status !== enriched.status) {
                addNotification(user.id, {
                  userId: user.id,
                  title: `Request ${enriched.status}`,
                  message: `Your request "${enriched.request_title}" has been ${enriched.status} by the provider.`,
                  type: "request",
                  link: "/family/requests"
                });
              }
              
              // 2. New chat message from provider
              const oldChatCount = oldReq.chat_messages?.length || 0;
              const newChatCount = enriched.chat_messages?.length || 0;
              if (newChatCount > oldChatCount) {
                const lastMsg = enriched.chat_messages?.[newChatCount - 1];
                if (lastMsg && lastMsg.sender === "provider") {
                  addNotification(user.id, {
                    userId: user.id,
                    title: `New Message from ${lastMsg.sender_name || enriched.provider_name || "Provider"}`,
                    message: lastMsg.text || "Sent an attachment",
                    type: "chat",
                    link: "/family/requests"
                  });
                }
              }

              // 3. Planning board status changed
              const oldPlanStatus = oldReq.planning_board?.status;
              const newPlanStatus = enriched.planning_board?.status;
              if (newPlanStatus && oldPlanStatus !== newPlanStatus) {
                addNotification(user.id, {
                  userId: user.id,
                  title: `Planning Board: ${newPlanStatus.replace('_', ' ')}`,
                  message: `The provider has updated the planning board status to "${newPlanStatus.replace('_', ' ')}" for "${enriched.request_title}".`,
                  type: "planning",
                  link: "/family/requests"
                });
              }

              // 4. New progress update
              const oldProgressCount = oldReq.progress_updates?.length || 0;
              const newProgressCount = enriched.progress_updates?.length || 0;
              if (newProgressCount > oldProgressCount) {
                const lastUpdate = enriched.progress_updates?.[newProgressCount - 1];
                if (lastUpdate) {
                  addNotification(user.id, {
                    userId: user.id,
                    title: `Progress Update: ${lastUpdate.title}`,
                    message: lastUpdate.description || `Status: ${lastUpdate.status}`,
                    type: "planning",
                    link: "/family/requests"
                  });
                }
              }
            }
            return prev.map(r => r.id === enriched.id ? enriched : r);
          });

          if (selectedRequest?.id === enriched.id) {
            setSelectedRequest(enriched);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, selectedRequest?.id, user?.id]);

  useEffect(() => {
    const updated = requests.find(r => r.id === selectedRequest?.id);
    if (updated && selectedRequest) {
      if (JSON.stringify(updated) !== JSON.stringify(selectedRequest)) {
        setSelectedRequest(updated);
      }
    }
  }, [requests, selectedRequest]);

  // Mark messages as seen when chat tab is active
  useEffect(() => {
    if (selectedRequest && activeTab === "chat") {
      const hasUnseen = (selectedRequest.chat_messages || []).some(
        (msg) => msg.sender === "provider" && !msg.seen
      );

      if (hasUnseen) {
        const updatedMessages = (selectedRequest.chat_messages || []).map((msg) => {
          if (msg.sender === "provider" && !msg.seen) {
            return { ...msg, seen: true };
          }
          return msg;
        });

        const notesObj = {
          custom_notes: selectedRequest.notes || "",
          payment_requested: selectedRequest.payment_requested || false,
          payment_amount: selectedRequest.payment_amount || 0,
          payment_currency: selectedRequest.payment_currency || "USD",
          payment_status: selectedRequest.payment_status || "unpaid",
          chat_messages: updatedMessages,
          planning_tasks: selectedRequest.planning_tasks || [],
          progress_updates: selectedRequest.progress_updates || [],
          planning_board: selectedRequest.planning_board,
          status: selectedRequest.status
        };

        const serializedNotes = JSON.stringify(notesObj);

        supabase
          .from("service_requests")
          .update({
            notes: serializedNotes,
            updated_at: new Date().toISOString()
          })
          .eq("id", selectedRequest.id)
          .then(({ error }) => {
            if (!error) {
              // Update shared localStorage
              const sharedRequestsKey = "struta_shared_service_requests";
              const localRequests = JSON.parse(localStorage.getItem(sharedRequestsKey) || "[]");
              const updatedLocal = localRequests.map((r: any) => 
                r.id === selectedRequest.id ? { ...r, notes: serializedNotes } : r
              );
              localStorage.setItem(sharedRequestsKey, JSON.stringify(updatedLocal));
              fetchMyRequests();
            }
          });
      }
    }
  }, [selectedRequest?.chat_messages, activeTab, selectedRequest?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedRequest?.chat_messages, activeTab]);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationPermission("granted");
    } else {
      setNotificationPermission("denied");
    }
  };

  const isPlanningApproved = selectedRequest?.planning_board?.status === "approved" || selectedRequest?.planning_board?.status === "completed";
  const isPaid = selectedRequest?.payment_status === "paid" || selectedRequest?.status === "paid";

  const handleApprovePlan = async () => {
    if (!selectedRequest) return;

    const updatedBoard: PlanningBoardData = {
      ...selectedRequest.planning_board!,
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: profile?.full_name || user?.email || "Family"
    };

    const notesObj = {
      custom_notes: selectedRequest.notes || "",
      payment_requested: true,
      payment_amount: updatedBoard.final_total,
      payment_currency: updatedBoard.currency,
      payment_status: "unpaid" as const,
      chat_messages: selectedRequest.chat_messages || [],
      planning_tasks: selectedRequest.planning_tasks || [],
      progress_updates: selectedRequest.progress_updates || [],
      planning_board: updatedBoard,
      status: "planning_completed" // Store rich status in JSON notes
    };

    const serializedNotes = JSON.stringify(notesObj);

    try {
      const { error } = await supabase
        .from("service_requests")
        .update({
          notes: serializedNotes,
          status: "accepted", // Write valid DB status to avoid check constraint violation!
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      // Update shared localStorage
      const sharedRequestsKey = "struta_shared_service_requests";
      const localRequests = JSON.parse(localStorage.getItem(sharedRequestsKey) || "[]");
      const updatedLocal = localRequests.map((r: any) => 
        r.id === selectedRequest.id ? { ...r, notes: serializedNotes, status: "accepted" } : r
      );
      localStorage.setItem(sharedRequestsKey, JSON.stringify(updatedLocal));

      addNotification(selectedRequest.provider_id, {
        providerId: selectedRequest.provider_id,
        title: "Planning Board Approved",
        message: `${profile?.full_name || "The family"} has approved the planning board for "${selectedRequest.request_title}". You can now generate the invoice.`,
        type: "planning"
      });

      showSuccess("Planning board approved! Awaiting invoice generation from the provider.");
      fetchMyRequests();
    } catch (err: any) {
      showError(err.message || "Failed to approve plan.");
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedRequest) return;

    const updatedBoard: PlanningBoardData = {
      ...selectedRequest.planning_board!,
      status: 'changes_requested'
    };

    const notesObj = {
      custom_notes: selectedRequest.notes || "",
      payment_requested: selectedRequest.payment_requested || false,
      payment_amount: selectedRequest.payment_amount || 0,
      payment_currency: selectedRequest.payment_currency || "USD",
      payment_status: selectedRequest.payment_status || "unpaid",
      chat_messages: selectedRequest.chat_messages || [],
      planning_tasks: selectedRequest.planning_tasks || [],
      progress_updates: selectedRequest.progress_updates || [],
      planning_board: updatedBoard
    };

    const serializedNotes = JSON.stringify(notesObj);

    try {
      const { error } = await supabase
        .from("service_requests")
        .update({
          notes: serializedNotes,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      // Update shared localStorage
      const sharedRequestsKey = "struta_shared_service_requests";
      const localRequests = JSON.parse(localStorage.getItem(sharedRequestsKey) || "[]");
      const updatedLocal = localRequests.map((r: any) => 
        r.id === selectedRequest.id ? { ...r, notes: serializedNotes } : r
      );
      localStorage.setItem(sharedRequestsKey, JSON.stringify(updatedLocal));

      addNotification(selectedRequest.provider_id, {
        providerId: selectedRequest.provider_id,
        title: "Changes Requested on Planning Board",
        message: `${profile?.full_name || "The family"} requested changes on the planning board for "${selectedRequest.request_title}".`,
        type: "planning"
      });

      showSuccess("Changes requested successfully.");
      fetchMyRequests();
    } catch (err: any) {
      showError(err.message || "Failed to request changes.");
    }
  };

  const handleSendMessage = async (textToSend?: string, attachmentUrl?: string, attachmentName?: string) => {
    if (!selectedRequest) return;
    const messageText = textToSend !== undefined ? textToSend : newMessage.trim();
    if (!messageText && !attachmentUrl) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      requestId: selectedRequest.id,
      sender: "family",
      text: messageText,
      timestamp: new Date().toISOString(),
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
      seen: false,
      sender_name: profile?.full_name || user?.email || "Family"
    };

    const updatedMessages = [...(selectedRequest.chat_messages || []), userMsg];
    
    const notesObj = {
      custom_notes: selectedRequest.notes || "",
      payment_requested: selectedRequest.payment_requested || false,
      payment_amount: selectedRequest.payment_amount || 0,
      payment_currency: selectedRequest.payment_currency || "USD",
      payment_status: selectedRequest.payment_status || "unpaid",
      chat_messages: updatedMessages,
      planning_tasks: selectedRequest.planning_tasks || [],
      progress_updates: selectedRequest.progress_updates || [],
      planning_board: selectedRequest.planning_board,
      status: selectedRequest.status // Preserve rich status
    };

    const serializedNotes = JSON.stringify(notesObj);

    try {
      const { error } = await supabase
        .from("service_requests")
        .update({
          notes: serializedNotes,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      // Update shared localStorage
      const sharedRequestsKey = "struta_shared_service_requests";
      const localRequests = JSON.parse(localStorage.getItem(sharedRequestsKey) || "[]");
      const updatedLocal = localRequests.map((r: any) => 
        r.id === selectedRequest.id ? { ...r, notes: serializedNotes } : r
      );
      localStorage.setItem(sharedRequestsKey, JSON.stringify(updatedLocal));

      addNotification(selectedRequest.provider_id, {
        providerId: selectedRequest.provider_id,
        title: `New Message from ${profile?.full_name || user?.email || "Family"}`,
        message: messageText || "Sent an attachment",
        type: "chat"
      });

      if (textToSend === undefined) {
        setNewMessage("");
      }
    } catch (err: any) {
      showError(err.message || "Failed to send message.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRequest) return;

    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedRequest.id}/chat-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('request-media')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('request-media')
        .getPublicUrl(fileName);

      await handleSendMessage("", urlData.publicUrl, file.name);
      showSuccess("File uploaded and sent successfully!");
    } catch (err: any) {
      showError(err.message || "Failed to upload file.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, requestId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      requestId
    });
  };

  const handleArchiveRequest = async (id: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;

    const notesObj = {
      custom_notes: req.notes || "",
      payment_requested: req.payment_requested || false,
      payment_amount: req.payment_amount || 0,
      payment_currency: req.payment_currency || "USD",
      payment_status: req.payment_status || "unpaid",
      chat_messages: req.chat_messages || [],
      planning_tasks: req.planning_tasks || [],
      progress_updates: req.progress_updates || [],
      planning_board: req.planning_board,
      archived: !req.archived,
      status: req.status // Preserve rich status
    };

    const serializedNotes = JSON.stringify(notesObj);

    try {
      const { error } = await supabase
        .from("service_requests")
        .update({ notes: serializedNotes })
        .eq("id", id);
        
      if (error) throw error;
        
      // Update shared localStorage
      const sharedRequestsKey = "struta_shared_service_requests";
      const localRequests = JSON.parse(localStorage.getItem(sharedRequestsKey) || "[]");
      const updatedLocal = localRequests.map((r: any) => 
        r.id === id ? { ...r, notes: serializedNotes } : r
      );
      localStorage.setItem(sharedRequestsKey, JSON.stringify(updatedLocal));

      showSuccess(req.archived ? "Request unarchived successfully" : "Request archived successfully");
      fetchMyRequests();
    } catch (err: any) {
      showError(err.message || "Failed to update request archive status");
    }
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      // 1. Delete dependent invoices first to satisfy foreign key constraints
      await supabase
        .from("invoices")
        .delete()
        .eq("request_id", id);

      // 2. Delete dependent payments
      await supabase
        .from("payments")
        .delete()
        .eq("request_id", id);

      if (user?.id) {
        const apiRes = await fetch("/api/request/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: id, userId: user.id }),
        });
        if (!apiRes.ok) {
          const { error } = await supabase.from("service_requests").delete().eq("id", id);
          if (error) throw error;
        }
      }
        
      // Update shared localStorage
      const sharedRequestsKey = "struta_shared_service_requests";
      const localRequests = JSON.parse(localStorage.getItem(sharedRequestsKey) || "[]");
      const updatedLocal = localRequests.filter((r: any) => r.id !== id);
      localStorage.setItem(sharedRequestsKey, JSON.stringify(updatedLocal));

      showSuccess("Request deleted successfully");
      setDeleteConfirmId(null);
      setDetailOpen(false);
      fetchMyRequests();
    } catch (err: any) {
      showError(err.message || "Failed to delete request");
    }
  };

  const activeRequests = requests.filter(r => r.status !== "cancelled" && (showArchived ? r.archived : !r.archived));

  const renderChatPanel = () => {
    if (!selectedRequest) return null;
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-[#1c1a16] rounded-2xl border border-[var(--border)] overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-[var(--border)] bg-white dark:bg-[#181612] flex justify-between items-center shrink-0">
          <div>
            <h4 className="font-bold text-sm text-[var(--ink)]">
              {selectedRequest.provider_name || "Verified Provider"}
            </h4>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online / Active Planning
            </p>
          </div>
          {notificationPermission !== "granted" && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRequestPermission}
              title="Enable Browser Notifications"
              className="text-[var(--gold)] hover:bg-[var(--gold-bg)]"
            >
              <Bell className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
          {(selectedRequest.chat_messages || []).map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${msg.sender === "family" ? "ml-auto flex-row-reverse" : ""}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${msg.sender === "family" ? "bg-[var(--gold)] text-white" : "bg-slate-200 dark:bg-[#39342c] text-slate-600 dark:text-[#b8ad9a]"}`}>
                {msg.sender === "family" ? "F" : "P"}
              </div>
              <div className="space-y-1">
                {/* Display Sender Name */}
                <p className={`text-[10px] font-bold text-slate-500 ${msg.sender === "family" ? "text-right" : "text-left"}`}>
                  {msg.sender_name || (msg.sender === "family" ? (selectedRequest.requester_name || profile?.full_name || user?.email || "Family") : (selectedRequest.provider_name || "Provider"))}
                </p>
                <div className={`p-3 rounded-2xl text-xs ${msg.sender === "family" ? "bg-[var(--gold)] text-white rounded-tr-none" : "bg-white dark:bg-[#181612] border border-[var(--border)] text-slate-700 dark:text-[#f6efe4] rounded-tl-none"}`}>
                  {msg.text && <p>{msg.text}</p>}
                  {msg.attachment_url && (
                    <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10">
                      <a 
                        href={msg.attachment_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 font-bold hover:underline text-[11px]"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        {msg.attachment_name || "View Attachment"}
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 px-1">
                  <p className={`text-[9px] text-[var(--muted)] ${msg.sender === "family" ? "text-right flex-1" : ""}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {msg.sender === "family" && (
                    <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                      {msg.seen ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" /> Seen
                        </>
                      ) : (
                        "Sent"
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!selectedRequest.chat_messages || selectedRequest.chat_messages.length === 0) && (
            <div className="text-center py-12 text-[var(--muted)] italic text-xs">
              No messages yet. Send a message to start planning.
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Replies */}
        <div className="p-2 bg-slate-100 dark:bg-[#181612] border-t border-[var(--border)] flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          {[
            "What time works best?",
            "I have updated the plan.",
            "Please review the final cost.",
            "Thank you, I will proceed."
          ].map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => handleSendMessage(reply)}
              className="px-2.5 py-1 bg-white dark:bg-[#1c1a16] border border-[var(--border)] rounded-full text-[10px] font-bold text-slate-600 dark:text-[#b8ad9a] hover:border-[var(--gold)] hover:text-[var(--gold)] whitespace-nowrap transition-all"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-3 border-t border-[var(--border)] bg-white dark:bg-[#181612] flex gap-2 shrink-0 items-center">
          <label className="cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-[#1c1a16] rounded-full text-[var(--muted)] hover:text-[var(--gold)] transition-colors shrink-0">
            {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <input type="file" className="hidden" onChange={file_e => handleFileUpload(file_e)} disabled={uploadingFile} />
          </label>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 h-9 text-xs bg-[var(--paper)] border-[var(--border)] text-[var(--ink)]"
          />
          <Button type="submit" size="sm" className="btn-struta-gold h-9 w-9 p-0 shrink-0">
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    );
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-[var(--ink)]">My Sent Requests</h3>
          <p className="text-xs text-[var(--muted)] mt-1">Right-click on any request to Archive or Delete. Click to open planning center.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowArchived(!showArchived)}
            className={showArchived ? "border-[var(--gold)] text-[var(--gold)] bg-[var(--gold-bg)]" : ""}
          >
            <Archive className="w-4 h-4 mr-2" /> {showArchived ? "Show Active" : "Show Archived"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMyRequests}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm gap-4 animate-pulse">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                </div>
              </div>
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-16 shrink-0" />
            </div>
          ))}
        </div>
      ) : activeRequests.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl border-[var(--border)] text-[var(--muted)]">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No requests found. Find a funeral home or vendor to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeRequests.map((request) => {
            const rating = providerRatings[request.provider_id] || 0;
            const isLowRating = rating > 0 && rating < 4.5;

            return (
              <div
                key={request.id}
                onContextMenu={(e) => handleContextMenu(e, request.id)}
                onClick={() => {
                  setSelectedRequest(request);
                  setActiveTab("overview");
                  setDetailOpen(true);
                }}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--gold)] transition-all cursor-pointer shadow-sm gap-4 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--gold-bg)] flex items-center justify-center text-[var(--gold)] shrink-0">
                    {request.provider_type === "home" ? <Building2 className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-[var(--ink)] truncate group-hover:text-[var(--gold)] transition-colors">
                      {request.request_title}
                    </h4>
                    <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                      {request.provider_name || `${request.provider_type === "home" ? "Funeral Home" : "Vendor"}`} • {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  {isLowRating && (
                    <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200 text-[10px] font-bold">
                      Low Rating
                    </Badge>
                  )}
                  {request.planning_board?.status && (
                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] capitalize">
                      Plan: {request.planning_board.status.replace('_', ' ')}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={`capitalize px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      request.status === "pending"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : request.status === "accepted"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : request.status === "completed"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {request.status}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-[var(--muted)] group-hover:translate-x-1 transition-transform hidden sm:block" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-white dark:bg-[#1c1a16] border border-[var(--border)] rounded-lg shadow-lg py-1 z-[99999] min-w-[140px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button 
            onClick={() => handleArchiveRequest(contextMenu.requestId)}
            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-[#f6efe4] hover:bg-slate-100 dark:hover:bg-[#39342c] flex items-center gap-2"
          >
            <Archive className="w-3.5 h-3.5" />
            {requests.find(r => r.id === contextMenu.requestId)?.archived ? "Unarchive" : "Archive"}
          </button>
          <button 
            onClick={() => setDeleteConfirmId(contextMenu.requestId)}
            className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Request
          </button>
        </div>
      )}

      {/* Custom Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-md bg-[var(--surface)] border-[var(--border)] text-[var(--ink)]">
          <DialogHeader>
            <DialogTitle className="font-head text-xl text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete Service Request
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this service request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteConfirmId && handleDeleteRequest(deleteConfirmId)}
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedRequest && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-7xl w-[95vw] md:w-[90vw] h-[90vh] bg-[var(--surface)] border-[var(--border)] text-[var(--ink)] flex flex-col p-0 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-start shrink-0 bg-[var(--cream)]/30">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--gold-bg)] text-[var(--gold)] border border-[var(--gold)]/10 capitalize">
                    {selectedRequest.provider_type} Request
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    Received: {new Date(selectedRequest.created_at).toLocaleString()}
                  </span>
                </div>
                <DialogTitle className="font-head text-2xl font-black mt-1 text-[var(--ink)]">
                  {selectedRequest.request_title}
                </DialogTitle>
              </div>
              <Badge
                variant="outline"
                className={`capitalize px-3 py-1 rounded-full font-bold text-xs ${
                  selectedRequest.status === "pending"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : selectedRequest.status === "accepted"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : selectedRequest.status === "completed"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {selectedRequest.status}
              </Badge>
            </div>

            {/* Sidebar Tab Layout - Mobile Friendly Horizontal Scroll */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
              <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--cream)]/20 dark:bg-[#1c1a16] flex flex-row md:flex-col p-2 md:p-4 gap-1 overflow-x-auto md:overflow-x-visible shrink-0 scrollbar-none">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`flex md:w-full items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === "overview" 
                      ? "bg-[var(--gold-bg)] text-[var(--gold)] shadow-sm" 
                      : "text-[var(--muted)] hover:bg-[var(--cream)]"
                  }`}
                >
                  <Info className="w-4 h-4" />
                  Overview & Details
                </button>

                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex md:w-full items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === "chat" 
                      ? "bg-[var(--gold-bg)] text-[var(--gold)] shadow-sm" 
                      : "text-[var(--muted)] hover:bg-[var(--cream)]"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat & Messages
                </button>

                <button
                  onClick={() => setActiveTab("planning")}
                  className={`flex md:w-full items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === "planning" 
                      ? "bg-[var(--gold-bg)] text-[var(--gold)] shadow-sm" 
                      : "text-[var(--muted)] hover:bg-[var(--cream)]"
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Planning Board
                </button>

                <button
                  onClick={() => setActiveTab("progress")}
                  className={`flex md:w-full items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === "progress" 
                      ? "bg-[var(--gold-bg)] text-[var(--gold)] shadow-sm" 
                      : "text-[var(--muted)] hover:bg-[var(--cream)]"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Progress Tracker
                </button>

                <button
                  onClick={() => setActiveTab("payments")}
                  className={`flex md:w-full items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === "payments" 
                      ? "bg-[var(--gold-bg)] text-[var(--gold)] shadow-sm" 
                      : "text-[var(--muted)] hover:bg-[var(--cream)]"
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Invoices & Payments
                </button>
              </div>

              {/* Right Content Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white dark:bg-[#181612] min-h-0 flex flex-col">
                
                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Real-time Status Display & Alternatives */}
                    {selectedRequest.status === "pending" && (
                      <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex items-start gap-3">
                        <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm text-amber-900 dark:text-amber-400">Awaiting Provider Response</h4>
                          <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-1">
                            Your request has been sent successfully. The provider is currently reviewing your details. You will receive a notification as soon as they accept or update the planning board.
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedRequest.status === "accepted" && (
                      <div className="p-5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm text-emerald-900 dark:text-amber-400">Request Accepted</h4>
                          <p className="text-xs text-emerald-700 dark:text-emerald-300/80 mt-1">
                            Great news! The provider has accepted your request. You can now collaborate on the **Planning Board** tab, chat in real-time, and track progress.
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedRequest.status === "rejected" && (
                      <div className="p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl space-y-4">
                        <div className="flex items-start gap-3">
                          <X className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-sm text-rose-900 dark:text-rose-400">Request Declined</h4>
                            <p className="text-xs text-rose-700 dark:text-rose-300/80 mt-1">
                              This provider is currently unavailable or unable to fulfill your request at this time. Don't worry, there are many other compassionate providers ready to support you.
                            </p>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-rose-200/30 flex flex-wrap gap-3">
                          <Button 
                            size="sm" 
                            className="btn-struta-gold"
                            onClick={() => {
                              setDetailOpen(false);
                              navigate("/family/search");
                            }}
                          >
                            Search Other Funeral Homes
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setDetailOpen(false);
                              navigate("/family/search");
                            }}
                          >
                            Browse Service Vendors
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h3 className="font-head text-lg font-bold text-slate-900 dark:text-[#f6efe4]">Request Details</h3>
                      <div className="p-5 bg-slate-50 dark:bg-[#1c1a16] border border-slate-100 dark:border-[#39342c] rounded-2xl text-sm text-slate-600 dark:text-[#b8ad9a] leading-relaxed whitespace-pre-line">
                        {selectedRequest.request_details}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-[#f6efe4]">Provider Contact Information</h4>
                      <div className="p-4 bg-[var(--cream)]/30 dark:bg-[#1c1a16] rounded-xl border border-[var(--border)] space-y-2 text-xs">
                        <p className="font-bold text-slate-800 dark:text-[#f6efe4] flex items-center gap-2">
                          {selectedRequest.provider_type === "home" ? <Building2 className="w-4 h-4 text-[var(--gold)]" /> : <Store className="w-4 h-4 text-[var(--gold)]" />}
                          {selectedRequest.provider_name || "Verified Provider"}
                        </p>
                        {selectedRequest.mpesa_phone && (
                          <a 
                            href={`tel:${selectedRequest.mpesa_phone}`} 
                            className="flex items-center gap-2 text-[var(--gold)] hover:underline font-bold"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {selectedRequest.mpesa_phone} (Autodial)
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* CHAT TAB */}
                {activeTab === "chat" && (
                  <div className="flex-1 h-full min-h-[400px]">
                    {renderChatPanel()}
                  </div>
                )}

                {/* PROGRESS TRACKER TAB */}
                {activeTab === "progress" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-head text-lg font-bold text-slate-900 dark:text-[#f6efe4] flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[var(--gold)]" />
                        Real-time Progress Tracker
                      </h3>
                      <p className="text-xs text-[var(--muted)]">Monitor live updates and milestones posted by your funeral home or vendor.</p>
                    </div>

                    <div className="relative border-l-2 border-[var(--border)] ml-4 pl-6 space-y-8 py-2">
                      {(selectedRequest.progress_updates || []).map((update) => (
                        <div key={update.id} className="relative">
                          {/* Timeline Dot */}
                          <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-[#181612] flex items-center justify-center ${
                            update.status === 'completed' ? 'bg-emerald-500' :
                            update.status === 'in_progress' ? 'bg-amber-500 animate-pulse' :
                            'bg-slate-300'
                          }`} />
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-[var(--ink)]">{update.title}</h4>
                              <Badge className={`text-[9px] capitalize ${
                                update.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                update.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {update.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-xs text-[var(--muted)]">{update.description}</p>
                            <p className="text-[9px] text-[var(--muted)]">{new Date(update.updated_at).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}

                      {(!selectedRequest.progress_updates || selectedRequest.progress_updates.length === 0) && (
                        <div className="text-center py-12 text-[var(--muted)] italic text-xs">
                          No progress updates posted yet. The provider will post live updates as work begins.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PLANNING BOARD TAB (SPLIT SCREEN LAYOUT) */}
                {activeTab === "planning" && (
                  <div className="h-full min-h-0">
                    {/* Left/Main Area */}
                    <div className="space-y-6 overflow-y-auto pr-0 md:pr-2 max-w-5xl mx-auto pb-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-head text-lg font-bold text-slate-900 dark:text-[#f6efe4] flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-[var(--gold)]" />
                            Service Planning Board
                          </h3>
                          <p className="text-xs text-[var(--muted)]">Review the work plan, cost, timeline, and invoice prepared by the provider.</p>
                        </div>
                        <Badge className="capitalize bg-[var(--gold-bg)] text-[var(--gold)] border-[var(--gold)]/20">
                          Status: {selectedRequest.planning_board?.status || 'not_started'}
                        </Badge>
                      </div>

                      {selectedRequest.planning_board && selectedRequest.planning_board.status !== 'not_started' ? (
                        <div className="space-y-6">
                          {/* 1. Service Request Summary */}
                          <div className="p-4 bg-slate-50 dark:bg-[#1c1a16] border rounded-xl space-y-2">
                            <h4 className="font-bold text-xs text-slate-500 uppercase">1. Service Request Summary</h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div><span className="text-[var(--muted)]">Title:</span> <span className="font-bold">{selectedRequest.request_title}</span></div>
                              <div><span className="text-[var(--muted)]">Category:</span> <span className="font-bold capitalize">{selectedRequest.provider_type}</span></div>
                              <div><span className="text-[var(--muted)]">Customer:</span> <span className="font-bold">{selectedRequest.requester_email}</span></div>
                              <div><span className="text-[var(--muted)]">Status:</span> <span className="font-bold capitalize">{selectedRequest.status}</span></div>
                            </div>
                          </div>

                          {/* 2. Scope of Work */}
                          <div className="p-4 border rounded-xl space-y-3">
                            <h4 className="font-bold text-xs text-slate-500 uppercase">2. Scope of Work</h4>
                            <div className="space-y-2 text-xs">
                              <div><span className="font-bold block">Work Summary:</span> <p className="text-slate-600 dark:text-[#b8ad9a]">{selectedRequest.planning_board.work_summary || "Not specified"}</p></div>
                              <div><span className="font-bold block">Detailed Scope:</span> <p className="text-slate-600 dark:text-[#b8ad9a]">{selectedRequest.planning_board.scope_details || "Not specified"}</p></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div><span className="font-bold block text-emerald-600">What is Included:</span> <p className="text-slate-600 dark:text-[#b8ad9a]">{selectedRequest.planning_board.included_items || "Not specified"}</p></div>
                                <div><span className="font-bold block text-rose-600">What is Not Included:</span> <p className="text-slate-600 dark:text-[#b8ad9a]">{selectedRequest.planning_board.excluded_items || "Not specified"}</p></div>
                              </div>
                            </div>
                          </div>

                          {/* 3. Task Checklist */}
                          <div className="p-4 border rounded-xl space-y-3">
                            <h4 className="font-bold text-xs text-slate-500 uppercase">3. Task Checklist</h4>
                            <div className="space-y-2">
                              {(selectedRequest.planning_tasks || []).map((task, idx) => (
                                <div key={task.id || idx} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50 text-xs">
                                  <div className="flex items-center gap-2">
                                    <Checkbox checked={task.status === 'completed'} disabled />
                                    <div>
                                      <p className="font-bold">{task.title}</p>
                                      <p className="text-[10px] text-[var(--muted)]">{task.description}</p>
                                    </div>
                                  </div>
                                  <Badge className="capitalize text-[10px]">{task.status.replace('_', ' ')}</Badge>
                                </div>
                              ))}
                              {(!selectedRequest.planning_tasks || selectedRequest.planning_tasks.length === 0) && (
                                <p className="text-xs text-[var(--muted)] italic">No tasks planned yet.</p>
                              )}
                            </div>
                          </div>

                          {/* 4. Materials / Items Needed */}
                          <div className="p-4 border rounded-xl space-y-3">
                            <h4 className="font-bold text-xs text-slate-500 uppercase">4. Materials & Items Needed</h4>
                            <div className="space-y-2">
                              {(selectedRequest.planning_board.materials || []).map((m) => (
                                <div key={m.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 text-xs">
                                  <div>
                                    <p className="font-bold">{m.item_name}</p>
                                    <p className="text-[10px] text-slate-500">Qty: {m.quantity} • Unit: {selectedRequest.planning_board?.currency} {m.unit_price}</p>
                                  </div>
                                  <span className="font-bold">{selectedRequest.planning_board?.currency} {m.total_price}</span>
                                </div>
                              ))}
                              {(!selectedRequest.planning_board.materials || selectedRequest.planning_board.materials.length === 0) && (
                                <p className="text-xs text-[var(--muted)] italic">No materials listed.</p>
                              )}
                            </div>
                          </div>

                          {/* 5. Labor / Service Charges */}
                          <div className="p-4 border rounded-xl space-y-3">
                            <h4 className="font-bold text-xs text-slate-500 uppercase">5. Labor & Service Charges</h4>
                            <div className="space-y-2">
                              {(selectedRequest.planning_board.labor || []).map((l) => (
                                <div key={l.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 text-xs">
                                  <div>
                                    <p className="font-bold">{l.service_name}</p>
                                    <p className="text-[10px] text-slate-500">{l.description} • {l.hours} hrs @ {selectedRequest.planning_board?.currency} {l.rate}/hr</p>
                                  </div>
                                  <span className="font-bold">{selectedRequest.planning_board?.currency} {l.total_price}</span>
                                </div>
                              ))}
                              {(!selectedRequest.planning_board.labor || selectedRequest.planning_board.labor.length === 0) && (
                                <p className="text-xs text-[var(--muted)] italic">No labor charges listed.</p>
                              )}
                            </div>
                          </div>

                          {/* 6. Timeline / Schedule */}
                          <div className="p-4 border rounded-xl space-y-3">
                            <h4 className="font-bold text-xs text-slate-500 uppercase">6. Timeline & Schedule</h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div><span className="text-[var(--muted)]">Proposed Start:</span> <span className="font-bold">{selectedRequest.planning_board.proposed_start_date || "Not set"}</span></div>
                              <div><span className="text-[var(--muted)]">Proposed End:</span> <span className="font-bold">{selectedRequest.planning_board.proposed_end_date || "Not set"}</span></div>
                              <div><span className="text-[var(--muted)]">Duration:</span> <span className="font-bold">{selectedRequest.planning_board.estimated_duration || "Not set"}</span></div>
                              <div><span className="text-[var(--muted)]">Preferred Time:</span> <span className="font-bold">{selectedRequest.planning_board.preferred_time || "Not set"}</span></div>
                            </div>
                          </div>

                          {/* 8. Attachments */}
                          <div className="p-4 border rounded-xl space-y-3">
                            <h4 className="font-bold text-xs text-slate-500 uppercase">8. Attachments</h4>
                            <div className="space-y-2">
                              {(selectedRequest.planning_board.attachments || []).map((file) => (
                                <div key={file.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 text-xs">
                                  <div className="flex items-center gap-2">
                                    <Paperclip className="w-4 h-4 text-[var(--gold)]" />
                                    <span>{file.file_name}</span>
                                  </div>
                                  <Button variant="ghost" size="sm" className="h-7 text-[10px]" asChild>
                                    <a href={file.file_url} target="_blank" rel="noopener noreferrer">Download</a>
                                  </Button>
                                </div>
                              ))}
                              {(!selectedRequest.planning_board.attachments || selectedRequest.planning_board.attachments.length === 0) && (
                                <p className="text-xs text-[var(--muted)] italic">No attachments uploaded.</p>
                              )}
                            </div>
                          </div>

                          {/* 9. Cost Summary */}
                          <div className="p-4 bg-[var(--cream)]/30 rounded-xl space-y-2 text-xs">
                            <h4 className="font-bold text-xs text-slate-500 uppercase">9. Cost Summary</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between"><span>Materials Subtotal:</span> <span className="font-bold">{selectedRequest.planning_board.currency} {selectedRequest.planning_board.materials.reduce((sum, m) => sum + m.total_price, 0)}</span></div>
                              <div className="flex justify-between"><span>Labor Subtotal:</span> <span className="font-bold">{selectedRequest.planning_board.currency} {selectedRequest.planning_board.labor.reduce((sum, l) => sum + l.total_price, 0)}</span></div>
                              <div className="flex justify-between"><span>Extra Charges:</span> <span className="font-bold">{selectedRequest.planning_board.currency} {selectedRequest.planning_board.extra_charges}</span></div>
                              <div className="flex justify-between text-rose-600"><span>Discount:</span> <span className="font-bold">-{selectedRequest.planning_board.currency} {selectedRequest.planning_board.discount}</span></div>
                              <div className="flex justify-between"><span>Tax:</span> <span className="font-bold">{selectedRequest.planning_board.currency} {selectedRequest.planning_board.tax}</span></div>
                              <div className="border-t pt-2 flex justify-between text-sm font-black text-[var(--ink)]">
                                <span>Final Total:</span>
                                <span>{selectedRequest.planning_board.currency} {selectedRequest.planning_board.final_total}</span>
                              </div>
                            </div>
                          </div>

                          {/* 10. Approval Section */}
                          {selectedRequest.planning_board.status === 'submitted_for_approval' && (
                            <div className="p-6 bg-[var(--gold-bg)] border border-[var(--gold)]/20 rounded-2xl space-y-4 text-center">
                              <Sparkles className="w-8 h-8 text-[var(--gold)] mx-auto animate-pulse" />
                              <h4 className="font-bold text-lg">Review & Approve Planning Board</h4>
                              <p className="text-xs text-[var(--muted)] max-w-md mx-auto">
                                Please review the scope of work, timeline, and cost summary above. Once approved, the provider will generate the final invoice for payment.
                              </p>
                              <div className="flex gap-3 justify-center">
                                <Button variant="outline" onClick={handleRequestChanges}>
                                  Request Changes
                                </Button>
                                <Button className="btn-struta-gold" onClick={handleApprovePlan}>
                                  Approve Plan
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-12 border-2 border-dashed rounded-2xl border-[var(--border)] text-center text-sm text-[var(--muted)] space-y-3">
                          <Clock className="w-12 h-12 mx-auto opacity-40 text-[var(--gold)]" />
                          <p className="font-bold text-slate-800 dark:text-[#f6efe4]">Planning Board Awaiting Setup</p>
                          <p className="max-w-xs mx-auto">The provider is currently preparing the work plan, cost, and timeline.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* INVOICES & PAYMENTS TAB */}
                {activeTab === "payments" && (
                  <div className="space-y-6">
                    {isPaid ? (
                      <div className="p-6 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl space-y-4">
                        <div className="flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-400">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <p className="font-bold">Paid</p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-0.5">The invoice has been paid and work progress is unlocked.</p>
                          </div>
                        </div>
                      </div>
                    ) : isPlanningApproved && selectedRequest.payment_requested ? (
                      <RequestPaymentPanel
                        request={selectedRequest}
                        userId={user?.id}
                        userEmail={user?.email}
                        onPaymentSubmitted={fetchMyRequests}
                      />
                    ) : (
                      <div className="p-12 border-2 border-dashed rounded-2xl border-[var(--border)] text-center text-sm text-[var(--muted)] space-y-3">
                        <Clock className="w-12 h-12 mx-auto opacity-40 text-[var(--gold)]" />
                        <p className="font-bold text-slate-800 dark:text-[#f6efe4]">Complete and approve the planning board before payment.</p>
                        <p className="max-w-xs mx-auto">The planning board must be approved and the invoice generated before payment is unlocked.</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--border)] flex justify-end shrink-0 bg-white dark:bg-[#181612]">
              <Button variant="outline" onClick={() => setDetailOpen(false)}>
                Close Action Center
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
