import type { CSSProperties } from "react";

import type { SiteSettings } from "@/lib/types";

import { ArrowUpRight } from "./ArrowUpRight";
import { MixedText } from "./MixedText";

export function HoursFooter({ settings }: { settings: SiteSettings }) {
  const mapQuery = encodeURIComponent(
    [settings.name, settings.addressLine1, settings.addressLine2]
      .filter(Boolean)
      .join(", "),
  );
  const socials = [
    { label: "Untappd", href: settings.untappdUrl },
    { label: "Instagram", href: settings.instagramUrl },
    { label: "Facebook", href: settings.facebookUrl },
  ].filter((s): s is { label: string; href: string } => Boolean(s.href));

  return (
    <footer id="hours" className="bg-navy text-cream">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <h2
          data-reveal
          className="font-display text-4xl uppercase text-amber-bright sm:text-5xl"
        >
          <MixedText text="Come *say hi*" />
        </h2>
        <div data-reveal-group className="mt-10 grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-cream/60">
              Hours
            </h3>
            <ul className="mt-4 space-y-1.5 text-sm">
              {(settings.hours ?? []).map((row) => (
                <li key={row.day} className="flex justify-between gap-6">
                  <span className="font-semibold">{row.day}</span>
                  <span className="text-cream/80">
                    {row.closed ? "Closed" : `${row.opens} – ${row.closes}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ "--rd": "90ms" } as CSSProperties}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-cream/60">
              Find us
            </h3>
            <address className="mt-4 space-y-1.5 text-sm not-italic text-cream/85">
              <div>{settings.addressLine1}</div>
              <div>{settings.addressLine2}</div>
              {settings.phone ? (
                <div>
                  <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>
                    {settings.phone}
                  </a>
                </div>
              ) : null}
              {settings.email ? (
                <div>
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </div>
              ) : null}
            </address>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-cream/40 px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-cream hover:text-navy"
            >
              Get directions
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <div style={{ "--rd": "180ms" } as CSSProperties}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-cream/60">
              Follow along
            </h3>
            <ul className="mt-4 space-y-1.5 text-sm">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-cream/85 underline decoration-amber/50 underline-offset-4 hover:text-amber-bright"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-14 border-t border-cream/15 pt-6 text-xs text-cream/50">
          © {new Date().getFullYear()} {settings.name ?? "Blue Ridge Beer Hub"}{" "}
          · Made with care in Waynesville, NC · 21+ to drink — please enjoy
          responsibly
        </p>
      </div>
    </footer>
  );
}
