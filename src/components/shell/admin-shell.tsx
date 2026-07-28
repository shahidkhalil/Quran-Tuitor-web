"use client";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { UserAvatar } from "@/components/profile/user-avatar";
import { IconShield, IconUsers, IconWallet } from "@/components/shell/panel-icons";
import { PanelNavLink } from "@/components/shell/panel-nav-link";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  email?: string | null;
  photoUrl?: string | null;
};

export function AdminShell({ children, email, photoUrl }: Props) {
  return (
    <div className="panel-canvas flex min-h-full flex-1">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-[var(--color-outline)] bg-[var(--color-surface-elevated)] lg:flex">
        <div className="border-b border-[var(--color-outline)] px-5 py-5">
          <Link href="/admin/account" className="flex items-center gap-3">
            <UserAvatar photoUrl={photoUrl} email={email} size="md" />
            <div className="min-w-0">
              <p className="display-title flex items-center gap-1.5 text-lg text-[var(--color-primary)]">
                <IconShield className="h-5 w-5" />
                Admin
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--color-on-surface-muted)]">
                {email ?? "Operations"}
              </p>
            </div>
          </Link>
        </div>
        <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 p-3">
          <PanelNavLink
            href="/admin"
            label="Vetting queue"
            exact
            variant="side-light"
            icon={<IconShield />}
          />
          <PanelNavLink
            href="/admin/ledger"
            label="Ledger"
            variant="side-light"
            icon={<IconWallet />}
          />
          <PanelNavLink
            href="/admin/account"
            label="Account"
            variant="side-light"
            icon={<IconUsers />}
          />
        </nav>
        <div className="border-t border-[var(--color-outline)] p-4">
          <SignOutButton className="w-full" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="nav-glass sticky top-0 z-30">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 md:px-8">
            <div className="flex items-center gap-3">
              <Link href="/admin/account" className="lg:hidden">
                <UserAvatar photoUrl={photoUrl} email={email} size="sm" />
              </Link>
              <Link
                href="/admin"
                className="display-title text-lg text-[var(--color-primary)] lg:hidden"
              >
                Admin console
              </Link>
              <span className="hidden status-pill status-pill-accent lg:inline-flex">
                Ops
              </span>
              <p className="hidden text-sm text-[var(--color-on-surface-muted)] sm:block">
                Tutor vetting &amp; marketplace trust
              </p>
            </div>
            <div className="flex items-center gap-3">
              <PanelNavLink href="/admin" label="Queue" exact />
              <PanelNavLink href="/admin/ledger" label="Ledger" />
              <PanelNavLink href="/admin/account" label="Account" />
              <SignOutButton className="lg:hidden" />
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 md:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
