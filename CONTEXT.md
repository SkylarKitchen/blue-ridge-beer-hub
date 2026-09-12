# Blue Ridge Beer Hub

The one-page website of a taproom and bottle shop in Waynesville, NC, kept up to date by its two owners through a visual editor. Every term here is one the owners can read; the guide at `/guide` uses the same words.

## Language

### The page

**Home Page**:
The single document that lists the sections of the homepage, top to bottom. Reordering, hiding, adding, and removing sections all happen here.
_Avoid_: page builder, layout, homepage config

**Section**:
One stacked element of the homepage. Every section has a kind, can be hidden, and can be moved anywhere in the stack.
_Avoid_: block, module, component, template

**Section kind**:
What a section is: Top of page, Events, On tap, What we offer, Photos, About, Feature, or Mountain divider.
_Avoid_: block type, section template

**Feature section**:
A reusable section of words plus one to three photos, with an optional "just in" list and an optional button. Its photo layout follows the photo count.
_Avoid_: showcase, spotlight, template section

**To Go**:
The Feature section about the coolers: cans, bottles, cases, and build-your-own packs to carry out. The first Feature section on the site.
_Avoid_: carryout section, bottle shop section, coolers section

**Just in list**:
The short owner-typed list inside a Feature section of what is newly stocked, with an optional "list updated on" date. An empty list hides itself.
_Avoid_: inventory, arrivals, new arrivals feed

**Hidden section**:
A section kept on the Home Page but taken off the site with "Hide for now". It keeps its words and photos for when it comes back.
_Avoid_: disabled, unpublished section, draft section

**Menu label**:
The name a section shows in the menu across the top of the site. Empty means the usual name, or no menu entry for kinds that are not normally in the menu.
_Avoid_: nav title, anchor label

**Mountain divider**:
The soft ridgeline graphic placed between sections.
_Avoid_: ridgeline, separator, spacer

**Fixed chrome**:
The parts of the site that are not sections and cannot move: the announcement banner, the header with the menu, and the hours footer.
_Avoid_: layout, shell

### Business information

**Site Settings**:
The document holding everything that appears once: name, address, phone, email, hours, social links, the announcement banner, and who gets the flyer email.
_Avoid_: config, globals, settings page

**Announcement banner**:
The optional colored strip across the very top of the site for short-lived news.
_Avoid_: alert, notice, ticker

**Gallery Photo**:
One photo in the Photos section, kept as its own entry under Structure with a description and a position.
_Avoid_: image, asset, media

**Event**:
A dated happening at the Hub. Past events drop off the site on their own.
_Avoid_: show, gig, listing

**Weekly Event**:
Something that happens on the same day every week, shown as "Every Thursday".
_Avoid_: recurring event, regular

**The robot**:
The overnight process that reads the monthly flyer posted to Facebook, drafts the events it finds, and emails the owners a one-tap publish link. The owners' name for it; use it with them.
_Avoid_: pipeline, ingest, cron (in owner-facing text)

### Editing

**Draft**:
Changes only editors can see. Nothing reaches visitors until it is published.
_Avoid_: pending, unsaved

**Publish**:
Making a draft live for visitors.
_Avoid_: deploy, push, save

**Editing on the page**:
Clicking words on the site preview inside the editor and typing over them.
_Avoid_: inline editing, in-place editing, visual editing (in owner-facing text)
