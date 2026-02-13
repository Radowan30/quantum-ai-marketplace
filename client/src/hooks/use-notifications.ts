import { useState, useEffect, useCallback } from "react";
import { Notification } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

export function useNotifications() {
  const { user } = useAuth();

  // Initialize with empty array, will be populated from database
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch notifications from database and subscribe to realtime updates
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform to match expected format
        const transformed = data?.map(n => ({
          id: n.id,
          userId: n.user_id,
          type: n.notification_type,
          title: n.title,
          message: n.message,
          createdAt: n.created_at,
          isRead: n.is_read,
          relatedModelId: n.related_model_id,
          relatedModelName: n.related_model_name,
          relatedDiscussionId: n.related_discussion_id,
          metadata: n.metadata
        })) || [];

        setNotifications(transformed);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();

    // Subscribe to realtime updates
    if (user?.id) {
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Notification change:', payload);

            if (payload.eventType === 'INSERT') {
              const newNotif = payload.new;
              setNotifications((prev) => [{
                id: newNotif.id,
                userId: newNotif.user_id,
                type: newNotif.notification_type,
                title: newNotif.title,
                message: newNotif.message,
                createdAt: newNotif.created_at,
                isRead: newNotif.is_read,
                relatedModelId: newNotif.related_model_id,
                relatedModelName: newNotif.related_model_name,
                relatedDiscussionId: newNotif.related_discussion_id,
                metadata: newNotif.metadata
              }, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedNotif = payload.new;
              setNotifications((prev) =>
                prev.map((n) =>
                  n.id === updatedNotif.id
                    ? {
                        ...n,
                        isRead: updatedNotif.is_read,
                      }
                    : n
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setNotifications((prev) =>
                prev.filter((n) => n.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mark a single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Update in database
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Update all in database
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
