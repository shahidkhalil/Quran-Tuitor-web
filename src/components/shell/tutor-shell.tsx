"use client";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { UserAvatar } from "@/components/profile/user-avatar";
import {
  IconCalendar,
  IconFile,
  IconHome,
  IconInbox,
  IconList,
  IconUsers,
  IconWallet,
} from "@/components/shell/panel-icons";
import { PanelNavLink } from "@/components/shell/panel-nav-link";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  isVerified: boolean;
  email?: string | null;
  photoUrl?: string | null;
  notificationBell?: ReactNode;
};

const applicantNav = [
  { href: "/tutor", label: "Home", exact: true, icon: <IconHome /> },
  { href: "/tutor/application", label: "Application", icon: <IconFile /> },
  { href: "/tutor/account", label: "Account", icon: <IconUsers /> },
] as const;

const tutorNav = [
  { href: "/tutor", label: "Home", exact: true, icon: <IconHome /> },
  { href: "/tutor/requests", label: "Requests", icon: <IconInbox /> },
  { href: "/tutor/calendar", label: "Calendar", icon: <IconCalendar /> },
  { href: "/tutor/messages", label: "Messages", icon: <IconInbox /> },
  { href: "/tutor/listing", label: "Listing", icon: <IconList /> },
  { href: "/tutor/earnings", label: "Earnings", icon: <IconWallet /> },
  { href: "/tutor/application", label: "Application", icon: <IconFile /> },
  { href: "/tutor/account", label: "Account", icon: <IconUsers /> },
] as const;

export function TutorShell({
  children,
  isVerified,
  email,
  photoUrl,
  notificationBell,
}: Props) {
  const nav = isVerified ? tutorNav : applicantNav;

  return (
    <div className="panel-canvas flex min-h-full flex-1">
      <aside className="panel-sidebar hidden w-60 shrink-0 flex-col md:flex lg:w-64">
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/tutor/account" className="flex items-center gap-3">
            <UserAvatar
              photoUrl={photoUrl}
              email={email}
              size="md"
              tone="dark"
            />
            <div className="min-w-0">
              <p className="display-title text-lg text-white">Tutor workspace</p>
              <p className="mt-0.5 truncate text-xs text-white/65">
                {isVerified ? "Verified tutor" : "Applicant"}
                {email ? ` · ${email}` : ""}
              </p>
            </div>
          </Link>
        </div>
        <nav aria-label="Tutor" className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => (
            <PanelNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              exact={"exact" in item ? item.exact : false}
              icon={item.icon}
              variant="side"
            />
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <SignOutButton className="w-full border-white/25 bg-transparent text-white hover:bg-white/10" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="nav-glass sticky top-0 z-40">
          <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-3 px-4 py-3 md:px-8">
            <div className="flex min-w-0 items-center gap-2 md:hidden">
              <Link href="/tutor/account">
                <UserAvatar photoUrl={photoUrl} email={email} size="sm" />
              </Link>
              <div>
                <Link
                  href="/tutor"
                  className="display-title text-base text-[var(--color-primary)]"
                >
                  Tutor
                </Link>
                <p className="text-[11px] font-semibold text-[var(--color-on-surface-muted)]">
                  {isVerified ? "Verified" : "Applicant"}
                </p>
              </div>
            </div>
            <p className="hidden text-sm text-[var(--color-on-surface-muted)] md:block">
              Manage trials, listing, and earnings in one place.
            </p>
            <div className="flex items-center gap-2">
              {notificationBell}
              <Link
                href="/browse"
                className="hidden items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] sm:inline-flex"
              >
                <IconCalendar className="h-4 w-4" />
                Marketplace
              </Link>
              <div className="md:hidden">
                <SignOutButton />
              </div>
            </div>
          </div>
          <nav
            aria-label="Tutor mobile"
            className="flex gap-1 overflow-x-auto px-3 pb-3 md:hidden"
          >
            {nav.map((item) => (
              <PanelNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                exact={"exact" in item ? item.exact : false}
              />
            ))}
          </nav>
        </header>

        <div className="mx-auto w-full max-w-[1080px] flex-1 px-4 py-8 md:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
