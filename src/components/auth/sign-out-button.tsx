"use client";

import { signOut } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
};

export function SignOutButton({ className }: Props) {
  return (
    <form action={signOut}>
      <Button
        type="submit"
        variant="secondary"
        className={cn("w-full sm:w-auto", className)}
      >
        Sign out
      </Button>
    </form>
  );
}
