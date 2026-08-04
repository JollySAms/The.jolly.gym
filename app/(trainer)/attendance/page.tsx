"use client";

import { useState } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SessionsList } from "./_components/SessionsList";
import { ClientOverview } from "./_components/ClientOverview";

type Tab = "sessies" | "overzicht";

export default function AttendancePage() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.getMe, isAuthenticated ? undefined : "skip");
  const [activeTab, setActiveTab] = useState<Tab>("sessies");

  if (isLoading) return null;
  if (!isAuthenticated) return null;
  if (me === undefined) return null; // wait for role to resolve
  if (me?.role !== "trainer") return null; // clients never see this page

  const tabClass = (tab: Tab) =>
    `flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
      activeTab === tab
        ? "bg-white text-gray-900 shadow-sm"
        : "text-gray-500 hover:text-gray-700"
    }`;

  return (
    <main className="min-h-screen bg-white max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Aanwezigheid</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        <button onClick={() => setActiveTab("sessies")} className={tabClass("sessies")}>
          Sessies
        </button>
        <button onClick={() => setActiveTab("overzicht")} className={tabClass("overzicht")}>
          Overzicht
        </button>
      </div>

      {activeTab === "sessies" && <SessionsList />}
      {activeTab === "overzicht" && <ClientOverview />}
    </main>
  );
}
