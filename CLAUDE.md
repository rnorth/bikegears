# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Deploy

```bash
mise run build    # Copies gear-calculator.html → public/index.html
mise run deploy   # Builds and deploys to Cloudflare Pages
```

Deployment requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets (set in GitHub Actions for CI; set locally for manual deploys).

## Architecture

This is a **single-file web app** — all application logic lives in `gear-calculator.html`. The `public/index.html` is the built artifact (do not edit it directly). There is no framework, bundler, or test suite.

### Core Domain Logic (all in `gear-calculator.html`)

- **Rollout** = (chainring ÷ cog) × wheel circumference (meters)
- **Gear speed** = rollout × cadence × 60 ÷ 1000 (km/h)
- **Chain angle** = calculated from chainstay length and chainring/cog lateral positions; used to optionally exclude cross-chaining combinations
- **Cog blocking** = simulates derailleur H-limit screw, blocking the N smallest cogs

The calculator ranks all valid chainring + cog-blocking combinations by how close their maximum rollout is to the racing limit (Youth A/B/C categories), then displays a gear table and speed chart for the selected configuration.

### UI structure

Two-panel layout: left panel = inputs, right panel = ranked configurations table + detail view (gear table, metrics, speed bar chart). Input changes trigger debounced recalculation (150ms).

## Deployment Infrastructure

- Cloudflare Pages project: `bikegears`, output dir: `./public`
- GitHub Actions (`.github/workflows/deploy.yml`): auto-deploys on push to main; creates PR preview deployments with auto-updating PR comments
