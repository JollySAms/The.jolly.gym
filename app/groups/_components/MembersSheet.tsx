"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Check } from "lucide-react";

type Group = {
  _id: Id<"groups">;
  name: string;
  color: string;
  memberIds: Id<"users">[];
};

type Props = {
  group: Group;
  onClose: () => void;
};

export function MembersSheet({ group, onClose }: Props) {
  const clients = useQuery(api.groups.listClients);
  const addMember = useMutation(api.groups.addMember);
  const removeMember = useMutation(api.groups.removeMember);

  async function toggleMember(userId: Id<"users">, isMember: boolean) {
    if (isMember) {
      await removeMember({ groupId: group._id, userId });
    } else {
      await addMember({ groupId: group._id, userId });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: group.color }}
            />
            <h2 className="text-sm font-semibold text-gray-800">{group.name} — leden</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Client list */}
        <div className="overflow-y-auto flex-1">
          {clients === undefined ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">
              Nog geen klanten aangemeld. Klanten verschijnen hier zodra ze inloggen.
            </p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {clients.map((client) => {
                const isMember = group.memberIds.includes(client._id);
                return (
                  <li key={client._id}>
                    <button
                      onClick={() => toggleMember(client._id, isMember)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{client.name}</p>
                          <p className="text-xs text-gray-400">{client.email}</p>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          isMember ? "bg-blue-600" : "border-2 border-gray-200"
                        }`}
                      >
                        {isMember && <Check size={13} className="text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer with member count */}
        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-500 text-center">
            {group.memberIds.length} {group.memberIds.length === 1 ? "lid" : "leden"} in deze groep
          </p>
        </div>
      </div>
    </div>
  );
}
