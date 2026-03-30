"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Package, BarChart, MessageSquare, TrendingUp, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/kiosk/items", label: "Items", icon: Package },
  { href: "/kiosk/polls", label: "Polls", icon: BarChart },
  { href: "/kiosk/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/kiosk/stats", label: "Stats", icon: TrendingUp },
];

export function KioskShellClient({
  kioskName,
  children,
}: {
  kioskName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface-dim">
      {/* Top Header */}
      <header
        className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4"
        style={{
          background:
            "linear-gradient(to bottom, rgba(14,14,14,1), rgba(14,14,14,0.95))",
          boxShadow: "0 4px 20px rgba(59, 130, 246, 0.08)",
        }}
      >
        <div className="flex items-center gap-3">
          <Store size={22} className="text-blue-500" />
          <div>
            <h1 className="font-bold text-lg tracking-tight text-on-surface leading-tight">
              {kioskName}
            </h1>
            <p className="text-xs text-gray-500 font-medium tracking-wide">
              Dashboard
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-blue-400 font-bold uppercase tracking-widest text-sm hover:bg-blue-500/10 transition-colors px-3 py-1 rounded-lg"
        >
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-[72px] pb-24">{children}</main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 w-full z-50 rounded-t-[2rem]"
        style={{
          background: "rgba(19, 19, 19, 0.9)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(59, 130, 246, 0.1)",
          boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div className="flex justify-around items-center px-4 pb-6 pt-2 w-full">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center p-2 transition-all duration-300 active:scale-95 ${
                  isActive
                    ? "text-blue-500 bg-blue-500/5 rounded-full scale-110"
                    : "text-gray-500 opacity-60 hover:text-blue-400"
                }`}
              >
                <Icon
                  size={22}
                  fill={isActive ? "currentColor" : "none"}
                  strokeWidth={isActive ? 0 : 2}
                />
                <span className="text-[10px] font-medium tracking-[0.05em]">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
