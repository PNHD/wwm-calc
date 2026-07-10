# Design System Audit

## Summary

- Components reviewed: application shell, navigation, gear inventory, build panel, simulation panel and analysis modal.
- Current product score: 28/100.
- Main structural issue: presentation and calculation state are combined in a 7,028-line App component.
- Styling issue: 324 inline style blocks and 492 hardcoded color occurrences across legacy stylesheets.

## Findings

| Area | Current issue | Product rebuild decision |
|---|---|---|
| Navigation | Multiple successive tab treatments | Replace with one ProductNavigation component |
| Gear | Card component optimized for a grid | Replace with EquippedSlotRail and GearTable |
| Build | Sidebar children reordered with CSS | Render a dedicated BuildWorkspace |
| Simulation | Banner, assumptions and stats share sidebar ordering | Render a dedicated CombatWorkspace |
| Analysis | Modal with horizontal tab overflow | Render a full-page OptimizeWorkspace |
| Tokens | Legacy variables plus hundreds of raw values | New product tokens are the only source for new components |
| Copy | DPS terms vary between screens | Standardize Formula ceiling, Modeled estimate, Recorded parse |
| Accessibility | Clickable divs and tiny controls remain | New components use native controls and 44px mobile targets |

## Migration Rule

No legacy visual class is permitted inside `src/product/`. Product components receive calculated values and callbacks from App through typed props. Legacy UI remains temporarily available only until each workspace is migrated and verified.

