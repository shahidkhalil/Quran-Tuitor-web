import { type NextRequest, NextResponse } from "next/server";
import { isAuthConfigured } from "@/lib/firebase/server-auth";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  const next = searchParams.get("next");
  const continueUrl = next && next.startsWith("/") ? next : undefined;

  if (!isAuthConfigured()) {
    return NextResponse.redirect(
      `${origin}/verify-email?error=${encodeURIComponent("Firebase is not configured")}`,
    );
  }

  if (!mode || !oobCode) {
    return NextResponse.redirect(
      `${origin}/verify-email?error=${encodeURIComponent("Missing verification token.")}`,
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    return NextResponse.redirect(
      `${origin}/verify-email?error=${encodeURIComponent("Missing Firebase API key")}`,
    );
  }

  if (mode === "verifyEmail") {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oobCode,
        }),
      },
    );
    if (response.ok) {
      return NextResponse.redirect(`${origin}${continueUrl ?? "/sign-in"}`);
    }
    return NextResponse.redirect(
      `${origin}/verify-email?error=${encodeURIComponent("Email verification failed or expired.")}`,
    );
  }

  if (mode === "resetPassword") {
    return NextResponse.redirect(
      `${origin}/reset-password?oobCode=${encodeURIComponent(oobCode)}`,
    );
  }

  return NextResponse.redirect(
    `${origin}/verify-email?error=${encodeURIComponent("Unsupported action mode.")}`,
  );
}
