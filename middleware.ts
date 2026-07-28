import { type NextRequest, NextResponse } from "next/server";

// Keep this file free of any @/lib/firebase/* imports.
// firebase-admin is Node-only and will crash Edge middleware if bundled.
const SESSION_COOKIE = "__session";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected =
    pathname.startsWith("/parent") ||
    pathname.startsWith("/tutor") ||
    pathname.startsWith("/admin");

  if (!isProtected) return NextResponse.next();

  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
