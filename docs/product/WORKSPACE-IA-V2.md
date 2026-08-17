# Workspace IA V2

## Goal

WWM Build Lab now treats PvE and Guild War as separate product workspaces. The redesign changes information architecture and presentation only; verified Global T96 damage formulas, Bamboocut calibration, Silkbind-Jade behavior, OCR parsing, GvG mechanics, objective rules, EX values and Attunement semantics remain unchanged.

## Before → after

| Previous surface | Workspace V2 location |
| --- | --- |
| Build | PvE / Build |
| Gear Analyzer | PvE / Gear |
| Gear Compare | PvE / Compare |
| Best Build | PvE / Best Build |
| Combat / Details | PvE / Combat |
| Simulation | PvE / Simulation |
| Rotations | PvE / More & Advanced / Rotations |
| Skill Editor | PvE / More & Advanced / Skill Editor |
| Team | PvE / More & Advanced / Team |
| Profile / import / export | PvE / More & Advanced / Import / Export |
| Guild War tab | Guild War / Overview |
| GvG Build Lab | Guild War / Builds |
| Roster 30 | Guild War / Roster |
| Strategy | Guild War / Strategy |
| Timeline & Sim | Guild War / Timeline and Guild War / Objectives |
| Commander | Guild War / More & Advanced / Commander / Fun Coin |
| Duelist & Healer | Guild War / More & Advanced / Duelists / Healer Lab |
| Match Log | Guild War / Match Log |
| GvG Share | Guild War / More & Advanced / Share Plan |

## Global shell

The global header contains brand, the first-class `PvE | Guild War` workspace switch, current Global/Tier context, active character selector and global data/share actions. Detailed scenario controls remain inside their owning workspace.

Desktop uses a persistent context navigation rail. PvE pages can expose a collapsible context inspector with current build, modeled DPS, scheme, Inner Ways and the next action. Guild War does not force a second inspector over pages that already own selection detail, especially Strategy.

## PvE primary journey

`Overview → Build → Gear → Compare → Best Build → Combat → Simulation`

The Overview surfaces build identity, modeled DPS, input health and three next actions. It intentionally does not invent menu-panel numbers that the shell does not own; exact static and conditional values remain in Combat.

Gear Compare is decision-first: modeled result and delta, then Why, then advanced menu/combat/evidence diagnostics. Diagnostic data remains available but no longer precedes the recommendation.

## Guild War primary journey

`Overview → Roster → Builds → Strategy → Timeline → Objectives → Match Log`

The Overview reads only already persisted GvG workspace facts (roster availability, role assignments, strategy positions, configured timeline, command starting balance and match-log count). It does not derive a universal GvG score.

Strategy is map-first. The existing battle map, roster/assets and selected-object detail are retained while the global GvG header/tab chrome is removed inside the new shell.

## Progressive disclosure

Primary navigation contains only core workflow pages. Rotations, Skill Editor, Team, Import/Export, Commander/Fun Coin, Duelist/Healer and sharing are under More & Advanced or context actions. Evidence and model assumptions remain accessible in their owning tools rather than dominating normal decision flow.

## Responsive behavior

- Desktop (1181+): full context rail; PvE context inspector; map-first GvG strategy.
- Tablet (761–1180): compact icon rail, no permanently forced inspector, large strategy canvas with side panels.
- Mobile (≤760): no shrunken desktop sidebar; workspace switch remains at top and each workspace gets a five-item bottom navigation. More opens a drawer. Strategy becomes a single-column planning surface in portrait and returns to a three-pane, map-first layout in landscape.

## Route and state compatibility

The current static-hosting architecture is preserved. Workspace routes use safe hashes such as `#pve/gear` and `#gvg/strategy` rather than server-path routes that could break Cloudflare Pages refreshes. Unknown legacy hashes are left untouched. Existing `gvg-share=` links remain authoritative and are not rewritten.

Shell navigation state is stored separately in `wwm_product_shell_v2`. Existing GvG state remains in `wwm_gvg_workspace_v1`; the redesign does not overwrite it. Switching workspaces hides the other workspace without mutating its product data.

## Accessibility

Workspace and page navigations have explicit accessible names and current states. Interactive controls use semantic buttons, keyboard-visible focus rings and text labels in addition to color. The mobile More surface is a labeled dialog. The existing GvG controls and map semantics remain intact.
