/* =====================================================================
   LATIN AMERICA FIT FINDER — SHARED ENGINE (safety-critical)
   =====================================================================
   ONE source of truth for the verdict logic, used by BOTH the browser
   (app.js) and the Node validator (tests/validate.mjs). Keeping it here
   means the hard-elimination safety gate cannot drift between what users
   see and what the tests check.

   Two verdict states only (unchanged): ELIMINATED_HARD_CONFLICT |
   SURVIVES_WITH_CONTEXT. The new rule: an elimination may fire ONLY when
   its claim-level `verification` meets the evidence threshold below.
   Anything short of that SURVIVES instead — an unverified claim can never
   rule a country out. Country-level `coverage` is derived and NEVER feeds
   back into gating (claim status is authoritative).
   ===================================================================== */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.FitEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* Statuses that clear the bar to enforce a hard elimination. */
  var APPROVED_STATUSES = ["official_source_confirmed", "attorney_reviewed"];
  /* Metadata every enforceable elimination must carry (PRD item 4). */
  var REQUIRED_ELIM_META = [
    "routeName", "governmentAuthority", "sourceUrl", "legalInstrument", "lastChecked"
  ];
  var ALL_STATUSES = APPROVED_STATUSES.concat(["needs_review", "expired"]);
  /* A confirmed claim older than this is treated as expired (cannot eliminate). */
  var MAX_AGE_DAYS = 400;

  function matches(when, a) {
    return Object.keys(when).every(function (k) {
      return when[k].indexOf(a[k]) !== -1;
    });
  }

  function daysBetween(fromISO, now) {
    var t = Date.parse(fromISO);
    if (isNaN(t)) return Infinity;
    return (now.getTime() - t) / 86400000;
  }

  function isExpired(v, now, maxAgeDays) {
    if (!v || !v.lastChecked) return false; /* missing date handled by threshold */
    return daysBetween(v.lastChecked, now || new Date()) > (maxAgeDays || MAX_AGE_DAYS);
  }

  /* Can this elimination legally rule a country out? Returns {ok, reasons[]}.
     The single chokepoint for hard-elimination safety. */
  function eliminationIsEnforceable(elim, opts) {
    opts = opts || {};
    var now = opts.now || new Date();
    var maxAge = opts.maxAgeDays || MAX_AGE_DAYS;
    var reasons = [];
    var v = elim && elim.verification;
    if (!v) return { ok: false, reasons: ["no verification block"] };
    if (APPROVED_STATUSES.indexOf(v.status) === -1) {
      reasons.push("status '" + v.status + "' below evidence threshold");
    }
    REQUIRED_ELIM_META.forEach(function (f) {
      if (!v[f]) reasons.push("missing " + f);
    });
    if (v.status !== "expired" && isExpired(v, now, maxAge)) {
      reasons.push("lastChecked is stale (> " + maxAge + " days) — treat as expired");
    }
    return { ok: reasons.length === 0, reasons: reasons };
  }

  function survivorNoteFor(country, a) {
    var notes = country.survivorNotes || [];
    for (var j = 0; j < notes.length; j++) {
      if (notes[j].when && matches(notes[j].when, a)) return notes[j];
    }
    return notes.filter(function (n) { return n.default; })[0] || { line: "", tags: [] };
  }

  function evaluateCountry(country, a, opts) {
    var elims = country.eliminations || [];
    var suppressed = null;
    for (var i = 0; i < elims.length; i++) {
      if (!matches(elims[i].when, a)) continue;
      var gate = eliminationIsEnforceable(elims[i], opts);
      if (gate.ok) {
        return {
          id: country.id, name: country.name,
          research: !!country.research, publicResearch: !!country.publicResearch,
          verdict: "ELIMINATED_HARD_CONFLICT",
          elimination: elims[i], line: elims[i].reason, tags: [],
          source: elims[i].source || country.source || null,
          verification: elims[i].verification || null
        };
      }
      /* Matched but not enforceable: it must NOT eliminate. Remember it so
         dev mode can surface "would eliminate if verified", then survive. */
      if (!suppressed) suppressed = { elimination: elims[i], gate: gate };
    }
    var note = survivorNoteFor(country, a);
    return {
      id: country.id, name: country.name,
      research: !!country.research, publicResearch: !!country.publicResearch,
      verdict: "SURVIVES_WITH_CONTEXT",
      elimination: null, line: note.line, tags: note.tags || [],
      source: country.source || null,
      verification: country.verification || null,
      suppressedElimination: suppressed
    };
  }

  /* Filter for what a given mode may see. Research countries are hidden
     unless includeResearchCountries is true (dev/preview) OR the country is
     flagged publicResearch (a deliberately-published labelled Research/Partial
     entry — still research:true, so still excluded from survivor counts and
     the surprise, and still non-eliminating). */
  function visibleCountries(countries, includeResearch) {
    return (countries || []).filter(function (c) {
      return includeResearch || !c.research || c.publicResearch;
    });
  }

  function evaluateAll(countries, a, opts) {
    opts = opts || {};
    return visibleCountries(countries, !!opts.includeResearchCountries)
      .map(function (c) { return evaluateCountry(c, a, opts); });
  }

  var COVERAGE_RANK = { research: 0, partial: 1, live: 2 };

  /* Derived, informational only. NEVER used for gating. Considers eliminations,
     the country survive-claim, AND routes[]. A country is only "live" when it
     is in production (research:false) and has at least one confirmed claim with
     nothing left unverified. Any unverified claim caps it at "partial"; zero
     confirmed claims makes it "research". */
  function deriveCoverage(country) {
    var confirmed = 0, unverified = 0;
    (country.eliminations || []).forEach(function (e) {
      if (eliminationIsEnforceable(e).ok) confirmed++; else unverified++;
    });
    (country.routes || []).forEach(function (r) {
      var s = r.verification && r.verification.status;
      if (APPROVED_STATUSES.indexOf(s) !== -1) confirmed++; else unverified++;
    });
    var cv = country.verification;
    if (cv) { if (APPROVED_STATUSES.indexOf(cv.status) !== -1) confirmed++; else unverified++; }
    /* "route not located" is NOT a confirmed negative — never counts as coverage. */
    if (country.research) {
      return confirmed > 0 ? "partial" : "research"; /* hidden countries never "live" */
    }
    if (confirmed === 0 && unverified === 0) return "live"; /* survive-only, defensible */
    if (unverified > 0 && confirmed === 0) return "research";
    if (unverified > 0) return "partial";
    return "live";
  }

  /* Guard for the "verified from partial routes" test: a stored coverage label
     may be equal to or MORE conservative than the derived value, never more
     optimistic, and a hidden country may never be labelled "live". */
  function coverageIsSafe(country) {
    var stored = country.coverage;
    if (stored == null) return { ok: true, reasons: [] };
    var reasons = [];
    if (COVERAGE_RANK[stored] == null) reasons.push("unknown coverage '" + stored + "'");
    if (country.research && stored === "live") reasons.push("hidden country labelled live");
    var derived = deriveCoverage(country);
    if (COVERAGE_RANK[stored] > COVERAGE_RANK[derived])
      reasons.push("stored '" + stored + "' more optimistic than derived '" + derived + "'");
    return { ok: reasons.length === 0, reasons: reasons, derived: derived };
  }

  return {
    APPROVED_STATUSES: APPROVED_STATUSES,
    ALL_STATUSES: ALL_STATUSES,
    REQUIRED_ELIM_META: REQUIRED_ELIM_META,
    MAX_AGE_DAYS: MAX_AGE_DAYS,
    matches: matches,
    isExpired: isExpired,
    eliminationIsEnforceable: eliminationIsEnforceable,
    evaluateCountry: evaluateCountry,
    evaluateAll: evaluateAll,
    visibleCountries: visibleCountries,
    deriveCoverage: deriveCoverage,
    coverageIsSafe: coverageIsSafe,
    COVERAGE_RANK: COVERAGE_RANK
  };
});
