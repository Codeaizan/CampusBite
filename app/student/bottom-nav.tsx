"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Home, TrendingUp, BarChart2, User } from "lucide-react";

const navItems = [
  { href: "/student/home", label: "Home", icon: Home },
  { href: "/student/trends", label: "Trends", icon: TrendingUp },
  { href: "/student/stats", label: "Stats", icon: BarChart2 },
  { href: "/student/profile", label: "Profile", icon: User },
];

export function StudentBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Prefetch all sibling routes so tab switching is near-instant
  useEffect(() => {
    navItems.forEach((item) => {
      if (!pathname.startsWith(item.href)) {
        router.prefetch(item.href);
      }
    });
  }, [pathname, router]);

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 rounded-t-[2rem]"
      style={{
        background: "rgba(14, 14, 14, 0.95)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 -8px 30px rgba(255, 140, 0, 0.08)",
      }}
    >
      <div className="flex justify-around items-center px-6 pt-3 pb-8 w-full">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center px-4 py-2 transition-all duration-200 active:scale-90 ${
                isActive
                  ? "text-[#FF8C00] bg-[#FF8C00]/10 rounded-2xl"
                  : "text-[#E5E2E1]/40 hover:text-[#FFB77D]"
              }`}
            >
              <Icon
                size={22}
                fill={isActive ? "currentColor" : "none"}
                strokeWidth={isActive ? 0 : 2}
              />
              <span className="text-[10px] font-bold uppercase tracking-widest mt-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

