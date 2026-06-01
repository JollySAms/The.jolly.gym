"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format, addMonths, subMonths } from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";

import { CalendarGrid } from "@/components/CalendarGrid";
import { DaySessionList } from "@/components/DaySessionList";
import { ClientSessionDetailSheet } from "@/app/(client)/_components/ClientSessionDetailSheet";

// The shape coming from listUpcoming — includes myStatus and workoutName
type UpcomingSession = {
  _id: Id<"sessions">;
  date: string;
  time: string;
  groupId: Id<"groups">;
  capacity: number;
  workoutName: string | null;
  workoutSnapshot?: { exerciseId: Id<"exercises">; name: string; sets: number }[];
  attendanceCount: number;
  myStatus: "coming" | "cancelled" | null;
  group: { _id: Id<"groups">; name: string; color: string } | null;
};

export default function ClientAgendaPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedSession, setSelectedSession] = useState<UpcomingSession | null>(null);

  // Calendar dots — all sessions for the month
  const monthSessions = useQuery(
    api.sessions.listByMonth,
    isSignedIn
      ? { year: currentMonth.getFullYear(), month: currentMonth.getMonth() + 1 }
      : "skip"
  );

  // All upcoming sessions — filtered to selected date for the day list
  const allUpcoming = useQuery(
    api.sessions.listUpcoming,
    isSignedIn ? {} : "skip"
  );

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const sessionsForDay = (allUpcoming ?? []).filter(
    (s) => s.date === selectedDateStr
  ) as UpcomingSession[];

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Agenda</h1>

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
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <button
            onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}
            className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700"
          >
            Vandaag
          </button>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <ChevronRight size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Calendar grid — dots for all sessions */}
      <CalendarGrid
        currentMonth={currentMonth}
        sessions={monthSessions ?? []}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <div className="border-t border-gray-100 my-4" />

      {/* Sessions for selected day */}
      <DaySessionList
        date={selectedDate}
        sessions={sessionsForDay}
        onSelectSession={(s) => setSelectedSession(s as unknown as UpcomingSession)}
      />

      {/* Detail sheet */}
      {selectedSession && (
        <ClientSessionDetailSheet
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
