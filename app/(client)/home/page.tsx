"use client";

import { useAuth, useUser, RedirectToSignIn } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { Dumbbell, CalendarDays, Users } from "lucide-react";
import { useEffect } from "react";

export default function ClientHomePage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const ensureUser = useMutation(api.users.ensureUser);
  const me = useQuery(api.users.getMe, isSignedIn ? {} : "skip");
  const nextSession = useQuery(
    api.sessions.getMyNextSession,
    isSignedIn && me !== undefined && me?.role === "client" ? {} : "skip"
  );
  const rsvp = useMutation(api.attendance.rsvp);
  const cancelRsvp = useMutation(api.attendance.cancelRsvp);

  useEffect(() => {
    if (isLoaded && isSignedIn && me === null) ensureUser();
  }, [isLoaded, isSignedIn, me]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;

  const firstName = user?.firstName ?? me?.name?.split(" ")[0] ?? "daar";

  async function handleRsvp() {
    if (!nextSession) return;
    if (nextSession.myStatus === "coming") {
      await cancelRsvp({ sessionId: nextSession._id });
    } else {
      await rsvp({ sessionId: nextSession._id });
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Greeting */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Hoi {firstName}
      </h1>
      <p className="text-sm text-gray-400 mb-8">
        {new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}
      </p>

      {/* Next session card */}
      {nextSession === undefined ? (
        // Loading skeleton
        <div className="rounded-2xl bg-gray-100 animate-pulse h-48" />
      ) : nextSession === null ? (
        // Empty state
        <div className="rounded-2xl border border-gray-100 px-6 py-10 text-center">
          <CalendarDays size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">Geen sessies gepland</p>
          <p className="text-xs text-gray-400 mt-1">
            Ga naar Agenda om je in te schrijven.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          {/* Colored header strip using group color */}
          <div
            className="h-1.5"
            style={{ backgroundColor: nextSession.group?.color ?? "#3B82F6" }}
          />

          <div className="px-5 py-5">
            {/* Section label */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Volgende sessie
            </p>

            {/* Date + time */}
            <p className="text-2xl font-bold text-gray-900 leading-tight">
              {format(parseISO(nextSession.date), "EEEE d MMMM", { locale: nl })}
            </p>
            <p className="text-base text-gray-500 mt-0.5">
              {nextSession.time} · {nextSession.group?.name ?? "Onbekende groep"}
            </p>

            {/* Workout */}
            {nextSession.workoutName && (
              <div className="flex items-center gap-2 mt-4 bg-gray-50 rounded-xl px-3 py-2.5">
                <Dumbbell size={15} className="text-gray-400 shrink-0" />
                <span className="text-sm font-medium text-gray-700">
                  {nextSession.workoutName}
                </span>
              </div>
            )}

            {/* Spots filled */}
            <div className="flex items-center gap-2 mt-2">
              <Users size={13} className="text-gray-300" />
              <span className="text-xs text-gray-400">
                {nextSession.attendanceCount} / {nextSession.capacity} ingeschreven
              </span>
            </div>

            {/* RSVP button */}
            <button
              onClick={handleRsvp}
              className={`mt-5 w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                nextSession.myStatus === "coming"
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-gray-900 text-white hover:bg-gray-700"
              }`}
            >
              {nextSession.myStatus === "coming"
                ? "Afmelden"
                : "Inschrijven"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
