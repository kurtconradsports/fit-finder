/* =====================================================================
   LATIN AMERICA FIT FINDER — app logic (PRD v1.2)
   Reads everything (rules, thresholds, copy, links) from rules.js.
   Do not put editable copy in this file.
   ===================================================================== */
(function () {
  "use strict";

  var R = window.FIT_RULES;
  var E = window.FitEngine; /* shared safety/verdict engine */
  var $ = function (id) { return document.getElementById(id); };

  /* Dev/preview mode: localhost or ?preview=1 / ?dev=1. Only here do research
     records appear — clearly labelled and blocked from authoritative verdicts.
     Production (the live URL) stays research-free. */
  var devMode = (function () {
    try {
      var qs = new URLSearchParams(location.search);
      if (qs.get("preview") === "1" || qs.get("dev") === "1") return true;
      return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    } catch (e) { return false; }
  })();
  /* Research records surface ONLY in dev mode (labelled, verdict-blocked).
     rules.settings.includeResearchCountries is the production default (false);
     dev mode reveals them. Production stays research-free. */
  var includeResearch = devMode || !!(R.settings && R.settings.includeResearchCountries);

  /* ---------------- analytics (§8) ---------------- */

  var events = (window.__ffEvents = []);
  function track(name, props) {
    props = props || {};
    events.push({ name: name, props: props, t: Date.now() });
    try {
      if (window.goatcounter && window.goatcounter.count) {
        /* GoatCounter: events show as event paths on the dashboard; the
           surprise country gets its own sub-path for per-country counts. */
        var path = name + (props.country ? "/" + props.country : "");
        window.goatcounter.count({ path: path, title: name, event: true });
      }
      if (window.plausible) window.plausible(name, { props: props });
      if (window.gtag) window.gtag("event", name, props);
      if (window.dataLayer) window.dataLayer.push(Object.assign({ event: name }, props));
    } catch (e) { /* analytics must never break the tool */ }
    if (window.console && console.debug) console.debug("[ff]", name, props);
  }

  /* ---------------- state ---------------- */

  var answers = { residency: null, income: null, budget: null, household: null };
  var firedQuestionEvents = {};
  var finderStarted = false;
  var seenResultCombos = {};

  function allAnswered() {
    return R.questions.every(function (q) { return !!answers[q.id]; });
  }
  function answeredCount() {
    return R.questions.filter(function (q) { return !!answers[q.id]; }).length;
  }

  /* ---------------- verdict engine (§4) ----------------
     The logic now lives in engine.js (shared with the validator) so the
     hard-elimination safety gate cannot drift. evaluateAll passes the dev
     flag through so research records only appear in dev mode. */

  function evaluateAll(a) {
    return E.evaluateAll(R.countries, a, {
      includeResearchCountries: includeResearch
    });
  }

  /* Surprise-elimination selector (§4). Research records never supply the
     surprise (they are excluded from authoritative verdicts). */
  function pickSurprise(results) {
    var byId = {};
    results.forEach(function (r) { if (!r.research) byId[r.id] = r; });
    for (var i = 0; i < R.surprise.eliminationPriority.length; i++) {
      var r = byId[R.surprise.eliminationPriority[i]];
      if (r && r.verdict === "ELIMINATED_HARD_CONFLICT") {
        return { kind: "elimination", result: r };
      }
    }
    /* nothing eliminated → strongest context flag */
    var survivors = results.filter(function (r) { return r.verdict === "SURVIVES_WITH_CONTEXT" && !r.research; });
    for (var t = 0; t < R.surprise.contextPriority.length; t++) {
      var tag = R.surprise.contextPriority[t];
      for (var s = 0; s < survivors.length; s++) {
        if (survivors[s].tags.indexOf(tag) !== -1) {
          return { kind: "context", result: survivors[s], tag: tag };
        }
      }
    }
    return { kind: "none" };
  }

  /* ---------------- URL state (unique result link, §5) ---------------- */

  function resultUrl() {
    var params = [];
    R.questions.forEach(function (q) {
      if (answers[q.id]) params.push(q.urlKey + "=" + encodeURIComponent(answers[q.id]));
    });
    var base = location.origin + location.pathname;
    return params.length ? base + "?" + params.join("&") : base;
  }

  function restoreFromUrl() {
    var qs = new URLSearchParams(location.search);
    R.questions.forEach(function (q) {
      var v = qs.get(q.urlKey);
      if (!v) return;
      var valid = q.options.some(function (o) { return o.value === v; });
      if (valid) answers[q.id] = v;
    });
  }

  function syncUrl() {
    try { history.replaceState(null, "", resultUrl()); } catch (e) {}
  }

  /* ---------------- rendering ---------------- */

  function fill(template, vars) {
    return template.replace(/\{(\w+)\}/g, function (_, k) {
      return vars[k] != null ? vars[k] : "";
    });
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderControls() {
    var wrap = $("controls");
    wrap.textContent = "";
    R.questions.forEach(function (q, idx) {
      var field = el("fieldset", "question");
      var legend = el("legend", "question-label");
      legend.appendChild(el("span", "question-num", "Q" + (idx + 1)));
      legend.appendChild(document.createTextNode(" " + q.label));
      field.appendChild(legend);

      var group = el("div", "options");
      group.setAttribute("role", "radiogroup");
      group.setAttribute("aria-label", q.label);
      q.options.forEach(function (o) {
        var btn = el("button", "option", o.label);
        btn.type = "button";
        btn.setAttribute("role", "radio");
        btn.dataset.q = q.id;
        btn.dataset.v = o.value;
        btn.setAttribute("aria-checked", String(answers[q.id] === o.value));
        if (answers[q.id] === o.value) btn.classList.add("selected");
        btn.addEventListener("click", function () { onAnswer(q, o.value); });
        group.appendChild(btn);
      });
      field.appendChild(group);
      wrap.appendChild(field);
    });
  }

  function updateControlSelection() {
    var buttons = document.querySelectorAll(".option");
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      var sel = answers[b.dataset.q] === b.dataset.v;
      b.classList.toggle("selected", sel);
      b.setAttribute("aria-checked", String(sel));
    }
  }

  function tagChips(tags) {
    var frag = document.createDocumentFragment();
    tags.forEach(function (t) {
      var def = R.tags[t];
      if (def) frag.appendChild(el("span", "chip", def.label));
    });
    return frag;
  }

  function sourceLink(source) {
    var p = el("p", "tile-source");
    p.appendChild(document.createTextNode("Source: "));
    var a = el("a", null, source.label);
    a.href = source.url;
    a.target = "_blank";
    a.rel = "noopener";
    p.appendChild(a);
    return p;
  }

  function renderTiles(results) {
    var wrap = $("tiles");
    wrap.textContent = "";
    results.forEach(function (r) {
      var eliminated = r.verdict === "ELIMINATED_HARD_CONFLICT";
      var cls = "tile " + (r.research ? "research" : (eliminated ? "eliminated" : "survivor"));
      var tile = el("article", cls);
      tile.dataset.country = r.id;

      var head = el("div", "tile-head");
      head.appendChild(el("h3", "tile-name", r.name));
      /* Research records get a neutral, non-authoritative label — never a
         "survives"/"ruled out" verdict (dev-only). */
      var statusText = r.research
        ? "Research — not verified"
        : (eliminated ? R.copy.statusEliminated : R.copy.statusSurvives);
      head.appendChild(el("span", "tile-status", statusText));
      tile.appendChild(head);

      if (r.research) {
        tile.appendChild(el("p", "tile-research-note",
          "Preview only. This country is still in research and is not shown to visitors or given a verdict."));
      }

      if (eliminated && r.elimination && r.elimination.nonNegotiable) {
        tile.appendChild(el("p", "tile-conflict", R.copy.conflictPrefix + " " + r.elimination.nonNegotiable + "."));
      }
      tile.appendChild(el("p", "tile-line", r.line));
      if (r.tags.length) {
        var chips = el("div", "tile-chips");
        chips.appendChild(tagChips(r.tags));
        tile.appendChild(chips);
      }
      if (r.source) tile.appendChild(sourceLink(r.source));
      tile.appendChild(el("p", "tile-verify", R.copy.microDisclaimer));

      wrap.appendChild(tile);
    });
  }

  function renderProgress() {
    var hint = $("progressHint");
    var n = answeredCount();
    if (n >= 4) { hint.textContent = ""; hint.hidden = true; return; }
    hint.hidden = false;
    hint.textContent = n === 0
      ? R.copy.progressPrompt
      : fill(R.copy.progressPartial, { answered: n });
  }

  function renderResult(results) {
    var wrap = $("result");
    wrap.textContent = "";
    if (!allAnswered()) { wrap.hidden = true; return; }
    wrap.hidden = false;

    var comboKey = R.questions.map(function (q) { return answers[q.id]; }).join("|");
    var newCombo = !seenResultCombos[comboKey];
    seenResultCombos[comboKey] = true;

    /* Authoritative verdict counts CONFIRMED countries only — research
       records never inflate the survivor list. */
    var survivors = results.filter(function (r) {
      return r.verdict === "SURVIVES_WITH_CONTEXT" && !r.research;
    });
    var names = survivors.map(function (r) { return r.name; });
    var listText = names.length > 1
      ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1]
      : (names[0] || "");

    var headTemplate = survivors.length === 1 ? R.copy.resultHeadlineSingular : R.copy.resultHeadlinePlural;
    wrap.appendChild(el("h2", "result-headline", fill(headTemplate, { n: survivors.length, list: listText })));

    /* survivor lines — identical styling, never ranked */
    var list = el("ul", "result-survivors");
    survivors.forEach(function (r) {
      var li = el("li", "result-survivor");
      li.appendChild(el("strong", "result-survivor-name", r.name));
      var lineWrap = el("span", "result-survivor-line", " — " + r.line);
      if (r.tags.length) {
        lineWrap.appendChild(document.createTextNode(" "));
        lineWrap.appendChild(tagChips(r.tags));
      }
      li.appendChild(lineWrap);
      list.appendChild(li);
    });
    wrap.appendChild(list);

    /* the surprise */
    var surprise = pickSurprise(results);
    var surpriseText = null;
    if (surprise.kind === "elimination") {
      var e = surprise.result.elimination;
      surpriseText = fill(R.copy.surpriseTemplate, {
        country: surprise.result.name,
        nonNegotiable: e.nonNegotiable,
        why: e.why
      });
      if (newCombo) track("surprise_elimination_shown", { country: surprise.result.id });
    } else if (surprise.kind === "context") {
      surpriseText = fill(R.copy.surpriseNoElimination, {
        country: surprise.result.name,
        line: surprise.result.line
      });
    } else {
      surpriseText = R.copy.surpriseNoFlags;
    }
    var sBlock = el("div", "result-surprise");
    sBlock.appendChild(el("p", null, surpriseText));
    wrap.appendChild(sBlock);

    /* hand-off + paid CTA (§6) */
    wrap.appendChild(el("p", "result-handoff", R.copy.handoff));

    var cta = el("a", "cta-button", R.copy.ctaButton);
    cta.href = R.links.audit;
    cta.addEventListener("click", function () { track("cta_clicked"); });
    wrap.appendChild(cta);
    wrap.appendChild(el("p", "cta-promise", R.copy.ctaPromise));

    /* share */
    var share = el("button", "share-button", R.copy.shareButton);
    share.type = "button";
    share.addEventListener("click", function () { shareResult(results, surprise); });
    wrap.appendChild(share);
    var toast = el("p", "share-toast", "");
    toast.id = "shareToast";
    toast.hidden = true;
    wrap.appendChild(toast);

    /* secondary: worksheet + recruitment hook (§5, visually subordinate) */
    var secondary = el("div", "result-secondary");
    if (R.links.worksheet && R.links.worksheet.charAt(0) !== "#") {
      var w = el("a", "worksheet-link", R.copy.worksheetLink);
      w.href = R.links.worksheet;
      w.addEventListener("click", function () { track("worksheet_clicked"); });
      secondary.appendChild(w);
    }
    var recruit = el("p", "recruit-line");
    recruit.appendChild(document.createTextNode(R.copy.recruitLine + " "));
    var cal = el("a", null, R.copy.recruitLinkText);
    cal.href = R.links.calendly;
    cal.target = "_blank";
    cal.rel = "noopener";
    recruit.appendChild(cal);
    secondary.appendChild(recruit);
    wrap.appendChild(secondary);

    wrap.appendChild(el("p", "result-disclaimer", R.copy.microDisclaimer));

    if (newCombo) {
      track("result_reached", {
        survivors: survivors.length,
        combo: comboKey
      });
    }
  }

  function renderAll() {
    var results = evaluateAll(answers);
    renderTiles(results);
    renderProgress();
    renderResult(results);
  }

  /* ---------------- interactions ---------------- */

  function onAnswer(q, value) {
    if (!finderStarted) { finderStarted = true; track("finder_start"); }
    answers[q.id] = value;
    if (!firedQuestionEvents[q.id]) {
      firedQuestionEvents[q.id] = true;
      track(q.analyticsKey + "_answered", { value: value });
    }
    updateControlSelection();
    syncUrl();
    renderAll();
  }

  /* ---------------- share card (§5) ---------------- */

  function wrapText(ctx, text, maxWidth) {
    var words = text.split(" ");
    var lines = [];
    var line = "";
    words.forEach(function (word) {
      var test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawCard(results, surprise) {
    var survivors = results.filter(function (r) { return r.verdict === "SURVIVES_WITH_CONTEXT"; });
    var canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    var ctx = canvas.getContext("2d");

    ctx.fillStyle = "#0f1512";
    ctx.fillRect(0, 0, 1200, 630);
    ctx.fillStyle = "#d4a24e";
    ctx.fillRect(0, 0, 1200, 6);

    ctx.fillStyle = "#a9a294";
    ctx.font = "600 24px Georgia, serif";
    ctx.fillText(R.shareCard.brand + "  ·  " + R.shareCard.tool, 70, 80);

    /* headline: the surprise elimination, stated as fact */
    var headline;
    if (surprise.kind === "elimination" && surprise.result.elimination.cardHeadline) {
      headline = surprise.result.elimination.cardHeadline;
    } else {
      headline = fill(R.shareCard.noEliminationHeadline, { n: survivors.length });
    }
    ctx.fillStyle = "#f2ede3";
    ctx.font = "700 52px Georgia, serif";
    var lines = wrapText(ctx, headline, 1060);
    var y = 170;
    lines.slice(0, 4).forEach(function (l) { ctx.fillText(l, 70, y); y += 66; });

    /* survivors */
    ctx.fillStyle = "#d4a24e";
    ctx.font = "600 32px Georgia, serif";
    y += 20;
    var survText = R.shareCard.survivorsPrefix + survivors.map(function (r) { return r.name; }).join(", ");
    wrapText(ctx, survText, 1060).slice(0, 2).forEach(function (l) { ctx.fillText(l, 70, y); y += 44; });

    /* one primary priority — residency goal only; never budget (no private
       financial numbers, §5) */
    var q1 = R.questions[0];
    var opt = q1.options.filter(function (o) { return o.value === answers[q1.id]; })[0];
    if (opt) {
      ctx.fillStyle = "#a9a294";
      ctx.font = "26px Georgia, serif";
      ctx.fillText(R.shareCard.priorityPrefix + opt.label, 70, y + 16);
    }

    ctx.fillStyle = "#d4a24e";
    ctx.font = "600 26px Georgia, serif";
    var displayUrl = resultUrl().replace(/^https?:\/\//, "");
    ctx.fillText(displayUrl.length > 90 ? displayUrl.slice(0, 90) + "…" : displayUrl, 70, 575);

    return canvas;
  }

  function showToast(msg) {
    var toast = $("shareToast");
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    setTimeout(function () { toast.hidden = true; }, 4000);
  }

  function shareResult(results, surprise) {
    track("share_clicked");
    var url = resultUrl();
    var canvas = drawCard(results, surprise);
    canvas.toBlob(function (blob) {
      var file = blob ? new File([blob], "fit-finder-result.png", { type: "image/png" }) : null;
      var payload = { title: R.shareCard.tool, text: R.shareCard.shareText, url: url };
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        payload.files = [file];
      }
      if (navigator.share) {
        navigator.share(payload).catch(function () { fallbackShare(blob, url); });
      } else {
        fallbackShare(blob, url);
      }
    }, "image/png");
  }

  function fallbackShare(blob, url) {
    if (blob) {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "fit-finder-result.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        showToast(R.copy.shareFallbackToast);
      }, function () { showToast(url); });
    } else {
      showToast(url);
    }
  }

  /* ---------------- self-test (§4 sanity + reshuffle checks) ---------------- */

  function selfTest() {
    var checks = [];
    function check(name, cond) { checks.push({ check: name, pass: !!cond }); }
    function verdictOf(rs, id) {
      return rs.filter(function (r) { return r.id === id; })[0].verdict;
    }

    /* canonical “Michael”: permanent · remote · $3–4.5k · couple */
    var michael = { residency: "permanent", income: "remote", budget: "b3k_4500", household: "couple" };
    /* Behaviour checks run against PRODUCTION scope (research countries
       excluded) so dev-mode staging can never mask a regression. */
    function prodEval(a) { return E.evaluateAll(R.countries, a, { includeResearchCountries: false }); }
    var rm = prodEval(michael);
    ["colombia", "costa_rica", "panama"].forEach(function (id) {
      check("Michael: " + id + " eliminated", verdictOf(rm, id) === "ELIMINATED_HARD_CONFLICT");
    });
    ["mexico", "ecuador", "uruguay"].forEach(function (id) {
      check("Michael: " + id + " survives", verdictOf(rm, id) === "SURVIVES_WITH_CONTEXT");
    });
    var sm = pickSurprise(rm);
    check("Michael: surprise = Colombia", sm.kind === "elimination" && sm.result.id === "colombia");
    var muy = rm.filter(function (r) { return r.id === "uruguay"; })[0];
    check("Michael: Uruguay carries budget_pressure", muy.tags.indexOf("budget_pressure") !== -1);

    /* reshuffle: retiree — permanent · pension · $3–4.5k · couple */
    var retiree = { residency: "permanent", income: "pension", budget: "b3k_4500", household: "couple" };
    var rr = prodEval(retiree);
    ["colombia", "costa_rica", "panama", "mexico", "ecuador", "uruguay"].forEach(function (id) {
      check("Retiree: " + id + " survives", verdictOf(rr, id) === "SURVIVES_WITH_CONTEXT");
    });

    /* Uruguay budget_pressure fires per the §4 table */
    var pressured = { residency: "several_years", income: "remote", budget: "b2k_3k", household: "family" };
    var rp = prodEval(pressured);
    var uy = rp.filter(function (r) { return r.id === "uruguay"; })[0];
    check("Uruguay: budget_pressure at $2–3k family", uy.tags.indexOf("budget_pressure") !== -1);

    /* exhaustive sweep: Mexico/Ecuador/Uruguay never eliminate; every
       elimination carries a documented reason + source (all 240 combos) */
    var neverEliminated = true, allDocumented = true, onlyTwoStates = true;
    R.questions[0].options.forEach(function (o1) {
      R.questions[1].options.forEach(function (o2) {
        R.questions[2].options.forEach(function (o3) {
          R.questions[3].options.forEach(function (o4) {
            var rs = prodEval({ residency: o1.value, income: o2.value, budget: o3.value, household: o4.value });
            rs.forEach(function (r) {
              if (r.verdict !== "ELIMINATED_HARD_CONFLICT" && r.verdict !== "SURVIVES_WITH_CONTEXT") onlyTwoStates = false;
              if (r.verdict === "ELIMINATED_HARD_CONFLICT") {
                if (["mexico", "ecuador", "uruguay"].indexOf(r.id) !== -1) neverEliminated = false;
                if (!r.elimination || !r.elimination.reason || !r.source) allDocumented = false;
              }
            });
          });
        });
      });
    });
    check("All 240 combos: Mexico/Ecuador/Uruguay never eliminate", neverEliminated);
    check("All 240 combos: every elimination has reason + source", allDocumented);
    check("All 240 combos: strictly two verdict states", onlyTwoStates);

    /* Safety gate: every elimination that CAN fire is enforceable (clears
       the evidence threshold). If any confirmed elimination silently stopped
       firing, Michael above would already have failed. */
    var allEnforceable = true;
    R.countries.forEach(function (c) {
      (c.eliminations || []).forEach(function (e) {
        if (!E.eliminationIsEnforceable(e).ok) allEnforceable = false;
      });
    });
    check("Every defined elimination is enforceable (meets evidence threshold)", allEnforceable);

    /* Production must never expose a research record. */
    var prod = E.evaluateAll(R.countries, michael, { includeResearchCountries: false });
    check("Production results contain no research records",
      prod.every(function (r) { return !r.research; }));

    var pass = checks.every(function (c) { return c.pass; });
    if (pass) {
      console.info("[ff] self-test PASS (" + checks.length + " checks)");
    } else {
      console.error("[ff] SELF-TEST FAILED");
      console.table(checks.filter(function (c) { return !c.pass; }));
    }
    return { pass: pass, checks: checks };
  }

  /* ---------------- init ---------------- */

  function init() {
    document.title = "Latin America Fit Finder — The Expat Escape Plan";
    $("headline").textContent = R.copy.headline;
    $("subhead").textContent = R.copy.subhead;
    $("disclaimer").textContent = R.copy.disclaimer;

    track("page_view");

    restoreFromUrl();
    renderControls();
    renderAll();
    /* §8: load-speed capture */
    window.addEventListener("load", function () {
      var ms = Math.round(performance.now());
      try {
        var nav = performance.getEntriesByType("navigation")[0];
        if (nav && nav.loadEventStart) ms = Math.round(nav.loadEventStart);
      } catch (e) {}
      track("load_speed", { ms: ms });
    });

    selfTest();
  }

  window.FitFinder = {
    evaluateAll: evaluateAll,
    pickSurprise: pickSurprise,
    drawCard: drawCard,
    resultUrl: resultUrl,
    selfTest: selfTest,
    answers: answers,
    events: events
  };

  init();
})();
