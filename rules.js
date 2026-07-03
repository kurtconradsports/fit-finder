/* =====================================================================
   LATIN AMERICA FIT FINDER — RULES & COPY (v1.2)
   =====================================================================
   THIS IS THE ONLY FILE YOU EDIT. All countries, elimination rules,
   thresholds, tags, copy, links, and official-source URLs live here.
   index.html / styles.css / app.js never need to change for a copy or
   rules update — save this file and refresh the page.

   HOW MATCHING WORKS
   - Answers object: { residency, income, budget, household } with the
     values listed under "questions" below.
   - An elimination fires ONLY when every key in its "when" matches
     (the user's answer is in that key's list). Per PRD §4, eliminations
     are documented legal route conflicts only — never affordability.
   - survivorNotes: the FIRST entry whose "when" matches wins; the entry
     with "default: true" is the fallback. Order matters.
   - Tags are non-verdict context. They explain; they never rank.

   ⚠ VERIFY BEFORE PUBLIC LAUNCH (PRD §4 footnote): the source URLs and
   route classifications below are from the July-3 2026 cross-check.
   If a route reclassifies, the tool's core claim changes with it.
   ===================================================================== */

window.FIT_RULES = {

  copy: {
    headline: "Which Latin American countries survive your non-negotiables?",
    subhead: "Start with what has to work — not beaches, rankings, or somebody else’s dream.",
    disclaimer: "approx · verify with a consulate or lawyer for your situation",
    microDisclaimer: "approx · verify with a consulate or lawyer for your situation",
    progressPrompt: "The tiles respond live. Answer all four to see your result.",
    progressPartial: "{answered} of 4 answered — the tiles are already responding.",

    statusSurvives: "Survives",
    statusEliminated: "Ruled out — route conflict",
    conflictPrefix: "Conflicts with your",

    resultHeadlinePlural: "{n} countries survive your non-negotiables: {list}.",
    resultHeadlineSingular: "1 country survives your non-negotiables: {list}.",
    surpriseTemplate: "{country} looked attractive but hard-failed your {nonNegotiable} — {why}.",
    surpriseNoElimination: "Nothing hard-failed your answers — the biggest thing to verify: {country} — {line}",
    surpriseNoFlags: "Nothing hard-failed your answers — all six remain worth investigating. Verify each route against your own numbers.",
    handoff: "The Finder shows what survives. The Fit Audit narrows these to your strongest two and names the cities.",

    ctaButton: "See What This Means for My Actual Move",
    ctaPromise: "The free result shows which countries survive. The Fit Audit narrows your survivors to the strongest two, names the specific cities to investigate in each, checks the residency math against your actual numbers, and flags what to verify — as a private walkthrough built for your situation. $99.",
    shareButton: "Share my result",
    shareFallbackToast: "Card downloaded · link copied",
    worksheetLink: "Get the free framework worksheet",
    recruitLine: "Building this with real movers. Got 15 minutes to tell me what’s missing?",
    recruitLinkText: "Grab a slot"
  },

  links: {
    /* EDIT THESE before launch */
    audit: "https://theexpatescapeplan.com/latin-america-fit-audit/",
    calendly: "https://calendly.com/kurtconrad/15min",
    worksheet: "#WORKSHEET-URL"  /* placeholder — set or leave; link hides itself while it starts with # */
  },

  questions: [
    {
      id: "residency", analyticsKey: "q1", urlKey: "r",
      label: "Your residency goal",
      options: [
        { value: "permanent",     label: "Permanent roots are essential" },
        { value: "several_years", label: "Several years is enough" },
        { value: "temporary",     label: "I only need a temporary base" },
        { value: "unsure",        label: "Not sure yet" }
      ]
    },
    {
      id: "income", analyticsKey: "q2", urlKey: "i",
      label: "Your income situation",
      options: [
        { value: "remote",        label: "Remote employment" },
        { value: "self_employed", label: "Self-employed / business income" },
        { value: "pension",       label: "Pension or retirement" },
        { value: "savings",       label: "Savings / investments" },
        { value: "unsure",        label: "Still figuring it out" }
      ]
    },
    {
      id: "budget", analyticsKey: "q3", urlKey: "b",
      label: "Your monthly living budget",
      options: [
        { value: "under_2k",  label: "Under $2,000" },
        { value: "b2k_3k",    label: "$2,000–$3,000" },
        { value: "b3k_4500",  label: "$3,000–$4,500" },
        { value: "over_4500", label: "More than $4,500" }
      ]
    },
    {
      id: "household", analyticsKey: "q4", urlKey: "h",
      label: "Who’s moving?",
      options: [
        { value: "solo",   label: "Just me" },
        { value: "couple", label: "Couple" },
        { value: "family", label: "Family with children" }
      ]
    }
  ],

  /* Non-verdict context tags. Chips render identically for every tag —
     no colors that imply one survivor beats another. */
  tags: {
    temporary_route_only:   { label: "temporary route only" },
    budget_pressure:        { label: "budget pressure" },
    consulate_verification: { label: "verify consulate figure" },
    dependent_requirement:  { label: "dependent requirement" }
  },

  countries: [
    {
      id: "mexico",
      name: "Mexico",
      eliminations: [],  /* never eliminates (MVP) */
      source: {
        label: "gob.mx — SRE, Visa de Residencia Temporal (SRE260)",
        url: "https://www.gob.mx/tramites/ficha/visa-de-residencia-temporal/SRE260"
      },
      survivorNotes: [
        {
          default: true,
          tags: ["consulate_verification"],
          line: "Temporary Resident up to 4 yrs, can convert to permanent — but the financial requirement is consulate-set and varies. Confirm with the specific consulate."
        }
      ]
    },

    {
      id: "costa_rica",
      name: "Costa Rica",
      eliminations: [
        {
          when: { residency: ["permanent"], income: ["remote", "self_employed"] },
          nonNegotiable: "permanent-residency goal",
          reason: "The remote-worker category is classified No Residente / Estancia — a non-resident stay, not a route to permanence.",
          why: "its remote-worker category is classified No Residente / Estancia — a non-resident stay, not a route to permanence",
          cardHeadline: "Costa Rica ruled out for my permanent move — the remote-worker category is a non-resident stay.",
          source: {
            label: "PGR / Migración Costa Rica — Estancia (No Residente) classification",
            url: "https://www.migracion.go.cr/"
          }
        }
      ],
      source: {
        label: "PGR / Migración Costa Rica — Estancia (No Residente) classification",
        url: "https://www.migracion.go.cr/"
      },
      survivorNotes: [
        {
          when: { income: ["pension"] },
          tags: [],
          line: "The pensionado route is a documented pension-income path toward residency — verify the current income requirement."
        },
        {
          when: { income: ["remote", "self_employed"] },
          tags: ["temporary_route_only"],
          line: "The remote-worker Estancia allows the stay — as a non-resident category, not residency. Fits a temporary base."
        },
        {
          default: true,
          tags: [],
          line: "No hard route conflict on these answers — verify the route matching your income type."
        }
      ]
    },

    {
      id: "panama",
      name: "Panama",
      eliminations: [
        {
          when: { residency: ["permanent"], income: ["remote", "self_employed"] },
          nonNegotiable: "permanent-residency goal",
          reason: "This short-stay remote-worker route (up to 9 months, renewable) does not itself provide a path to permanent residence. Panama has strong long-term options — just not via this route.",
          why: "its short-stay remote-worker route (up to 9 months, renewable) does not itself provide a path to permanent residence",
          cardHeadline: "Panama ruled out for my permanent move — the remote-worker route is a short stay, not residency.",
          source: {
            label: "ProPanamá — Visa de Nómadas Digitales",
            url: "https://propanama.gob.pa/"
          }
        }
      ],
      source: {
        label: "ProPanamá — Visa de Nómadas Digitales",
        url: "https://propanama.gob.pa/"
      },
      survivorNotes: [
        {
          when: { income: ["pension"] },
          tags: [],
          line: "The pensionado route is a documented pension-income path toward residency — verify the current income requirement."
        },
        {
          when: { income: ["remote", "self_employed"] },
          tags: ["temporary_route_only"],
          line: "The remote-worker route covers up to 9 months (renewable) — a stay, not residency. Fits a temporary base."
        },
        {
          default: true,
          tags: [],
          line: "No hard route conflict on these answers — verify the route matching your income type."
        }
      ]
    },

    {
      id: "colombia",
      name: "Colombia",
      eliminations: [
        {
          when: { residency: ["permanent"], income: ["remote", "self_employed"] },
          nonNegotiable: "permanent-residency goal",
          reason: "Colombia’s digital-nomad visa is a Visitor (V) visa — up to 2 yrs, grants no residency status. Other routes exist; not this one, on remote income, toward permanence.",
          why: "its digital-nomad visa is a Visitor (V) visa that grants no residency status",
          cardHeadline: "Colombia ruled out for my permanent move — the digital-nomad visa grants no residency status.",
          source: {
            label: "Cancillería — Resolución 5477/2022 (Visa V)",
            url: "https://www.cancilleria.gov.co/tramites_servicios/visa"
          }
        }
      ],
      source: {
        label: "Cancillería — Resolución 5477/2022 (Visa V)",
        url: "https://www.cancilleria.gov.co/tramites_servicios/visa"
      },
      survivorNotes: [
        {
          when: { income: ["remote", "self_employed"] },
          tags: ["temporary_route_only"],
          line: "The digital-nomad (V) visa fits a temporary base — up to 2 years, but it grants no residency status."
        },
        {
          when: { income: ["pension", "savings"] },
          tags: [],
          line: "Pension and investment routes exist here toward residency — verify the current requirements for your income type."
        },
        {
          default: true,
          tags: [],
          line: "No hard route conflict on these answers — verify the route matching your income type."
        }
      ]
    },

    {
      id: "ecuador",
      name: "Ecuador",
      eliminations: [],  /* never eliminates (MVP) */
      source: {
        label: "Ministerio del Trabajo (SBU 2026) · immigration regulation",
        url: "https://www.trabajo.gob.ec/"
      },
      survivorNotes: [
        {
          when: { household: ["couple", "family"] },
          tags: ["dependent_requirement"],
          line: "Remote-worker pathway ≈ 3× the Basic Salary (2026 SBU $482 → ~$1,446/mo, +~$250/dependent); permanent residency possible after >21 months temporary."
        },
        {
          default: true,
          tags: [],
          line: "Remote-worker pathway ≈ 3× the Basic Salary (2026 SBU $482 → ~$1,446/mo, +~$250/dependent); permanent residency possible after >21 months temporary."
        }
      ]
    },

    {
      id: "uruguay",
      name: "Uruguay",
      /* NEVER eliminates (PRD v1.1+): affordability is a modeled judgment,
         not a documented legal fact. Warning tag only. */
      eliminations: [],
      source: null,
      survivorNotes: [
        {
          /* budget_pressure fires up to $4,500/mo for couples/families.
             (Resolved 2026-07-03: the PRD §4 table stopped at $2–3k, but the
             §4 “Michael” sanity check — $3–4.5k couple — expects the tag;
             Kurt ruled the sanity check wins.) */
          when: { budget: ["under_2k", "b2k_3k", "b3k_4500"], household: ["couple", "family"] },
          tags: ["budget_pressure"],
          line: "Uruguay is the highest-cost country on this list — at this budget with private healthcare, expect real pressure. Verify against a specific city."
        },
        {
          default: true,
          tags: [],
          line: "No hard route conflict on these answers. The highest-cost country on this list — verify costs against a specific city."
        }
      ]
    }
  ],

  surprise: {
    /* The shareable payload: the eliminated country the user most likely
       expected to like. Uruguay can never appear (never eliminates). */
    eliminationPriority: ["colombia", "costa_rica", "panama"],
    /* If nothing eliminated: strongest context flag, in this order. */
    contextPriority: ["budget_pressure", "consulate_verification", "dependent_requirement", "temporary_route_only"]
  },

  shareCard: {
    brand: "THE EXPAT ESCAPE PLAN",
    tool: "Latin America Fit Finder",
    survivorsPrefix: "My Latin America survivors: ",
    priorityPrefix: "My priority: ",
    noEliminationHeadline: "{n} Latin American countries survive my non-negotiables.",
    /* Per PRD §5: no private financial numbers on the card unless the user
       opts in. MVP never prints budget; priority = residency goal only. */
    shareText: "Which Latin American countries survive YOUR non-negotiables?"
  }
};
