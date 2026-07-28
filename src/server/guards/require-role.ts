import { homePathForRole, type UserRole } from "@/domain/roles";
import { getCurrentProfile } from "@/server/services/profile";
import { redirect } from "next/navigation";

export async function requireRoles(allowed: UserRole[], nextPath: string) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }
  if (!allowed.includes(profile.role)) {
    redirect(homePathForRole(profile.role));
  }
  return profile;
}
