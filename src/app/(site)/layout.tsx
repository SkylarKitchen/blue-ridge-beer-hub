import { SanityLive } from "@/sanity/live";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <SanityLive />
    </>
  );
}
