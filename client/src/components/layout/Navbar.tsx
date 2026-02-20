import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Bell } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { NotificationCenter } from "@/components/NotificationCenter";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface NavbarProps {
  layout?: "public" | "dashboard";
  onMobileSidebarToggle?: () => void;
  mobileSidebarOpen?: boolean;
}

export function Navbar({ layout = "public", onMobileSidebarToggle, mobileSidebarOpen = false }: NavbarProps) {

  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);

  const { currentRole } = useAuth();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  // Calculate role-filtered unread count
  const roleFilteredUnreadCount = notifications.filter((n) => {
    if (!n.isRead) {
      if (currentRole === 'publisher') {
        return ["new_subscription", "collaborator_subscription", "new_discussion", "new_comment", "comment_reply", "new_rating"].includes(n.type);
      } else if (currentRole === 'buyer') {
        return ["comment_reply", "model_updated", "subscription_success"].includes(n.type);
      }
    }
    return false;
  }).length;



  const isDashboard = layout === "dashboard";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-md backdrop-saturate-150 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.05)]"
    >
      <div className={`${isDashboard ? "px-4 md:px-6" : "container mx-auto px-6"} h-16 md:h-16 flex items-center justify-between py-2 md:py-0`}>
        {/* Hamburger Menu - Left side on mobile for dashboard */}
        {isDashboard && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileSidebarToggle}
            className="md:hidden flex-shrink-0"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        )}

        {/* Brand - Center on mobile, Left on desktop */}
        <div
          className={`flex items-center gap-3 cursor-pointer ${
            isDashboard
              ? "md:order-first absolute left-1/2 -translate-x-1/2 md:relative md:left-auto md:translate-x-0"
              : ""
          }`}
          onClick={() => {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new HashChangeEvent('hashchange'));
            setLocation("/");
          }}
        >
          {/* Mobile Layout - Vertical stacking */}
          <div className="flex flex-col items-center gap-1 md:hidden py-1">
            <div className="w-5 h-5 bg-primary rounded-md flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-xs tracking-tighter">M</span>
            </div>
            <span className="font-heading font-bold text-[9px] leading-none text-foreground neon-text">
              MIMOS
            </span>
            <span className="text-[6px] tracking-wider uppercase opacity-70 text-muted-foreground leading-none">
              Quantum AI
            </span>
          </div>

          {/* Desktop Layout - Horizontal */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-bold text-xl tracking-tighter">M</span>
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold leading-none text-foreground neon-text">
                MIMOS
              </span>
              <span className="text-[10px] tracking-wider uppercase opacity-70 text-muted-foreground">
                Quantum AI
              </span>
            </div>
          </div>
        </div>

        {/* Notification Bell - Right side on mobile/tablet */}
        {isDashboard && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotificationDialogOpen(true)}
            className="md:hidden relative flex-shrink-0"
          >
            <Bell className="w-4 h-4" />
            {roleFilteredUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {roleFilteredUnreadCount > 9 ? '9+' : roleFilteredUnreadCount}
              </span>
            )}
          </Button>
        )}

        {/* Desktop Nav - Public */}
        {!isDashboard && (
          <div className="hidden md:flex items-center gap-8">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new HashChangeEvent('hashchange'));
              }}
              className="text-sm font-medium hover:text-primary transition-colors cursor-pointer"
            >
              Home
            </a>
            <a href="/#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <Link href="/about">
              <a className="text-sm font-medium hover:text-primary transition-colors">About Us</a>
            </Link>
            <Link href="/auth">
              <Button variant="default" size="sm">
                Login / Register
              </Button>
            </Link>
          </div>
        )}

        {/* Desktop Nav - Dashboard */}
        {isDashboard && (
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotificationDialogOpen(true)}
              className="text-muted-foreground hover:text-primary relative"
            >
              <Bell className="w-5 h-5" />
              {roleFilteredUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {roleFilteredUnreadCount > 9 ? '9+' : roleFilteredUnreadCount}
                </span>
              )}
            </Button>
          </div>
        )}

        {/* Mobile Toggle - Public only */}
        {!isDashboard && (
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Menu - Public only */}
      {!isDashboard && mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b p-4 shadow-lg flex flex-col gap-4 animate-in slide-in-from-top-2">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              window.history.pushState({}, '', '/');
              window.dispatchEvent(new HashChangeEvent('hashchange'));
            }}
            className="text-sm font-medium py-2 cursor-pointer"
          >
            Home
          </a>
          <a href="/#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium py-2">
            Features
          </a>
          <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
            <a className="text-sm font-medium py-2">About Us</a>
          </Link>
          <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
            <Button className="w-full">Login</Button>
          </Link>
        </div>
      )}

      {/* Notification Dialog */}
      {isDashboard && (
        <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px] p-0 gap-0">
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              currentRole={currentRole as 'buyer' | 'publisher'}
            />
          </DialogContent>
        </Dialog>
      )}
    </nav>
  );
}
