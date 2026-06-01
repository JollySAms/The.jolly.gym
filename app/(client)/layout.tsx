"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, TrendingUp } from "lucide-react";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/sessions", label: "Agenda", icon: CalendarDays },
  { href: "/progression", label: "Progressie", icon: TrendingUp },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Page content */}
      {children}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                active ? "text-gray-900" : "text-gray-400"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
