"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Store,
  MessageSquare,
  BarChart,
  Settings,
  LogOut,
  Utensils,
  Map,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/admin/kiosks", label: "Kiosks", icon: Store },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/polls", label: "Polls", icon: BarChart },
  { href: "/admin/live", label: "Live Map", icon: Map },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// Map route to page title
const pageTitles: Record<string, string> = {
  "/admin/kiosks": "Manage Kiosks",
  "/admin/feedback": "Global Feedback",
  "/admin/polls": "Poll Manager",
  "/admin/live": "Real-time Map",
  "/admin/settings": "Settings",
};

export function AdminShellClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Prefetch all admin routes for instant sidebar switching
  useEffect(() => {
    navItems.forEach((item) => {
      if (!pathname.startsWith(item.href)) {
        router.prefetch(item.href);
      }
    });
  }, [pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const currentTitle =
    pageTitles[pathname] || "Super Admin — CampusBite";

  return (
    <div className="flex min-h-screen bg-surface-dim">
      {/* Fixed Left Sidebar */}
      <aside
        className="h-screen w-64 fixed left-0 top-0 overflow-y-auto z-50"
        style={{
          backgroundColor: "#0E0E0E",
          boxShadow: "0 0 20px rgba(255, 140, 0, 0.08)",
        }}
      >
        <div className="flex flex-col h-full py-6">
          {/* Branding */}
          <div className="px-6 mb-10">
            <div className="flex items-center gap-2">
              <Utensils size={22} className="text-[#FF8C00]" />
              <h1 className="text-xl font-bold text-[#FF8C00] tracking-tighter">
                CampusBite
              </h1>
            </div>
            <p className="text-neutral-500 text-xs mt-1 uppercase tracking-widest font-semibold">
              Super Admin
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-6 py-3 font-medium transition-all active:scale-95 ${
                    isActive
                      ? "bg-orange-500/10 text-orange-500 border-r-4 border-orange-500"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Card + Logout */}
          <div className="px-6 mt-auto space-y-4">
            <div className="p-4 rounded-xl bg-surface-container" style={{ border: "1px solid rgba(86, 67, 52, 0.1)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-surface-dim font-bold text-sm">
                  SA
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">
                    CampusBite
                  </p>
                  <p className="text-[10px] text-neutral-500">Root Access</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="ml-64 flex-1 min-h-screen">
        {/* Top Header Bar */}
        <header
          className="fixed top-0 right-0 left-64 h-16 z-40 flex justify-between items-center px-8"
          style={{
            background: "rgba(19, 19, 19, 0.8)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderBottom: "1px solid rgba(86, 67, 52, 0.15)",
          }}
        >
          <span className="text-on-surface font-black tracking-tighter text-lg">
            {currentTitle}
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 rounded-full text-sm font-bold text-on-surface hover:bg-surface-bright/40 transition-all"
            style={{
              background: "rgba(58, 57, 57, 0.2)",
              border: "1px solid rgba(86, 67, 52, 0.3)",
            }}
          >
            Logout
          </button>
        </header>

        {/* Page Content */}
        <main className="pt-24 pb-12 px-8">{children}</main>
      </div>
    </div>
  );
}
