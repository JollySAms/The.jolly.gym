"use client";

import { useAuth, useUser, RedirectToSignIn } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { Dumbbell, CalendarDays, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ClientSessionDetailSheet } from "@/app/(client)/_components/ClientSessionDetailSheet";

type NextSession = {
  _id: Id<"sessions">;
  date: string;
  time: string;
  capacity: number;
  workoutName: string | null;
  workoutSnapshot?: { exerciseId: Id<"exercises">; name: string; sets: number }[];
  attendanceCount: number;
  myStatus: "coming" | "cancelled" | null;
  group: { _id: Id<"groups">; name: string; color: string } | null;
};

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

  const [showDetail, setShowDetail] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [todayLabel, setTodayLabel] = useState<string | null>(null);

  useEffect(() => {
    setTodayLabel(format(new Date(), "EEEE d MMMM", { locale: nl }));
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn && me === null) ensureUser();
  }, [isLoaded, isSignedIn, me, ensureUser]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;

  const firstName = user?.firstName ?? me?.name?.split(" ")[0] ?? "daar";

  async function handleRsvp(e: React.MouseEvent) {
    e.stopPropagation();
    if (!nextSession || rsvpLoading) return;
    setRsvpLoading(true);
    try {
      if (nextSession.myStatus === "coming") {
        await cancelRsvp({ sessionId: nextSession._id });
        toast.success("Je bent afgemeld");
      } else {
        await rsvp({ sessionId: nextSession._id });
        toast.success("Je bent ingeschreven!");
      }
    } catch {
      toast.error("Dat lukte niet. Probeer het opnieuw.");
    } finally {
      setRsvpLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Greeting */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Hoi {firstName}</h1>
      <p className="text-sm text-gray-500 mb-8 capitalize">
        {todayLabel ?? ""}
      </p>

      {/* Next session card */}
      {nextSession === undefined ? (
        <div className="rounded-2xl bg-gray-100 animate-pulse h-48" />
      ) : nextSession === null ? (
        <div className="rounded-2xl border border-gray-100 px-6 py-10 text-center">
          <CalendarDays size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">Geen sessies gepland</p>
          <p className="text-xs text-gray-500 mt-1">
            Ga naar Agenda om je in te schrijven.
          </p>
        </div>
      ) : (
        // Card tappable for details — RSVP button inside stops propagation
        <div
          onClick={() => setShowDetail(true)}
          className="rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-200 transition-colors"
        >
          {/* Group color strip */}
          <div
            className="h-1.5"
            style={{ backgroundColor: nextSession.group?.color ?? "#3B82F6" }}
          />

          <div className="px-5 py-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Volgende sessie
            </p>

            <p className="text-2xl font-bold text-gray-900 leading-tight capitalize">
              {format(parseISO(nextSession.date), "EEEE d MMMM", { locale: nl })}
            </p>
            <p className="text-base text-gray-500 mt-0.5">
              {nextSession.time} · {nextSession.group?.name ?? "Onbekende groep"}
            </p>

            {nextSession.workoutName && (
              <div className="flex items-center gap-2 mt-4 bg-gray-50 rounded-xl px-3 py-2.5">
                <Dumbbell size={15} className="text-gray-400 shrink-0" />
                <span className="text-sm font-medium text-gray-700">
                  {nextSession.workoutName}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 mt-2">
              <Users size={13} className="text-gray-300" />
              <span className="text-xs text-gray-500">
                {nextSession.attendanceCount} / {nextSession.capacity} ingeschreven
              </span>
            </div>

            {/* RSVP button — stopPropagation so card tap still opens detail */}
            <button
              onClick={handleRsvp}
              disabled={rsvpLoading}
              className={`mt-5 w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                nextSession.myStatus === "coming"
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-gray-900 text-white hover:bg-gray-700"
              }`}
            >
              {rsvpLoading
                ? "..."
                : nextSession.myStatus === "coming"
                ? "Afmelden"
                : "Inschrijven"}
            </button>
          </div>
        </div>
      )}

      {/* Detail sheet */}
      {showDetail && nextSession && (
        <ClientSessionDetailSheet
          session={nextSession as NextSession}
          onClose={() => setShowDetail(false)}
        />
      )}
    </div>
  );
}
