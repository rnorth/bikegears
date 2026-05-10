# Youth Bike Gear Calculator

A single-page tool for finding the optimal chainring and cog blocking configuration for youth bike racing gear limits (Youth A, B, and C categories).

## What it does

Youth bicycle racing enforces maximum rollout limits per category. This calculator helps you find the best legal setup for a given wheel size and cassette by:

- Calculating rollout and max speed for every chainring × cog-blocking combination
- Ranking configurations by how close their maximum rollout is to the category limit (closer = better)
- Showing a gear table with rollout, speed, and chain angle for each chainring/cog pair
- Visualising chain cross-angle per gear (green/amber/red) based on chainstay length and component positions
- Optionally excluding cross-chaining combinations from the legal maximum

**Cog blocking** simulates the derailleur's H-limit screw — blocking the N smallest (highest-speed) cogs — which is how youth categories enforce rollout limits in practice.

## Usage

The app is live at **[bikegears.rnorth.org](https://bikegears.rnorth.org)**.

Enter your bike's specs in the left panel (category, wheel size, chainring, cassette, chainstay length). The right panel updates instantly with ranked configurations and a detail view for the selected one.

Configurations can be shared via URL — the current inputs are encoded in the URL hash, and a **Save/Share** button copies a permalink to the clipboard.

## Development

**Prerequisites:** [mise](https://mise.jdx.dev/) for tool management.

```bash
# Install tools
mise install

# Build (copies gear-calculator.html → public/index.html)
mise run build

# Run tests
npm test

# Deploy to Cloudflare Pages (requires CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID)
mise run deploy
```

All application logic lives in `gear-calculator.html`. `public/index.html` is the build artifact — don't edit it directly.

Tests use [Playwright](https://playwright.dev/) and run against the source HTML file directly.

## Deployment

Cloudflare Pages project: `bikegears`. GitHub Actions auto-deploys on push to `main` and creates preview deployments for pull requests.

## License

BSD 4-Clause
