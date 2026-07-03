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

   CLAIM-LEVEL VERIFICATION (safety-critical)
   - Every elimination carries a `verification` block. A country can be
     HARD-ELIMINATED only when that block clears the evidence threshold in
     engine.js (status official_source_confirmed|attorney_reviewed + route,
     authority, official source, legal instrument, and a current check date).
     Anything less SURVIVES — an unverified claim can never rule a place out.
   - status values: official_source_confirmed · attorney_reviewed ·
     needs_review · expired. A needs_review/expired claim must NOT carry a
     lastChecked date (the validator fails the build if it does).
   - Colombia / Costa Rica / Panama: status official_source_confirmed, from
     operator-supplied legal instruments (2026-07-03). Independent attorney
     review still recommended (professionalVerificationRecommended: true).
   - Mexico / Ecuador: never eliminate; their survive-claim sources are
     needs_review (no confirmed date) — informational, not authoritative.
   - New research countries live behind settings.includeResearchCountries
     (default false) and never appear in production results.
   ===================================================================== */

var FIT_RULES = {

  /* Global switches. includeResearchCountries stays FALSE in production;
     app.js flips it true only in dev/preview mode, where research records
     are clearly labelled and blocked from authoritative verdicts. */
  settings: {
    includeResearchCountries: false,
    staleAfterDays: 400
  },

  copy: {
    headline: "Which Latin American countries survive your non-negotiables?",
    subhead: "Start with what has to work — not beaches, rankings, or somebody else’s dream.",
    disclaimer: "approx · verify with a consulate or lawyer for your situation",
    microDisclaimer: "approx · verify with a consulate or lawyer for your situation",
    progressPrompt: "The tiles respond live. Answer all four to see your result.",
    progressPartial: "{answered} of 4 answered — the tiles are already responding.",

    statusSurvives: "Survives",
    statusEliminated: "Ruled out — route conflict",
    statusResearch: "Research / Partial",
    conflictPrefix: "Conflicts with your",
    /* Shown on public Research/Partial tiles (Peru, Paraguay). */
    researchNotePublic: "Partial research: some routes are confirmed, but figures are still being verified. Shown for information only — it never rules a country out and isn’t counted as a confirmed result.",
    /* Shown only in dev/preview for still-hidden research countries (e.g. Brazil). */
    researchNoteDev: "Preview only. This country is still in research and is not shown to visitors or given a verdict.",

    resultHeadlinePlural: "{n} countries survive your non-negotiables: {list}.",
    resultHeadlineSingular: "1 country survives your non-negotiables: {list}.",
    surpriseTemplate: "{country} looked attractive but hard-failed your {nonNegotiable} — {why}.",
    surpriseNoElimination: "Nothing hard-failed your answers — the biggest thing to verify: {country} — {line}",
    surpriseNoFlags: "Nothing hard-failed your answers — every confirmed country remains worth investigating. Verify each route against your own numbers.",
    handoff: "The Finder shows what survives. The Fit Audit narrows these to your strongest two and names the cities.",

    ctaButton: "See What This Means for My Actual Move",
    ctaPromise: "The free result shows which countries survive. The Fit Audit narrows your survivors to the strongest two, names the specific cities to investigate in each, checks the residency math against your actual numbers, and flags what to verify — as a private walkthrough built for your situation. $99.",
    shareButton: "Share my result",
    shareFallbackToast: "Card downloaded · link copied",
    worksheetLink: "Get the free Shortlist Worksheet — emailed to you",
    recruitLine: "Building this with real movers. Got 15 minutes to tell me what’s missing?",
    recruitLinkText: "Grab a slot"
  },

  links: {
    /* All three verified live 2026-07-03. */
    audit: "https://theexpatescapeplan.com/latin-america-fit-audit/",
    calendly: "https://calendly.com/kurtconrad/15min",
    /* Live Shortlist Worksheet funnel: captures email via the site's
       expat-escape-lead-magnet plugin → Mailchimp (tag lead-magnet-shortlist,
       UTMs recorded in LMSOURCE/LMMEDIUM/LMCAMP) → worksheet emailed
       immediately by the site. End-to-end tested 2026-07-03. */
    worksheet: "https://theexpatescapeplan.com/latin-america-shortlist/?utm_source=fit_finder&utm_medium=referral&utm_campaign=finder_worksheet"
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
      research: false,
      eliminations: [],  /* never eliminates (MVP) */
      source: {
        label: "gob.mx — SRE, Visa de Residencia Temporal (SRE260)",
        url: "https://www.gob.mx/tramites/ficha/visa-de-residencia-temporal/SRE260"
      },
      /* Survive-claim metadata (informational; never eliminates). No
         confirmed check date → needs_review, so NO lastChecked. */
      verification: {
        status: "needs_review",
        routeName: "Residencia Temporal (SRE260)",
        claim: "Temporary Resident up to 4 yrs, convertible to permanent; financial requirement is consulate-set and varies.",
        governmentAuthority: "Secretaría de Relaciones Exteriores (SRE)",
        sourceTitle: "Visa de Residencia Temporal (SRE260)",
        sourceUrl: "https://www.gob.mx/tramites/ficha/visa-de-residencia-temporal/SRE260",
        legalInstrument: null,
        lastChecked: null,
        reviewedBy: null,
        reviewNotes: "Best-effort from July-3 cross-check; figures are consulate-set. Re-verify before this line does authoritative work.",
        confidence: "medium",
        professionalVerificationRecommended: true
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
      research: false,
      eliminations: [
        {
          when: { residency: ["permanent"], income: ["remote", "self_employed"] },
          nonNegotiable: "permanent-residency goal",
          reason: "The remote-worker category is classified No Residente / Estancia — a non-resident stay, not a route to permanence.",
          why: "its remote-worker category is classified No Residente / Estancia — a non-resident stay, not a route to permanence",
          cardHeadline: "Costa Rica ruled out for my permanent move — the remote-worker category is a non-resident stay.",
          source: {
            label: "Ley 10008 — Estancia para Trabajadores Remotos (DGME)",
            url: "https://www.migracion.go.cr/",
            lastVerified: "2026-07-03"
          },
          verification: {
            status: "official_source_confirmed",
            routeName: "Estancia para Trabajadores Remotos (No Residente)",
            claim: "The remote-worker category is classified No Residente / Estancia — a non-resident stay, not a route to permanent residence.",
            governmentAuthority: "Dirección General de Migración y Extranjería (DGME)",
            sourceTitle: "Ley 10008 — Estancia para Trabajadores Remotos",
            sourceUrl: "https://www.migracion.go.cr/",
            legalInstrument: "Ley 10008 (2021)",
            lastChecked: "2026-07-03",
            reviewedBy: "Kurt Conrad — operator-supplied legal instrument, 2026-07-03",
            reviewNotes: "Portal returns 403 to bots; loads in a normal browser. Independent attorney review recommended.",
            confidence: "high",
            professionalVerificationRecommended: true
          }
        }
      ],
      source: {
        label: "Ley 10008 — Estancia para Trabajadores Remotos (DGME)",
        url: "https://www.migracion.go.cr/",
        lastVerified: "2026-07-03"
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
      research: false,
      eliminations: [
        {
          when: { residency: ["permanent"], income: ["remote", "self_employed"] },
          nonNegotiable: "permanent-residency goal",
          reason: "This short-stay remote-worker route (up to 9 months, renewable) does not itself provide a path to permanent residence. Panama has strong long-term options — just not via this route.",
          why: "its short-stay remote-worker route (up to 9 months, renewable) does not itself provide a path to permanent residence",
          cardHeadline: "Panama ruled out for my permanent move — the remote-worker route is a short stay, not residency.",
          source: {
            label: "Decreto Ejecutivo 198 de 2021 — Visa de Corta Estancia para Trabajadores Remotos (SNM)",
            url: "https://www.migracion.gob.pa/",
            lastVerified: "2026-07-03"
          },
          verification: {
            status: "official_source_confirmed",
            routeName: "Visa de Corta Estancia para Trabajadores Remotos",
            claim: "The short-stay remote-worker route (up to 9 months, renewable) does not itself provide a path to permanent residence.",
            governmentAuthority: "Servicio Nacional de Migración (SNM)",
            sourceTitle: "Decreto Ejecutivo 198 de 2021 — Visa de Corta Estancia para Trabajadores Remotos",
            sourceUrl: "https://www.migracion.gob.pa/",
            legalInstrument: "Decreto Ejecutivo 198 de 2021",
            lastChecked: "2026-07-03",
            reviewedBy: "Kurt Conrad — operator-supplied legal instrument, 2026-07-03",
            reviewNotes: "Official portal reachable (HTTP 200). Independent attorney review recommended.",
            confidence: "high",
            professionalVerificationRecommended: true
          }
        }
      ],
      source: {
        label: "Decreto Ejecutivo 198 de 2021 — Visa de Corta Estancia para Trabajadores Remotos (SNM)",
        url: "https://www.migracion.gob.pa/",
        lastVerified: "2026-07-03"
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
      research: false,
      eliminations: [
        {
          when: { residency: ["permanent"], income: ["remote", "self_employed"] },
          nonNegotiable: "permanent-residency goal",
          reason: "Colombia’s digital-nomad visa is a Visitor (V) visa — up to 2 yrs, grants no residency status. Other routes exist; not this one, on remote income, toward permanence.",
          why: "its digital-nomad visa is a Visitor (V) visa that grants no residency status",
          cardHeadline: "Colombia ruled out for my permanent move — the digital-nomad visa grants no residency status.",
          source: {
            label: "Resolución 5477 de 2022 (Cancillería) — Visa V Nómadas Digitales",
            url: "https://visa.cancilleria.gov.co/",
            lastVerified: "2026-07-03"
          },
          verification: {
            status: "official_source_confirmed",
            routeName: "Visa V — Nómadas Digitales (Visitor visa)",
            claim: "The digital-nomad visa is a Visitor (V) visa — up to 2 years — that grants no residency status.",
            governmentAuthority: "Ministerio de Relaciones Exteriores (Cancillería)",
            sourceTitle: "Resolución 5477 de 2022 — Visa V Nómadas Digitales",
            sourceUrl: "https://visa.cancilleria.gov.co/",
            legalInstrument: "Resolución 5477 de 2022",
            lastChecked: "2026-07-03",
            reviewedBy: "Kurt Conrad — operator-supplied legal instrument, 2026-07-03",
            reviewNotes: "Portal did not respond to an automated fetch (000) on 2026-07-03; confirm it loads in a browser. Legal instrument name is the durable reference. Independent attorney review recommended.",
            confidence: "medium",
            professionalVerificationRecommended: true
          }
        }
      ],
      source: {
        label: "Resolución 5477 de 2022 (Cancillería) — Visa V Nómadas Digitales",
        url: "https://visa.cancilleria.gov.co/",
        lastVerified: "2026-07-03"
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
      research: false,
      eliminations: [],  /* never eliminates (MVP) */
      source: {
        label: "Ministerio del Trabajo (SBU 2026) · immigration regulation",
        url: "https://www.trabajo.gob.ec/"
      },
      /* Survive-claim carries specific dollar figures → needs_review (SBU
         changes yearly). Informational only; NO lastChecked. */
      verification: {
        status: "needs_review",
        routeName: "Remote-worker residence pathway",
        claim: "Remote-worker pathway ≈ 3× the Basic Salary (2026 SBU $482 → ~$1,446/mo, +~$250/dependent); permanent residency possible after >21 months temporary.",
        governmentAuthority: "Ministerio del Trabajo (SBU) · immigration regulation",
        sourceTitle: "Ministerio del Trabajo — Salario Básico Unificado 2026",
        sourceUrl: "https://www.trabajo.gob.ec/",
        legalInstrument: null,
        lastChecked: null,
        reviewedBy: null,
        reviewNotes: "Contains dollar figures that go stale annually (SBU resets each year). Verify the current SBU and multiplier before this line does authoritative work.",
        confidence: "medium",
        professionalVerificationRecommended: true
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
      research: false,
      /* NEVER eliminates (PRD v1.1+): affordability is a modeled judgment,
         not a documented legal fact. Warning tag only. */
      eliminations: [],
      source: null,
      /* Warning-only country: the cost claim is a modeled judgment, not a
         legal fact, so it intentionally has no official source and never
         eliminates. needs_review + NO lastChecked keeps it honest. */
      verification: {
        status: "needs_review",
        routeName: null,
        claim: "Highest-cost country on this list — budget pressure warning (modeled, not a legal conflict).",
        governmentAuthority: null,
        sourceTitle: null,
        sourceUrl: null,
        legalInstrument: null,
        lastChecked: null,
        reviewedBy: null,
        reviewNotes: "Warning tag only — by design has no legal source and can never hard-eliminate (cost is context, never a verdict).",
        confidence: "low",
        professionalVerificationRecommended: false
      },
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
    },

    /* ============================================================
       RESEARCH COUNTRIES (Stage: 2026-07-03) — all research:true,
       hidden from production, eliminations:[] so none can rule out.
       routes[] stage the confirmed/needs_review claims for later
       conversion. Nothing here is public until research:false.
       ============================================================ */

    {
      id: "chile",
      name: "Chile",
      research: false,                 /* PUBLIC — normal survivor; no elimination rules (never rules out) */
      coverage: "partial",            /* confirmed routes exist; remote-work route not located */
      eliminations: [],
      governingLaw: "Ley 21.325 (Migración y Extranjería) + Decreto 177/2022 (reglamento)",
      authority: "Servicio Nacional de Migraciones (SERMIG)",
      source: {
        label: "SERMIG — Ley 21.325 + Decreto 177/2022",
        url: "https://serviciomigraciones.cl/residencia-temporal/"
      },
      routes: [
        {
          routeName: "Extranjeros jubilados y rentistas",
          servesIncomeTypes: ["pension", "savings"],
          officialServesDescription: "Pension/retirement plus qualifying passive rent/investment income.",
          verification: {
            status: "official_source_confirmed",
            governmentAuthority: "Servicio Nacional de Migraciones (SERMIG)",
            legalInstrument: "Ley 21.325 + Decreto 177/2022",
            sourceTitle: "Residencia temporal — Jubilados y rentistas",
            sourceUrl: "https://serviciomigraciones.cl/residencia-temporal/subcategorias/jubilados-y-rentistas/",
            lastChecked: "2026-07-03",
            reviewedBy: "deep-research cross-check 2026-07-03",
            confidence: "high",
            uncertaintyNotes: "SERMIG publishes no fixed amount; solvency assessed case-by-case.",
            professionalVerificationRecommended: true
          },
          permanence: {
            pathType: "eligible_to_apply",
            eligibleToApply: true,
            standardEligibilityMonths: 24,
            possibleReducedEligibilityMonths: 12,
            reductionIsDiscretionary: true,
            approvalGuaranteed: false,
            presenceRequirements: null,
            absenceCancellationRules: null,
            notes: "Art.79 Ley 21.325 + Art.66 reglamento — reduced timeline requires a founded resolution of the SERMIG Director; not automatic."
          },
          threshold: {
            thresholdType: "case_by_case_solvency",
            localAmount: null, localCurrency: null,
            calculationBasis: "'Sufficient to meet basic needs' — SERMIG publishes no fixed amount.",
            effectiveDate: null,
            usdEstimate: null, usdEstimateDate: null, usdEstimateSource: null,
            thresholdNotes: "Do NOT insert third-party dollar estimates as a legal threshold."
          },
          notes: null
        },
        {
          routeName: "Personas que desarrollan actividades lícitas remuneradas",
          servesIncomeTypes: [],   /* local employed work + cuenta propia — NOT foreign remote employment */
          officialServesDescription: "Local employed work and cuenta propia activity as described by the official page. Does NOT map to foreign remote employment.",
          verification: {
            status: "official_source_confirmed",
            governmentAuthority: "Servicio Nacional de Migraciones (SERMIG)",
            legalInstrument: "Ley 21.325 + Decreto 177/2022",
            sourceTitle: "Residencia temporal — Actividades remuneradas",
            sourceUrl: "https://serviciomigraciones.cl/residencia-temporal/subcategorias/actividades-remuneradas/",
            lastChecked: "2026-07-03",
            reviewedBy: "deep-research cross-check 2026-07-03",
            confidence: "high",
            uncertaintyNotes: "Official scope is local remunerated activity; do NOT map to foreign remote employment.",
            professionalVerificationRecommended: true
          },
          permanence: {
            pathType: "eligible_to_apply", eligibleToApply: true,
            standardEligibilityMonths: 24, possibleReducedEligibilityMonths: 12,
            reductionIsDiscretionary: true, approvalGuaranteed: false,
            presenceRequirements: null, absenceCancellationRules: null,
            notes: "Reduced timeline discretionary (SERMIG Director resolution)."
          },
          threshold: {
            thresholdType: "case_by_case_solvency",
            localAmount: null, localCurrency: null,
            calculationBasis: "Case-by-case solvency; no fixed published amount.",
            effectiveDate: null, usdEstimate: null, usdEstimateDate: null, usdEstimateSource: null,
            thresholdNotes: "No fixed legal threshold published."
          },
          notes: "Do NOT map to foreign remote employment."
        },
        {
          routeName: "Inversionistas",
          servesIncomeTypes: ["savings", "self_employed"],
          officialServesDescription: "Savings/investment; self-employed applies only where the applicant is legal representative or senior management of the investing company.",
          verification: {
            status: "official_source_confirmed",
            governmentAuthority: "Servicio Nacional de Migraciones (SERMIG)",
            legalInstrument: "Ley 21.325 + Decreto 177/2022",
            sourceTitle: "Residencia temporal — Inversionistas",
            sourceUrl: "https://serviciomigraciones.cl/residencia-temporal/subcategorias/inversionistas/",
            lastChecked: "2026-07-03",
            reviewedBy: "deep-research cross-check 2026-07-03",
            confidence: "high",
            uncertaintyNotes: "self_employed mapping applies only as legal rep / senior management of the investing company.",
            professionalVerificationRecommended: true
          },
          permanence: {
            pathType: "eligible_to_apply", eligibleToApply: true,
            standardEligibilityMonths: 24, possibleReducedEligibilityMonths: 12,
            reductionIsDiscretionary: true, approvalGuaranteed: false,
            presenceRequirements: null, absenceCancellationRules: null,
            notes: "Reduced timeline discretionary (SERMIG Director resolution)."
          },
          threshold: {
            thresholdType: "fixed_amount",
            localAmount: 500000, localCurrency: "USD",
            calculationBasis: "Productive investment (Decreto 177/2022).",
            effectiveDate: null,
            usdEstimate: null, usdEstimateDate: null, usdEstimateSource: null,
            thresholdNotes: "USD is the stated currency of the productive-investment figure, not a third-party estimate."
          },
          notes: null
        }
      ],
      absenceOfEvidence: [
        {
          routeName: "Dedicated foreign remote-work route",
          status: "not_verified",
          routeLocated: false,
          note: "None located on the SERMIG subcategory list. Absence of evidence, NOT proof none exists — must never generate an elimination or a country-wide 'no remote route' claim."
        }
      ],
      verification: {
        status: "needs_review",
        routeName: null,
        claim: "Country coverage assembled from confirmed routes; not production-ready.",
        governmentAuthority: "Servicio Nacional de Migraciones (SERMIG)",
        sourceTitle: null, sourceUrl: null, legalInstrument: null,
        lastChecked: null, reviewedBy: null,
        reviewNotes: "Routes confirmed; remote-work coverage unresolved. Country stays hidden until routes are wired and reviewed.",
        confidence: "medium", professionalVerificationRecommended: true
      },
      survivorNotes: [
        { when: { income: ["pension"] }, tags: [],
          line: "Confirmed jubilados-y-rentistas route accepts pension income; solvency is judged case-by-case (SERMIG publishes no fixed figure). Permanent residency is by application after ~2 years — a 12-month reduction is possible but discretionary, never guaranteed." },
        { when: { income: ["savings"] }, tags: [],
          line: "Confirmed investor and rentista routes fit savings/investment (the investor route references a productive-investment figure). Permanent residency is by application after ~2 years; any reduction is discretionary, not automatic." },
        { when: { income: ["remote"] }, tags: [],
          line: "The confirmed routes cover pension, investment, and local work. A route matching foreign remote employment wasn’t located in this review — that’s an unverified gap, not a confirmed “no.” Check remote-work options directly." },
        { when: { income: ["self_employed"] }, tags: [],
          line: "The confirmed investor route can fit business owners acting as the company’s legal representative; investment and solvency terms apply. Permanent residency is by application after ~2 years (reductions discretionary)." },
        { default: true, tags: [],
          line: "Confirmed residence routes for pension, investment, and local work. Permanent residency is by application after ~2 years — a possible 12-month reduction is discretionary, not automatic. Verify the route matching your situation." }
      ]
    },

    {
      id: "argentina",
      name: "Argentina",
      research: false,                 /* PUBLIC — normal survivor; no elimination rules (never rules out) */
      coverage: "partial",
      eliminations: [],
      governingLaw: "Ley 25.871 + Decreto 616/2010",
      authority: "Dirección Nacional de Migraciones (DNM)",
      source: {
        label: "DNM — Ley 25.871 + Decreto 616/2010",
        url: "https://www.argentina.gob.ar/interior/migraciones"
      },
      routes: [
        {
          routeName: "Residencia temporaria como rentista (Art. 23 b)",
          servesIncomeTypes: ["savings"],
          officialServesDescription: "Income from assets/patrimony only. The official page EXPLICITLY EXCLUDES 'retribuciones obtenidas por el trabajo personal' (personal-work compensation).",
          verification: {
            status: "official_source_confirmed",
            governmentAuthority: "Dirección Nacional de Migraciones (DNM)",
            legalInstrument: "Ley 25.871 Art. 23(b) + Decreto 616/2010",
            sourceTitle: "Obtener una residencia temporaria como rentista",
            sourceUrl: "https://www.argentina.gob.ar/servicio/obtener-una-residencia-temporaria-como-rentista",
            lastChecked: "2026-07-03",
            reviewedBy: "deep-research cross-check 2026-07-03",
            confidence: "high",
            uncertaintyNotes: "Explicitly excludes personal-work compensation — do NOT map remote/self-employed personal income here.",
            professionalVerificationRecommended: true
          },
          permanence: {
            pathType: "eligible_to_apply", eligibleToApply: true,
            standardEligibilityMonths: 36, possibleReducedEligibilityMonths: null,
            reductionIsDiscretionary: false, approvalGuaranteed: false,
            presenceRequirements: "Must be physically present >50% of the granted residence period; no absence ≥6 consecutive months.",
            absenceCancellationRules: "Informational (dated): DNU 366/2025 (28 May 2025) — permanent residency cancelled if holder absent ≥1 year. Informational legal note ONLY; must NOT generate an elimination unless separately and precisely encoded.",
            notes: "3 yrs continuous temporary residence (non-MERCOSUR arraigo), Decreto 616/2010 + DNM FAQ."
          },
          threshold: {
            thresholdType: "minimum_wage_multiple",
            localAmount: null, localCurrency: "ARS",
            calculationBasis: "5x SMVM",
            effectiveDate: null,
            usdEstimate: null, usdEstimateDate: null, usdEstimateSource: null,
            thresholdNotes: "Set by Disposición DNM 1732/2023 (mod. 3446/2023). SMVM value updatable — do NOT hard-code a USD equivalent as the legal threshold; store localAmount + effectiveDate when the SMVM figure is confirmed."
          },
          notes: null
        },
        {
          routeName: "Residencia temporaria como pensionado (Art. 23 c)",
          servesIncomeTypes: ["pension"],
          officialServesDescription: "Pension/retirement income.",
          verification: {
            status: "official_source_confirmed",
            governmentAuthority: "Dirección Nacional de Migraciones (DNM)",
            legalInstrument: "Ley 25.871 Art. 23(c) + Decreto 616/2010",
            sourceTitle: "Obtener una residencia temporaria como pensionado",
            sourceUrl: "https://www.argentina.gob.ar/servicio/obtener-una-residencia-temporaria-como-pensionado",
            lastChecked: "2026-07-03",
            reviewedBy: "deep-research cross-check 2026-07-03",
            confidence: "high",
            uncertaintyNotes: null,
            professionalVerificationRecommended: true
          },
          permanence: {
            pathType: "eligible_to_apply", eligibleToApply: true,
            standardEligibilityMonths: 36, possibleReducedEligibilityMonths: null,
            reductionIsDiscretionary: false, approvalGuaranteed: false,
            presenceRequirements: "Must be physically present >50% of the granted residence period; no absence ≥6 consecutive months.",
            absenceCancellationRules: "Informational (dated): DNU 366/2025 (28 May 2025) — permanent residency cancelled if holder absent ≥1 year. Informational legal note ONLY; must NOT generate an elimination.",
            notes: "3 yrs continuous temporary residence (non-MERCOSUR)."
          },
          threshold: {
            thresholdType: "minimum_wage_multiple",
            localAmount: null, localCurrency: "ARS",
            calculationBasis: "5x SMVM",
            effectiveDate: null,
            usdEstimate: null, usdEstimateDate: null, usdEstimateSource: null,
            thresholdNotes: "Set by Disposición DNM 1732/2023 (mod. 3446/2023). Store localAmount + effectiveDate when confirmed; no hard-coded USD."
          },
          notes: null
        },
        {
          routeName: "Residencia temporaria como trabajador migrante (Art. 23 a)",
          servesIncomeTypes: [],   /* employer-sponsored LOCAL work (relación de dependencia) only */
          officialServesDescription: "Verified for employer-sponsored LOCAL work (relación de dependencia) only.",
          verification: {
            status: "official_source_confirmed",
            governmentAuthority: "Dirección Nacional de Migraciones (DNM)",
            legalInstrument: "Ley 25.871 Art. 23(a) + Decreto 616/2010",
            sourceTitle: "Obtener una residencia temporaria como trabajador migrante",
            sourceUrl: "https://www.argentina.gob.ar/servicio/obtener-una-residencia-temporaria-como-trabajador-migrante",
            lastChecked: "2026-07-03",
            reviewedBy: "deep-research cross-check 2026-07-03",
            confidence: "high",
            uncertaintyNotes: "Local employer-sponsored work only. Do NOT use this to claim Argentina rejects remote workers generally.",
            professionalVerificationRecommended: true
          },
          permanence: {
            pathType: "eligible_to_apply", eligibleToApply: true,
            standardEligibilityMonths: 36, possibleReducedEligibilityMonths: null,
            reductionIsDiscretionary: false, approvalGuaranteed: false,
            presenceRequirements: "Must be physically present >50% of the granted residence period; no absence ≥6 consecutive months.",
            absenceCancellationRules: "Informational: DNU 366/2025 — see above. Must NOT generate an elimination.",
            notes: null
          },
          threshold: {
            thresholdType: "unverified",
            localAmount: null, localCurrency: null, calculationBasis: null, effectiveDate: null,
            usdEstimate: null, usdEstimateDate: null, usdEstimateSource: null,
            thresholdNotes: "Employer-sponsored; income threshold not separately verified here."
          },
          notes: null
        },
        {
          routeName: "Reunificación familiar (dependent mechanism)",
          servesIncomeTypes: [],
          officialServesDescription: "Family reunification — dependent mechanism, not an income route.",
          verification: {
            status: "official_source_confirmed",
            governmentAuthority: "Dirección Nacional de Migraciones (DNM)",
            legalInstrument: "Ley 25.871 + Decreto 616/2010",
            sourceTitle: "Reunificación familiar",
            sourceUrl: "https://www.argentina.gob.ar/servicio/radicaciones-residencia-permanente",
            lastChecked: "2026-07-03",
            reviewedBy: "deep-research cross-check 2026-07-03",
            confidence: "high",
            uncertaintyNotes: "Dependent mechanism; not an income-qualifying route.",
            professionalVerificationRecommended: true
          },
          permanence: {
            pathType: "eligible_to_apply", eligibleToApply: true,
            standardEligibilityMonths: 36, possibleReducedEligibilityMonths: null,
            reductionIsDiscretionary: false, approvalGuaranteed: false,
            presenceRequirements: "Must be physically present >50% of the granted residence period; no absence ≥6 consecutive months.",
            absenceCancellationRules: "Informational: DNU 366/2025 — see above.",
            notes: null
          },
          threshold: {
            thresholdType: "case_by_case_solvency",
            localAmount: null, localCurrency: null, calculationBasis: "Dependent — no independent income threshold.", effectiveDate: null,
            usdEstimate: null, usdEstimateDate: null, usdEstimateSource: null,
            thresholdNotes: null
          },
          notes: null
        }
      ],
      absenceOfEvidence: [
        {
          routeName: "Dedicated remote-employment route",
          status: "not_verified", routeLocated: false,
          note: "Not located. Absence of evidence, not proof of absence — no elimination."
        },
        {
          routeName: "Stand-alone self-employed route",
          status: "not_verified", routeLocated: false,
          note: "Not located. Absence of evidence, not proof of absence — no elimination."
        }
      ],
      verification: {
        status: "needs_review",
        routeName: null,
        claim: "Rentista/pensionado/trabajador routes + permanence confirmed; remote and self-employed routes unresolved.",
        governmentAuthority: "Dirección Nacional de Migraciones (DNM)",
        sourceTitle: null, sourceUrl: null, legalInstrument: null,
        lastChecked: null, reviewedBy: null,
        reviewNotes: "Country stays hidden until routes are wired and reviewed. DNU 366/2025 is informational only.",
        confidence: "medium", professionalVerificationRecommended: true
      },
      survivorNotes: [
        { when: { income: ["pension"] }, tags: [],
          line: "Confirmed pensionado route (Art. 23c) accepts pension/retirement income; the requirement is a multiple of the minimum wage (the peso figure moves and isn’t fixed here). Permanent residency is by application after 3 years’ continuous residence — not automatic." },
        { when: { income: ["savings"] }, tags: [],
          line: "Confirmed rentista route (Art. 23b) accepts income from assets/investments — it explicitly excludes personal-work earnings. The requirement is a minimum-wage multiple (peso figure not fixed here). Permanent residency is by application after 3 years." },
        { when: { income: ["remote"] }, tags: [],
          line: "Confirmed routes cover pension, investment income, local employment, and family reunification. A dedicated foreign-remote-work route wasn’t located in this review — an unverified gap, not a confirmed “no.” The rentista route requires non-work income; check remote options directly." },
        { when: { income: ["self_employed"] }, tags: [],
          line: "A stand-alone self-employed route wasn’t verified in this review — an unverified gap, not a “no.” The rentista route covers investment income but excludes personal-work earnings. Check business options directly." },
        { default: true, tags: [],
          line: "Confirmed residence routes for pension and investment income, plus local employment and family reunification. Permanent residency is by application after 3 years (not automatic). Verify the route matching your situation." }
      ]
    },

    {
      id: "paraguay",
      name: "Paraguay",
      research: true,                  /* stays research → excluded from survivor count & surprise, never eliminates */
      publicResearch: true,            /* but VISIBLE in production as a labelled Research/Partial tile */
      coverage: "research",
      eliminations: [],
      governingLaw: "Ley N° 6984/2022",
      authority: "Dirección Nacional de Migraciones",
      routes: [
        {
          routeName: "Residencia permanente para el cambio de categoría (temporal → permanente)",
          servesIncomeTypes: [],
          officialServesDescription: "Permanent change-of-category step (from temporary resident). Confirmed for the PERMANENT step only.",
          verification: {
            status: "official_source_confirmed",
            governmentAuthority: "Dirección Nacional de Migraciones",
            legalInstrument: "Ley N° 6984/2022",
            sourceTitle: "Residencia permanente para el cambio de categoría de residente temporal",
            sourceUrl: "https://migraciones.gov.py/residencia-permanente-para-el-cambio-de-categoria-de-residente-temporal/",
            lastChecked: "2026-07-03",
            reviewedBy: "deep-research cross-check 2026-07-03",
            confidence: "high",
            uncertaintyNotes: "Permanent step confirmed; the qualifying non-MERCOSUR TEMPORARY entry pathway is needs_review.",
            professionalVerificationRecommended: true
          },
          permanence: {
            pathType: "eligible_to_apply", eligibleToApply: true,
            standardEligibilityMonths: null, possibleReducedEligibilityMonths: null,
            reductionIsDiscretionary: false, approvalGuaranteed: false,
            presenceRequirements: null, absenceCancellationRules: null,
            notes: "Confirmed for the permanent change-of-category step only."
          },
          threshold: {
            thresholdType: "unverified",
            localAmount: null, localCurrency: null, calculationBasis: null, effectiveDate: null,
            usdEstimate: null, usdEstimateDate: null, usdEstimateSource: null,
            thresholdNotes: "Temporary-entry thresholds not verified."
          },
          notes: null
        },
        {
          routeName: "Residencia permanente para inversionistas (SUACE)",
          servesIncomeTypes: ["savings", "self_employed"],
          officialServesDescription: "Investor permanent route via SUACE. Confirmed that the route EXISTS; minimum investment amount unverified.",
          verification: {
            status: "official_source_confirmed",
            governmentAuthority: "Dirección Nacional de Migraciones / SUACE",
            legalInstrument: "Ley N° 6984/2022",
            sourceTitle: "Residencia permanente para inversionistas extranjeros (SUACE)",
            sourceUrl: "https://migraciones.gov.py/residencia-permanente-para-inversionistas-extranjeros-suace/",
            lastChecked: "2026-07-03",
            reviewedBy: "deep-research cross-check 2026-07-03",
            confidence: "medium",
            uncertaintyNotes: "Route existence confirmed; minimum investment amount is NOT verified.",
            professionalVerificationRecommended: true
          },
          permanence: {
            pathType: "eligible_to_apply", eligibleToApply: true,
            standardEligibilityMonths: null, possibleReducedEligibilityMonths: null,
            reductionIsDiscretionary: false, approvalGuaranteed: false,
            presenceRequirements: null, absenceCancellationRules: null,
            notes: "Investor permanent route via SUACE."
          },
          threshold: {
            thresholdType: "unverified",
            localAmount: null, localCurrency: null, calculationBasis: null, effectiveDate: null,
            usdEstimate: null, usdEstimateDate: null, usdEstimateSource: null,
            thresholdNotes: "Minimum investment amount unverified — do not populate."
          },
          notes: null
        },
        {
          routeName: "Qualifying non-MERCOSUR temporary pathway (US applicant)",
          servesIncomeTypes: [],
          officialServesDescription: "Temporary entry pathway, income-type mapping, and numeric thresholds — all unresolved.",
          verification: {
            status: "needs_review",
            governmentAuthority: "Dirección Nacional de Migraciones",
            legalInstrument: null, sourceTitle: null, sourceUrl: null,
            lastChecked: null, reviewedBy: null,
            confidence: "low",
            uncertaintyNotes: "Temporary pathway + income mapping + thresholds all need primary-source research. Paraguay must NOT issue public hard eliminations from incomplete route mapping.",
            professionalVerificationRecommended: true
          },
          permanence: {
            pathType: "uncertain", eligibleToApply: null,
            standardEligibilityMonths: null, possibleReducedEligibilityMonths: null,
            reductionIsDiscretionary: false, approvalGuaranteed: false,
            presenceRequirements: null, absenceCancellationRules: null, notes: null
          },
          threshold: {
            thresholdType: "unverified",
            localAmount: null, localCurrency: null, calculationBasis: null, effectiveDate: null,
            usdEstimate: null, usdEstimateDate: null, usdEstimateSource: null, thresholdNotes: null
          },
          notes: null
        }
      ],
      absenceOfEvidence: [],
      verification: {
        status: "needs_review",
        routeName: null,
        claim: "Two permanent routes confirmed; temporary entry pathway and thresholds unresolved.",
        governmentAuthority: "Dirección Nacional de Migraciones",
        sourceTitle: null, sourceUrl: null, legalInstrument: null,
        lastChecked: null, reviewedBy: null,
        reviewNotes: "Coverage research-grade — the entry pathway is needs_review, so not production-usable.",
        confidence: "low", professionalVerificationRecommended: true
      },
      survivorNotes: [
        { default: true, tags: [],
          line: "Confirmed: a temporary-to-permanent change-of-category route and a SUACE foreign-investor permanent route both exist. Still being verified: income-type mapping, the temporary-pathway details, and the SUACE minimum investment. Shown for information — verify directly." }
      ]
    },

    {
      id: "peru",
      name: "Peru",
      research: true,                  /* stays research → excluded from survivor count & surprise, never eliminates */
      publicResearch: true,            /* but VISIBLE in production as a labelled Research/Partial tile */
      coverage: "partial",           /* route existence/framework confirmed; amounts & timing needs_review */
      eliminations: [],
      /* Legal framework + authority for all three routes, from the Official
         Immigration Verification Pass (Peru). Per-route source metadata below. */
      governingLaw: "Decreto Legislativo 1350; Decreto Supremo 007-2017-IN; TUPA MIGRACIONES 2023",
      authority: "Superintendencia Nacional de Migraciones",
      routes: [
        {
          routeName: "Calidad Migratoria Rentista Residente",
          servesIncomeTypes: ["pension", "savings"],
          officialServesDescription: "Rentista residence for pension/retirement and savings/investment income. Direct indefinite-residence finding; indefinite and not renewable.",
          verification: {
            status: "official_source_confirmed",
            governmentAuthority: "Superintendencia Nacional de Migraciones",
            legalInstrument: "Decreto Legislativo 1350; Decreto Supremo 007-2017-IN; TUPA MIGRACIONES 2023",
            sourceTitle: "Texto Único de Procedimientos Administrativos de MIGRACIONES",
            sourceUrl: "https://www.gob.pe/institucion/migraciones/informes-publicaciones/2770424-texto-unico-de-procedimientos-administrativos-tupa",
            lastChecked: "2026-07-03",
            reviewedBy: "Official Immigration Verification Pass (provided report), 2026-07-03",
            confidence: "high",
            uncertaintyNotes: "Route existence, legal framework, authority, official source, and direct indefinite-residence finding confirmed (high confidence). Financial amount remains needs_review.",
            professionalVerificationRecommended: true
          },
          permanence: {
            pathType: "direct_permanent",
            eligibleToApply: null,
            standardEligibilityMonths: null,
            possibleReducedEligibilityMonths: null,
            reductionIsDiscretionary: false,
            approvalGuaranteed: false,
            presenceRequirements: null,
            absenceCancellationRules: null,
            notes: "Indefinite; not renewable; direct indefinite-residence finding."
          },
          threshold: {
            thresholdType: "unverified",
            localAmount: null, localCurrency: null, calculationBasis: null, effectiveDate: null,
            usdEstimate: null, usdEstimateDate: null, usdEstimateSource: null,
            thresholdNotes: "Financial amount remains needs_review — do not invent."
          },
          notes: null
        },
        {
          routeName: "Cambio de Calidad Migratoria Trabajador Residente",
          servesIncomeTypes: ["self_employed"],   /* self-employed/business (independent service contract) — NOT foreign remote employment */
          officialServesDescription: "Worker change-of-category for self-employed/business income. Independent service contract of at least one year is supported; permanent change-of-category procedure is supported. Foreign remote employment remains unverified.",
          verification: {
            status: "official_source_confirmed",
            governmentAuthority: "Superintendencia Nacional de Migraciones",
            legalInstrument: "Decreto Legislativo 1350; Decreto Supremo 007-2017-IN; TUPA MIGRACIONES 2023",
            sourceTitle: "Texto Único de Procedimientos Administrativos de MIGRACIONES",
            sourceUrl: "https://www.gob.pe/institucion/migraciones/informes-publicaciones/2770424-texto-unico-de-procedimientos-administrativos-tupa",
            lastChecked: "2026-07-03",
            reviewedBy: "Official Immigration Verification Pass (provided report), 2026-07-03",
            confidence: "medium",
            uncertaintyNotes: "Route existence, legal framework, authority, official source, the 1-year independent-service-contract basis, and the permanent change-of-category procedure are confirmed. Exact threshold and permanent-residence timing remain needs_review. Foreign remote employment remains unverified — do NOT map.",
            professionalVerificationRecommended: true
          },
          permanence: {
            pathType: "eligible_to_apply",
            eligibleToApply: true,
            standardEligibilityMonths: null,
            possibleReducedEligibilityMonths: null,
            reductionIsDiscretionary: false,
            approvalGuaranteed: false,
            presenceRequirements: null,
            absenceCancellationRules: null,
            notes: "Permanent change-of-category procedure supported; exact timing remains needs_review."
          },
          threshold: {
            thresholdType: "unverified",
            localAmount: null, localCurrency: null, calculationBasis: null, effectiveDate: null,
            usdEstimate: null, usdEstimateDate: null, usdEstimateSource: null,
            thresholdNotes: "Exact threshold remains needs_review."
          },
          notes: null
        },
        {
          routeName: "Calidad Migratoria Inversionista Residente",
          servesIncomeTypes: ["self_employed", "savings"],
          officialServesDescription: "Investor residence for self-employed/business and savings/investment income. 365 days, renewable; 10 UIT solvency language; 10 Peruvian jobs requirement; permanent change-of-category procedure is supported.",
          verification: {
            status: "official_source_confirmed",
            governmentAuthority: "Superintendencia Nacional de Migraciones",
            legalInstrument: "Decreto Legislativo 1350; Decreto Supremo 007-2017-IN; TUPA MIGRACIONES 2023",
            sourceTitle: "Texto Único de Procedimientos Administrativos de MIGRACIONES",
            sourceUrl: "https://www.gob.pe/institucion/migraciones/informes-publicaciones/2770424-texto-unico-de-procedimientos-administrativos-tupa",
            lastChecked: "2026-07-03",
            reviewedBy: "Official Immigration Verification Pass (provided report), 2026-07-03",
            confidence: "medium",
            uncertaintyNotes: "Route existence, legal framework, authority, official source, 365-day renewable duration, 10 UIT solvency language, 10 Peruvian jobs requirement, and permanent change-of-category procedure are confirmed. Exact 2026 UIT amount remains needs_review.",
            professionalVerificationRecommended: true
          },
          permanence: {
            pathType: "eligible_to_apply",
            eligibleToApply: true,
            standardEligibilityMonths: null,
            possibleReducedEligibilityMonths: null,
            reductionIsDiscretionary: false,
            approvalGuaranteed: false,
            presenceRequirements: null,
            absenceCancellationRules: null,
            notes: "365 days, renewable; 10 Peruvian jobs requirement; permanent change-of-category supported; exact timing remains needs_review."
          },
          threshold: {
            thresholdType: "unverified",
            localAmount: null, localCurrency: null,
            calculationBasis: "10 UIT (solvency language)",
            effectiveDate: null,
            usdEstimate: null, usdEstimateDate: null, usdEstimateSource: null,
            thresholdNotes: "Exact 2026 UIT amount remains needs_review — do not compute."
          },
          notes: null
        }
      ],
      absenceOfEvidence: [],
      verification: {
        status: "needs_review",
        routeName: null,
        claim: "Three routes staged; existence/framework/authority/source confirmed. Country not production-ready (amounts and timing needs_review).",
        governmentAuthority: "Superintendencia Nacional de Migraciones",
        sourceTitle: "Texto Único de Procedimientos Administrativos de MIGRACIONES",
        sourceUrl: "https://www.gob.pe/institucion/migraciones/informes-publicaciones/2770424-texto-unico-de-procedimientos-administrativos-tupa",
        legalInstrument: "Decreto Legislativo 1350; Decreto Supremo 007-2017-IN; TUPA MIGRACIONES 2023",
        lastChecked: null, reviewedBy: null,
        reviewNotes: "Route existence/framework confirmed for all three; exact amounts and permanent-residence timing remain needs_review. Foreign remote employment unverified.",
        confidence: "medium", professionalVerificationRecommended: true
      },
      survivorNotes: [
        { when: { income: ["pension"] }, tags: [],
          line: "The Rentista route accepts pension/passive income and is a confirmed route to indefinite residence; the exact financial threshold is still being verified." },
        { when: { income: ["savings"] }, tags: [],
          line: "The Rentista (indefinite residence) and Investor routes cover investment income — the investor route cites a UIT-based solvency requirement and a local-jobs condition. Exact amounts are still being verified." },
        { when: { income: ["self_employed"] }, tags: [],
          line: "The Worker and Investor routes can fit business/self-employed income (independent service contract or investment); exact thresholds and timing are still being verified. Foreign remote employment is not verified." },
        { default: true, tags: [],
          line: "Confirmed: Rentista, Worker, and Investor routes exist with their legal framework and issuing authority. Still being verified: exact income thresholds and some permanent-residence timing. Shown for information — verify directly." }
      ]
    },

    {
      id: "brazil",
      name: "Brazil",
      research: true,
      coverage: "research",
      eliminations: [],
      governingLaw: null,
      authority: null,
      routes: [],
      absenceOfEvidence: [],
      verification: {
        status: "needs_review",
        routeName: null,
        claim: "Skeleton — no verified routes yet.",
        governmentAuthority: null, sourceTitle: null, sourceUrl: null, legalInstrument: null,
        lastChecked: null, reviewedBy: null,
        reviewNotes: "Awaiting primary-source research. No invented sources or thresholds.",
        confidence: "low", professionalVerificationRecommended: true
      },
      survivorNotes: [
        { default: true, tags: [], line: "Research record — Brazil skeleton, no verified routes. Hidden from visitors." }
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

/* Expose for the browser (window.FIT_RULES) and Node (require) alike, so the
   same data drives the live tool and the validator. */
(typeof window !== "undefined" ? window : globalThis).FIT_RULES = FIT_RULES;
if (typeof module !== "undefined" && module.exports) module.exports = FIT_RULES;
