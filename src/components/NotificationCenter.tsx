"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bell, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StrutaNotification } from '@/utils/notifications';

interface NotificationCenterProps {
  notifications: StrutaNotification[];
  onDismiss?: (id: string) => void;
}

export function NotificationCenter({ notifications, onDismiss }: NotificationCenterProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState<string[]>([]);

  useEffect(() => {
    // Show new notifications
    const newIds = notifications.map(n => n.id).filter(id => !visible.includes(id));
    if (newIds.length > 0) {
      setVisible(prev => [...prev, ...newIds]);
      
      // Auto-hide notification after 5 seconds
      const timer = setTimeout(() => {
        setVisible(prev => prev.slice(1));
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notifications, visible]);

  const activeNotifications = notifications.filter(n => visible.includes(n.id)).slice(-3); // Show max 3

  const getIcon = (type: StrutaNotification['type']) => {
    switch (type) {
      case 'payment':
        return <AlertCircle className="w-4 h-4" />;
      case 'request':
        return <Bell className="w-4 h-4" />;
      case 'chat':
        return <Bell className="w-4 h-4" />;
      default:
        return <Check className="w-4 h-4" />;
    }
  };

  const getColor = (type: StrutaNotification['type']) => {
    switch (type) {
      case 'payment':
        return 'bg-blue-500';
      case 'request':
        return 'bg-amber-500';
      case 'chat':
        return 'bg-green-500';
      case 'planning':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleNotificationClick = (notification: StrutaNotification) => {
    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
      case 'chat':
        // Navigate to the relevant request/chat if metadata is available
        if (notification.metadata?.requestId) {
          navigate(`/family/requests?id=${notification.metadata.requestId}`);
        } else if (notification.metadata?.providerId) {
          navigate(`/marketplace`);
        } else {
          navigate(`/family/requests`);
        }
        break;
      case 'request':
        navigate(`/family/requests`);
        break;
      case 'payment':
        navigate(`/family/billing`);
        break;
      case 'planning':
        navigate(`/family/billing`);
        break;
      default:
        break;
    }
    onDismiss?.(notification.id);
  };

  if (activeNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {activeNotifications.map((notification) => (
        <div
          key={notification.id}
          onClick={() => handleNotificationClick(notification)}
          className={cn(
            "animate-in slide-in-from-top-2 fade-in rounded-lg shadow-lg p-4",
            "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700",
            "flex items-start gap-3 cursor-pointer hover:shadow-xl transition-shadow"
          )}
        >
          <div className={cn("mt-1 rounded-full p-1 text-white", getColor(notification.type))}>
            {getIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              {notification.title}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => {
              setVisible(prev => prev.filter(id => id !== notification.id));
              onDismiss?.(notification.id);
            }}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
