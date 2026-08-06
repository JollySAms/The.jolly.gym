"use client";

import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function SignOutDialog({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { signOut } = useAuthActions();

  async function handleSignOut() {
    await signOut();
    router.replace("/sign-in");
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={children as React.ReactElement}></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Uitloggen</AlertDialogTitle>
          <AlertDialogDescription>
            Weet je zeker dat je wilt uitloggen?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuleren</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Uitloggen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
