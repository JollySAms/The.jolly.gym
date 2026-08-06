"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { Home, CalendarDays, TrendingUp, LogOut } from "lucide-react";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/sessions", label: "Agenda", icon: CalendarDays },
  { href: "/progression", label: "Progressie", icon: TrendingUp },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const me = useQuery(api.users.getMe, isAuthenticated ? {} : "skip");

  async function handleSignOut() {
    await signOut();
    router.replace("/sign-in");
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/sign-in");
  }, [isLoading, isAuthenticated, router]);

  // Don't render client UI until auth is confirmed
  if (isLoading || !isAuthenticated || me === undefined) return null;

  return (
    <div className="min-h-screen bg-white pb-24">
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
              className={`flex-1 flex flex-col items-center gap-1.5 py-4 text-xs font-medium transition-colors ${
                active ? "text-gray-900" : "text-gray-400"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              {label}
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="flex-1 flex flex-col items-center gap-1.5 py-4 text-xs font-medium text-gray-400 transition-colors"
        >
          <LogOut size={22} strokeWidth={1.5} />
          Uitloggen
        </button>
      </nav>
    </div>
  );
}
