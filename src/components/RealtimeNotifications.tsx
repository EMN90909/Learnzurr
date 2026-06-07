"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { NotificationCenter } from "@/components/NotificationCenter";
import { deleteNotification, getNotifications, requestNotificationPermission, type StrutaNotification } from "@/utils/notifications";
import { supabase } from "@/integrations/supabase/client";
import { mapProfileRoleToPushRole } from "@/lib/push-role";

const getUserId = (profile: any, user: any) => profile?.user_id || profile?.id || user?.id || "";

export default function RealtimeNotifications() {
  const { profile, user } = useAuth();
  const userId = getUserId(profile, user);
  const [notifications, setNotifications] = useState<StrutaNotification[]>([]);
  const refreshInFlight = useRef(false);

  const refresh = async () => {
    if (!userId || refreshInFlight.current) return;
    refreshInFlight.current = true;
    try {
      setNotifications(await getNotifications(userId));
    } finally {
      refreshInFlight.current = false;
    }
  };

  useEffect(() => {
    if (!userId) return;
    void refresh();
    const role = mapProfileRoleToPushRole(profile?.role, profile?.staff_business_type || profile?.organization_type);
    if (role && "Notification" in window && Notification.permission === "default") void requestNotificationPermission(userId, role);

    const refreshSoon = () => window.setTimeout(() => void refresh(), 120);
    const channel = supabase
      .channel(`notifications-fast-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, refreshSoon)
      .subscribe();

    const storageHandler = (event: StorageEvent) => {
      if (!event.key || event.key === `struta_local_notifications_${userId}`) void refresh();
    };
    const customHandler = () => void refresh();
    const poll = window.setInterval(() => void refresh(), 5000);

    window.addEventListener("storage", storageHandler);
    window.addEventListener("struta_notifications_updated", customHandler);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener("storage", storageHandler);
      window.removeEventListener("struta_notifications_updated", customHandler);
      void supabase.removeChannel(channel);
    };
  }, [userId, profile?.role, profile?.staff_business_type, profile?.organization_type]);

  const handleDismiss = async (id: string) => {
    if (!userId) return;
    await deleteNotification(userId, id);
    setNotifications((current) => current.filter((item) => item.id !== id));
  };

  return <NotificationCenter notifications={notifications} onDismiss={handleDismiss} />;
}
