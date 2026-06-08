"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format, parse, addHours } from "date-fns";
import { nl } from "date-fns/locale";
import { X, Clock } from "lucide-react";

type EnrichedSession = {
  _id: Id<"sessions">;
  date: string;
  time: string;
  capacity: number;
  group: { _id: Id<"groups">; name: string; color: string } | null;
  attendanceCount: number;
};

type Props = {
  session: EnrichedSession;
  isTrainer: boolean;
  onClose: () => void;
  onEdit?: () => void;
};

const STATUS_CONFIG = {
  coming:      { label: "Gaat",            className: "text-green-600" },
  cancelled:   { label: "Gaat niet",       className: "text-red-500"   },
  no_response: { label: "Nog geen reactie", className: "text-gray-500"  },
} as const;

export function SessionDetailSheet({ session, onClose, onEdit }: Props) {
  const attendees = useQuery(api.attendance.getSessionWithAttendees, {
    sessionId: session._id,
  });

  const liveCount = attendees
    ? (attendees.members.filter((m) => m?.status === "coming").length +
       attendees.crossGroupComers.length)
    : session.attendanceCount;

  const isFull = liveCount >= session.capacity;
  const spotsLeft = session.capacity - liveCount;

  const startTime = session.time;
  const endTime = format(
    addHours(parse(session.time, "HH:mm", new Date(0)), 1),
    "HH:mm"
  );
  const dateLabel = format(
    parse(session.date, "yyyy-MM-dd", new Date(0)),
    "EEE d/M",
    { locale: nl }
  );

  const color = session.group?.color ?? "#3B82F6";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100 shrink-0">
          <span className="text-sm font-medium text-gray-500">Klas bekijken</span>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Session info card */}
          <div
            className="rounded-xl border-l-4 p-4 bg-gray-50"
            style={{ borderColor: color }}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {session.group?.name ?? "Onbekende groep"}
              </h2>
              <div className="flex flex-col items-end">
                <span
                  className="px-3 py-1 rounded-lg text-white text-sm font-bold"
                  style={{ backgroundColor: isFull ? "#EF4444" : "#22C55E" }}
                >
                  {liveCount} / {session.capacity}
                </span>
                <span className="text-xs text-gray-500 mt-0.5">
                  {spotsLeft} beschikbaar
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <Clock size={14} />
              <span>
                {dateLabel} &nbsp; {startTime} – {endTime}
              </span>
            </div>
          </div>

          {/* Full attendee breakdown */}
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
              <div className="space-y-0.5">
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

                {attendees.members.length === 0 && (
                  <p className="text-sm text-gray-500 py-2">
                    Geen groepsleden gevonden.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Edit button (trainer only) */}
        {onEdit && (
          <div className="px-4 py-4 border-t border-gray-100 shrink-0">
            <button
              onClick={onEdit}
              className="w-full py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Bewerken
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
