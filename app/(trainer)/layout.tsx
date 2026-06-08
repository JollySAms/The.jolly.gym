"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CalendarDays, Users, Dumbbell, ClipboardList, TrendingUp } from "lucide-react";

const navItems = [
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/groups", label: "Groepen", icon: Users },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/attendance", label: "Aanwezigheid", icon: ClipboardList },
  { href: "/client-progress", label: "Progressie", icon: TrendingUp },
];

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const me = useQuery(api.users.getMe, isSignedIn ? {} : "skip");

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/sign-in");
    if (me !== undefined && me !== null && me.role !== "trainer") router.replace("/");
  }, [isLoaded, isSignedIn, me, router]);

  // Don't render trainer UI until role is confirmed
  if (!isLoaded || !isSignedIn || me === undefined || me === null || me.role !== "trainer") return null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-gray-100 px-4 py-6 shrink-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6 px-2">
          The Jolly Gym
        </p>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Page content */}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 flex">
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
