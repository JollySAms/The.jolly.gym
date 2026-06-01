"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format, addMonths, subMonths } from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { SessionAttendees } from "./SessionAttendees";

type EnrichedSession = {
  _id: Id<"sessions">;
  date: string;
  time: string;
  groupId: Id<"groups">;
  capacity: number;
  group: { _id: Id<"groups">; name: string; color: string } | null;
  attendanceCount: number;
};

export function SessionsList() {
  const { isSignedIn } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expandedId, setExpandedId] = useState<Id<"sessions"> | null>(null);

  const sessions = useQuery(
    api.sessions.listByMonth,
    isSignedIn
      ? { year: currentMonth.getFullYear(), month: currentMonth.getMonth() + 1 }
      : "skip"
  ) as EnrichedSession[] | undefined;

  const today = format(new Date(), "yyyy-MM-dd");

  // Sort sessions by date asc — upcoming first, past sessions further down
  const sorted = sessions
    ? [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    : undefined;

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-base font-semibold text-gray-800 capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: nl })}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100"
            aria-label="Vorige maand"
          >
            <ChevronLeft size={18} className="text-blue-600" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Nu
          </button>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100"
            aria-label="Volgende maand"
          >
            <ChevronRight size={18} className="text-blue-600" />
          </button>
        </div>
      </div>

      {/* Sessions list */}
      {sorted === undefined && (
        <p className="text-sm text-gray-400">Laden...</p>
      )}

      {sorted && sorted.length === 0 && (
        <p className="text-sm text-gray-400 italic">Geen sessies deze maand</p>
      )}

      {sorted && sorted.length > 0 && (
        <ul className="space-y-2">
          {sorted.map((session) => {
            const isPast = session.date <= today;
            const isExpanded = expandedId === session._id;
            const dateObj = new Date(session.date + "T00:00:00");
            const dayLabel = format(dateObj, "EEE d MMM", { locale: nl });

            return (
              <li key={session._id} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : session._id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  {/* Date */}
                  <span className={`text-sm font-medium w-28 shrink-0 capitalize ${isPast ? "text-gray-700" : "text-gray-400"}`}>
                    {dayLabel}
                  </span>

                  {/* Time */}
                  <span className={`text-sm w-12 shrink-0 ${isPast ? "text-gray-600" : "text-gray-400"}`}>
                    {session.time}
                  </span>

                  {/* Group badge */}
                  {session.group && (
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full text-white shrink-0"
                      style={{ backgroundColor: session.group.color }}
                    >
                      {session.group.name}
                    </span>
                  )}

                  {/* Attendance count */}
                  <span className={`ml-auto text-sm font-semibold ${isPast ? "text-gray-800" : "text-gray-400"}`}>
                    {session.attendanceCount}/{session.capacity}
                  </span>

                  {/* Expand icon */}
                  <span className="ml-2 text-gray-400 shrink-0">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </button>

                {/* Expanded attendee list */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50">
                    <SessionAttendees sessionId={session._id} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
