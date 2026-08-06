"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { STATUS_CONFIG, STATUS_CYCLE } from "@/lib/attendanceStatus";

type Props = {
  sessionId: Id<"sessions">;
};

type Attendee = {
  userId: string;
  name: string | null | undefined;
  status: "coming" | "cancelled" | "no_response";
  isGroupMember: boolean;
};

export function SessionAttendees({ sessionId }: Props) {
  const data = useQuery(api.attendance.getSessionWithAttendees, { sessionId });
  const setAttendance = useMutation(api.attendance.trainerSetAttendance);

  if (data === undefined) {
    return <p className="text-sm text-gray-500 py-2">Laden...</p>;
  }
  if (!data) {
    return <p className="text-sm text-gray-500 py-2">Niet gevonden</p>;
  }

  const all: Attendee[] = [
    ...(data.members ?? []).filter((m): m is NonNullable<typeof m> => m !== null),
    ...(data.crossGroupComers ?? []).map((c) => ({ ...c, isGroupMember: false })),
  ];

  if (all.length === 0) {
    return <p className="text-sm text-gray-500 py-2 italic">Nog niemand aangemeld</p>;
  }

  function handleToggle(userId: string, currentStatus: Attendee["status"]) {
    const nextStatus = STATUS_CYCLE[currentStatus];
    setAttendance({ sessionId, userId: userId as Id<"users">, status: nextStatus });
  }

  return (
    <ul className="mt-2 space-y-1">
      {all.map((m) => {
        const cfg = STATUS_CONFIG[m.status];
        return (
          <li key={m.userId} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">
              {m.name ?? "Onbekend"}
              {!m.isGroupMember && (
                <span className="ml-1.5 text-xs text-gray-500">(gast)</span>
              )}
            </span>
            <button
              onClick={() => handleToggle(m.userId, m.status)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              {cfg.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
