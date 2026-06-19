"use client";

import { useQuery, useMutation } from "convex/react";
import { useState, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format, parse, addHours } from "date-fns";
import { nl } from "date-fns/locale";
import { X, Dumbbell, ClipboardList } from "lucide-react";
import { WorkoutLogSheet } from "./WorkoutLogSheet";
import { toast } from "sonner";

type SessionData = {
  _id: Id<"sessions">;
  date: string;
  time: string;
  capacity: number;
  workoutName: string | null;
  workoutSnapshot?: { exerciseId: Id<"exercises">; name: string; sets: number }[];
  attendanceCount: number;
  myStatus: "coming" | "cancelled" | null;
  group: { _id: Id<"groups">; name: string; color: string } | null;
  isGroupMember: boolean;
};

type Props = {
  session: SessionData;
  onClose: () => void;
};

const STATUS_CONFIG = {
  coming:      { label: "Gaat",                 className: "text-green-600" },
  cancelled:   { label: "Gaat niet",            className: "text-red-500"   },
  no_response: { label: "Nog geen reactie",     className: "text-gray-500"  },
} as const;

export function ClientSessionDetailSheet({ session, onClose }: Props) {
  const attendees = useQuery(api.attendance.getSessionWithAttendees, {
    sessionId: session._id,
  });
  const rsvp = useMutation(api.attendance.rsvp);
  const markAbsent = useMutation(api.attendance.markAbsent);
  const undoAbsent = useMutation(api.attendance.undoAbsent);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [absentLoading, setAbsentLoading] = useState(false);
  const [showLog, setShowLog] = useState(false);
  // Optimistic local status so the button updates instantly after RSVP
  const [localStatus, setLocalStatus] = useState(session.myStatus);
  useEffect(() => { setLocalStatus(session.myStatus); }, [session.myStatus]);

  const color = session.group?.color ?? "#3B82F6";

  // Derive attendance count and isFull from the live attendees query so the
  // button state updates if the session fills up while this sheet is open.
  const liveAttendanceCount = attendees != null
    ? attendees.members.filter((m) => m?.status === "coming").length + attendees.crossGroupComers.length
    : session.attendanceCount;
  const isFull = liveAttendanceCount >= session.capacity && localStatus !== "coming";

  const startTime = session.time;
  const endTime = format(
    addHours(parse(session.time, "HH:mm", new Date(0)), 1),
    "HH:mm"
  );
  const dateLabel = format(
    parse(session.date, "yyyy-MM-dd", new Date(0)),
    "EEEE d MMMM",
    { locale: nl }
  );

  async function handleRsvp() {
    if (rsvpLoading || localStatus === "coming") return;
    setRsvpLoading(true);
    const previousStatus = localStatus;
    try {
      setLocalStatus("coming");
      await rsvp({ sessionId: session._id });
      toast.success("Je bent ingeschreven!");
    } catch {
      setLocalStatus(previousStatus);
      toast.error("Dat lukte niet. Probeer het opnieuw.");
    } finally {
      setRsvpLoading(false);
    }
  }

  async function handleMarkAbsent() {
    if (absentLoading) return;
    setAbsentLoading(true);
    const previousStatus = localStatus;
    try {
      setLocalStatus("cancelled");
      await markAbsent({ sessionId: session._id });
    } catch {
      setLocalStatus(previousStatus);
      toast.error("Dat lukte niet. Probeer het opnieuw.");
    } finally {
      setAbsentLoading(false);
    }
  }

  async function handleUndoAbsent() {
    if (absentLoading) return;
    setAbsentLoading(true);
    const previousStatus = localStatus;
    try {
      setLocalStatus(null);
      await undoAbsent({ sessionId: session._id });
    } catch {
      setLocalStatus(previousStatus);
      toast.error("Dat lukte niet. Probeer het opnieuw.");
    } finally {
      setAbsentLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Colored top strip */}
        <div className="h-1 shrink-0" style={{ backgroundColor: color }} />

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
              {session.group?.name ?? "Sessie"}
            </p>
            <p className="text-base font-bold text-gray-900 capitalize">{dateLabel}</p>
            <p className="text-sm text-gray-500">
              {startTime} – {endTime} &nbsp;·&nbsp; {liveAttendanceCount}/{session.capacity}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 shrink-0">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-5">

          {/* Workout */}
          {session.workoutName && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell size={14} className="text-gray-400" />
                <p className="text-sm font-semibold text-gray-700">{session.workoutName}</p>
              </div>
              {session.workoutSnapshot && session.workoutSnapshot.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {session.workoutSnapshot.map((ex) => (
                    <span
                      key={ex.exerciseId}
                      className="text-xs bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1 text-gray-600"
                    >
                      {ex.name} · {ex.sets}×
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attendee breakdown */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Deelnemers
            </p>

            {attendees === undefined ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : !attendees ? (
              <p className="text-sm text-gray-500 py-2">Sessie niet gevonden.</p>
            ) : (
              <div className="space-y-1">
                {/* Group members */}
                {attendees.members.map((m) => {
                  if (!m) return null;
                  const cfg = STATUS_CONFIG[m.status];
                  return (
                    <div
                      key={m.userId}
                      className="flex items-center justify-between py-2 border-b border-gray-50"
                    >
                      <span className="text-sm text-gray-800">{m.name}</span>
                      <span className={`text-xs font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}

                {/* Cross-group comers */}
                {attendees.crossGroupComers.length > 0 && (
                  <>
                    <p className="text-xs text-gray-500 pt-3 pb-1">Ook aanwezig</p>
                    {attendees.crossGroupComers.map((c) => (
                      <div
                        key={c.userId}
                        className="flex items-center justify-between py-2 border-b border-gray-50"
                      >
                        <span className="text-sm text-gray-800">{c.name}</span>
                        <span className="text-xs font-medium text-green-600">Gaat</span>
                      </div>
                    ))}
                  </>
                )}

                {attendees.members.length === 0 && attendees.crossGroupComers.length === 0 && (
                  <p className="text-sm text-gray-500 py-2">Geen groepsleden gevonden.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons — pinned to bottom */}
        <div className="px-4 py-4 border-t border-gray-100 shrink-0 space-y-2">
          {session.workoutSnapshot && session.workoutSnapshot.length > 0 && (
            <button
              onClick={() => setShowLog(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <ClipboardList size={15} />
              Workout loggen
            </button>
          )}

          {/* Inschrijven: turns green when signed up, disabled when already coming */}
          <button
            onClick={handleRsvp}
            disabled={isFull || rsvpLoading || localStatus === "coming"}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:cursor-default ${
              isFull
                ? "bg-gray-50 text-gray-300"
                : localStatus === "coming"
                ? "bg-green-500 text-white"
                : "bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50"
            }`}
          >
            {rsvpLoading ? "..." : isFull ? "Sessie is vol" : localStatus === "coming" ? "Ingeschreven ✓" : "Inschrijven"}
          </button>

          {/* Niet aanwezig: only shown to own-group members */}
          {session.isGroupMember && (
            <button
              onClick={localStatus === "cancelled" ? handleUndoAbsent : handleMarkAbsent}
              disabled={absentLoading}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                localStatus === "cancelled"
                  ? "bg-red-50 text-red-500 hover:bg-red-100"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {absentLoading ? "..." : localStatus === "cancelled" ? "Niet aanwezig ✓" : "Niet aanwezig"}
            </button>
          )}
        </div>
      </div>

      {showLog && session.workoutSnapshot && (
        <WorkoutLogSheet
          sessionId={session._id}
          workoutName={session.workoutName}
          workoutSnapshot={session.workoutSnapshot}
          onClose={() => setShowLog(false)}
        />
      )}
    </div>
  );
}
