"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function RootPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.getMe, isAuthenticated ? {} : "skip");

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/sign-in");
      return;
    }
    if (me === undefined) return;
    if (me?.role === "trainer") {
      router.replace("/agenda");
    } else {
      router.replace("/home");
    }
  }, [isLoading, isAuthenticated, me, router]);

  return null;
}
