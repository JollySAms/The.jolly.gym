"use client";

import { useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format, addMonths, subMonths } from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, LogOut } from "lucide-react";
import { SignOutDialog } from "@/components/SignOutDialog";

import { CalendarGrid } from "@/components/CalendarGrid";
import { DaySessionList } from "@/components/DaySessionList";
import { SessionDetailSheet } from "./_components/SessionDetailSheet";
import { AddSessionDialog } from "./_components/AddSessionDialog";
import { EditSessionDialog } from "./_components/EditSessionDialog";

type EnrichedSession = {
  _id: Id<"sessions">;
  date: string;
  time: string;
  groupId: Id<"groups">;
  workoutId?: Id<"workouts">;
  capacity: number;
  group: { _id: Id<"groups">; name: string; color: string } | null;
  attendanceCount: number;
};

export default function AgendaPage() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.getMe, isAuthenticated ? {} : "skip");

  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedSession, setSelectedSession] = useState<EnrichedSession | null>(null);
  const [editingSession, setEditingSession] = useState<EnrichedSession | null>(null);
  const [showAddSession, setShowAddSession] = useState(false);

  // Wait for me to resolve before determining role — prevents trainer seeing client UI during load
  const isTrainer = me !== undefined && me?.role === "trainer";

  const monthSessions = useQuery(
    api.sessions.listByMonth,
    isAuthenticated
      ? { year: currentMonth.getFullYear(), month: currentMonth.getMonth() + 1 }
      : "skip"
  );

  const daySessions = useQuery(
    api.sessions.listByDate,
    isAuthenticated ? { date: format(selectedDate, "yyyy-MM-dd") } : "skip"
  );

  // Show nothing while loading, middleware handles redirect if not authenticated
  if (isLoading || !isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-white max-w-lg mx-auto px-4 py-6">
      {/* Page title with sign-out (mobile only) */}
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">The Jolly Gym agenda</h1>
        <SignOutDialog>
          <button className="md:hidden flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1">
            <LogOut size={14} />
            Uitloggen
          </button>
        </SignOutDialog>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-base font-semibold text-gray-800 capitalize">
          <span className="font-bold">{format(currentMonth, "MMMM", { locale: nl })}</span>{" "}
          {format(currentMonth, "yyyy")}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <ChevronLeft size={18} className="text-blue-600" />
          </button>
          <button
            onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Vandaag
          </button>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <ChevronRight size={18} className="text-blue-600" />
          </button>
        </div>
      </div>

      {/* Calendar */}
      <CalendarGrid
        currentMonth={currentMonth}
        sessions={(monthSessions ?? []) as EnrichedSession[]}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <div className="border-t border-gray-100 my-4" />

      {/* Day session list */}
      <DaySessionList
        date={selectedDate}
        sessions={daySessions as EnrichedSession[] | undefined}
        onSelectSession={setSelectedSession}
      />

      {/* Trainer: Add session button */}
      {isTrainer && (
        <button
          onClick={() => setShowAddSession(true)}
          className="fixed bottom-24 right-6 md:bottom-6 flex items-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Sessie toevoegen
        </button>
      )}

      {/* Session detail sheet */}
      {selectedSession && (
        <SessionDetailSheet
          session={selectedSession}
          isTrainer={isTrainer}
          onClose={() => setSelectedSession(null)}
          onEdit={isTrainer ? () => { setEditingSession(selectedSession); setSelectedSession(null); } : undefined}
        />
      )}

      {/* Edit session dialog (trainer only) */}
      {editingSession && (
        <EditSessionDialog
          session={editingSession}
          onClose={() => setEditingSession(null)}
        />
      )}

      {/* Add session dialog (trainer only) */}
      {showAddSession && (
        <AddSessionDialog
          defaultDate={selectedDate}
          onClose={() => setShowAddSession(false)}
        />
      )}
    </main>
  );
}
