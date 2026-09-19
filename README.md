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
| **Sarah Ahmed** | Class teacher, form tutor of 11S | Can raise a concern for any student. Otherwise sees the plain-language guidance line only for her own class (11S) — no underlying medical, wellbeing or safeguarding records — unless she switches on **duty mode**, which widens that to any student for the length of a cover period, a trip or a duty shift. |

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

1. **Today**, as Emily Carter — the three portals (Wellbeing, Safeguarding,
   Medical) front and centre as big cards, each with a one-line stat and a red
   count badge when something in it needs attention. Below that: what's overdue,
   due today, and newly assigned.
2. **Registration**, choose a school (Middle Schools) and class (7B) — today's
   register for that class, with a quick **Flag** button on every row. This is
   the natural everyday flagging moment: a teacher taking the register notices
   something and raises it on the spot, without leaving the screen.
3. Open **Sophie Brennan** from anywhere (search, ⌘K, or from her class in
   Registration) → her **student profile**. Walk the tabs: Overview (plain
   guidance only), Timeline (the unified, cross-portal chronology),
   Safeguarding (the actual case).
4. Switch role to **Sarah Ahmed** (teacher) and reopen Sophie's timeline — most
   entries now render as **redacted rows**, and the Safeguarding tab is **locked**.
   This is the single most important idea in the whole prototype: one student
   record, with the access boundary enforced per section, not per screen.
   Open **Layla Al-Otaibi** (Year 9, not Sarah's class) and notice her allergy
   guidance is now locked too — Sarah only sees guidance for her own class
   (11S) by default. Switch on **duty mode** in the sidebar and reopen Layla —
   the same allergy guidance a teacher covering her would need is now visible.
5. As Sarah Ahmed, click **Raise a concern** in the sidebar. File a report either
   by typing a name or by choosing a school and class to browse — four short
   steps, a locked account after submission, and a plain confirmation that
   names who it went to. On the "others present" step, type `@` to tag a
   colleague or another student from a grouped, filterable picker.
6. Switch to **Dan Whitfield** and open **Safeguarding → Triage queue** — triage
   the report you just filed: set a level, assign an owner.
7. Open **Omar Haddad**'s timeline (as Emily Carter) to see the **system pattern
   flag** it produces from three nurse visits and a real attendance drop —
   acknowledge or dismiss it and note it never reads as a decision the system
   made.
8. Open **Sophie Brennan's case** and try **Close case** — it blocks on the four
   closure conditions and says exactly which are unmet.
9. Use **advance the clock by a day**, then look at **Today** as Emily Carter — an
   action on Sophie's case becomes overdue and **escalates** to her because the
   owner hasn't acted.
10. Open **Activities → Al-Ula residential trip** — the flagship cross-portal
    screen: plain-language guidance for every attending student, drawn from all
    three portals, never exposing an underlying case.
11. **Settings → Audit log** (DSL and senior DSL only) — every view and change,
    read back as a plain sentence, with "who has viewed this case" visible
    directly on the case screen itself.
12. **House points** — pick a student, tap a reason (Effort, Kindness,
    Teamwork, Leadership, Achievement), done. The three house totals (Safa,
    Marwa, Arafat) update live with a leaderboard and a running feed of who
    gave what to whom. The same one-tap panel is also available as a **Points**
    button on every row in Registration.
13. **Reporting → Cases by level of concern** — click a bar and land on the
    register filtered to that exact level; the same works for the category
    chart, the staff-spread chart, and the average-time stat tiles. Every
    list-screen filter (level, status, owner, category, school, class,
    reported by) lives in the URL, so a filtered view can be copied and sent
    to a colleague.

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
- **Registration, and dropping the attendance overlay.** An early version put an
  attendance bar chart directly behind the unified timeline; live feedback was
  that it didn't read well merged into a case chronology. Attendance now lives
  in its own **Registration** screen (school → class → today's register, with a
  flag button on every row — a genuine everyday moment to raise a concern), and
  the timeline instead relies on the system pattern flag's own sentence (e.g.
  "three nurse visits and a 15 percentage point attendance drop") to carry that
  signal. Registration itself is deliberately not one of the three home-page
  portal cards: taking a register isn't something you'd ever "flag" the way you
  flag a wellbeing, safeguarding or medical concern.
- **School and class filters.** "School" here means the tier a year group sits
  in on the Misk Schools curriculum map — Junior Schools, Upper Primary Schools,
  Middle Schools, Senior Schools (`src/lib/school.ts`) — derived from
  `yearGroup`, not the Girls/Boys campus already in the brief's own staff table.
  Both now exist as complementary filters. They replace name-only search as the
  primary way to find a student in Raise a concern, Registration, and the
  safeguarding register, while keeping the name search for when you already
  know who you're looking for.
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
- **"Own students" made real.** This was originally stubbed as "true for any
  student a teacher looks up" — a placeholder that quietly gave every teacher
  guidance visibility over the whole school. `Staff.homeroomOf` now names the
  classes a teacher actually teaches (Sarah Ahmed is form tutor of 11S), and
  `canSeeStudentGuidance` checks a looked-up student's tutor group against it.
  Because a teacher's job genuinely does need to widen sometimes — cover, a
  trip, a break duty — there's a duty-mode toggle in the sidebar (visible only
  to roles with a scoped guidanceScope) that lifts the restriction for as long
  as it's on, with a locked banner explaining the boundary when it's off.
- **House points.** Not in the original brief; added on request. Houses (Safa,
  Marwa, Arafat) get their own token family (`--color-safa/marwa/arafat`),
  deliberately distinct from the portal accents and the urgent/caution/steady
  semantics so the two systems never get read as related. Awarding is
  one tap once a student is picked — reason buttons carry a preset point value
  (Kindness/Effort +3, Teamwork/Leadership +5, Achievement +10) rather than a
  separate amount picker, on the view that a second decision is a second
  reason to not bother. It's reachable from its own page and, since the
  moment a teacher is most likely to want it is while taking the register,
  from a **Points** button on every Registration row.
- **Reporting drill-down and URL-synced filters.** The brief asks for list-
  screen filters that "persist in the URL so a view can be shared with a
  colleague" (section 7) — implemented as a small `useQueryParam` hook and
  wired into the safeguarding register. Reporting's charts and stat tiles
  now read as entry points into that same filtered register rather than a
  dead end: click a bar, land on exactly the cases behind it.
- **Fixed: raising a concern from a known student.** Flagging a student from
  Registration or a profile page used to still ask "who is this about?" —
  the student id arrived via the URL but the wizard didn't use it to skip
  ahead. It now opens straight on "what happened" with the student shown in
  a persistent header (and a "change student" link), instead of re-asking a
  question the click already answered.
- **Home contact log (Phase 0 for the iSAMS gap).** iSAMS logs the first
  outbound email to a parent, but every reply or follow-up call happens off
  system, through a staff member's own inbox — so it's never evidenced.
  Rather than building a full parent-comms/chat/video platform up front, this
  is a deliberately smaller first step: `HomeContact` (`src/lib/types.ts`) is
  a portal-agnostic, case-independent record any member of staff can create
  for any student, shown on the profile's new **Home communication** card and
  folded into the unified timeline as a fourth, non-routable
  `TimelinePortal` value (`'communication'` — see `src/lib/timeline.ts` and
  `src/lib/portal-theme.ts`) so it never disturbs the three real portals'
  routing or theming.
  A first pass at this asked staff to fill in a form after the fact, which
  just moves the busywork rather than removing it. The real prior art —
  CPOMS and MyConcern's Outlook/Gmail add-ins — solves this with near-zero
  effort: one click on the email you're already looking at, versus a
  zero-click mailbox watcher that auto-matches replies to a student by parent
  email address. The prototype mirrors both: **Log this email** opens a
  prefilled, one-click confirm (`source: 'logged'`); **Simulate: parent
  replied** shows the zero-click path, landing an entry with no staff action
  at all (`source: 'auto-captured'`), against a simulated per-student
  logging address shown on the card. Full parent chat/video remains a
  larger, separate bet, not attempted here.
- **AI call prep.** Also on the Home communication card: a "Prep for this
  call" button that synthesises points to raise, cautions, and recent
  context from every module the current viewer already has permission to
  see (flags, readable safeguarding cases, medical/wellbeing records if
  granted, and the home-contact history) — see `src/lib/callPrep.ts`. It
  reuses the exact same permission-scoped data a screen would already show
  (`canReadCase`, `canSeeStudentGuidance`, `permissions.medical/wellbeing`)
  rather than widening access, so a teacher never sees more through call
  prep than they'd see anywhere else in the app — verified by switching
  roles on the same student (a senior DSL sees the open case detail; a
  class teacher gets a "safeguarding history you can't see — check with the
  DSL" caution instead). It's a deterministic, rule-based synthesis, not a
  model call: a prototype of the feature's *shape* (pull every module into
  one briefing) rather than of natural-language generation.

## What's intentionally not here

Real authentication, MIS integration, server-side file upload, email/SMS
delivery, parent-facing screens, and real AI inference — all explicitly out
of scope in the brief. Where production would use AI to surface a pattern or
prep a conversation, this prototype shows clearly labelled, rule-based
output drawn from the dummy data instead — a system flag (see Omar Haddad's
timeline) or the "Prep for this call" panel — with no wording that implies
a model generated it or that the system decided anything.
