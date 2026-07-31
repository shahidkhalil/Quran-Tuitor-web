/** Classroom join troubleshooting — additive help content. */

export type TroubleshootStep = {
  id: string;
  title: string;
  detail: string;
  href?: string;
  hrefLabel?: string;
};

export const CLASSROOM_TROUBLESHOOT_STEPS: TroubleshootStep[] = [
  {
    id: "browser",
    title: "Use a supported browser",
    detail:
      "Chrome or Edge work best. Avoid in-app browsers (Instagram, Facebook). Update to the latest version.",
  },
  {
    id: "https",
    title: "Stay on a secure page",
    detail:
      "Camera and mic need HTTPS. Prefer the Join button in Schedule/Bookings rather than a copied link in an insecure tab.",
  },
  {
    id: "system-check",
    title: "Run the pre-lesson system check",
    detail:
      "Confirm mic and camera permissions before class. Fix red items, then continue to the meeting.",
    href: "/parent/system-check",
    hrefLabel: "Open system check",
  },
  {
    id: "permissions",
    title: "Allow camera & microphone",
    detail:
      "If the browser blocked access earlier, open site settings → allow camera/mic → refresh, then run the check again.",
  },
  {
    id: "headphones",
    title: "Use headphones",
    detail:
      "Headphones reduce echo. Mute other tabs and close unused video apps (Zoom, Teams, etc.).",
  },
  {
    id: "network",
    title: "Check your connection",
    detail:
      "Prefer Wi‑Fi over weak mobile data. Pause large downloads. If video freezes, turn off HD or switch networks.",
  },
  {
    id: "devices",
    title: "Pick the right devices",
    detail:
      "In the meeting UI, select the correct mic/camera. Unplug and reconnect USB devices if they don’t appear.",
  },
  {
    id: "still-stuck",
    title: "Still can’t join?",
    detail:
      "Open a support case from the booking. Never pay the tutor off-platform — rematch stays with the team.",
    href: "/parent/support",
    hrefLabel: "Open support",
  },
];

export const TUTOR_CLASSROOM_TROUBLESHOOT_STEPS: TroubleshootStep[] =
  CLASSROOM_TROUBLESHOOT_STEPS.map((step) => {
    if (step.id === "system-check") {
      return {
        ...step,
        href: "/tutor/system-check",
        hrefLabel: "Open system check",
      };
    }
    if (step.id === "still-stuck") {
      return {
        ...step,
        href: "/tutor/support",
        hrefLabel: "Open support",
      };
    }
    return step;
  });
