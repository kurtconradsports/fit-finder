# Latin America Fit Finder (MVP)

Standalone, mobile-first static web app built against **Fit-Finder-PRD v1.2** (frozen scope).
Plain HTML/CSS/JS — no build step, no dependencies, no backend.

## Files

| File | What it is | Edit it? |
|---|---|---|
| `rules.js` | **All countries, elimination rules, thresholds, tags, copy, links, official-source URLs.** | **Yes — this is the only file you should need to touch.** |
| `index.html` | Page shell + meta/OG tags. | Only for `<head>` meta/OG changes. |
| `styles.css` | §14 design layer (dark editorial, mobile-first). | Only for visual changes. |
| `app.js` | Verdict engine, rendering, share card, analytics, self-test. | No copy lives here. |

## Editing rules & copy

Open `rules.js`. Everything is commented. Key points:

- **Two verdict states only** (PRD §4): `ELIMINATED_HARD_CONFLICT` fires when every
  condition in an elimination's `when` matches the user's answers. Everything else is
  `SURVIVES_WITH_CONTEXT`.
- **Survivor notes**: first entry whose `when` matches wins; `default: true` is the
  fallback. Order matters.
- **Tags** are non-verdict context chips. They explain, never rank.
- Save and refresh — no rebuild.

## Adding a country

> Reminder: the PRD's **build gate** blocks extra countries until five qualified
> tester sessions are done. When that gate opens, this is the procedure.

The engine, tile grid, survivor count, result templates, and share card all read
the country list dynamically — adding a country is a `rules.js` edit, no code
changes. Paste this into the `countries` array and fill it in:

```js
{
  id: "peru",                     /* lowercase snake_case, unique */
  name: "Peru",
  /* Eliminations fire ONLY on documented legal route conflicts (PRD §4) —
     never affordability. Leave the array empty if it never eliminates. */
  eliminations: [
    {
      when: { residency: ["permanent"], income: ["remote", "self_employed"] },
      nonNegotiable: "permanent-residency goal",   /* fills “hard-failed your {nonNegotiable}” */
      reason: "Full factual sentence shown on the eliminated tile.",
      why: "short clause for the surprise line — “…hard-failed your X — {why}.”",
      cardHeadline: "Peru ruled out for my permanent move — <one-line documented fact>.",
      source: { label: "Official source name", url: "https://…" }
    }
  ],
  source: { label: "Official source for the survivor line", url: "https://…" },
  /* First entry whose `when` matches wins; `default: true` is the fallback.
     Order matters. Tags must exist in the `tags` map above. */
  survivorNotes: [
    {
      when: { income: ["pension"] },
      tags: [],
      line: "Route note for this answer combination."
    },
    {
      default: true,
      tags: [],
      line: "No hard route conflict on these answers — verify the route matching your income type."
    }
  ]
}
```

**Checklist — the four spots that don't update themselves:**

1. **Surprise priority** — if the country can eliminate, add its `id` to
   `surprise.eliminationPriority` in `rules.js` (position = how surprising its
   elimination is). Survive-only countries need nothing here.
2. **`copy.surpriseNoFlags` in `rules.js`** says *"all six remain worth
   investigating"* — update the count. (Only reachable when nothing is
   eliminated and no survivor carries a tag, but it's live copy.)
3. **Self-test coverage in `app.js`** — the seventh country will NOT fail the
   existing checks, but it gets no named coverage. If it should never eliminate,
   add its `id` to the `["mexico", "ecuador", "uruguay"]` never-eliminates list
   in `selfTest()` (two occurrences). Optionally add a named check for its
   elimination combo, mirroring the "Michael" block. Then reload and confirm
   `[ff] self-test PASS` in the console.
4. **Share-card survivors line in `app.js` (`drawCard`)** clips at two wrapped
   lines. Six survivor names fit; with 8–9 survivors the list may truncate.
   Cosmetic only — check a no-elimination result's card if the list grows.

Items 3–4 are the only ones that touch `app.js`, and both are optional-but-recommended
rather than required for the country to work.

## Deploying

**Live now (since 2026-07-03):** https://kurtconradsports.github.io/fit-finder/
served by GitHub Pages from the public repo
https://github.com/kurtconradsports/fit-finder (branch `main`, root).

This folder (inside expat-escape-ops) is the working copy. To ship an update:
copy the five files into a clone of the public repo, commit, push — Pages
redeploys automatically in ~1 minute:

```bash
git clone https://github.com/kurtconradsports/fit-finder /tmp/ff && \
cp index.html styles.css app.js rules.js README.md /tmp/ff/ && \
cd /tmp/ff && git commit -am "update" && git push
```

It would also work on any other static host (Netlify, Cloudflare Pages) or
opened directly as a file (`index.html`).

## Analytics

**Live dashboard: https://expatescape.goatcounter.com** — log in as
kurtconradsports@gmail.com (password in expat-escape-ops `config/secrets.env`,
`GOATCOUNTER_PASSWORD`; change it after first login). Pageviews are counted
automatically; the §8 events appear under the "events" filter as paths
(`finder_start`, `result_reached`, `surprise_elimination_shown/colombia`, …).
Caveats: adblockers block GoatCounter (undercounts, like every client-side
tool), localhost hits are ignored (safe for dev), and `page_view` is covered
by GoatCounter's automatic pageview rather than the custom event.

All §8 events fire through one `track()` function in `app.js`. Besides
GoatCounter it also forwards to **Plausible**, **gtag**, or **GTM dataLayer**
if their snippet is present on the page — add a provider's `<script>` tag to
`index.html` and events flow with zero code changes. Events also accumulate
in `window.__ffEvents` for debugging.

Events: `page_view`, `finder_start`, `q1_answered`–`q4_answered`, `result_reached`,
`surprise_elimination_shown`, `share_clicked`, `cta_clicked`, `worksheet_clicked`,
plus `load_speed`.

## Self-test

The PRD §4 sanity checks run automatically on every page load and log to the console
(`[ff] self-test PASS`). Run manually: `FitFinder.selfTest()` in the browser console.
It verifies:

- **"Michael"** (permanent · remote · $3–4.5k · couple) → Colombia/Costa Rica/Panama
  eliminated; Mexico/Ecuador/Uruguay survive; surprise = Colombia.
- **Retiree reshuffle** (permanent · pension) → all six survive.
- All 240 answer combinations: Mexico/Ecuador/Uruguay never eliminate, every
  elimination carries a documented reason + source, strictly two verdict states.

## ⚠ Before public launch

1. ✅ **Done 2026-07-03** — the three eliminating rules (Colombia, Costa Rica,
   Panama) carry verified legal-instrument sources with `lastVerified` dates.
   Mexico/Ecuador remain best-effort (they never eliminate).
2. ✅ **Done 2026-07-03** — `links.audit` (live Fit Audit page), `links.calendly`,
   and `links.worksheet` (live Shortlist landing page with `utm_source=fit_finder`)
   all set and tested. The worksheet funnel captures email via the site's
   lead-magnet plugin → Mailchimp (audience "The Expat Escape Plan Subscribers",
   tag `lead-magnet-shortlist`) → worksheet emailed immediately by the site.
3. ~~Known PRD discrepancy~~ **Resolved 2026-07-03:** the §4 table (tag stops at
   $2–3k) and the §4 "Michael" sanity line ($3–4.5k couple carries it) disagreed;
   Kurt ruled the sanity line wins. Uruguay's `budget_pressure` fires up to
   $4,500/mo for couples/families, and the self-test asserts it for Michael.

## Interpretation notes (within §4, flagged for review)

- **Colombia survivors:** the `temporary_route_only` tag + nomad-visa line applies when
  income is remote/self-employed; pension/savings survivors get a neutral
  "pension/investment routes exist" line instead (showing nomad-visa copy to a retiree
  would misread). Both lines are editable in `rules.js`.
- **Costa Rica / Panama survivors** on remote income + temporary goal carry
  `temporary_route_only` (the route is factually a stay, not residency).
