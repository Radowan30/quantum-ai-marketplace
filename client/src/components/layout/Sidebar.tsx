import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Settings,
  PlusCircle,
  BarChart3,
  Search,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

// Helper function to extract user initials
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2); // Max 2 letters
};

interface SidebarProps {
  mobileSidebarOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileSidebarOpen = false, onClose }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { userProfile, currentRole, loading } = useAuth();

  // Show loading skeleton if still fetching auth data or if currentRole is unexpectedly null
  if (loading || !currentRole) {
    return (
      <>
        {/* Backdrop for mobile */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onClose}
          />
        )}

        {/* Desktop Skeleton */}
        <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-4rem)] fixed left-0 top-16 border-r border-border bg-background px-4">
          <div className="flex-1 px-2 pt-6 overflow-y-auto">
            <Skeleton className="h-4 w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          </div>
          <div className="px-2 py-4 border-t border-border shrink-0 space-y-3">
            <div className="flex items-center gap-3 px-3 py-2">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </aside>

        {/* Mobile Skeleton */}
        <aside
          className={cn(
            "md:hidden flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-border bg-background px-4 z-50 transition-transform duration-300 ease-in-out",
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="h-16" />
          <div className="flex-1 px-2 pt-6 overflow-y-auto">
            <Skeleton className="h-4 w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          </div>
          <div className="px-2 py-4 border-t border-border shrink-0 space-y-3">
            <div className="flex items-center gap-3 px-3 py-2">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </aside>
      </>
    );
  }

  // At this point, currentRole is guaranteed to be non-null
  const role = currentRole;

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut();
    // Clear localStorage
    localStorage.removeItem("currentRole");
    localStorage.removeItem("rememberMe"); // Clear remember me preference on logout
    localStorage.removeItem("sessionStartTime"); // Clear session start time
    // AuthContext listener will handle redirect to "/"
    setLogoutDialogOpen(false);
    onClose?.(); // Close mobile sidebar
  };

  const handleLinkClick = () => {
    onClose?.(); // Close mobile sidebar when nav link is clicked
  };

  const publisherLinks = [
    { icon: LayoutDashboard, label: "Analytics", href: "/publisher/dashboard" },
    {
      icon: Search,
      label: "Marketplace Preview",
      href: "/marketplace-preview",
    },
    { icon: Package, label: "My Models", href: "/publisher/my-models" },
    { icon: Settings, label: "Settings", href: "/publisher/settings" },
  ];

  const buyerLinks = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/buyer/dashboard" },
    { icon: Search, label: "Browse Marketplace", href: "/marketplace" },
    {
      icon: ShoppingBag,
      label: "My Subscriptions",
      href: "/buyer/my-subscriptions",
    },
    { icon: Settings, label: "Settings", href: "/buyer/settings" },
  ];

  const links = role === "publisher" ? publisherLinks : buyerLinks;

  const sidebarContent = (
    <>
      <div className="flex-1 px-2 pt-6 overflow-y-auto">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
          {role === "publisher" ? "Publisher Portal" : "Buyer Portal"}
        </p>
        <div className="space-y-1">
          {links.map((link) => {
            const isActive =
              location === link.href || location.startsWith(link.href + "/");

            return (
              <Link key={link.href} href={link.href}>
                <a
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <link.icon
                    className={cn(
                      "w-4 h-4",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  {link.label}
                </a>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="px-2 py-4 border-t border-border shrink-0 space-y-3">
        {/* User Info Section */}
        <div className="flex items-center gap-3 px-3 py-2">
          {/* User Initials Circle */}
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">
              {userProfile?.name ? getInitials(userProfile.name) : "U"}
            </span>
          </div>

          {/* User Name and Role Badge */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {userProfile?.name || "User"}
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground rounded-full">
              {role === "publisher" ? "Publisher" : "Buyer"}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
        >
          <LogOut className="w-4 h-4 text-muted-foreground" />
          <span>Logout</span>
        </button>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will be redirected to the
              home page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutConfirm}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  return (
    <>
      {/* Backdrop for mobile */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop Sidebar - Always visible on desktop */}
      <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-4rem)] fixed left-0 top-16 border-r border-border bg-background px-4">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar - Slides in from left */}
      <aside
        className={cn(
          "md:hidden flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-border bg-background px-4 z-50 transition-transform duration-300 ease-in-out",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Add padding top for mobile to account for navbar */}
        <div className="h-16" />
        {sidebarContent}
      </aside>
    </>
  );
}
