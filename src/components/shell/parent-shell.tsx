"use client";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { UserAvatar } from "@/components/profile/user-avatar";
import {
  IconCalendar,
  IconHome,
  IconInbox,
  IconList,
  IconSearch,
  IconShield,
  IconUser,
  IconUsers,
} from "@/components/shell/panel-icons";
import { PanelNavLink } from "@/components/shell/panel-nav-link";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  email?: string | null;
  photoUrl?: string | null;
  notificationBell?: ReactNode;
};

/** Market-standard parent IA: home → find → family → lessons → inbox → support → profile */
const nav = [
  { href: "/parent", label: "Home", exact: true, icon: <IconHome /> },
  { href: "/browse", label: "Browse", icon: <IconSearch /> },
  { href: "/parent/learners", label: "Learners", icon: <IconUsers /> },
  { href: "/parent/bookings", label: "Bookings", icon: <IconCalendar /> },
  { href: "/parent/schedule", label: "Schedule", icon: <IconList /> },
  { href: "/parent/messages", label: "Messages", icon: <IconInbox /> },
  { href: "/parent/support", label: "Support", icon: <IconShield /> },
  { href: "/parent/account", label: "Account", icon: <IconUser /> },
] as const;

export function ParentShell({
  children,
  email,
  photoUrl,
  notificationBell,
}: Props) {
  return (
    <div className="panel-canvas flex min-h-full flex-1">
      <aside className="panel-sidebar hidden w-60 shrink-0 flex-col md:flex lg:w-64">
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/parent/account" className="flex items-center gap-3">
            <UserAvatar
              photoUrl={photoUrl}
              email={email}
              size="md"
              tone="dark"
            />
            <div className="min-w-0">
              <p className="display-title text-lg text-white">Family workspace</p>
              <p className="mt-0.5 truncate text-xs text-white/65">
                Parent
                {email ? ` · ${email}` : ""}
              </p>
            </div>
          </Link>
        </div>
        <nav aria-label="Parent" className="flex flex-1 flex-col gap-1 p-3">
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
              <Link href="/parent/account">
                <UserAvatar photoUrl={photoUrl} email={email} size="sm" />
              </Link>
              <div>
                <Link
                  href="/parent"
                  className="display-title text-base text-[var(--color-primary)]"
                >
                  Family
                </Link>
                <p className="text-[11px] font-semibold text-[var(--color-on-surface-muted)]">
                  Parent dashboard
                </p>
              </div>
            </div>
            <p className="hidden text-sm text-[var(--color-on-surface-muted)] md:block">
              Find tutors, book free trials, and manage paid lessons securely.
            </p>
            <div className="flex items-center gap-2">
              {notificationBell}
              <Link
                href="/browse"
                className="btn-panel btn-panel-primary hidden !min-h-9 !px-3.5 text-[11px] sm:inline-flex"
              >
                <IconSearch className="h-3.5 w-3.5" />
                Find tutors
              </Link>
              <div className="md:hidden">
                <SignOutButton />
              </div>
            </div>
          </div>
          <nav
            aria-label="Parent mobile"
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
