# CLAUDE.md

Standing instructions for this repository. Read this before writing any code.

## What this is

A staff portal for K–12 schools, holding three connected portals: **Medical**, **Wellbeing** and **Safeguarding**. One student record underneath all three.

This is a north star prototype running on dummy data. No backend, no real student data, no MIS integration. Build the best version of the idea, not the minimum one.

## The one rule

**A member of staff must be able to use this with no training, no workshop and no manual.**

If a screen needs explaining, the screen is wrong. Redesign it rather than adding help text. When you are choosing between two implementations, choose the one a Year 4 teacher would understand at 7:45am on a Monday.

Every other rule in this file is downstream of that one.

## Who uses this

| Persona | Technical confidence | What they need |
| --- | --- | --- |
| Class teacher | Low | To log a concern in under a minute, and to know what to be mindful of with today's class |
| Head of year / pastoral lead | Medium | To see a student's picture over time and run support plans |
| School nurse | Low to medium | To record a visit fast, and to keep healthcare plans current |
| Designated safeguarding lead (DSL) | Medium | To triage, own cases, and never lose track of one |
| Senior DSL | Medium | Oversight: what is stalled, what is escalating, what is closing properly |

Design for the first and the last. The middle three follow.

## Grounding in practice

This is a safeguarding product before it is a software product. The model must reflect how schools are actually held to account.

- The case lifecycle is: report, triage, decide, act, safeguard, review, evidenced closure. Never shortcut it.
- **Open to log, tight to read.** Any adult can raise a concern. What can be read afterwards is narrow and role-bound.
- One named owner on every case at every moment. There is no state where a case belongs to "the team".
- A concern record is evidence. Once submitted, the account is locked; corrections are appended, never overwritten.
- Nothing waits on a meeting. Every case carries a clock, and silence escalates on its own.
- Closure is evidenced, not asserted: actions have outcomes, contact home is recorded or a recorded exception is authorised, and a named person writes why it is closed.
- Information sharing follows need-to-know. No screen shows more about a child than the person's job requires.
- Where the system infers a pattern, it flags and a human decides. The interface must never look as though software made a judgement about a child.

## Writing the interface

Copy is design here. Get it wrong and everything else fails.

- British English. Sentence case for every heading, label and button. Never title case.
- Say **"level of concern"**, never "risk". Anywhere. In code, in comments, in the interface.
- Say "student", not "pupil" or "child".
- Dates read `17 Sep 2026`. Times `08:14`. Never relative-only: "2 days ago (15 Sep)".
- No acronyms without their meaning on first use on that screen. DSL, IHP, SDSL all get expanded.
- Buttons say what happens: "Raise a concern", "Close this case", not "Submit" or "OK".
- Errors say what to do, not what went wrong. "Choose a date in the past" beats "Invalid date".
- Empty states say what this space is for and offer the action. Never an empty box.
- Destructive or irreversible actions are stated plainly before the click: "You will not be able to edit this account after submitting."

## Design tokens

All colour, type and spacing go through Tailwind theme tokens. **Never a raw hex in a component.**

Neutrals: `canvas #FAF9F5` · `surface #FFFFFF` · `surface-sunken #F2F0E9` · `line #E2DFD5` · `line-strong #C8C3B4` · `ink #1A1A17` · `ink-body #42423C` · `ink-muted #6B6B61`

Portal accents, as `base / deep / tint`:

- Medical — `#0F766E / #0A5750 / #E4F0EE`
- Wellbeing — `#3F7B52 / #2E5C3D / #E7F0E8`
- Safeguarding — `#33447E / #25325F / #E7EAF4`

Semantic: `urgent #A32A2A` · `caution #A66300` · `steady #2F7D4F` · `info #2C5E8A`

Rules:

- The accent occupies roughly five per cent of any view. Never flood a screen with it.
- The three portals differ **only** by accent, portal mark and header band. Structure, spacing and components are identical. Staff must never feel they moved to a different product.
- **Never colour alone.** Every level, status and flag carries a text label as well.

Type: Public Sans only, tabular numerals for all figures and dates. Never Inter, Roboto or Arial. Page title 28/600, section 19/600, card 16/600, body 15/400/1.55, label 13/500, micro 12/400. Nothing below 12px. Running text capped at 68 characters.

Spacing: 8px scale only — 4, 8, 12, 16, 24, 32, 48, 64. Radius 8 inputs and buttons, 12 cards, 16 modals. Cards use a hairline border, not a shadow. One soft shadow, modals and popovers only.

Motion: 150ms ease-out for state, 200ms for panels. No bounce, no parallax, nothing decorative. Honour `prefers-reduced-motion`.

## Components

Build the shared set once in `src/components/ui` and reuse. Never style a one-off inside a screen.

`AppShell` `PortalHeader` `PageHeader` `Card` `DataTable` `FilterBar` `SearchField` `StudentChip` `LevelBadge` `StatusPill` `Timeline` `TimelineEvent` `ActionItem` `PersonAvatar` `Drawer` `Modal` `Tabs` `EmptyState` `Toast` `AuditEntry` `FormField` `DatePicker` `Select` `TextArea` `ConfirmDialog` `Banner` `RoleSwitcher`

Every component ships with default, hover, focus, active, disabled, loading, empty and error states. Keep `/kitchen-sink` as a route showing all of them; update it whenever you add a component.

## Accessibility — WCAG 2.2 AA, not optional

- Semantic elements always. A `button` is a `<button>`. Never a click handler on a `div`.
- Every input has a real `<label>`. Placeholders are not labels.
- Visible focus everywhere: 2px ring in the portal accent, with offset. Never remove the outline.
- Every flow completable by keyboard alone. Focus trapped in modals, returned on close, Escape closes.
- Contrast 4.5:1 body, 3:1 for large text and interface boundaries. Check every accent on its own tint.
- One `<h1>` per screen, heading ladder never skips a level. Skip-to-content link present.
- Live regions for toasts, alert counts and validation. Errors tied to their field and announced.
- Touch targets 44px minimum.

## Permissions and audit

- One permissions map. One helper: `can(role, action, resource)`. Every screen and control asks it. Never scatter role checks through components.
- Three restriction treatments, used deliberately: **hidden** (portals the role cannot enter), **locked** (a card saying who to contact, on the safeguarding tab), **redacted** (timeline rows showing date and portal only).
- Search returns nothing the current role cannot read, and gives no count hinting it exists.
- Every view, create, edit, permission change and export writes an `AuditEvent`. Reads matter as much as writes.
- Audit entries read as plain sentences: "Dan Whitfield viewed Sophie Brennan's case, 16 Sep 2026 at 08:14".

## Code conventions

- React + TypeScript + Vite. Tailwind with tokens in theme. React Router. Lucide icons. Recharts. date-fns.
- No component library. We build our own so the identity is ours.
- State in context with a reducer, seeded from one fixtures file. Types in `src/types`, fixtures in `src/data`.
- **No browser storage APIs.** Everything in memory, with a visible demo reset.
- No `any`. Discriminated unions for record types.
- Components small and single-purpose. Logic in hooks, not in JSX.
- Commit at each completed step of the build order. Keep the app running at every commit.

## Never

- Never invent a safeguarding practice to fill a gap. Flag it and ask.
- Never show a case record to a role that cannot read it, including in counts, previews, search or tooltips.
- Never let a pattern flag read as a decision. It flags, a human decides, and the dismissal reason is recorded.
- Never allow a case to close without all four closure conditions satisfied.
- Never allow an edit to a submitted account. Append only.
- Never use the word "risk", raw hex, a spacing value off the scale, or colour as the only signal.
- Never add a tooltip or help text to rescue a confusing screen. Fix the screen.

## Before you call a screen done

1. Could a non-technical teacher use this with no explanation?
2. Does every element on it earn its place, or is something there because it seemed useful?
3. Every state handled: loading, empty, error, overdue, restricted?
4. Keyboard only, start to finish?
5. Contrast checked, no meaning carried by colour alone?
6. Copy in British English, sentence case, plain, no jargon, no "risk"?
7. Permissions asked through `can()`, and audit written?
8. Works at 1280, 768 and 375?

If any answer is no, it is not done.

## When this file and a task instruction disagree

This file wins on practice, permissions, copy and accessibility. The task wins on scope and priority. If the conflict is real, say so before building rather than choosing silently.
