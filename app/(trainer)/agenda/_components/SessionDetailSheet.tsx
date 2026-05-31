"use client";

import { useQuery, useMutation } from "convex/react";
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

export function SessionDetailSheet({ session, isTrainer, onClose, onEdit }: Props) {
  const attendees = useQuery(api.attendance.getForSession, { sessionId: session._id });
  const myStatus = useQuery(api.attendance.getMyStatus, { sessionId: session._id });
  const rsvp = useMutation(api.attendance.rsvp);
  const cancelRsvp = useMutation(api.attendance.cancelRsvp);

  // Derive live count from the attendees query so it updates in real-time
  const liveCount = attendees?.length ?? session.attendanceCount;
  const isComing = myStatus?.status === "coming";
  const isFull = liveCount >= session.capacity;
  const spotsLeft = session.capacity - liveCount;

  // Format time range: "09:00" → "09:00 – 10:00"
  const startTime = session.time;
  const endTime = format(
    addHours(parse(session.time, "HH:mm", new Date()), 1),
    "HH:mm"
  );

  // Format date: "2026-05-20" → "Wo 20/5"
  const dateLabel = format(
    parse(session.date, "yyyy-MM-dd", new Date()),
    "EEE d/M",
    { locale: nl }
  );

  const color = session.group?.color ?? "#3B82F6";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-500">Klas bekijken</span>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Session card */}
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

          {/* Attendee list */}
          <div>
            <div className="grid grid-cols-2 border-b border-gray-200 pb-1 mb-1">
              <span className="text-xs font-semibold text-gray-600 underline">Naam</span>
              <span className="text-xs font-semibold text-gray-600 underline">Gemaakt op</span>
            </div>

            {attendees === undefined ? (
              <p className="text-sm text-gray-400 py-2">Laden...</p>
            ) : attendees.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">Nog geen aanmeldingen</p>
            ) : (
              attendees.map((a) => (
                <div key={a._id} className="grid grid-cols-2 py-2 border-b border-gray-50 text-sm">
                  <span className="text-gray-900">{a.userName}</span>
                  <span className="text-gray-500">
                    {format(new Date(a.signedUpAt), "d/M/yyyy HH:mm")}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* RSVP button (clients) or Edit/Cancel (trainer) */}
          {isTrainer ? (
            <div className="flex gap-2 pt-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="flex-1 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Bewerken
                </button>
              )}
            </div>
          ) : (
            <div className="pt-2">
              {isComing ? (
                <button
                  onClick={() => cancelRsvp({ sessionId: session._id })}
                  className="w-full py-3 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Afmelden
                </button>
              ) : (
                <button
                  onClick={() => rsvp({ sessionId: session._id })}
                  disabled={isFull}
                  className="w-full py-3 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: isFull ? "#9CA3AF" : color }}
                >
                  {isFull ? "Vol" : "Reservering toevoegen"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
