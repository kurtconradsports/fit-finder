/* =====================================================================
   FIT FINDER — VALIDATOR (machine-readable, CI-safe)
   =====================================================================
   Run: node tests/validate.mjs   (exit 0 = pass, 1 = fail)
   Writes tests/validation-report.json.

   Enforces the safety invariants (PRD item 5). It FAILS the build when:
   (1) a needs_review/expired claim produces a hard elimination;
   (2) a hard-elimination rule lacks required source metadata;
   (3) a research-only country appears in normal production results;
   (4) an unverified claim is given a lastChecked/lastVerified date;
   (5) a country-wide conclusion is derived from a route-specific claim;
   (6) missing data is silently treated as a negative (elimination) result.
   It also re-runs the §4 behaviour checks (Michael / retiree / 240 combos)
   so live behaviour is provably unchanged, and lists every incomplete
   country + claim for the research backlog.
   ===================================================================== */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const R = require(path.join(ROOT, "rules.js"));
const E = require(path.join(ROOT, "engine.js"));

const results = [];
let failed = 0;
function assert(name, cond, detail) {
  const pass = !!cond;
  if (!pass) failed++;
  results.push({ check: name, pass, detail: detail || null });
}

/* ---- enumerate every claim (elimination + country survive-claim) ---- */
const claims = [];
for (const c of R.countries) {
  for (const e of (c.eliminations || [])) {
    claims.push({ country: c.id, kind: "elimination", when: e.when, v: e.verification, elim: e });
  }
  if (c.verification) {
    claims.push({ country: c.id, kind: "survive", v: c.verification, elim: null });
  }
}

const STATUSES = E.ALL_STATUSES;
const UNVERIFIED = ["needs_review", "expired"];

/* ---- Invariant 4: unverified claims must not carry a date ---- */
for (const cl of claims) {
  const v = cl.v || {};
  if (UNVERIFIED.includes(v.status)) {
    assert(
      `[unverified-no-date] ${cl.country}/${cl.kind}: '${v.status}' claim has no lastChecked`,
      !v.lastChecked,
      v.lastChecked ? `lastChecked=${v.lastChecked} present on ${v.status} claim` : null
    );
    if (cl.elim && cl.elim.source && cl.elim.source.lastVerified) {
      assert(`[unverified-no-date] ${cl.country}/elim: source.lastVerified absent on unverified`, false,
        `source.lastVerified=${cl.elim.source.lastVerified}`);
    }
  }
  assert(`[status-valid] ${cl.country}/${cl.kind}: status is a known value`,
    STATUSES.includes(v.status), `status='${v.status}'`);
}

/* ---- Invariants 1 & 2: only fully-verified eliminations may fire ---- */
for (const c of R.countries) {
  for (const e of (c.eliminations || [])) {
    const gate = E.eliminationIsEnforceable(e);
    const status = e.verification && e.verification.status;
    if (UNVERIFIED.includes(status)) {
      assert(`[no-unverified-elim] ${c.id}: ${status} elimination is NOT enforceable`,
        !gate.ok, gate.ok ? "unverified elimination would fire!" : null);
    }
    if (gate.ok) {
      // Invariant 2: an enforceable elim must carry all required metadata.
      for (const f of E.REQUIRED_ELIM_META) {
        assert(`[elim-metadata] ${c.id}: enforceable elim has ${f}`,
          !!e.verification[f], `missing ${f}`);
      }
      // Invariant 5: route-specific, never a country-wide flag.
      assert(`[route-specific] ${c.id}: elimination names a specific route`,
        !!e.verification.routeName && !!e.when && Object.keys(e.when).length > 0,
        "elimination must be scoped by a route + when-clause, not country-wide");
    }
  }
}

/* ---- Invariant 3: research countries never appear in production UNLESS
        explicitly flagged publicResearch (labelled Research/Partial). ---- */
const anyAnswer = { residency: "permanent", income: "remote", budget: "b3k_4500", household: "couple" };
const prodAll = E.evaluateAll(R.countries, anyAnswer, { includeResearchCountries: false });
assert("[research-hidden] no NON-public research record in production results",
  prodAll.every((r) => !r.research || r.publicResearch),
  prodAll.filter((r) => r.research && !r.publicResearch).map((r) => r.id).join(",") || null);
/* Any publicResearch country must remain research-flagged (excluded from
   survivor count + surprise) and non-eliminating. */
for (const c of R.countries.filter((x) => x.publicResearch)) {
  assert(`[public-research] ${c.id} is research:true (excluded from counts/surprise)`, c.research === true);
  assert(`[public-research] ${c.id} is non-eliminating`, (c.eliminations || []).length === 0);
  assert(`[public-research] ${c.id} is visible in production`, prodAll.some((r) => r.id === c.id));
}
const researchDefined = R.countries.filter((c) => c.research).map((c) => c.id);

/* ---- Synthetic fixtures: prove each gate independently, even before the
        13 real research countries exist. ---- */
const fixtures = [
  { id: "fx_needs_review_elim", name: "FX1", research: false,
    eliminations: [{ when: { residency: ["permanent"] }, reason: "x",
      verification: { status: "needs_review", routeName: "r", governmentAuthority: "g",
        sourceUrl: "u", legalInstrument: "l", lastChecked: null } }] },
  { id: "fx_missing_meta_elim", name: "FX2", research: false,
    eliminations: [{ when: { residency: ["permanent"] }, reason: "x",
      verification: { status: "official_source_confirmed", routeName: "r" /* missing rest */,
        lastChecked: "2026-07-03" } }] },
  { id: "fx_expired_elim", name: "FX3", research: false,
    eliminations: [{ when: { residency: ["permanent"] }, reason: "x",
      verification: { status: "official_source_confirmed", routeName: "r", governmentAuthority: "g",
        sourceUrl: "u", legalInstrument: "l", lastChecked: "2000-01-01" } }] },
  { id: "fx_research_country", name: "FX4", research: true, eliminations: [],
    survivorNotes: [{ default: true, line: "candidate", tags: [] }] },
  { id: "fx_good_elim", name: "FX5", research: false,
    eliminations: [{ when: { residency: ["permanent"] }, reason: "x",
      verification: { status: "official_source_confirmed", routeName: "r", governmentAuthority: "g",
        sourceUrl: "u", legalInstrument: "l", lastChecked: "2026-07-03" } }] }
];
const permAns = { residency: "permanent", income: "remote", budget: "b3k_4500", household: "couple" };
function verdictOfFixture(fx) {
  return E.evaluateCountry(fx, permAns, { now: new Date("2026-07-03") }).verdict;
}
assert("[fixture:needs_review] needs_review elim survives (not eliminated)",
  verdictOfFixture(fixtures[0]) === "SURVIVES_WITH_CONTEXT");
assert("[fixture:missing_meta] incomplete elim survives (not eliminated)",
  verdictOfFixture(fixtures[1]) === "SURVIVES_WITH_CONTEXT");
assert("[fixture:expired] stale elim survives (not eliminated)",
  verdictOfFixture(fixtures[2]) === "SURVIVES_WITH_CONTEXT");
assert("[fixture:research-hidden] research country absent from production",
  E.evaluateAll(fixtures, permAns, { includeResearchCountries: false }).every((r) => r.id !== "fx_research_country"));
assert("[fixture:research-shown-dev] research country present (labelled) in dev",
  E.evaluateAll(fixtures, permAns, { includeResearchCountries: true }).some((r) => r.id === "fx_research_country" && r.research === true));
assert("[fixture:good] fully-verified elim DOES eliminate",
  E.evaluateCountry(fixtures[4], permAns, { now: new Date("2026-07-03") }).verdict === "ELIMINATED_HARD_CONFLICT");

/* ---- Invariant 6: missing data → survive, never eliminate ---- */
const emptyCountry = { id: "fx_empty", name: "FXE", research: false, eliminations: [], survivorNotes: [] };
assert("[missing-data-safe] country with no data survives (not eliminated)",
  E.evaluateCountry(emptyCountry, permAns).verdict === "SURVIVES_WITH_CONTEXT");

/* ---- §4 behaviour parity: live behaviour unchanged ---- */
function verdictOf(rs, id) { const r = rs.find((x) => x.id === id); return r && r.verdict; }
const michael = { residency: "permanent", income: "remote", budget: "b3k_4500", household: "couple" };
const rm = E.evaluateAll(R.countries, michael, { includeResearchCountries: false });
for (const id of ["colombia", "costa_rica", "panama"])
  assert(`[behaviour] Michael: ${id} eliminated`, verdictOf(rm, id) === "ELIMINATED_HARD_CONFLICT");
for (const id of ["mexico", "ecuador", "uruguay"])
  assert(`[behaviour] Michael: ${id} survives`, verdictOf(rm, id) === "SURVIVES_WITH_CONTEXT");

const retiree = { residency: "permanent", income: "pension", budget: "b3k_4500", household: "couple" };
const rr = E.evaluateAll(R.countries, retiree, { includeResearchCountries: false });
for (const id of ["colombia", "costa_rica", "panama", "mexico", "ecuador", "uruguay"])
  assert(`[behaviour] Retiree: ${id} survives`, verdictOf(rr, id) === "SURVIVES_WITH_CONTEXT");

/* 240-combo sweep on real data */
let neverElim = true, twoStates = true, allDoc = true;
for (const o1 of R.questions[0].options)
  for (const o2 of R.questions[1].options)
    for (const o3 of R.questions[2].options)
      for (const o4 of R.questions[3].options) {
        const a = { residency: o1.value, income: o2.value, budget: o3.value, household: o4.value };
        for (const r of E.evaluateAll(R.countries, a, { includeResearchCountries: false })) {
          if (!["ELIMINATED_HARD_CONFLICT", "SURVIVES_WITH_CONTEXT"].includes(r.verdict)) twoStates = false;
          if (r.verdict === "ELIMINATED_HARD_CONFLICT") {
            /* No never-eliminating country may ever hard-eliminate — includes the
               four newly-visible staged countries (they have no rules). */
            if (["mexico", "ecuador", "uruguay", "chile", "argentina", "peru", "paraguay"].includes(r.id)) neverElim = false;
            if (!r.elimination || !r.elimination.reason || !r.source) allDoc = false;
          }
        }
      }
assert("[behaviour] 240 combos: Mexico/Ecuador/Uruguay + Chile/Argentina/Peru/Paraguay never eliminate", neverElim);
assert("[behaviour] 240 combos: strictly two verdict states", twoStates);
assert("[behaviour] 240 combos: every elimination documented", allDoc);

/* ---- Permanence / threshold / absence-of-evidence integrity (item 4) ---- */
function permanenceViolations(route) {
  const p = route.permanence; if (!p) return [];
  const v = [];
  if (p.pathType === "eligible_to_apply") {
    if (p.approvalGuaranteed !== false) v.push("eligible_to_apply must set approvalGuaranteed:false (never guaranteed PR)");
    if (p.eligibleToApply !== true) v.push("eligible_to_apply must set eligibleToApply:true");
  }
  if (p.possibleReducedEligibilityMonths != null && p.reductionIsDiscretionary !== true)
    v.push("reduced timeline present but not marked discretionary (would render as automatic)");
  if (["direct_permanent", "eligible_to_apply", "no_verified_pathway", "uncertain"].indexOf(p.pathType) === -1)
    v.push("unknown pathType '" + p.pathType + "'");
  return v;
}
function thresholdViolations(route) {
  const t = route.threshold; if (!t) return [];
  const v = [];
  if (["case_by_case_solvency", "unverified"].indexOf(t.thresholdType) !== -1 && t.localAmount != null)
    v.push(t.thresholdType + " must not carry a legal localAmount (no fixed threshold)");
  if (t.usdEstimate != null) {
    if (!t.usdEstimateSource) v.push("usdEstimate present without usdEstimateSource");
    if (t.localAmount != null && t.usdEstimate === t.localAmount) v.push("usdEstimate reused as the legal localAmount");
  }
  if (["fixed_amount", "minimum_wage_multiple", "case_by_case_solvency", "unverified"].indexOf(t.thresholdType) === -1)
    v.push("unknown thresholdType '" + t.thresholdType + "'");
  return v;
}
function routeClaimViolations(route) {
  const vf = route.verification || {}; const v = [];
  if (UNVERIFIED.includes(vf.status) && vf.lastChecked) v.push("unverified route carries lastChecked");
  if (![...STATUSES, "not_verified"].includes(vf.status)) v.push("unknown route status '" + vf.status + "'");
  return v;
}
function absenceViolations(c) {
  const v = [];
  for (const a of (c.absenceOfEvidence || [])) {
    if (a.routeLocated !== false) v.push(`${c.id}: absenceOfEvidence '${a.routeName}' must have routeLocated:false`);
    if (E.APPROVED_STATUSES.includes(a.status)) v.push(`${c.id}: absenceOfEvidence '${a.routeName}' must not be a confirmed status (absence≠proof)`);
  }
  return v;
}

for (const c of R.countries) {
  for (const rt of (c.routes || [])) {
    const pv = permanenceViolations(rt), tv = thresholdViolations(rt), rv = routeClaimViolations(rt);
    assert(`[permanence] ${c.id}/${rt.routeName}`, pv.length === 0, pv.join("; ") || null);
    assert(`[threshold] ${c.id}/${rt.routeName}`, tv.length === 0, tv.join("; ") || null);
    assert(`[route-status] ${c.id}/${rt.routeName}`, rv.length === 0, rv.join("; ") || null);
  }
  const av = absenceViolations(c);
  assert(`[absence-of-evidence] ${c.id}`, av.length === 0, av.join("; ") || null);
  const cov = E.coverageIsSafe(c);
  assert(`[coverage] ${c.id}: stored coverage not inflated / not verified-from-partial`, cov.ok, cov.reasons.join("; ") || null);
}

/* ---- Teeth: prove each new check actually catches a bad record ---- */
assert("[teeth] permanence: guaranteed-PR caught",
  permanenceViolations({ permanence: { pathType: "eligible_to_apply", approvalGuaranteed: true, eligibleToApply: true } }).length > 0);
assert("[teeth] permanence: automatic reduced-timeline caught",
  permanenceViolations({ permanence: { pathType: "eligible_to_apply", approvalGuaranteed: false, eligibleToApply: true, possibleReducedEligibilityMonths: 12, reductionIsDiscretionary: false } }).length > 0);
assert("[teeth] threshold: estimate-as-legal-threshold caught",
  thresholdViolations({ threshold: { thresholdType: "case_by_case_solvency", localAmount: 2000 } }).length > 0);
assert("[teeth] threshold: usdEstimate-without-source caught",
  thresholdViolations({ threshold: { thresholdType: "fixed_amount", localAmount: 500000, usdEstimate: 2000 } }).length > 0);
assert("[teeth] absence: located-as-confirmed caught",
  absenceViolations({ id: "fx", absenceOfEvidence: [{ routeName: "r", routeLocated: true, status: "official_source_confirmed" }] }).length > 0);
assert("[teeth] coverage: hidden-country-labelled-live caught",
  !E.coverageIsSafe({ research: true, coverage: "live", routes: [], eliminations: [] }).ok);
assert("[teeth] coverage: verified-from-partial caught",
  !E.coverageIsSafe({ research: false, coverage: "live", eliminations: [], routes: [{ verification: { status: "needs_review" } }] }).ok);
assert("[teeth] coverage: good record passes",
  E.coverageIsSafe({ research: true, coverage: "partial", eliminations: [], routes: [{ verification: { status: "official_source_confirmed" } }] }).ok);

/* ---- Release classification: all five staged countries never eliminate;
        Chile/Argentina public survivors; Peru/Paraguay public research;
        Brazil hidden. ---- */
const NEW = ["chile", "argentina", "paraguay", "peru", "brazil"];
for (const id of NEW) {
  const c = R.countries.find((x) => x.id === id);
  assert(`[staged] ${id} exists`, !!c);
  assert(`[staged] ${id} has no eliminations (cannot rule out)`, c && (c.eliminations || []).length === 0);
}
/* Chile & Argentina — PUBLIC normal survivors. */
for (const id of ["chile", "argentina"]) {
  const c = R.countries.find((x) => x.id === id);
  assert(`[release] ${id} is public (research:false)`, c.research === false);
  assert(`[release] ${id} present in production`, prodAll.some((r) => r.id === id));
  assert(`[release] ${id} carries no staging language`,
    !(c.survivorNotes || []).some((n) => /research record|hidden from visitors/i.test(n.line || "")));
}
/* Peru & Paraguay — PUBLIC research/partial. */
for (const id of ["peru", "paraguay"]) {
  const c = R.countries.find((x) => x.id === id);
  assert(`[release] ${id} is publicResearch + research:true`, c.publicResearch === true && c.research === true);
  assert(`[release] ${id} present in production`, prodAll.some((r) => r.id === id));
  assert(`[release] ${id} carries no staging language`,
    !(c.survivorNotes || []).some((n) => /research record|hidden from visitors/i.test(n.line || "")));
}
/* Brazil — HIDDEN. */
const brazil = R.countries.find((x) => x.id === "brazil");
assert("[release] brazil hidden (research:true, not publicResearch)", brazil.research === true && !brazil.publicResearch);
assert("[release] brazil absent from production", !prodAll.some((r) => r.id === "brazil"));
assert("[release] brazil has zero routes (intentional)", (brazil.routes || []).length === 0);
/* Public country count = 10. */
assert("[release] production shows exactly 10 countries",
  prodAll.length === 10, "got " + prodAll.length + ": " + prodAll.map((r) => r.id).join(","));

/* ---- backlog: incomplete countries + claims (machine-readable) ---- */
const incomplete = { countries: [], claims: [] };
for (const c of R.countries) {
  const coverage = E.deriveCoverage(c);
  const claimList = [];
  for (const e of (c.eliminations || [])) {
    const gate = E.eliminationIsEnforceable(e);
    claimList.push({ kind: "elimination", route: e.verification && e.verification.routeName,
      status: e.verification && e.verification.status, enforceable: gate.ok, blockers: gate.reasons });
  }
  for (const rt of (c.routes || [])) {
    claimList.push({ kind: "route", route: rt.routeName,
      status: rt.verification && rt.verification.status, enforceable: null, blockers: [] });
  }
  if (c.verification)
    claimList.push({ kind: "survive", route: c.verification.routeName, status: c.verification.status,
      enforceable: null, blockers: [] });
  const needsWork = claimList.filter((x) => x.status && UNVERIFIED.includes(x.status));
  if (coverage !== "live" || needsWork.length) {
    incomplete.countries.push({ id: c.id, research: !!c.research, storedCoverage: c.coverage || null,
      derivedCoverage: coverage, claimsNeedingReview: needsWork.length });
  }
  for (const cl of claimList)
    if (cl.status && UNVERIFIED.includes(cl.status)) incomplete.claims.push({ country: c.id, ...cl });
}

const report = {
  generatedAt: new Date().toISOString(),
  totalChecks: results.length,
  failures: failed,
  pass: failed === 0,
  researchCountriesDefined: researchDefined,
  productionCountries: R.countries.filter((c) => !c.research).map((c) => c.id),
  incomplete,
  checks: results
};
fs.writeFileSync(path.join(__dirname, "validation-report.json"), JSON.stringify(report, null, 2));

console.log(`\nFit Finder validator — ${results.length} checks, ${failed} failure(s)`);
if (failed) {
  console.error("FAILED:");
  for (const r of results.filter((x) => !x.pass)) console.error("  ✗ " + r.check + (r.detail ? "  (" + r.detail + ")" : ""));
} else {
  console.log("All checks passed. Live behaviour unchanged; safety gates enforced.");
}
console.log(`Report: tests/validation-report.json  ·  incomplete claims: ${incomplete.claims.length}\n`);
process.exit(failed ? 1 : 0);
