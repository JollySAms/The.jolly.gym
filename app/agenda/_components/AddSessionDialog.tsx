"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format, addWeeks } from "date-fns";
import { nl } from "date-fns/locale";
import { X } from "lucide-react";

type Props = {
  defaultDate?: Date;
  onClose: () => void;
};

// Dutch weekday names matching date-fns EEEE with nl locale
function dutchWeekday(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return format(new Date(y, m - 1, d), "EEEE", { locale: nl });
}

export function AddSessionDialog({ defaultDate, onClose }: Props) {
  const groups = useQuery(api.groups.list);
  const createSession = useMutation(api.sessions.create);
  const createBatch = useMutation(api.sessions.createBatch);

  const [date, setDate] = useState(
    defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [time, setTime] = useState("09:00");
  const [groupId, setGroupId] = useState<Id<"groups"> | "">("");
  const [recurring, setRecurring] = useState(false);
  const [weeks, setWeeks] = useState(4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupId) { setError("Kies een groep"); return; }
    setSaving(true);
    setError(null);
    try {
      if (recurring && weeks > 1) {
        const created = await createBatch({
          date,
          time,
          groupId: groupId as Id<"groups">,
          weeks,
        });
        // created is the count of new sessions; duplicates were skipped silently
        void created;
      } else {
        await createSession({ date, time, groupId: groupId as Id<"groups"> });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
    } finally {
      setSaving(false);
    }
  }

  // Preview the end date when recurring is on
  const endDateLabel = (() => {
    if (!recurring || weeks <= 1) return null;
    const [y, m, d] = date.split("-").map(Number);
    const end = addWeeks(new Date(y, m - 1, d), weeks - 1);
    return format(end, "d MMMM yyyy", { locale: nl });
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Sessie toevoegen</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
            ) : groups.length === 0 ? (
              <p className="text-sm text-red-500">Maak eerst een groep aan.</p>
            ) : (
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value as Id<"groups">)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Kies een groep</option>
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Recurring toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-700">Sessie herhaalt zich wekelijks</span>
            <button
              type="button"
              role="switch"
              aria-checked={recurring}
              onClick={() => setRecurring((r) => !r)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                recurring ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  recurring ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Weeks input — only shown when recurring is on */}
          {recurring && (
            <div className="bg-blue-50 rounded-xl p-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Herhalen voor
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={2}
                    max={52}
                    value={weeks}
                    onChange={(e) => setWeeks(Math.max(2, Math.min(52, Number(e.target.value))))}
                    className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">weken</span>
                </div>
              </div>
              {endDateLabel && date && (
                <p className="text-xs text-gray-500">
                  Elke{" "}
                  <span className="font-medium text-gray-700">{dutchWeekday(date)}</span>{" "}
                  om {time} — t/m{" "}
                  <span className="font-medium text-gray-700">{endDateLabel}</span>
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {saving
              ? "Opslaan..."
              : recurring && weeks > 1
              ? `${weeks} sessies opslaan`
              : "Sessie opslaan"}
          </button>
        </form>
      </div>
    </div>
  );
}
