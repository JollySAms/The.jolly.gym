"use client";

import { useState, useEffect } from "react";
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
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [expandedId, setExpandedId] = useState<Id<"sessions"> | null>(null);
  const [today, setToday] = useState<string>("");

  useEffect(() => {
    setToday(format(new Date(), "yyyy-MM-dd"));
  }, []);

  const sessions = useQuery(
    api.sessions.listByMonth,
    isSignedIn
      ? { year: currentMonth.getFullYear(), month: currentMonth.getMonth() + 1 }
      : "skip"
  ) as EnrichedSession[] | undefined;

  const upcoming = sessions
    ? [...sessions]
        .filter((s) => s.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    : undefined;

  const past = sessions
    ? [...sessions]
        .filter((s) => s.date < today)
        .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
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
      {upcoming === undefined && (
        <p className="text-sm text-gray-400">Laden...</p>
      )}

      {upcoming && past && upcoming.length === 0 && past.length === 0 && (
        <p className="text-sm text-gray-400 italic">Geen sessies deze maand</p>
      )}

      {upcoming && past && (upcoming.length > 0 || past.length > 0) && (
        <div className="space-y-2">
          {/* Upcoming sessions — full color */}
          {upcoming.map((session) => (
            <SessionRow
              key={session._id}
              session={session}
              isPast={false}
              isExpanded={expandedId === session._id}
              onToggle={() => setExpandedId(expandedId === session._id ? null : session._id)}
            />
          ))}

          {/* Divider */}
          {past.length > 0 && (
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider shrink-0">
                Verleden
              </span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
          )}

          {/* Past sessions — faded, most recent first */}
          {past.map((session) => (
            <SessionRow
              key={session._id}
              session={session}
              isPast={true}
              isExpanded={expandedId === session._id}
              onToggle={() => setExpandedId(expandedId === session._id ? null : session._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type SessionRowProps = {
  session: EnrichedSession;
  isPast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
};

function SessionRow({ session, isPast, isExpanded, onToggle }: SessionRowProps) {
  const dateObj = new Date(session.date + "T00:00:00");
  const dayLabel = format(dateObj, "EEE d MMM", { locale: nl });

  return (
    <div className={`border rounded-xl overflow-hidden ${isPast ? "border-gray-100" : "border-gray-200"}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Date */}
        <span className={`text-sm font-medium w-28 shrink-0 capitalize ${isPast ? "text-gray-400" : "text-gray-900"}`}>
          {dayLabel}
        </span>

        {/* Time */}
        <span className={`text-sm w-12 shrink-0 ${isPast ? "text-gray-400" : "text-gray-700"}`}>
          {session.time}
        </span>

        {/* Group badge */}
        {session.group && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${isPast ? "text-white opacity-40" : "text-white"}`}
            style={{ backgroundColor: session.group.color }}
          >
            {session.group.name}
          </span>
        )}

        {/* Attendance count */}
        <span className={`ml-auto text-sm font-semibold ${isPast ? "text-gray-400" : "text-gray-900"}`}>
          {session.attendanceCount}/{session.capacity}
        </span>

        {/* Expand icon */}
        <span className="ml-2 text-gray-400 shrink-0">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <SessionAttendees sessionId={session._id} />
        </div>
      )}
    </div>
  );
}
