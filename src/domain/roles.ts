export type UserRole =
  | "parent"
  | "adult"
  | "tutor_applicant"
  | "tutor"
  | "admin";

export function homePathForRole(role: UserRole | string | null | undefined): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "tutor":
    case "tutor_applicant":
      return "/tutor";
    case "adult":
    case "parent":
    default:
      return "/parent";
  }
}

export function canAccessPath(
  role: UserRole | string | null | undefined,
  pathname: string,
): boolean {
  if (pathname.startsWith("/admin")) {
    return role === "admin";
  }
  if (pathname.startsWith("/tutor")) {
    return role === "tutor" || role === "tutor_applicant";
  }
  if (pathname.startsWith("/parent")) {
    return role === "parent" || role === "adult";
  }
  return true;
}
