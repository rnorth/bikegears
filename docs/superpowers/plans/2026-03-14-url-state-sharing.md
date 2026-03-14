# URL State & Sharing Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add URL hash-based state persistence, Share/Save buttons, and dynamic page titles to the bike gear calculator.

**Architecture:** Three new JS functions (`serializeToHash`, `loadFromHash`, `updatePageTitle`) added to the `<script>` block in `gear-calculator.html`. Two new buttons in the header. A key mapping array drives serialization/deserialization to keep the code DRY.

**Tech Stack:** Vanilla JS, no dependencies.

**Spec:** `docs/superpowers/specs/2026-03-14-url-state-sharing-design.md`

---

## Chunk 1: Core Implementation

### Task 1: Add key mapping and serialization/deserialization functions

**Files:**
- Modify: `gear-calculator.html:292-300` (top of `<script>` block)

- [ ] **Step 1: Add the key mapping and `serializeToHash()` function**

Add after the `const $ = id => ...` line (line 293), before the `inputIds` array:

```javascript
// URL hash parameter mapping: [shortKey, inputId, type]
// type: 'n' = number, 's' = string, 'c' = checkbox (1/0), 'l' = comma-separated list
const hashKeyMap = [
  ['wc', 'wheelCirc', 'n'],
  ['rl', 'rolloutLimit', 'n'],
  ['mb', 'maxBlock', 'n'],
  ['cr', 'chainrings', 'l'],
  ['cs', 'cassette', 'l'],
  ['cd', 'cadence', 'n'],
  ['dm', 'displayMetric', 's'],
  ['aw', 'angleWarn', 'n'],
  ['ad', 'angleDanger', 'n'],
  ['eh', 'excludeHighAngle', 'c'],
  ['cl', 'chainstay', 'n'],
  ['ci', 'chainlineInner', 'n'],
  ['co', 'chainlineOuter', 'n'],
  ['ho', 'hubOLD', 'n'],
  ['lc', 'locknutToCog', 'n'],
  ['cp', 'cogPitch', 'n'],
];

function serializeToHash() {
  const params = hashKeyMap.map(([key, id, type]) => {
    const el = $(id);
    const val = type === 'c' ? (el.checked ? '1' : '0') :
                type === 'l' ? el.value.replace(/\s+/g, '') :
                el.value;
    return key + '=' + encodeURIComponent(val);
  });
  window.location.hash = params.join('&');
}

function loadFromHash() {
  const hash = window.location.hash.slice(1); // remove leading #
  if (!hash) return;
  const params = new URLSearchParams(hash);
  hashKeyMap.forEach(([key, id, type]) => {
    if (!params.has(key)) return;
    const val = params.get(key);
    const el = $(id);
    if (type === 'c') {
      el.checked = val === '1';
    } else {
      el.value = val;
    }
  });
}
```

- [ ] **Step 2: Verify** — Open the page in a browser, open the console, run `serializeToHash()`. Confirm the URL hash updates with all parameters. Then reload the page with that hash and confirm inputs are populated from it.

- [ ] **Step 3: Commit**

```bash
git add gear-calculator.html
git commit -m "Add URL hash serialization and deserialization"
```

---

### Task 2: Add `loadFromHash()` call on page load

**Files:**
- Modify: `gear-calculator.html` (near line 647, before the `recalculate()` call)

- [ ] **Step 1: Call `loadFromHash()` before the initial `recalculate()`**

Change the end of the script (line 647) from:

```javascript
// Initial calculation
recalculate();
```

to:

```javascript
// Load settings from URL hash (if present), then run initial calculation
loadFromHash();
recalculate();
```

- [ ] **Step 2: Verify** — Manually construct a URL with `#wc=2000&rl=7.18&cd=100` and load it. Confirm wheel circ is 2000, rollout limit is 7.18, cadence is 100, and all other inputs retain their HTML defaults.

- [ ] **Step 3: Commit**

```bash
git add gear-calculator.html
git commit -m "Load settings from URL hash on page load"
```

---

### Task 3: Add dynamic page title

**Files:**
- Modify: `gear-calculator.html` (add function in script block, call from `recalculate()`)

- [ ] **Step 1: Add `updatePageTitle()` function**

Add after the `loadFromHash()` function:

```javascript
function updatePageTitle() {
  const cogs = parseList('cassette');
  const limit = parseFloat($('rolloutLimit').value);
  const category = limit === 7.18 ? 'Youth A' : limit === 6.73 ? 'Youth B' : limit === 6.34 ? 'Youth C' : limit + 'm';
  const cogRange = cogs.length ? cogs[0] + '-' + cogs[cogs.length - 1] : '';
  // Use selected config's chainring, or fall back to first chainring input
  const selRow = document.querySelector('.ranking-table tr.selected');
  const chainring = selRow ? selRow.querySelector('td:nth-child(2)').textContent.trim() : (parseList('chainrings').pop() || '') + 'T';
  document.title = 'Youth Bike Gear Calculator — ' + chainring + ', ' + cogRange + ', ' + category;
}
```

- [ ] **Step 2: Call `updatePageTitle()` at the end of `recalculate()`**

Add `updatePageTitle();` as the last line inside the `recalculate()` function (after the `updatePresetHighlights()` call).

- [ ] **Step 3: Verify** — Change inputs and confirm the browser tab title updates. Check that selecting different configurations in the ranking table updates the chainring in the title on the next recalculate.

- [ ] **Step 4: Commit**

```bash
git add gear-calculator.html
git commit -m "Add dynamic page title with chainring, cassette range, and category"
```

---

### Task 4: Add Share and Save buttons

**Files:**
- Modify: `gear-calculator.html` (HTML header area + styles + script)

- [ ] **Step 1: Add button styles**

Add to the `<style>` block (before the closing `</style>`):

```css
.share-save-buttons { display: flex; gap: 8px; margin-top: 8px; }
.share-save-buttons button { font-size: 0.8rem; padding: 5px 12px; border: 1px solid var(--border); border-radius: 4px; cursor: pointer; background: var(--card); color: var(--text); transition: background 0.15s, color 0.15s; }
.share-save-buttons button:hover { border-color: var(--accent); color: var(--accent); }
```

- [ ] **Step 2: Add buttons to the HTML**

Add after the closing `</p>` of the subtitle (line 109), before the disclaimer div:

```html
<div class="share-save-buttons">
  <button id="shareBtn" onclick="shareConfig()">Share</button>
  <button id="saveBtn" onclick="saveConfig()">Save</button>
</div>
```

- [ ] **Step 3: Add `shareConfig()` and `saveConfig()` functions**

Add after the `updatePageTitle()` function:

```javascript
function shareConfig() {
  serializeToHash();
  navigator.clipboard.writeText(window.location.href).then(() => {
    const btn = $('shareBtn');
    btn.textContent = 'Copied to clipboard!';
    setTimeout(() => { btn.textContent = 'Share'; }, 2000);
  });
}

function saveConfig() {
  serializeToHash();
  const btn = $('saveBtn');
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  btn.textContent = 'Bookmark this page (' + (isMac ? '⌘' : 'Ctrl+') + 'D)';
  setTimeout(() => { btn.textContent = 'Save'; }, 3000);
}
```

- [ ] **Step 4: Verify**
  - Click Share: URL hash should update, clipboard should contain the full URL, button should show "Copied to clipboard!" for 2 seconds.
  - Click Save: URL hash should update, button should show bookmark hint for 3 seconds with correct shortcut for the OS.
  - Reload the page with the hash URL — all settings should restore.

- [ ] **Step 5: Commit**

```bash
git add gear-calculator.html
git commit -m "Add Share and Save buttons for URL-based config sharing"
```
