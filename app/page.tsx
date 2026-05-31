"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function RootPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const me = useQuery(api.users.getMe, isSignedIn ? {} : "skip");

  useEffect(() => {
    if (!isLoaded || !isSignedIn || me === undefined) return;
    if (me?.role === "trainer") {
      router.replace("/agenda");
    } else {
      router.replace("/home");
    }
  }, [isLoaded, isSignedIn, me, router]);

  if (isLoaded && !isSignedIn) return <RedirectToSignIn />;

  return null;
}
