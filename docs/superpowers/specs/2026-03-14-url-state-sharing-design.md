# URL State & Sharing

## Summary

Store all calculator settings in the URL `#` fragment using short-key query parameters. Add Share and Save buttons to let users copy/bookmark their configuration. Update the page title to reflect key settings.

## URL Hash Format

All 16 inputs are serialized as short-key params in the hash fragment. The hash is NOT updated live — only when the user clicks Share or Save.

| Key | Input ID | Type | Example |
|-----|----------|------|---------|
| `wc` | wheelCirc | number | 2109 |
| `rl` | rolloutLimit | number | 6.73 |
| `mb` | maxBlock | number | 3 |
| `cr` | chainrings | comma-separated ints | 34,36,38,39,40,42,44,46,48,50 |
| `cs` | cassette | comma-separated ints | 11,12,13,14,15,17,19,21,24,28 |
| `cd` | cadence | number | 90 |
| `dm` | displayMetric | string enum | rollout |
| `aw` | angleWarn | number | 1.5 |
| `ad` | angleDanger | number | 2.5 |
| `eh` | excludeHighAngle | 1 or 0 | 1 |
| `cl` | chainstay | number | 410 |
| `ci` | chainlineInner | number | 41 |
| `co` | chainlineOuter | number | 46 |
| `ho` | hubOLD | number | 130 |
| `lc` | locknutToCog | number | 3.5 |
| `cp` | cogPitch | number | 3.95 |

Example URL: `#wc=2109&rl=6.73&mb=3&cr=34,36,38&cs=11,12,13,14&cd=90&dm=rollout&aw=1.5&ad=2.5&eh=1&cl=410&ci=41&co=46&ho=130&lc=3.5&cp=3.95`

## Page Title

Updated on every `recalculate()` call:

```
Youth Bike Gear Calculator — {chainring}T, {cassette-min}-{cassette-max}, {category}
```

- **Chainring**: the selected (or top-ranked) configuration's chainring size
- **Cassette range**: min and max from the cassette input
- **Category**: "Youth A" if limit=7.18, "Youth B" if limit=6.73, "Youth C" if limit=6.34, otherwise the raw limit (e.g. "6.50m")

## UI: Share and Save Buttons

Two buttons placed in the header area near the subtitle.

### Share Button
1. Serialize all inputs to hash params
2. Set `window.location.hash`
3. Copy full URL to clipboard via `navigator.clipboard.writeText()`
4. Show brief "Copied to clipboard!" feedback (text change on button, reverts after ~2 seconds)

### Save Button
1. Serialize all inputs to hash params
2. Set `window.location.hash`
3. Show a toast/message: "Bookmark this page to save your settings (Ctrl+D / Cmd+D)"

## Page Load Behaviour

On page load, before the initial `recalculate()`:
1. Check if `window.location.hash` is non-empty
2. Parse short-key params from the hash
3. For each recognized key, set the corresponding input's value
4. Invalid or missing keys are silently ignored (inputs keep their HTML default values)

## Implementation Notes

- All logic lives in `gear-calculator.html` (single-file app, no external dependencies)
- Three new functions: `serializeToHash()`, `loadFromHash()`, `updatePageTitle()`
- `updatePageTitle()` called at the end of `recalculate()`
- `loadFromHash()` called once before the initial `recalculate()` on DOMContentLoaded
- Share/Save buttons call `serializeToHash()` then their respective secondary action
