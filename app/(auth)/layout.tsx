import { MarketingNav } from "@/components/marketing/marketing-nav";

export default async function AuthSegmentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--color-background)]">
      <MarketingNav />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
