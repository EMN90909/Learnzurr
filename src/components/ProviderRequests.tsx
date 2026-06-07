"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, 
  Check, 
  X, 
  Calendar, 
  Mail, 
  FileText, 
  RefreshCw, 
  Phone, 
  Send, 
  DollarSign, 
  AlertTriangle,
  MessageSquare,
  ClipboardList,
  Settings,
  Info,
  ChevronRight,
  User,
  Building2,
  Store,
  Sparkles,
  Plus,
  Trash2,
  Paperclip,
  Bell,
  Upload,
  Clock,
  Archive
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { enrichRequest, PlanningBoardData, ServiceRequest, ProgressUpdate } from "./MySentRequests";
import { addNotification, requestNotificationPermission } from "@/utils/notifications";
import { useAuth } from "@/components/auth/AuthProvider";

type ProviderType = "home" | "vendor";

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

type ProviderRequestsProps = {
  providerId: string;
  providerType: ProviderType;
  onStatusChange?: () => void;
};

export default function ProviderRequests({
  providerId,
  providerType,
  onStatusChange,
}: ProviderRequestsProps) {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "chat" | "payments" | "planning" | "progress" | "actions">("overview");
  const [notificationPermission, setNotificationPermission] = useState<string>("default");
  const [showArchived, setShowArchived] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; requestId: string } | null>(null);

  // Custom Delete Confirmation Dialog State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [paymentDetailsConfigured, setPaymentDetailsConfigured] = useState(false);
  const [providerDetails, setProviderDetails] = useState<{ paypal_email?: string; mpesa_phone?: string }>({});

  // Real-time Chat State
  const [newMessage, setNewMessage] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Planning Board Form State
  const [planningForm, setPlanningForm] = useState<PlanningBoardData>({
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
  });

  // Temporary item states for adding to lists
  const [tempMaterial, setTempMaterial] = useState({ item_name: "", quantity: 1, unit_price: 0, supplier: "", notes: "" });
  const [tempLabor, setTempLabor] = useState({ service_name: "", description: "", hours: 1, rate: 0 });
  const [tempTask, setTempTask] = useState({ title: "", description: "", assigned_to: "", estimated_time: "", due_date: "" });
  const [tempProgress, setTempProgress] = useState({ title: "", description: "", status: 'pending' as const });

  const fetchRequests = useCallback(async () => {
    if (!providerId || !providerType) return;

    setLoading(true);
    let dbRequests: ServiceRequest[] = [];

    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("provider_id", providerId)
        .eq("provider_type", providerType)
        .order("created_at", { ascending: false });

      if (!error && data) {
        dbRequests = data;
      }
    } catch (error) {
      console.warn("Supabase fetch failed, relying on localStorage fallback.");
    }

    const sharedRequestsKey = "struta_shared_service_requests";
    const localRequests = JSON.parse(localStorage.getItem(sharedRequestsKey) || "[]");
    const filteredLocal = localRequests.filter(
      (r: any) => r.provider_id === providerId && r.provider_type === providerType
    );

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

    // Verify if provider has payment details configured
    const localBusinessInfo = localStorage.getItem(`business_info_${providerType}_${providerId}`);
    let paypalEmail = "";
    let mpesaPhone = "";

    if (localBusinessInfo) {
      try {
        const parsed = JSON.parse(localBusinessInfo);
        paypalEmail = parsed.paypal_email || "";
        mpesaPhone = parsed.mpesa_phone || "";
      } catch {}
    }

    setProviderDetails({ paypal_email: paypalEmail, mpesa_phone: mpesaPhone });
    setPaymentDetailsConfigured(!!paypalEmail || !!mpesaPhone);

    setLoading(false);
  }, [providerId, providerType]);

  useEffect(() => {
    fetchRequests();
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }

    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener("click", handleCloseMenu);
    return () => {
      window.removeEventListener("click", handleCloseMenu);
    };
  }, [fetchRequests]);

  // Real-time subscription for service requests
  useEffect(() => {
    if (!providerId || !providerType) return;

    const channel = supabase
      .channel('realtime-service-requests-provider')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `provider_id=eq.${providerId}`
        },
        (payload) => {
          const enriched = enrichRequest(payload.new);
          
          setRequests((prev) => {
            const oldReq = prev.find(r => r.id === enriched.id);
            if (oldReq) {
              // 1. Status changed (e.g. cancelled by family)
              if (oldReq.status !== enriched.status) {
                addNotification(providerId, {
                  userId: providerId,
                  title: `Request ${enriched.status === "accepted" ? "approved" : enriched.status}`,
                  message: `The request "${enriched.request_title}" has been ${enriched.status === "accepted" ? "approved" : enriched.status} by the family.`,
                  type: "request",
                  link: providerType === "home" ? "/operations/cases" : "/marketplace/orders"
                });
              }
              
              // 2. New chat message from family
              const oldChatCount = oldReq.chat_messages?.length || 0;
              const newChatCount = enriched.chat_messages?.length || 0;
              if (newChatCount > oldChatCount) {
                const lastMsg = enriched.chat_messages?.[newChatCount - 1];
                if (lastMsg && lastMsg.sender === "family") {
                  addNotification(providerId, {
                    userId: providerId,
                    title: `New Message from ${lastMsg.sender_name || enriched.requester_name || "Family"}`,
                    message: lastMsg.text || "Sent an attachment",
                    type: "chat",
                    link: providerType === "home" ? "/operations/cases" : "/marketplace/orders"
                  });
                }
              }

              // 3. Planning board status changed (e.g. approved or changes requested)
              const oldPlanStatus = oldReq.planning_board?.status;
              const newPlanStatus = enriched.planning_board?.status;
              if (newPlanStatus && oldPlanStatus !== newPlanStatus) {
                addNotification(providerId, {
                  userId: providerId,
                  title: `Planning Board: ${newPlanStatus.replace('_', ' ')}`,
                  message: `The family has updated the planning board status to "${newPlanStatus.replace('_', ' ')}" for "${enriched.request_title}".`,
                  type: "planning",
                  link: providerType === "home" ? "/operations/cases" : "/marketplace/orders"
                });
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
  }, [providerId, providerType, selectedRequest?.id]);

  useEffect(() => {
    if (selectedRequest) {
      const updated = requests.find(r => r.id === selectedRequest.id);
      if (updated) {
        if (JSON.stringify(updated) !== JSON.stringify(selectedRequest)) {
          setSelectedRequest(updated);
        }
      }
    }
  }, [requests, selectedRequest]);

  useEffect(() => {
    if (selectedRequest?.planning_board) {
      setPlanningForm(selectedRequest.planning_board);
    }
  }, [selectedRequest]);

  // Mark messages as seen when chat tab is active
  useEffect(() => {
    if (selectedRequest && activeTab === "chat") {
      const hasUnseen = (selectedRequest.chat_messages || []).some(
        (msg) => msg.sender === "family" && !msg.seen
      );

      if (hasUnseen) {
        const updatedMessages = (selectedRequest.chat_messages || []).map((msg) => {
          if (msg.sender === "family" && !msg.seen) {
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
              fetchRequests();
            }
          });
      }
    }
  }, [selectedRequest?.chat_messages, activeTab, selectedRequest?.id, fetchRequests]);

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

  const handleSendMessage = async (textToSend?: string, attachmentUrl?: string, attachmentName?: string) => {
    if (!selectedRequest) return;
    const messageText = textToSend !== undefined ? textToSend : newMessage.trim();
    if (!messageText && !attachmentUrl) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      requestId: selectedRequest.id,
      sender: "provider",
      text: messageText,
      timestamp: new Date().toISOString(),
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
      seen: false,
      sender_name: profile?.home_name || profile?.business_name || profile?.full_name || "Provider"
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

      if (selectedRequest.requester_id) {
        addNotification(selectedRequest.requester_id, {
          userId: selectedRequest.requester_id,
          title: `New Message from ${profile?.home_name || profile?.business_name || profile?.full_name || (providerType === "home" ? "Funeral Home" : "Vendor")}`,
          message: messageText || "Sent an attachment",
          type: "chat"
        });
      }

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

  const calculateTotals = (form: PlanningBoardData) => {
    const materialsSubtotal = form.materials.reduce((sum, m) => sum + m.total_price, 0);
    const laborSubtotal = form.labor.reduce((sum, l) => sum + l.total_price, 0);
    const finalTotal = Math.max(0, materialsSubtotal + laborSubtotal + Number(form.extra_charges) + Number(form.tax) - Number(form.discount));
    return { ...form, final_total: finalTotal };
  };

  const savePlanningBoardDirectly = async (updatedBoard: PlanningBoardData, updatedTasks?: any[], updatedProgress?: ProgressUpdate[]) => {
    if (!selectedRequest) return;

    const notesObj = {
      custom_notes: selectedRequest.notes || "",
      payment_requested: selectedRequest.payment_requested || false,
      payment_amount: updatedBoard.final_total,
      payment_currency: updatedBoard.currency,
      payment_status: selectedRequest.payment_status || "unpaid",
      chat_messages: selectedRequest.chat_messages || [],
      planning_tasks: updatedTasks || selectedRequest.planning_tasks || [],
      progress_updates: updatedProgress || selectedRequest.progress_updates || [],
      planning_board: updatedBoard,
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

      // Update local requests list to keep UI in sync
      setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, notes: serializedNotes, planning_board: updatedBoard, planning_tasks: updatedTasks || r.planning_tasks, progress_updates: updatedProgress || r.progress_updates } : r));
    } catch (err: any) {
      console.error("Failed to auto-save planning board:", err);
    }
  };

  const handleSavePlanningBoard = async (statusOverride?: 'submitted_for_approval' | 'completed' | 'in_progress') => {
    if (!selectedRequest) return;

    const updatedStatus = statusOverride || 'in_progress';
    const updatedBoard = calculateTotals({
      ...planningForm,
      status: updatedStatus
    });

    const notesObj = {
      custom_notes: selectedRequest.notes || "",
      payment_requested: updatedStatus === 'submitted_for_approval' || updatedStatus === 'completed',
      payment_amount: updatedBoard.final_total,
      payment_currency: updatedBoard.currency,
      payment_status: selectedRequest.payment_status || "unpaid",
      chat_messages: selectedRequest.chat_messages || [],
      planning_tasks: selectedRequest.planning_tasks || [],
      progress_updates: selectedRequest.progress_updates || [],
      planning_board: updatedBoard,
      status: updatedStatus === 'completed' ? "planning_completed" : selectedRequest.status // Store rich status in JSON notes
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

      if (updatedStatus === "completed") {
        const invoiceNumber = `INV-${selectedRequest.id.slice(0, 8).toUpperCase()}`;
        await supabase.from("invoices").upsert(
          {
            request_id: selectedRequest.id,
            user_id: selectedRequest.requester_id,
            provider_id: selectedRequest.provider_id,
            invoice_number: invoiceNumber,
            title: selectedRequest.request_title,
            description: selectedRequest.request_details,
            amount: updatedBoard.final_total,
            currency: updatedBoard.currency,
            status: "pending",
            metadata: {
              provider_type: selectedRequest.provider_type,
            },
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "request_id",
          }
        );
      }

      addNotification(selectedRequest.requester_id || "", {
        userId: selectedRequest.requester_id || "",
        title: updatedStatus === 'completed' ? "Invoice Generated" : updatedStatus === 'submitted_for_approval' ? "Planning Board Submitted" : "Planning Board Updated",
        message: updatedStatus === 'completed' 
          ? `An invoice of ${updatedBoard.currency} ${updatedBoard.final_total} has been generated for "${selectedRequest.request_title}".`
          : `${profile?.home_name || profile?.business_name || profile?.full_name || "The provider"} has updated the planning board for "${selectedRequest.request_title}".`,
        type: updatedStatus === 'completed' ? "payment" : "planning"
      });

      showSuccess("Planning board saved successfully!");
      fetchRequests();
    } catch (err: any) {
      showError(err.message || "Failed to save planning board.");
    }
  };

  const handleAddMaterial = () => {
    if (!tempMaterial.item_name.trim()) return;
    const newMaterial = {
      id: crypto.randomUUID(),
      item_name: tempMaterial.item_name.trim(),
      quantity: tempMaterial.quantity,
      unit_price: tempMaterial.unit_price,
      total_price: tempMaterial.quantity * tempMaterial.unit_price,
      supplier: tempMaterial.supplier.trim() || undefined,
      notes: tempMaterial.notes.trim() || undefined
    };

    setPlanningForm(prev => {
      const updated = {
        ...prev,
        materials: [...prev.materials, newMaterial]
      };
      const finalForm = calculateTotals(updated);
      savePlanningBoardDirectly(finalForm);
      return finalForm;
    });
    setTempMaterial({ item_name: "", quantity: 1, unit_price: 0, supplier: "", notes: "" });
    showSuccess("Material added and saved!");
  };

  const handleRemoveMaterial = (id: string) => {
    setPlanningForm(prev => {
      const updated = {
        ...prev,
        materials: prev.materials.filter(m => m.id !== id)
      };
      const finalForm = calculateTotals(updated);
      savePlanningBoardDirectly(finalForm);
      return finalForm;
    });
    showSuccess("Material removed and saved!");
  };

  const handleAddLabor = () => {
    if (!tempLabor.service_name.trim()) return;
    const newLabor = {
      id: crypto.randomUUID(),
      service_name: tempLabor.service_name.trim(),
      description: tempLabor.description.trim(),
      hours: tempLabor.hours,
      rate: tempLabor.rate,
      total_price: tempLabor.hours * tempLabor.rate
    };

    setPlanningForm(prev => {
      const updated = {
        ...prev,
        labor: [...prev.labor, newLabor]
      };
      const finalForm = calculateTotals(updated);
      savePlanningBoardDirectly(finalForm);
      return finalForm;
    });
    setTempLabor({ service_name: "", description: "", hours: 1, rate: 0 });
    showSuccess("Labor charge added and saved!");
  };

  const handleRemoveLabor = (id: string) => {
    setPlanningForm(prev => {
      const updated = {
        ...prev,
        labor: prev.labor.filter(l => l.id !== id)
      };
      const finalForm = calculateTotals(updated);
      savePlanningBoardDirectly(finalForm);
      return finalForm;
    });
    showSuccess("Labor charge removed and saved!");
  };

  const handleAddTask = async () => {
    if (!tempTask.title.trim() || !selectedRequest) return;
    const newTask = {
      id: crypto.randomUUID(),
      title: tempTask.title.trim(),
      description: tempTask.description.trim(),
      assigned_to: tempTask.assigned_to.trim(),
      status: 'not_started' as const,
      estimated_time: tempTask.estimated_time.trim(),
      due_date: tempTask.due_date
    };

    const updatedTasks = [...(selectedRequest.planning_tasks || []), newTask];
    await savePlanningBoardDirectly(planningForm, updatedTasks);
    setTempTask({ title: "", description: "", assigned_to: "", estimated_time: "", due_date: "" });
    showSuccess("Task added and saved!");
  };

  const handleRemoveTask = async (id: string) => {
    if (!selectedRequest) return;
    const updatedTasks = (selectedRequest.planning_tasks || []).filter(t => t.id !== id);
    await savePlanningBoardDirectly(planningForm, updatedTasks);
    showSuccess("Task removed and saved!");
  };

  // Progress Updates (Posh Updates) Handlers
  const handleAddProgressUpdate = async () => {
    if (!tempProgress.title.trim() || !selectedRequest) return;
    const newUpdate: ProgressUpdate = {
      id: crypto.randomUUID(),
      title: tempProgress.title.trim(),
      description: tempProgress.description.trim(),
      status: tempProgress.status,
      updated_at: new Date().toISOString()
    };

    const updatedProgress = [...(selectedRequest.progress_updates || []), newUpdate];
    await savePlanningBoardDirectly(planningForm, undefined, updatedProgress);
    
    addNotification(selectedRequest.requester_id || "", {
      userId: selectedRequest.requester_id || "",
      title: `Progress Update: ${newUpdate.title}`,
      message: newUpdate.description || `Status: ${newUpdate.status}`,
      type: "planning"
    });

    setTempProgress({ title: "", description: "", status: 'pending' });
    showSuccess("Progress update posted successfully!");
  };

  const handleUpdateProgressStatus = async (id: string, status: 'pending' | 'in_progress' | 'completed') => {
    if (!selectedRequest) return;
    const updatedProgress = (selectedRequest.progress_updates || []).map(u => 
      u.id === id ? { ...u, status, updated_at: new Date().toISOString() } : u
    );
    const targetUpdate = updatedProgress.find(u => u.id === id);

    await savePlanningBoardDirectly(planningForm, undefined, updatedProgress);

    if (targetUpdate) {
      addNotification(selectedRequest.requester_id || "", {
        userId: selectedRequest.requester_id || "",
        title: `Progress Update: ${targetUpdate.title}`,
        message: `Status changed to: ${status.replace('_', ' ')}`,
        type: "planning"
      });
    }

    showSuccess("Progress status updated!");
  };

  const handleRemoveProgressUpdate = async (id: string) => {
    if (!selectedRequest) return;
    const updatedProgress = (selectedRequest.progress_updates || []).filter(u => u.id !== id);
    await savePlanningBoardDirectly(planningForm, undefined, updatedProgress);
    showSuccess("Progress update removed.");
  };

  async function updateRequestStatus(
    requestId: string,
    status: "accepted" | "rejected" | "completed"
  ) {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    try {
      // Reconstruct and update the status inside the JSON notes payload as well
      let updatedNotes = request.notes || "";
      const notesObj = {
        custom_notes: request.notes || "",
        payment_requested: request.payment_requested || false,
        payment_amount: request.payment_amount || 0,
        payment_currency: request.payment_currency || "USD",
        payment_status: request.payment_status || "unpaid",
        chat_messages: request.chat_messages || [],
        planning_tasks: request.planning_tasks || [],
        progress_updates: request.progress_updates || [],
        planning_board: request.planning_board,
        status: status // Sync status inside JSON notes!
      };
      updatedNotes = JSON.stringify(notesObj);

      const { data, error } = await supabase
        .from("service_requests")
        .update({
          status,
          notes: updatedNotes, // Save updated JSON notes
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;

      const enriched = enrichRequest(data);
      setRequests((prev) =>
        prev.map((item) => (item.id === requestId ? enriched : item))
      );
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(enriched);
      }

      // Update shared localStorage
      const sharedRequestsKey = "struta_shared_service_requests";
      const localRequests = JSON.parse(localStorage.getItem(sharedRequestsKey) || "[]");
      const updatedLocal = localRequests.map((r: any) => 
        r.id === requestId ? { ...r, notes: updatedNotes, status, updated_at: new Date().toISOString() } : r
      );
      localStorage.setItem(sharedRequestsKey, JSON.stringify(updatedLocal));

      addNotification(request.requester_id || "", {
        userId: request.requester_id || "",
        title: `Request ${status === "accepted" ? "approved" : status}`,
        message: `Your request "${request.request_title}" has been ${status === "accepted" ? "approved" : status} by the provider.`,
        type: "request"
      });

      showSuccess(`Request marked as ${status === "accepted" ? "approved" : status}!`);
      fetchRequests();
    } catch (error: any) {
      console.warn("Supabase update failed, updating localStorage fallback:", error.message);
    }
  }

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
      fetchRequests();
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

      // 3. Delete the service request itself
      try {
        const { error } = await supabase
          .from("service_requests")
          .delete()
          .eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.warn("Supabase delete failed, falling back to localStorage:", err);
      }
        
      // Update shared localStorage
      const sharedRequestsKey = "struta_shared_service_requests";
      const localRequests = JSON.parse(localStorage.getItem(sharedRequestsKey) || "[]");
      const updatedLocal = localRequests.filter((r: any) => r.id !== id);
      localStorage.setItem(sharedRequestsKey, JSON.stringify(updatedLocal));

      showSuccess("Request deleted successfully");
      setDeleteConfirmId(null);
      setDetailOpen(false);
      fetchRequests();
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
              {selectedRequest.requester_email}
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
              className={`flex gap-3 max-w-[85%] ${msg.sender === "provider" ? "ml-auto flex-row-reverse" : ""}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${msg.sender === "provider" ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-[#39342c] text-slate-600 dark:text-[#b8ad9a]"}`}>
                {msg.sender === "provider" ? "P" : "F"}
              </div>
              <div className="space-y-1">
                {/* Display Sender Name */}
                <p className={`text-[10px] font-bold text-slate-500 ${msg.sender === "provider" ? "text-right" : "text-left"}`}>
                  {msg.sender_name || (msg.sender === "provider" ? (selectedRequest.provider_name || "Provider") : (selectedRequest.requester_name || selectedRequest.requester_email || "Family"))}
                </p>
                <div className={`p-3 rounded-2xl text-xs ${msg.sender === "provider" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white dark:bg-[#181612] border border-[var(--border)] text-slate-700 dark:text-[#f6efe4] rounded-tl-none"}`}>
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
                  <p className={`text-[9px] text-[var(--muted)] ${msg.sender === "provider" ? "text-right flex-1" : ""}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {msg.sender === "provider" && (
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
            "Can you send a photo?",
            "What time works best?",
            "I have updated the plan.",
            "Please review the final cost."
          ].map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => handleSendMessage(reply)}
              className="px-2.5 py-1 bg-white dark:bg-[#1c1a16] border border-[var(--border)] rounded-full text-[10px] font-bold text-slate-600 dark:text-[#b8ad9a] hover:border-indigo-500 hover:text-indigo-600 whitespace-nowrap transition-all"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-3 border-t border-[var(--border)] bg-white dark:bg-[#181612] flex gap-2 shrink-0 items-center">
          <label className="cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-[#1c1a16] rounded-full text-[var(--muted)] hover:text-indigo-600 transition-colors shrink-0">
            {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <input type="file" className="hidden" onChange={file_e => handleFileUpload(file_e)} disabled={uploadingFile} />
          </label>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 h-9 text-xs bg-[var(--paper)] border-[var(--border)] text-[var(--ink)]"
          />
          <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 w-9 p-0 shrink-0">
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
          <h3 className="text-xl font-bold text-slate-900 dark:text-[#f6efe4]">Incoming Service Requests</h3>
          <p className="text-xs text-slate-500 mt-1">Right-click on any request to Archive or Delete. Click to open planning center.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowArchived(!showArchived)}
            className={showArchived ? "border-indigo-600 text-indigo-600 bg-indigo-50" : ""}
          >
            <Archive className="w-4 h-4 mr-2" /> {showArchived ? "Show Active" : "Show Archived"}
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchRequests}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-[#181612] border border-slate-200 dark:border-[#39342c] rounded-xl shadow-sm gap-4 animate-pulse">
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
        <div className="text-center py-12 border-2 border-dashed rounded-xl text-slate-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeRequests.map((request) => (
            <div
              key={request.id}
              onContextMenu={(e) => handleContextMenu(e, request.id)}
              onClick={() => {
                setSelectedRequest(request);
                setActiveTab("overview");
                setDetailOpen(true);
              }}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-[#181612] border border-slate-200 dark:border-[#39342c] rounded-xl hover:border-indigo-500 transition-all cursor-pointer shadow-sm gap-4 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  {request.provider_type === "home" ? <FileText className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-[#f6efe4] truncate group-hover:text-indigo-600 transition-colors">
                    {request.request_title}
                  </h4>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    From: {request.requester_email} • {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
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
                  {request.status === "accepted" ? "approved" : request.status}
                </Badge>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform hidden sm:block" />
              </div>
            </div>
          ))}
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
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 capitalize">
                    {selectedRequest.provider_type} Request
                  </span>
                  <span className="text-xs text-slate-500">
                    Received: {new Date(selectedRequest.created_at).toLocaleString()}
                  </span>
                </div>
                <DialogTitle className="font-head text-2xl font-black mt-1 text-slate-900 dark:text-[#f6efe4]">
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
                {selectedRequest.status === "accepted" ? "approved" : selectedRequest.status}
              </Badge>
            </div>

            {/* Sidebar Tab Layout - Mobile Friendly Horizontal Scroll */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
              <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--cream)]/20 dark:bg-[#1c1a16] flex flex-row md:flex-col p-2 md:p-4 gap-1 overflow-x-auto md:overflow-x-visible shrink-0 scrollbar-none">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`flex md:w-full items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === "overview" 
                      ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                      : "text-slate-500 hover:bg-[var(--cream)]"
                  }`}
                >
                  <Info className="w-4 h-4" />
                  Overview & Details
                </button>

                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex md:w-full items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === "chat" 
                      ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                      : "text-slate-500 hover:bg-[var(--cream)]"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat & Messages
                </button>

                <button
                  onClick={() => setActiveTab("planning")}
                  className={`flex md:w-full items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === "planning" 
                      ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                      : "text-slate-500 hover:bg-[var(--cream)]"
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Planning Board
                </button>

                <button
                  onClick={() => setActiveTab("progress")}
                  className={`flex md:w-full items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === "progress" 
                      ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                      : "text-slate-500 hover:bg-[var(--cream)]"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Progress Tracker
                </button>

                <button
                  onClick={() => setActiveTab("payments")}
                  className={`flex md:w-full items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === "payments" 
                      ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                      : "text-slate-500 hover:bg-[var(--cream)]"
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Invoices & Payments
                </button>

                <button
                  onClick={() => setActiveTab("actions")}
                  className={`flex md:w-full items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === "actions" 
                      ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                      : "text-slate-500 hover:bg-[var(--cream)]"
                  }`}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Actions
                </button>
              </div>

              {/* Right Content Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white dark:bg-[#181612] min-h-0 flex flex-col">
                
                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Prominent Approval Banner for Pending Requests */}
                    {selectedRequest.status === "pending" && (
                      <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-amber-900 dark:text-amber-400">Pending Approval</h4>
                          <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-1">This request needs your approval before you can start planning or generate invoices.</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            onClick={() => updateRequestStatus(selectedRequest.id, "accepted")}
                          >
                            <Check className="w-4 h-4 mr-1.5" /> Accept Request
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold"
                            onClick={() => updateRequestStatus(selectedRequest.id, "rejected")}
                          >
                            <X className="w-4 h-4 mr-1.5" /> Decline
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
                      <h4 className="font-bold text-sm text-slate-800 dark:text-[#f6efe4]">Family Contact Information</h4>
                      <div className="p-4 bg-indigo-50/30 dark:bg-[#1c1a16] rounded-xl border border-indigo-100 dark:border-[#39342c] space-y-2 text-xs">
                        <p className="font-bold text-slate-800 dark:text-[#f6efe4] flex items-center gap-2">
                          <User className="w-4 h-4 text-indigo-600" />
                          Family Representative
                        </p>
                        <p className="flex items-center gap-2 text-slate-600 dark:text-[#b8ad9a]">
                          <Mail className="w-3.5 h-3.5" />
                          {selectedRequest.requester_email}
                        </p>
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
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-head text-lg font-bold text-slate-900 dark:text-[#f6efe4] flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-600" />
                          Real-time Progress Tracker
                        </h3>
                        <p className="text-xs text-slate-500">Post live updates and milestones to keep the family informed in real-time.</p>
                      </div>
                    </div>

                    {selectedRequest.status !== "pending" ? (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Side: Add Progress Update Form */}
                        <div className="lg:col-span-1 p-4 border rounded-xl space-y-4 bg-slate-50/50">
                          <h4 className="font-bold text-xs text-slate-500 uppercase">Post New Update</h4>
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Update Title</Label>
                              <Input 
                                placeholder="e.g. Coffin made / Hearse taking body" 
                                value={tempProgress.title} 
                                onChange={e => setTempProgress({...tempProgress, title: e.target.value})}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Description</Label>
                              <Textarea 
                                placeholder="Provide details about this milestone..." 
                                value={tempProgress.description} 
                                onChange={e => setTempProgress({...tempProgress, description: e.target.value})}
                                rows={2}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Initial Status</Label>
                              <Select 
                                value={tempProgress.status} 
                                onValueChange={(v: any) => setTempProgress({...tempProgress, status: v})}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button type="button" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleAddProgressUpdate}>
                              <Plus className="w-4 h-4 mr-1.5" /> Post Update
                            </Button>
                          </div>
                        </div>

                        {/* Right Side: Timeline & Management */}
                        <div className="lg:col-span-2 space-y-6">
                          <div className="relative border-l-2 border-[var(--border)] ml-4 pl-6 space-y-8 py-2">
                            {(selectedRequest.progress_updates || []).map((update) => (
                              <div key={update.id} className="relative group">
                                {/* Timeline Dot */}
                                <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-[#181612] flex items-center justify-center ${
                                  update.status === 'completed' ? 'bg-emerald-500' :
                                  update.status === 'in_progress' ? 'bg-amber-500 animate-pulse' :
                                  'bg-slate-300'
                                }`} />
                                
                                <div className="flex justify-between items-start gap-4">
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

                                  {/* Quick Status Controls */}
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    {update.status !== 'completed' && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="w-7 h-7 text-emerald-600 hover:bg-emerald-50"
                                        onClick={() => handleUpdateProgressStatus(update.id, 'completed')}
                                        title="Mark Completed"
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                    )}
                                    {update.status !== 'in_progress' && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="w-7 h-7 text-amber-600 hover:bg-amber-50"
                                        onClick={() => handleUpdateProgressStatus(update.id, 'in_progress')}
                                        title="Mark In Progress"
                                      >
                                        <Clock className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="w-7 h-7 text-rose-600 hover:bg-rose-50"
                                      onClick={() => handleRemoveProgressUpdate(update.id)}
                                      title="Delete Update"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {(!selectedRequest.progress_updates || selectedRequest.progress_updates.length === 0) && (
                              <div className="text-center py-12 text-[var(--muted)] italic text-xs">
                                No progress updates posted yet. Use the form on the left to post your first live update.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 border-2 border-dashed rounded-2xl border-[var(--border)] text-center text-sm text-slate-400 space-y-3">
                        <Clock className="w-12 h-12 mx-auto opacity-40 text-indigo-600" />
                        <p className="font-bold text-slate-800 dark:text-[#f6efe4]">Progress Tracker Locked</p>
                        <p className="max-w-xs mx-auto">You must accept the request first to unlock the progress tracker.</p>
                      </div>
                    )}
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
                            <ClipboardList className="w-5 h-5 text-indigo-600" />
                            Service Planning Board
                          </h3>
                          <p className="text-xs text-slate-500">Prepare the work plan, cost, timeline, and invoice before the user pays.</p>
                        </div>
                        <Badge className="capitalize bg-indigo-50 text-indigo-700 border-indigo-200">
                          Status: {planningForm.status}
                        </Badge>
                      </div>

                      {selectedRequest.status !== "pending" ? (
                        <div className="space-y-6">
                          {/* 1. Service Request Summary */}
                          <div className="p-4 bg-slate-50 dark:bg-[#1c1a16] border rounded-xl space-y-2">
                            <h4 className="font-bold text-xs text-slate-500 uppercase">1. Service Request Summary</h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div><span className="text-slate-500">Title:</span> <span className="font-bold">{selectedRequest.request_title}</span></div>
                              <div><span className="text-slate-500">Category:</span> <span className="font-bold capitalize">{selectedRequest.provider_type}</span></div>
                              <div><span className="text-slate-500">Customer:</span> <span className="font-bold">{selectedRequest.requester_email}</span></div>
                              <div><span className="text-slate-500">Status:</span> <span className="font-bold capitalize">{selectedRequest.status}</span></div>
                            </div>
                          </div>

                          {/* 2. Scope of Work */}
                          <div className="p-4 border rounded-xl space-y-4">
                            <h4 className="font-bold text-xs text-slate-500 uppercase">2. Scope of Work</h4>
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Work Summary</Label>
                                <Input value={planningForm.work_summary} onChange={e => setPlanningForm({...planningForm, work_summary: e.target.value})} placeholder="e.g. Repair leaking pipe" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Detailed Scope</Label>
                                <Textarea value={planningForm.scope_details} onChange={e => setPlanningForm({...planningForm, scope_details: e.target.value})} placeholder="Describe the detailed steps..." />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-xs">What is Included</Label>
                                  <Input value={planningForm.included_items} onChange={e => setPlanningForm({...planningForm, included_items: e.target.value})} placeholder="e.g. Labor, materials" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">What is Not Included</Label>
                                  <Input value={planningForm.excluded_items} onChange={e => setPlanningForm({...planningForm, excluded_items: e.target.value})} placeholder="e.g. Wall breaking" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 3. Task Checklist */}
                          <div className="p-4 border rounded-xl space-y-4">
                            <h4 className="font-bold text-xs text-slate-500 uppercase">3. Task Checklist</h4>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <Input placeholder="Task Title" value={tempTask.title} onChange={e => setTempTask({...tempTask, title: e.target.value})} />
                                <Input placeholder="Description" value={tempTask.description} onChange={e => setTempTask({...tempTask, description: e.target.value})} />
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <Input placeholder="Assigned To" value={tempTask.assigned_to} onChange={e => setTempTask({...tempTask, assigned_to: e.target.value})} />
                                <Input placeholder="Est. Time" value={tempTask.estimated_time} onChange={e => setTempTask({...tempTask, estimated_time: e.target.value})} />
                                <Input type="date" value={tempTask.due_date} onChange={e => setTempTask({...tempTask, due_date: e.target.value})} />
                              </div>
                              <Button type="button" variant="outline" size="sm" onClick={handleAddTask}>
                                <Plus className="w-4 h-4 mr-1" /> Add Task
                              </Button>

                              <div className="space-y-2 pt-2">
                                {(selectedRequest.planning_tasks || []).map((task) => (
                                  <div key={task.id} className="flex justify-between items-center p-3 rounded-lg border bg-slate-50/50 text-xs">
                                    <div>
                                      <p className="font-bold">{task.title}</p>
                                      <p className="text-[10px] text-slate-500">{task.description} • Assigned: {task.assigned_to}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => handleRemoveTask(task.id)}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* 4. Materials / Items Needed */}
                          <div className="p-4 border rounded-xl space-y-4">
                            <h4 className="font-bold text-xs text-slate-500 uppercase">4. Materials & Items Needed</h4>
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-3">
                                <Input placeholder="Item Name" value={tempMaterial.item_name} onChange={e => setTempMaterial({...tempMaterial, item_name: e.target.value})} />
                                <Input type="number" placeholder="Qty" value={tempMaterial.quantity} onChange={e => setTempMaterial({...tempMaterial, quantity: parseInt(e.target.value) || 1})} />
                                <Input type="number" placeholder="Unit Price" value={tempMaterial.unit_price || ""} onChange={e => setTempMaterial({...tempMaterial, unit_price: parseFloat(e.target.value) || 0})} />
                              </div>
                              <Button type="button" variant="outline" size="sm" onClick={handleAddMaterial}>
                                <Plus className="w-4 h-4 mr-1" /> Add Material
                              </Button>

                              <div className="space-y-2 pt-2">
                                {planningForm.materials.map((m) => (
                                  <div key={m.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 text-xs">
                                    <div>
                                      <p className="font-bold">{m.item_name}</p>
                                      <p className="text-[10px] text-slate-500">Qty: {m.quantity} • Unit: {planningForm.currency} {m.unit_price}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-bold">{planningForm.currency} {m.total_price}</span>
                                      <Button variant="ghost" size="sm" className="text-rose-600 h-7 w-7 p-0" onClick={() => handleRemoveMaterial(m.id)}>
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* 5. Labor / Service Charges */}
                          <div className="p-4 border rounded-xl space-y-4">
                            <h4 className="font-bold text-xs text-slate-500 uppercase">5. Labor & Service Charges</h4>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <Input placeholder="Service Name" value={tempLabor.service_name} onChange={e => setTempLabor({...tempLabor, service_name: e.target.value})} />
                                <Input placeholder="Description" value={tempLabor.description} onChange={e => setTempLabor({...tempLabor, description: e.target.value})} />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <Input type="number" placeholder="Hours" value={tempLabor.hours} onChange={e => setTempLabor({...tempLabor, hours: parseFloat(e.target.value) || 1})} />
                                <Input type="number" placeholder="Rate" value={tempLabor.rate || ""} onChange={e => setTempLabor({...tempLabor, rate: parseFloat(e.target.value) || 0})} />
                              </div>
                              <Button type="button" variant="outline" size="sm" onClick={handleAddLabor}>
                                <Plus className="w-4 h-4 mr-1" /> Add Labor
                              </Button>

                              <div className="space-y-2 pt-2">
                                {planningForm.labor.map((l) => (
                                  <div key={l.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 text-xs">
                                    <div>
                                      <p className="font-bold">{l.service_name}</p>
                                      <p className="text-[10px] text-slate-500">{l.hours} hrs @ {planningForm.currency} {l.rate}/hr</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-bold">{planningForm.currency} {l.total_price}</span>
                                      <Button variant="ghost" size="sm" className="text-rose-600 h-7 w-7 p-0" onClick={() => handleRemoveLabor(l.id)}>
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* 6. Timeline / Schedule */}
                          <div className="p-4 border rounded-xl space-y-4">
                            <h4 className="font-bold text-xs text-slate-500 uppercase">6. Timeline & Schedule</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <Label className="text-xs">Proposed Start Date</Label>
                                <Input type="date" value={planningForm.proposed_start_date} onChange={e => setPlanningForm({...planningForm, proposed_start_date: e.target.value})} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Proposed End Date</Label>
                                <Input type="date" value={planningForm.proposed_end_date} onChange={e => setPlanningForm({...planningForm, proposed_end_date: e.target.value})} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Estimated Duration</Label>
                                <Input value={planningForm.estimated_duration} onChange={e => setPlanningForm({...planningForm, estimated_duration: e.target.value})} placeholder="e.g. 2 hours" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Preferred Visit Time</Label>
                                <Input value={planningForm.preferred_time} onChange={e => setPlanningForm({...planningForm, preferred_time: e.target.value})} placeholder="e.g. Morning" />
                              </div>
                            </div>
                          </div>

                          {/* 9. Cost Summary */}
                          <div className="p-4 bg-slate-50 dark:bg-[#1c1a16] rounded-xl space-y-3">
                            <h4 className="font-bold text-xs text-slate-500 uppercase">9. Cost Summary</h4>
                            <div className="grid grid-cols-3 gap-4 text-xs">
                              <div className="space-y-1">
                                <Label className="text-xs">Extra Charges</Label>
                                <Input type="number" value={planningForm.extra_charges || ""} onChange={e => setPlanningForm(calculateTotals({...planningForm, extra_charges: parseFloat(e.target.value) || 0}))} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Discount</Label>
                                <Input type="number" value={planningForm.discount || ""} onChange={e => setPlanningForm(calculateTotals({...planningForm, discount: parseFloat(e.target.value) || 0}))} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Tax</Label>
                                <Input type="number" value={planningForm.tax || ""} onChange={e => setPlanningForm(calculateTotals({...planningForm, tax: parseFloat(e.target.value) || 0}))} />
                              </div>
                            </div>

                            <div className="border-t pt-3 flex justify-between items-center text-sm font-black">
                              <span>Final Total:</span>
                              <span>{planningForm.currency} {planningForm.final_total}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3 justify-end">
                            {(planningForm.status === 'approved' || planningForm.status === 'completed') && (
                              <Button type="button" variant="secondary" onClick={() => handleSavePlanningBoard('in_progress')}>
                                Re-open for Editing
                              </Button>
                            )}
                            <Button type="button" variant="outline" onClick={() => handleSavePlanningBoard('in_progress')}>
                              Save Draft
                            </Button>
                            <Button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => handleSavePlanningBoard('submitted_for_approval')}>
                              Submit for Approval
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-12 border-2 border-dashed rounded-2xl border-[var(--border)] text-center text-sm text-slate-400 space-y-3">
                          <Calendar className="w-12 h-12 mx-auto opacity-40 text-indigo-600" />
                          <p className="font-bold text-slate-800 dark:text-[#f6efe4]">Planning Board Locked</p>
                          <p className="max-w-xs mx-auto">You must accept the request first to unlock the planning board.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* INVOICES & PAYMENTS TAB */}
                {activeTab === "payments" && (
                  <div className="space-y-6">
                    {selectedRequest.planning_board?.status === 'approved' ? (
                      <div className="p-6 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl space-y-4">
                        <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-400 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Generate Invoice
                        </h4>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300/80 leading-relaxed">
                          The family has approved the planning board. You can now generate the final invoice of {selectedRequest.planning_board.currency} {selectedRequest.planning_board.final_total}.
                        </p>
                        <Button 
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11"
                          onClick={() => handleSavePlanningBoard('completed')}
                        >
                          Generate Invoice
                        </Button>
                      </div>
                    ) : selectedRequest.planning_board?.status === 'completed' ? (
                      <div className="p-6 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Invoice Generated</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-[#f6efe4] mt-1">
                              {selectedRequest.planning_board.currency} {selectedRequest.planning_board.final_total}
                            </p>
                          </div>
                          <Badge className={selectedRequest.payment_status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}>
                            {selectedRequest.payment_status === "paid" ? "Paid" : "Unpaid"}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 border-2 border-dashed rounded-2xl border-[var(--border)] text-center text-sm text-slate-400 space-y-3">
                        <Clock className="w-12 h-12 mx-auto opacity-40 text-indigo-600" />
                        <p className="font-bold text-slate-800 dark:text-[#f6efe4]">Invoice Locked</p>
                        <p className="max-w-xs mx-auto">The planning board must be approved by the family before you can generate the invoice.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ACTIONS TAB */}
                {activeTab === "actions" && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="font-head text-lg font-bold text-slate-900 dark:text-[#f6efe4]">Manage Request</h3>
                      <p className="text-xs text-slate-500">Perform administrative actions on this request.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedRequest.status === "pending" && (
                        <>
                          <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 font-bold"
                            onClick={() => updateRequestStatus(selectedRequest.id, "accepted")}
                          >
                            <Check className="w-4 h-4 mr-2" /> Accept & Notify Family
                          </Button>
                          <Button
                            variant="outline"
                            className="text-rose-600 border-rose-200 hover:bg-rose-50 h-12 font-bold"
                            onClick={() => updateRequestStatus(selectedRequest.id, "rejected")}
                          >
                            <X className="w-4 h-4 mr-2" /> Decline Request
                          </Button>
                        </>
                      )}

                      {selectedRequest.status === "accepted" && (
                        <>
                          <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 font-bold"
                            onClick={() => updateRequestStatus(selectedRequest.id, "completed")}
                          >
                            <Check className="w-4 h-4 mr-2" /> Mark Completed
                          </Button>
                        </>
                      )}
                    </div>
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
