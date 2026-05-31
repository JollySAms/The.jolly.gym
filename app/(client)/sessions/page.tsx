"use client";

import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format, parseISO, isToday, isTomorrow, isThisWeek } from "date-fns";
import { nl } from "date-fns/locale";
import { useState } from "react";
import { ChevronDown, ChevronUp, Dumbbell, Users } from "lucide-react";

type UpcomingSession = {
  _id: Id<"sessions">;
  date: string;
  time: string;
  capacity: number;
  workoutName: string | null;
  attendanceCount: number;
  myStatus: "coming" | "cancelled" | null;
  group: { _id: Id<"groups">; name: string; color: string } | null;
};

function dateLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Vandaag";
  if (isTomorrow(d)) return "Morgen";
  if (isThisWeek(d, { weekStartsOn: 1 }))
    return format(d, "EEEE", { locale: nl });
  return format(d, "d MMMM", { locale: nl });
}

function AttendeeList({ sessionId }: { sessionId: Id<"sessions"> }) {
  const data = useQuery(api.attendance.getSessionWithAttendees, { sessionId });

  if (data === undefined)
    return <p className="text-xs text-gray-400 py-2">Laden…</p>;
  if (!data) return null;

  const { members, crossGroupComers } = data;

  const statusLabel = (status: "coming" | "cancelled" | "no_response") => {
    if (status === "coming") return { text: "Gaat", color: "text-green-600" };
    if (status === "cancelled") return { text: "Gaat niet", color: "text-red-500" };
    return { text: "Nog niet ingeschreven", color: "text-gray-400" };
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
      {members.map((m) => {
        if (!m) return null;
        const { text, color } = statusLabel(m.status);
        return (
          <div key={m.userId} className="flex items-center justify-between">
            <span className="text-xs text-gray-700">{m.name}</span>
            <span className={`text-xs font-medium ${color}`}>{text}</span>
          </div>
        );
      })}

      {crossGroupComers.length > 0 && (
        <>
          <div className="border-t border-gray-100 pt-2 mt-1">
            <p className="text-xs text-gray-400 mb-1.5">Ook aanwezig</p>
            {crossGroupComers.map((c) => (
              <div key={c.userId} className="flex items-center justify-between">
                <span className="text-xs text-gray-700">{c.name}</span>
                <span className="text-xs font-medium text-green-600">Gaat</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SessionCard({ session }: { session: UpcomingSession }) {
  const [expanded, setExpanded] = useState(false);
  const rsvp = useMutation(api.attendance.rsvp);
  const cancelRsvp = useMutation(api.attendance.cancelRsvp);

  const isFull =
    session.attendanceCount >= session.capacity &&
    session.myStatus !== "coming";

  async function handleRsvp(e: React.MouseEvent) {
    e.stopPropagation();
    if (session.myStatus === "coming") {
      await cancelRsvp({ sessionId: session._id });
    } else if (!isFull) {
      await rsvp({ sessionId: session._id });
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      {/* Group color strip */}
      <div
        className="h-1"
        style={{ backgroundColor: session.group?.color ?? "#e5e7eb" }}
      />

      <div
        className="px-4 py-4 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: session info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: session.group?.color ?? "#e5e7eb" }}
              />
              <span className="text-xs font-semibold text-gray-500 truncate">
                {session.group?.name ?? "Onbekende groep"}
              </span>
            </div>

            <p className="text-base font-bold text-gray-900">
              {session.time}
            </p>

            {session.workoutName && (
              <div className="flex items-center gap-1.5 mt-1">
                <Dumbbell size={12} className="text-gray-300 shrink-0" />
                <span className="text-xs text-gray-500 truncate">
                  {session.workoutName}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 mt-1">
              <Users size={12} className="text-gray-300 shrink-0" />
              <span className="text-xs text-gray-400">
                {session.attendanceCount} / {session.capacity}
              </span>
            </div>
          </div>

          {/* Right: RSVP button + expand toggle */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              onClick={handleRsvp}
              disabled={isFull}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                session.myStatus === "coming"
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : isFull
                  ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                  : "bg-gray-900 text-white hover:bg-gray-700"
              }`}
            >
              {session.myStatus === "coming"
                ? "Afmelden"
                : isFull
                ? "Vol"
                : "Inschrijven"}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              className="p-1 text-gray-300 hover:text-gray-500"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {expanded && <AttendeeList sessionId={session._id} />}
      </div>
    </div>
  );
}

export default function ClientSessionsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const me = useQuery(api.users.getMe, isSignedIn ? {} : "skip");
  const sessions = useQuery(
    api.sessions.listUpcoming,
    isSignedIn && me !== undefined ? {} : "skip"
  );

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;

  // Group sessions by date
  const grouped: Record<string, UpcomingSession[]> = {};
  for (const s of sessions ?? []) {
    if (!grouped[s.date]) grouped[s.date] = [];
    grouped[s.date].push(s as UpcomingSession);
  }
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Agenda</h1>

      {sessions === undefined ? (
        // Loading skeleton
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">Geen aankomende sessies.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              {/* Date header */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 capitalize">
                {dateLabel(date)}
                <span className="ml-2 normal-case font-normal">
                  {format(parseISO(date), "d MMM", { locale: nl })}
                </span>
              </p>

              <div className="space-y-3">
                {grouped[date].map((s) => (
                  <SessionCard key={s._id} session={s} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
