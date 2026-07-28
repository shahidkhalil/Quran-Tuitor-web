import { redirect } from "next/navigation";

export const metadata = { title: "More" };

/** More was folded into Account for a cleaner parent IA. */
export default function ParentMorePage() {
  redirect("/parent/account");
}
