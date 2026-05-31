"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X } from "lucide-react";

const PRESET_COLORS = [
  { hex: "#3B82F6", label: "Blauw" },
  { hex: "#22C55E", label: "Groen" },
  { hex: "#F97316", label: "Oranje" },
  { hex: "#EF4444", label: "Rood" },
  { hex: "#A855F7", label: "Paars" },
  { hex: "#EC4899", label: "Roze" },
  { hex: "#EAB308", label: "Geel" },
  { hex: "#14B8A6", label: "Teal" },
];

type Props = {
  group?: { _id: Id<"groups">; name: string; color: string };
  onClose: () => void;
};

export function GroupDialog({ group, onClose }: Props) {
  const createGroup = useMutation(api.groups.create);
  const updateGroup = useMutation(api.groups.update);

  const [name, setName] = useState(group?.name ?? "");
  const [color, setColor] = useState(group?.color ?? PRESET_COLORS[0].hex);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!group;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Vul een naam in"); return; }
    setSaving(true);
    setError(null);
    try {
      if (isEditing) {
        await updateGroup({ id: group._id, name: name.trim(), color });
      } else {
        await createGroup({ name: name.trim(), color });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">
            {isEditing ? "Groep bewerken" : "Groep toevoegen"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Naam</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bijv. Fitte mannen"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Kleur</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.hex)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    color === c.hex
                      ? "border-gray-800 scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Opslaan..." : isEditing ? "Wijzigingen opslaan" : "Groep aanmaken"}
          </button>
        </form>
      </div>
    </div>
  );
}
