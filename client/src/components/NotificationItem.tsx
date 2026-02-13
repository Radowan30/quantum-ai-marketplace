import { Notification } from "@/lib/types";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import {
  UserPlus,
  MessageSquare,
  Star,
  CheckCircle,
  MessageCircle,
  RefreshCw,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (notificationId: string) => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const [, setLocation] = useLocation();

  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case "new_subscription":
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case "new_discussion":
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case "new_rating":
        return <Star className="w-5 h-5 text-yellow-500" />;
      case "subscription_success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "comment_reply":
        return <MessageCircle className="w-5 h-5 text-indigo-500" />;
      case "model_updated":
        return <RefreshCw className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Handle notification click
  const handleClick = () => {
    // Mark as read
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }

    // Navigate to related resource
    if (notification.relatedModelId) {
      setLocation(`/model/${notification.relatedModelId}`);
    }
  };

  // Format timestamp
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        "p-4 hover:bg-accent/50 cursor-pointer transition-colors",
        !notification.isRead && "bg-accent/20"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                "text-sm font-medium line-clamp-2",
                !notification.isRead && "font-semibold"
              )}
            >
              {notification.title}
            </h4>
            {!notification.isRead && (
              <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="whitespace-nowrap">{timeAgo}</span>
            {notification.relatedModelName && (
              <>
                <span>•</span>
                <span className="truncate min-w-0">{notification.relatedModelName}</span>
              </>
            )}
          </div>

          {/* Additional metadata based on type */}
          {notification.metadata && (
            <div className="mt-2 text-xs text-muted-foreground break-words">
              {notification.type === "new_subscription" &&
                notification.metadata.subscriberEmail && (
                  <span className="truncate block">from {notification.metadata.subscriberEmail}</span>
                )}
              {notification.type === "new_rating" &&
                notification.metadata.oldRating !== undefined &&
                notification.metadata.newRating !== undefined && (
                  <span className="whitespace-nowrap">
                    {notification.metadata.oldRating.toFixed(1)} → {notification.metadata.newRating.toFixed(1)} stars
                  </span>
                )}
              {notification.type === "model_updated" &&
                notification.metadata.updatedFields && (
                  <span className="line-clamp-2">
                    Updated: {notification.metadata.updatedFields.join(", ")}
                  </span>
                )}
              {notification.type === "comment_reply" &&
                notification.metadata.replyAuthor && (
                  <span className="truncate block">Reply from {notification.metadata.replyAuthor}</span>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Mark as read button (only show if unread) */}
      {!notification.isRead && (
        <div className="mt-2 ml-8">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
          >
            Mark as read
          </Button>
        </div>
      )}
    </div>
  );
}
