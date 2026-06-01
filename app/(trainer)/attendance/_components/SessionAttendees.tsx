"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type Props = {
  sessionId: Id<"sessions">;
};

type Attendee = {
  name: string | null | undefined;
  status: "coming" | "cancelled" | "no_response";
  isGroupMember: boolean;
};

export function SessionAttendees({ sessionId }: Props) {
  const data = useQuery(api.attendance.getSessionWithAttendees, { sessionId });

  if (data === undefined) {
    return <p className="text-sm text-gray-400 py-2">Laden...</p>;
  }
  if (!data) {
    return <p className="text-sm text-gray-400 py-2">Niet gevonden</p>;
  }

  const all: Attendee[] = [
    ...(data.members ?? []).filter((m): m is NonNullable<typeof m> => m !== null),
    ...(data.crossGroupComers ?? []).map((c) => ({ ...c, isGroupMember: false })),
  ];

  if (all.length === 0) {
    return <p className="text-sm text-gray-400 py-2 italic">Nog niemand aangemeld</p>;
  }

  return (
    <ul className="mt-2 space-y-1">
      {all.map((m, i) => (
        <li key={i} className="flex items-center justify-between text-sm">
          <span className="text-gray-700">
            {m.name ?? "Onbekend"}
            {!m.isGroupMember && (
              <span className="ml-1.5 text-xs text-gray-400">(gast)</span>
            )}
          </span>
          {m.status === "coming" && (
            <span className="text-green-600 font-medium">Komt</span>
          )}
          {m.status === "cancelled" && (
            <span className="text-red-500 font-medium">Afgemeld</span>
          )}
          {m.status === "no_response" && (
            <span className="text-gray-400">–</span>
          )}
        </li>
      ))}
    </ul>
  );
}
