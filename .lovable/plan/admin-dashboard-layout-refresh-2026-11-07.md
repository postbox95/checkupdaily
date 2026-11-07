# Admin Dashboard Layout Refresh

## Goal
Reorganize the existing admin screen to match the supplied Content Manager reference: clear brand sidebar navigation, a concise top bar, at-a-glance catalog counts, and a focused workspace for the selected management area.

## User-facing changes
- Replace the crowded row of tabs with a grouped, responsive left-side navigation for the existing management sections.
- Add a compact mobile navigation treatment so every section remains reachable on narrow screens.
- Keep the existing catalog counts visible as summary tiles and place the current section beneath them.
- Retain all current management forms, searches, actions, and access checks; do not invent overview, audit-log, or notification features absent from the app.

## Technical details
- Refactor the existing authenticated admin shell and reuse the current tab content panels as the active workspace.
- Use existing semantic color tokens and UI primitives, with a branded dark sidebar and clear active-navigation state.
- Preserve the current default section and verify navigation, layout at desktop/mobile sizes, tests, and preview build logs.