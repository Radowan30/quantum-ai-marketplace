import { useState } from "react";
import { Notification, NotificationType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationItem } from "./NotificationItem";

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  currentRole?: "buyer" | "publisher";
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  currentRole = "buyer",
}: NotificationCenterProps) {
  // Filter state differs based on role
  const [filter, setFilter] = useState<
    "all" | "subs" | "discuss" | "ratings" | "model_updates"
  >("all");

  // First, filter notifications by current role
  const roleFilteredNotifications = notifications.filter((notification) => {
    if (currentRole === "publisher") {
      // Publishers only see these notification types
      const publisherNotificationTypes = [
        "new_subscription",
        "collaborator_subscription",
        "new_discussion",
        "new_comment",
        "comment_reply",
        "new_rating",
      ];
      return publisherNotificationTypes.includes(notification.type);
    } else if (currentRole === "buyer") {
      // Buyers only see these notification types
      const buyerNotificationTypes = [
        "comment_reply",
        "model_updated",
        "subscription_success",
      ];
      return buyerNotificationTypes.includes(notification.type);
    }
    return false;
  });

  // Calculate counts based on role-filtered notifications
  const unreadCount = roleFilteredNotifications.filter((n) => !n.isRead).length;

  // Publisher-specific counts
  const subsNotifications = roleFilteredNotifications.filter((n) =>
    ["new_subscription", "collaborator_subscription"].includes(n.type),
  );

  const ratingNotifications = roleFilteredNotifications.filter(
    (n) => n.type === "new_rating",
  );

  // Role-aware discussion notifications
  const discussNotifications =
    currentRole === "publisher"
      ? roleFilteredNotifications.filter((n) =>
          ["new_discussion", "new_comment", "comment_reply"].includes(n.type),
        )
      : roleFilteredNotifications.filter(
          (n) => n.type === "comment_reply", // Buyers only see comment replies
        );

  // Buyer-specific counts
  const modelUpdateNotifications = roleFilteredNotifications.filter(
    (n) => n.type === "model_updated",
  );

  // Then apply Notification tab-specific filtering
  const filteredNotifications = roleFilteredNotifications.filter(
    (notification) => {
      if (filter === "all") return true;

      if (currentRole === "publisher") {
        if (filter === "subs") {
          return ["new_subscription", "collaborator_subscription"].includes(
            notification.type,
          );
        }
        if (filter === "discuss") {
          return ["new_discussion", "new_comment", "comment_reply"].includes(
            notification.type,
          );
        }
        if (filter === "ratings") {
          return notification.type === "new_rating";
        }
      } else if (currentRole === "buyer") {
        if (filter === "discuss") {
          return notification.type === "comment_reply";
        }
        if (filter === "model_updates") {
          return notification.type === "model_updated";
        }
      }

      return false;
    },
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pr-12 border-b">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-lg truncate">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground truncate">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllAsRead}
            className="text-xs flex-shrink-0 ml-2 mr-2"
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Tabs for filtering - Role-specific */}
      <Tabs
        value={filter}
        onValueChange={(value) =>
          setFilter(
            value as "all" | "subs" | "discuss" | "ratings" | "model_updates",
          )
        }
      >
        <TabsList className="w-full justify-start rounded-none border-b h-auto p-0 flex-wrap">
          <TabsTrigger
            value="all"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm px-2 sm:px-4"
          >
            All ({roleFilteredNotifications.length})
          </TabsTrigger>

          {currentRole === "publisher" ? (
            <>
              <TabsTrigger
                value="subs"
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm px-2 sm:px-4"
              >
                Subs ({subsNotifications.length})
              </TabsTrigger>
              <TabsTrigger
                value="discuss"
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm px-2 sm:px-4"
              >
                Discuss ({discussNotifications.length})
              </TabsTrigger>
              <TabsTrigger
                value="ratings"
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm px-2 sm:px-4"
              >
                Ratings ({ratingNotifications.length})
              </TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger
                value="discuss"
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm px-2 sm:px-4"
              >
                Discuss ({discussNotifications.length})
              </TabsTrigger>
              <TabsTrigger
                value="model_updates"
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm px-2 sm:px-4"
              >
                Model Updates ({modelUpdateNotifications.length})
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value={filter} className="m-0">
          <ScrollArea className="h-[60vh] max-h-[500px]">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground px-4">
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
