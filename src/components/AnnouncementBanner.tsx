import { Editable } from "./Editable";

export function AnnouncementBanner({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <div className="bg-navy-deep px-4 py-2 sm:px-10 text-center text-sm font-semibold text-amber-bright">
      <Editable value={text} path="announcement" label="Announcement banner" />
    </div>
  );
}
