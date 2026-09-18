# Seela — school staff portal prototype

A working, clickable prototype of a K–12 school staff portal with three connected
portals — **Medical**, **Wellbeing** and **Safeguarding** — built around one shared
student record. Everything runs on dummy data held in memory in the browser: there
is no backend, no authentication server, and no real student data. It exists to show
school leaders what the system would feel like to use, not to be a finished product.

## Running it

```bash
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`). There is nothing to
configure and nothing to sign in with — the prototype opens straight into the
**Today** screen as Emily Carter, the senior designated safeguarding lead.

`npm run build` produces a static production build in `dist/`.

## The five personas

Use the **demo: switch role** control (bottom of the sidebar, and again under
**Settings → Demo controls**) to move between them. Switching role changes what is
visible on every screen — nothing is hidden by hiding the whole feature, most of it
is hidden by genuinely filtering the data model.

| Persona | Role | What they can do |
|---|---|---|
| **Emily Carter** | Senior designated safeguarding lead | Full read and write access across both campuses: sets levels of concern, closes cases, authorises contact-home exceptions, reads the full audit log. |
| **Dan Whitfield** | Designated safeguarding lead, Boys School | Triages reports, proposes a level of concern, reads every safeguarding case on his own campus, reads the audit log for his campus. |
| **Priya Nair** | School nurse | Full read and write access to medical records for every student. No access to wellbeing or safeguarding beyond the plain-language guidance line. |
| **Tom Reilly** | Head of Year 9 and pastoral lead | Full wellbeing access for Year 9, summary medical access, and safeguarding access only for cases he is assigned to. |
| **Sarah Ahmed** | Class teacher | Can raise a concern for any student. Otherwise sees only the plain-language guidance line for her own students — no underlying medical, wellbeing or safeguarding records. |

The exact capability matrix is rendered live at **Settings → Permissions** — the same
table as below, but generated from the single `can(role, action, resource)` map the
whole app consults (`src/lib/permissions.ts`), so it can never drift out of sync with
the real behaviour.

## Demo controls

Three controls, all clearly marked, so a live walkthrough never touches real state:

- **Switch role** — the dropdown in the sidebar and in Settings.
- **Advance the clock by a day** — moves the prototype's virtual "now" forward.
  Used to show a due-today reminder become overdue, and an overdue action on an
  elevated or immediate case escalate to the senior DSL.
- **Reset dummy data** — restores every case, record and the clock to the start of
  the demo. Confirmation required; cannot be undone within the session.

## A five-minute demo sequence

1. **Today**, as Emily Carter — a quiet landing screen with nothing competing for
   attention, showing what's overdue, due today, and newly assigned.
2. Open **Sophie Brennan** from anywhere (search, ⌘K) → her **student profile**.
   Walk the tabs: Overview (plain guidance only), Timeline (the unified,
   cross-portal chronology), Safeguarding (the actual case).
3. Switch role to **Sarah Ahmed** (teacher) and reopen Sophie's timeline — most
   entries now render as **redacted rows**, and the Safeguarding tab is **locked**.
   This is the single most important idea in the whole prototype: one student
   record, with the access boundary enforced per section, not per screen.
4. As Sarah Ahmed, click **Raise a concern** in the sidebar and file a report on
   any student — four short steps, a locked account after submission, and a plain
   confirmation that names who it went to.
5. Switch to **Dan Whitfield** and open **Safeguarding → Triage queue** — triage
   the report you just filed: set a level, assign an owner.
6. Open **Omar Haddad**'s timeline (as Emily Carter) to see the **attendance
   overlay** sit visibly under a cluster of nurse visits and the **system pattern
   flag** it produces — acknowledge or dismiss it and note it never reads as a
   decision the system made.
7. Open **Sophie Brennan's case** and try **Close case** — it blocks on the four
   closure conditions and says exactly which are unmet.
8. Use **advance the clock by a day**, then look at **Today** as Emily Carter — an
   action on Sophie's case becomes overdue and **escalates** to her because the
   owner hasn't acted.
9. Open **Activities → Al-Ula residential trip** — the flagship cross-portal
   screen: plain-language guidance for every attending student, drawn from all
   three portals, never exposing an underlying case.
10. **Settings → Audit log** (DSL and senior DSL only) — every view and change,
    read back as a plain sentence, with "who has viewed this case" visible
    directly on the case screen itself.

## The six students worth knowing

- **Layla Al-Otaibi** (Y9) — severe nut allergy with an emergency protocol, on the
  Al-Ula trip. Shows medical guidance surfacing into an activity.
- **Omar Haddad** (Y7) — drifting attendance, three nurse visits for vague stomach
  pain, one pastoral note. Nothing alone; together it's the pattern flag.
- **Sophie Brennan** (Y11) — the worked safeguarding case: open, elevated, contact
  home logged, a review due, one action overdue.
- **Yusuf Rahman** (Y5) — Type 1 diabetes with a full healthcare plan and lunchtime
  medication.
- **Hana Nakamura** (Y10) — counselling referral in progress, a running support
  plan with two goals.
- **Daniel Okoro** (Y8) — two closed concerns from last term, a third raised
  yesterday, sitting untriaged with a recurrence flag.

## Architecture

- **Stack**: React + TypeScript + Vite, Tailwind v4 (tokens defined as an
  `@theme` block in `src/index.css`, not scattered hex values), React Router,
  Recharts for the reporting views only (code-split so it doesn't weigh down
  every other route), `date-fns`, Lucide icons. No component library — every
  component in `src/components/ui` is built from scratch for this design system.
- **State**: one `AppProvider` (`src/context/AppContext.tsx`) holding all data in
  a single reducer, seeded once from `src/lib/fixtures.ts`. No browser storage of
  any kind — a full reload resets to the seed, by design.
- **Permissions**: `src/lib/permissions.ts` exports one map, one `perms(role)`
  lookup and a handful of pure `can…` helpers. Every screen and control consults
  it directly rather than re-implementing role logic locally.
- **The virtual clock**: `src/lib/clock.ts` anchors "now" to a fixed date rather
  than the real wall clock, so seeded data like "review due tomorrow" stays true
  regardless of when the demo is actually run. The clock-advance demo control
  moves an offset forward from that anchor.
- **Layout**: `src/pages` for top-level and shared screens, `src/portals/{medical,wellbeing,safeguarding}`
  for portal-specific screens, `src/components/ui` for the shared component set.

## Decisions made where the brief left something open

- **Closure conditions.** The brief asks for "four closure conditions" without
  naming them. Implemented as: every assigned action is completed; contact with
  home has been recorded (or an authorised exception is on file); at least one
  review has taken place; and a closure statement has been written. Each is
  checked live in the close-case modal, with a link to what's missing.
- **Contact-home exceptions.** A DSL can record an exception, but it sits as
  "awaiting authorisation" until a senior DSL — the only role with
  `authoriseContactException` — signs off, demonstrating the exception route as a
  genuinely separate, gated path rather than the same form with a checkbox.
- **Reporting access.** The brief doesn't gate the Reporting portal by role.
  It's hidden from the Teacher persona (aggregate case statistics aren't
  something a class teacher's job requires) and shown to every other role.
- **Documents tab.** Shown on the student profile per the spec, but since file
  upload is explicitly out of scope, it's a labelled empty state rather than a
  half-built feature.
- **Contrast over the literal token table.** Section 2 of the brief specifies
  exact hex values for every token, and section 8 separately requires 4.5:1 body
  text contrast and 3:1 for interface boundaries. A few combinations in the
  literal table don't clear those bars against each other (`line-strong` on
  white was 1.76:1; `caution` and `steady` text on their own tint backgrounds
  were 4.10:1 and 4.31:1). Since accessibility is listed as a non-negotiable,
  contrast won that conflict: `line-strong` was darkened from `#C8C3B4` to
  `#9C927A` (now 3.09:1), and `caution-deep` / `steady-deep` variants were added
  for small badge and banner text on tint backgrounds. Every other token in the
  brief's table is used exactly as specified.
- **Wellbeing scope for a pastoral lead.** "Full, own year" is read as: full
  detail for students in the pastoral lead's year group, and a locked banner
  (same visual treatment as the safeguarding boundary) for students outside it,
  rather than hiding the whole Wellbeing tab — a pastoral lead should be able to
  tell the boundary exists.

## What's intentionally not here

Real authentication, MIS integration, server-side file upload, email/SMS
delivery, parent-facing screens, and AI inference — all explicitly out of scope
in the brief. Where production would use AI to surface a pattern, this prototype
shows a clearly labelled system flag drawn from the dummy data instead (see
Omar Haddad's timeline), with acknowledge/dismiss actions and no wording that
implies the system decided anything.
