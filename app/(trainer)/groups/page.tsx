"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { Plus, Pencil, Users, Trash2 } from "lucide-react";

import { GroupDialog } from "./_components/GroupDialog";
import { MembersSheet } from "./_components/MembersSheet";

type Group = {
  _id: Id<"groups">;
  name: string;
  color: string;
  memberIds: Id<"users">[];
};

export default function GroupsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const me = useQuery(api.users.getMe, isSignedIn ? {} : "skip");
  const groups = useQuery(api.groups.list, isSignedIn ? {} : "skip");
  const removeGroup = useMutation(api.groups.remove);

  const [showAdd, setShowAdd] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [managingGroupId, setManagingGroupId] = useState<Id<"groups"> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Group | null>(null);

  // Derive live group from reactive query so member toggles reflect instantly
  const managingGroup = managingGroupId
    ? (groups?.find((g) => g._id === managingGroupId) as Group ?? null)
    : null;

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;

  const isTrainer = me !== undefined && me?.role === "trainer";

  // Clients don't have access to group management
  if (me !== undefined && !isTrainer) {
    return (
      <main className="min-h-screen bg-white max-w-lg mx-auto px-4 py-6">
        <p className="text-sm text-gray-500">Geen toegang.</p>
      </main>
    );
  }

  async function handleDelete(group: Group) {
    await removeGroup({ id: group._id });
    setConfirmDelete(null);
  }

  return (
    <main className="min-h-screen bg-white max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Groepen</h1>
      <p className="text-sm text-gray-500 mb-6">
        Beheer je trainingsgroepen en leden.
      </p>

      {/* Group list */}
      {groups === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm mb-4">Nog geen groepen aangemaakt.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
          >
            Eerste groep aanmaken
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {groups.map((group) => (
            <li
              key={group._id}
              className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
            >
              {/* Color dot + name + member count */}
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.color }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{group.name}</p>
                  <p className="text-xs text-gray-500">
                    {group.memberIds.length} {group.memberIds.length === 1 ? "lid" : "leden"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <button
                  onClick={() => setManagingGroupId(group._id)}
                  title="Leden beheren"
                  className="p-2 rounded-lg hover:bg-white text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Users size={16} />
                </button>
                <button
                  onClick={() => setEditingGroup(group as Group)}
                  title="Bewerken"
                  className="p-2 rounded-lg hover:bg-white text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setConfirmDelete(group as Group)}
                  title="Verwijderen"
                  className="p-2 rounded-lg hover:bg-white text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add group FAB */}
      {groups !== undefined && groups.length > 0 && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-24 right-6 md:bottom-6 flex items-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Groep toevoegen
        </button>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Groep verwijderen?</h3>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-medium text-gray-700">{confirmDelete.name}</span> wordt
              verwijderd. Bestaande sessies blijven zichtbaar.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-semibold text-white hover:bg-red-600"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {showAdd && <GroupDialog onClose={() => setShowAdd(false)} />}
      {editingGroup && (
        <GroupDialog group={editingGroup} onClose={() => setEditingGroup(null)} />
      )}
      {managingGroup && (
        <MembersSheet group={managingGroup} onClose={() => setManagingGroupId(null)} />
      )}
    </main>
  );
}
