# Design Reference

`reference-dashboard.jpg` (user-provided screenshot, 1280×885) is the **locked visual target**
for UMESH SMARTBILL. Palette + tokens in `../PLAN.md §9` and `../ui-mockups.md §A` are derived from it.

Observed layout DNA (all screens must follow this):
- 240px dark emerald sidebar, always-on; brand block top-left (icon chip + wordmark, two lines: "UMESH" / "SMARTBILL" in letterspaced caps)
- Business switcher card (logo mark + name + branch subtitle) → then WORKSPACE / (later ACCOUNT) section labels, tiny uppercase muted
- Active nav item = filled primary-green rounded-lg row with white text; hover = white 6% overlay
- Smart-tip box anchored bottom of sidebar; "Settings" + data-safety footnote at very bottom
- Top bar: 420px pill search with `⌘K` badge, right cluster = language toggle (हिंदी | EN), bell, avatar+name+role circle-button
- Content: `Hello, Umesh!` 24px bold + one muted line; two ghost buttons top-right with the primary "New Bill" (shows `F2` kbd chip)
- 4 KPI stat cards: tinted icon chip left, label + trend badge top, big mono number, muted sub-line
- Row 2: Sales Performance (2/3) + Quick Actions (1/3, 4 rows w/ tinted icons and chevrons)
- Row 3: Recent Bills table (4/3) + Low Stock alert list (1/3, count badge)
- Cards: white, 1px #E4EBE8 border, 12px radius, no drop shadow except dropdowns/modals
