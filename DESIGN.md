# TaskForge — Design: "engineering logbook"

Dense, calm, utilitarian. Paper and ink, hairline rules, one signal color. Information first,
decoration never. Every value below lives in `client/src/styles/tokens.css`. Components never use
raw colors, sizes or timings.

## Color

Each token is defined once with `light-dark()`. `color-scheme` on `:root` picks the side: the OS
setting by default, or `data-theme="light" | "dark"` from the theme toggle. Every text pair is at
least 4.5:1 on every surface, including row hover. Input borders (`--rule-strong`) are at least
3:1 on paper.

| token               | light     | dark (warm charcoal) | use                                    |
| ------------------- | --------- | -------------------- | -------------------------------------- |
| `--paper`           | `#F4F1E8` | `#1C1B18`            | app background                         |
| `--paper-2`         | `#ECE8DC` | `#232220`            | sidebar, panel                         |
| `--paper-hover`     | `#E9E4D7` | `#292724`            | row hover, keyboard cursor row         |
| `--paper-input`     | `#FAF8F2` | `#1F1E1B`            | text inputs                            |
| `--ink`             | `#1D1B17` | `#EAE4D8`            | primary text                           |
| `--ink-2`           | `#555048` | `#B4AD9F`            | secondary text, labels                 |
| `--ink-3`           | `#655F55` | `#9C9588`            | meta, mono hints, placeholders         |
| `--rule`            | `#D8D2C4` | `#36332E`            | 1px hairlines (decorative)             |
| `--rule-strong`     | `#8C8577` | `#6E685E`            | input borders, control boundaries      |
| `--signal`          | `#B5361A` | `#EE7455`            | primary action, focus ring, High       |
| `--signal-ink`      | `#FBF8F1` | `#1C1B18`            | text on signal                         |
| `--signal-wash`     | `#F3DED6` | `#3A2620`            | text selection, error field background |
| `--status-open`     | `#4E6672` | `#9AAFB9`            | slate                                  |
| `--status-progress` | `#7E5A18` | `#D1A65A`            | ochre                                  |
| `--status-closed`   | `#55684F` | `#9BB094`            | sage                                   |

Dark mode is tuned separately rather than inverted. Its neutrals are warmer, the vermilion is
lifted, and the status hues get lighter rather than more saturated.

## Type

- UI: IBM Plex Sans, weights 400 and 500. Weight 600 is used only for the project name.
- Mono: IBM Plex Mono, for issue numbers, timestamps, counts, column headers and keyboard hints.
- Tabular numerals everywhere.
- Hebrew text falls back to the system's Hebrew sans. User text renders with `dir="auto"`.

| token          | size / line | use                                    |
| -------------- | ----------- | -------------------------------------- |
| `--text-micro` | 11 / 16     | kbd hints, column headers (mono, caps) |
| `--text-meta`  | 12 / 16     | meta, timestamps, counts               |
| `--text-body`  | 13 / 20     | table, sidebar, controls (default)     |
| `--text-read`  | 15 / 24     | issue description (measure ≤ 68ch)     |
| `--text-title` | 18 / 24     | issue title in the detail panel        |
| `--text-head`  | 22 / 28     | project name                           |

## Space and layout (4px grid)

- Spacing tokens: `--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 20 · `--s-6` 24 · `--s-8` 32 · `--s-10` 40.
- Heights: header 56, toolbar 40, table row 32, controls 28.
- Widths: sidebar 232, detail panel 480 (420 below 1200px).
- Below 768px the sidebar moves into a drawer and the detail panel goes full-screen.
- The table and toolbar respond to the width of the issues column (container queries), not the
  window, so opening the panel adapts them too: under 800px status becomes a select, under
  760px Created drops, under 560px Priority drops and status shows only its glyph.

## Shape and elevation

- `--radius-1` 2px for inputs, kbd and checkboxes. `--radius-2` 4px for buttons, menus and
  popovers. The table, panel and sidebar are square.
- Structure comes from 1px `--rule` lines. Surfaces have no shadows.
- One elevation, for floating menus only: `--elev-menu`, a hairline ring plus a short, faint drop.
- Focus: 2px solid `--signal` with a 1px offset, on `:focus-visible` only.

## Motion

| token     | value | use                       |
| --------- | ----- | ------------------------- |
| `--dur-1` | 120ms | hover, color changes      |
| `--dur-2` | 160ms | menus, popovers, overlays |
| `--dur-3` | 180ms | panel and drawer slide    |

- Easing: `--ease-out` is `cubic-bezier(.2, .8, .2, 1)`.
- Panels move at most 12px (`--panel-shift`).
- `prefers-reduced-motion` sets every duration and the shift to 0.

## Rules

- No gradients, blur, emoji, pill badges, or shadows on surfaces.
- Icons: 16px with a 1.5px stroke, inline SVG (`components/ui/icons.tsx`). Use them only where
  text alone is weaker: close, menu, more, search, sort direction, and the status and priority
  glyphs.
- Status is a 12px circle (hollow, half, full) plus its word. Priority is three bars plus its
  word. Only High's bars use the signal color; the word stays ink.
- Closed issues recede: their titles drop to `--ink-2`.
- One vermilion action per view: New issue in the header. Secondary actions (Create in
  quick-add, Retry, Clear filters) are outlined or quiet.
- Bold is rare: 500 for labels and active controls, 600 for the project name only.
- Copy is terse and specific: say what happened and what to do next. Timestamps are relative,
  with the absolute time on hover.
