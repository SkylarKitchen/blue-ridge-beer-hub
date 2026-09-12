import { stegaClean } from "next-sanity";
import type { CSSProperties } from "react";

import { DEFAULT_COPY } from "@/lib/copy";
import type { SiteSettings } from "@/lib/types";

import { ArrowUpRight } from "./ArrowUpRight";
import { Editable } from "./Editable";

export function HoursFooter({ settings }: { settings: SiteSettings }) {
  // stegaClean first: in a draft preview these strings carry invisible
  // characters that would be percent-encoded into the Maps URL.
  const mapQuery = encodeURIComponent(
    stegaClean(
      [settings.name, settings.addressLine1, settings.addressLine2]
        .filter(Boolean)
        .join(", "),
    ),
  );
  const socials = [
    { label: "Untappd", href: settings.untappdUrl },
    { label: "Instagram", href: settings.instagramUrl },
    { label: "Facebook", href: settings.facebookUrl },
  ].filter((s): s is { label: string; href: string } => Boolean(s.href));

  return (
    <footer id="hours" className="bg-navy text-cream">
      <div className="mx-auto max-w-6xl px-5 sm:px-10 py-16">
        <h2
          data-reveal
          className="font-display text-4xl uppercase text-amber-bright sm:text-5xl"
        >
          <Editable
            value={settings.footerHeading ?? DEFAULT_COPY.footerHeading}
            path="footerHeading"
            label="Footer heading"
          />
        </h2>
        <div data-reveal-group className="mt-10 grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-cream/60">
              <Editable
                value={
                  settings.footerHoursLabel ?? DEFAULT_COPY.footerHoursLabel
                }
                path="footerHoursLabel"
                label="Hours column label"
              />
            </h3>
            <ul className="mt-4 space-y-1.5 text-sm">
              {(settings.hours ?? []).map((row) => (
                <li
                  key={row._key ?? row.day}
                  className="flex justify-between gap-6"
                >
                  <span className="font-semibold">{row.day}</span>
                  <span className="text-cream/80">
                    {row.closed ? (
                      "Closed"
                    ) : (
                      <>
                        <Editable value={row.opens} label="Opening time" />
                        {" – "}
                        <Editable value={row.closes} label="Closing time" />
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ "--rd": "90ms" } as CSSProperties}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-cream/60">
              <Editable
                value={
                  settings.footerFindUsLabel ?? DEFAULT_COPY.footerFindUsLabel
                }
                path="footerFindUsLabel"
                label="Address column label"
              />
            </h3>
            <address className="mt-4 space-y-1.5 text-sm not-italic text-cream/85">
              <div>
                <Editable
                  value={settings.addressLine1}
                  path="addressLine1"
                  label="Street address"
                />
              </div>
              <div>
                <Editable
                  value={settings.addressLine2}
                  path="addressLine2"
                  label="City, state, zip"
                />
              </div>
              {settings.phone ? (
                <div>
                  <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>
                    <Editable
                      value={settings.phone}
                      path="phone"
                      label="Phone number"
                    />
                  </a>
                </div>
              ) : null}
              {settings.email ? (
                <div>
                  <a href={`mailto:${stegaClean(settings.email)}`}>
                    <Editable
                      value={settings.email}
                      path="email"
                      label="Email address"
                    />
                  </a>
                </div>
              ) : null}
            </address>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-cream/40 px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-cream hover:text-navy"
            >
              <Editable
                value={
                  settings.footerDirectionsCta ??
                  DEFAULT_COPY.footerDirectionsCta
                }
                path="footerDirectionsCta"
                label="Directions button label"
              />
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <p className="mt-4 text-sm text-cream/70">
              <Editable
                value={settings.footerVisitLine ?? DEFAULT_COPY.footerVisitLine}
                path="footerVisitLine"
                label="Line above the tourism link"
              />{" "}
              <a
                href="https://www.visithaywood.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-cream/85 underline decoration-amber/50 underline-offset-4 hover:text-amber-bright"
              >
                Visit Haywood County
              </a>
            </p>
          </div>
          <div style={{ "--rd": "180ms" } as CSSProperties}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-cream/60">
              <Editable
                value={
                  settings.footerFollowLabel ?? DEFAULT_COPY.footerFollowLabel
                }
                path="footerFollowLabel"
                label="Social links column label"
              />
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
          © {new Date().getFullYear()}{" "}
          <Editable
            value={settings.name ?? "Blue Ridge Beer Hub"}
            path="name"
            label="Business name"
          />{" "}
          ·{" "}
          <Editable
            value={settings.footerLegal ?? DEFAULT_COPY.footerLegal}
            path="footerLegal"
            label="Small print"
          />
        </p>
      </div>
    </footer>
  );
}
