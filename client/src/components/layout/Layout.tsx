import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { QuantumBackground } from "@/components/ui/QuantumBackground";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
  type?: "public" | "dashboard";
  showSidebar?: boolean;
}

export function Layout({ children, type = "public", showSidebar = true, showBackground = true }: LayoutProps & { showBackground?: boolean }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground relative selection:bg-primary/30">
      {showBackground && <QuantumBackground />}
      <Navbar
        layout={type}
        onMobileSidebarToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        mobileSidebarOpen={mobileSidebarOpen}
      />

      <div className="flex pt-16">
        {type === "dashboard" && showSidebar && (
          <Sidebar
            mobileSidebarOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
          />
        )}

        <main
          className={`flex-1 min-h-[calc(100vh-64px)] ${
            type === "dashboard" && showSidebar ? "md:ml-64 p-6 md:p-8" : "w-full"
          }`}
        >
          {children}
        </main>
      </div>

      <Toaster />
    </div>
  );
}
