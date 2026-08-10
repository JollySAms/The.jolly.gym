"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";

export function ClientOverview() {
  const { isAuthenticated } = useConvexAuth();

  const overview = useQuery(
    api.attendance.getClientAttendanceOverview,
    isAuthenticated ? {} : "skip"
  );

  if (overview === undefined) {
    return <p className="text-sm text-gray-500">Laden...</p>;
  }

  if (!overview || overview.length === 0) {
    return <p className="text-sm text-gray-500 italic">Nog geen groepen of sessies gevonden</p>;
  }

  // Filter out groups with no members
  const groupsWithMembers = overview.filter((g) => g.members.length > 0);

  if (groupsWithMembers.length === 0) {
    return <p className="text-sm text-gray-500 italic">Nog geen leden toegevoegd aan groepen</p>;
  }

  return (
    <div className="space-y-6">
      {groupsWithMembers.map(({ group, totalSessions, members }) => (
        <div key={group._id}>
          {/* Group header */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: group.color }}
            />
            <h3 className="text-sm font-semibold text-gray-800">{group.name}</h3>
            <span className="text-xs text-gray-500 ml-auto">{totalSessions} sessies</span>
          </div>

          {/* Members table */}
          <ul className="space-y-2">
            {members.map((member, i) => {
              const pct = totalSessions > 0
                ? Math.round((member.attended / totalSessions) * 100)
                : 0;

              return (
                <li key={i} className="flex items-center gap-3">
                  {/* Name */}
                  <span className="text-sm text-gray-700 w-32 shrink-0 truncate">
                    {member.name ?? "Onbekend"}
                  </span>

                  {/* Progress bar */}
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: group.color,
                      }}
                    />
                  </div>

                  {/* Count + percentage */}
                  <span className="text-xs text-gray-500 w-20 text-right shrink-0">
                    {member.attended}/{totalSessions} ({pct}%)
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
