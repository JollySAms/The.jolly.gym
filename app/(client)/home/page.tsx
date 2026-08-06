"use client";

import { useConvexAuth, useQuery, useMutation } from "convex/react";
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
  isGroupMember: boolean;
};

export default function ClientHomePage() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.getMe, isAuthenticated ? {} : "skip");
  const nextSession = useQuery(
    api.sessions.getMyNextSession,
    isAuthenticated && me !== undefined && me?.role === "client" ? {} : "skip"
  );
  const rsvp = useMutation(api.attendance.rsvp);
  const cancelRsvp = useMutation(api.attendance.cancelRsvp);
  const markAbsent = useMutation(api.attendance.markAbsent);
  const undoAbsent = useMutation(api.attendance.undoAbsent);

  const [showDetail, setShowDetail] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [absentLoading, setAbsentLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState<"coming" | "cancelled" | null>(null);
  const [todayLabel, setTodayLabel] = useState<string | null>(null);

  useEffect(() => {
    setTodayLabel(format(new Date(), "EEEE d MMMM", { locale: nl }));
  }, []);

  useEffect(() => {
    if (nextSession) setLocalStatus(nextSession.myStatus);
  }, [nextSession?.myStatus]);

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  const firstName = me?.name?.split(" ")[0] ?? "daar";

  async function handleRsvp(e: React.MouseEvent) {
    e.stopPropagation();
    if (!nextSession || rsvpLoading) return;
    setRsvpLoading(true);
    const previousStatus = localStatus;
    try {
      if (localStatus === "coming") {
        setLocalStatus(null);
        await cancelRsvp({ sessionId: nextSession._id });
      } else {
        setLocalStatus("coming");
        await rsvp({ sessionId: nextSession._id });
        toast.success("Je bent ingeschreven!");
      }
    } catch {
      setLocalStatus(previousStatus);
      toast.error("Dat lukte niet. Probeer het opnieuw.");
    } finally {
      setRsvpLoading(false);
    }
  }

  async function handleMarkAbsent(e: React.MouseEvent) {
    e.stopPropagation();
    if (!nextSession || absentLoading) return;
    setAbsentLoading(true);
    const previousStatus = localStatus;
    try {
      setLocalStatus("cancelled");
      await markAbsent({ sessionId: nextSession._id });
    } catch {
      setLocalStatus(previousStatus);
      toast.error("Dat lukte niet. Probeer het opnieuw.");
    } finally {
      setAbsentLoading(false);
    }
  }

  async function handleUndoAbsent(e: React.MouseEvent) {
    e.stopPropagation();
    if (!nextSession || absentLoading) return;
    setAbsentLoading(true);
    const previousStatus = localStatus;
    try {
      setLocalStatus(null);
      await undoAbsent({ sessionId: nextSession._id });
    } catch {
      setLocalStatus(previousStatus);
      toast.error("Dat lukte niet. Probeer het opnieuw.");
    } finally {
      setAbsentLoading(false);
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
            {nextSession.workoutName ? (
              <div className="flex items-center gap-2 mt-4 bg-gray-50 rounded-xl px-3 py-2.5">
                <Dumbbell size={15} className="text-gray-400 shrink-0" />
                <span className="text-sm font-medium text-gray-700">
                  {nextSession.workoutName}
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-4">Nog geen workout toegevoegd</p>
            )}

            <div className="flex items-center gap-2 mt-2">
              <Users size={13} className="text-gray-300" />
              <span className="text-xs text-gray-500">
                {nextSession.attendanceCount} / {nextSession.capacity} ingeschreven
              </span>
            </div>

            {/* RSVP buttons — stopPropagation so card tap still opens detail */}
            <div className="mt-5 space-y-2">
              {/* Inschrijven: turns green when signed up, disabled when already coming */}
              <button
                onClick={handleRsvp}
                disabled={rsvpLoading}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  localStatus === "coming"
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-900 text-white hover:bg-gray-700"
                }`}
              >
                {rsvpLoading ? "..." : localStatus === "coming" ? "Ingeschreven ✓" : "Inschrijven"}
              </button>
              {/* Niet aanwezig: only shown to own-group members */}
              {nextSession.isGroupMember && (
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
