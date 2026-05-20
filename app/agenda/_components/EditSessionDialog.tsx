"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X } from "lucide-react";

type Props = {
  session: {
    _id: Id<"sessions">;
    date: string;
    time: string;
    groupId: Id<"groups">;
  };
  onClose: () => void;
};

export function EditSessionDialog({ session, onClose }: Props) {
  const groups = useQuery(api.groups.list);
  const updateSession = useMutation(api.sessions.update);
  const cancelSession = useMutation(api.sessions.cancel);

  const [date, setDate] = useState(session.date);
  const [time, setTime] = useState(session.time);
  const [groupId, setGroupId] = useState<Id<"groups">>(session.groupId);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateSession({ id: session._id, date, time, groupId });
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Er ging iets mis");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Weet je zeker dat je deze sessie wilt annuleren?")) return;
    setCancelling(true);
    try {
      await cancelSession({ id: session._id });
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Er ging iets mis");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Sessie bewerken</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Datum</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tijd</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Groep</label>
            {groups === undefined ? (
              <p className="text-sm text-gray-400">Laden...</p>
            ) : (
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value as Id<"groups">)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Opslaan..." : "Wijzigingen opslaan"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full py-3 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50"
          >
            {cancelling ? "Annuleren..." : "Sessie annuleren"}
          </button>
        </form>
      </div>
    </div>
  );
}
