// Formkurve — demo web app for training and nutrition.
// Everything runs in the browser. State lives in localStorage of this browser
// only (wrapped in try/catch: private windows simply start fresh each time).
// First visit loads a believable sample week so the app never looks empty.
(function () {
  "use strict";

  var KEY = "formkurve-demo-v1";
  var motion = document.documentElement.classList.contains("fx");

  /* Data ------------------------------------------------------------------ */
  // per 100 g: kcal, protein, carbs, fat; g = usual portion
  var FOODS = [
    { id: "hafer", name: "Haferflocken", kcal: 370, p: 13, c: 59, f: 7, g: 60 },
    { id: "skyr", name: "Skyr natur", kcal: 63, p: 11, c: 4, f: 0.2, g: 150 },
    { id: "quark", name: "Magerquark", kcal: 67, p: 12, c: 4, f: 0.3, g: 250 },
    { id: "joghurt", name: "Griechischer Joghurt 10 %", kcal: 122, p: 4, c: 4, f: 10, g: 150 },
    { id: "milch", name: "Milch 1,5 %", kcal: 47, p: 3.4, c: 4.8, f: 1.5, g: 200 },
    { id: "banane", name: "Banane", kcal: 95, p: 1.1, c: 20, f: 0.3, g: 120 },
    { id: "apfel", name: "Apfel", kcal: 54, p: 0.3, c: 12, f: 0.2, g: 150 },
    { id: "beeren", name: "Beerenmischung (TK)", kcal: 45, p: 1, c: 8, f: 0.4, g: 100 },
    { id: "brot", name: "Vollkornbrot", kcal: 215, p: 7, c: 38, f: 2, g: 50 },
    { id: "ei", name: "Ei, gekocht", kcal: 155, p: 13, c: 1, f: 11, g: 60 },
    { id: "haehnchen", name: "Hähnchenbrust", kcal: 110, p: 23, c: 0, f: 1.5, g: 150 },
    { id: "lachs", name: "Lachsfilet", kcal: 200, p: 20, c: 0, f: 13, g: 125 },
    { id: "thunfisch", name: "Thunfisch (Dose, Wasser)", kcal: 110, p: 25, c: 0, f: 1, g: 120 },
    { id: "hack", name: "Rinderhack", kcal: 250, p: 20, c: 0, f: 19, g: 125 },
    { id: "tofu", name: "Tofu natur", kcal: 120, p: 13, c: 2, f: 7, g: 150 },
    { id: "linsen", name: "Linsen, gekocht", kcal: 115, p: 9, c: 17, f: 0.4, g: 150 },
    { id: "reis", name: "Reis, gekocht", kcal: 130, p: 2.7, c: 28, f: 0.3, g: 200 },
    { id: "nudeln", name: "Nudeln, gekocht", kcal: 150, p: 5, c: 30, f: 1, g: 220 },
    { id: "kartoffeln", name: "Kartoffeln, gekocht", kcal: 72, p: 2, c: 15, f: 0.1, g: 250 },
    { id: "brokkoli", name: "Brokkoli", kcal: 34, p: 2.8, c: 4, f: 0.4, g: 150 },
    { id: "salat", name: "Salat, gemischt", kcal: 20, p: 1.2, c: 3, f: 0.2, g: 100 },
    { id: "tomate", name: "Tomaten", kcal: 18, p: 0.9, c: 3.9, f: 0.2, g: 120 },
    { id: "avocado", name: "Avocado", kcal: 160, p: 2, c: 9, f: 15, g: 80 },
    { id: "oel", name: "Olivenöl", kcal: 884, p: 0, c: 0, f: 100, g: 10 },
    { id: "mandeln", name: "Mandeln", kcal: 600, p: 21, c: 9, f: 52, g: 25 },
    { id: "erdnuss", name: "Erdnussbutter", kcal: 590, p: 25, c: 16, f: 50, g: 20 },
    { id: "gouda", name: "Gouda", kcal: 356, p: 25, c: 0, f: 27, g: 30 },
    { id: "shake", name: "Proteinshake (Pulver)", kcal: 380, p: 78, c: 6, f: 5, g: 30 },
    { id: "reiswaffel", name: "Reiswaffel", kcal: 385, p: 8, c: 80, f: 3, g: 10 },
    { id: "pizza", name: "Pizza Margherita", kcal: 250, p: 11, c: 31, f: 9, g: 350 },
    { id: "doener", name: "Döner Kebab", kcal: 215, p: 12, c: 20, f: 10, g: 400 },
    { id: "schoko", name: "Zartbitterschokolade", kcal: 550, p: 8, c: 33, f: 42, g: 20 }
  ];
  var FOOD = {};
  FOODS.forEach(function (f) { FOOD[f.id] = f; });

  var PLANS = {
    push: { name: "Push-Tag", tag: "Brust · Schultern · Trizeps", ex: [
      { id: "bank", name: "Bankdrücken", sets: 4, reps: 8, kg: 70, rest: 120 },
      { id: "schulter", name: "Schulterdrücken", sets: 3, reps: 10, kg: 40, rest: 90 },
      { id: "dips", name: "Dips", sets: 3, reps: 12, kg: null, rest: 90 },
      { id: "seitheben", name: "Seitheben", sets: 3, reps: 15, kg: 10, rest: 60 },
      { id: "trizeps", name: "Trizepsdrücken am Kabel", sets: 3, reps: 12, kg: 25, rest: 60 }
    ] },
    pull: { name: "Pull-Tag", tag: "Rücken · Bizeps", ex: [
      { id: "klimmzug", name: "Klimmzüge", sets: 4, reps: 8, kg: null, rest: 120 },
      { id: "rudern", name: "Langhantelrudern", sets: 4, reps: 10, kg: 60, rest: 90 },
      { id: "latzug", name: "Latzug eng", sets: 3, reps: 12, kg: 55, rest: 90 },
      { id: "facepull", name: "Face Pulls", sets: 3, reps: 15, kg: 20, rest: 60 },
      { id: "curls", name: "Bizepscurls", sets: 3, reps: 12, kg: 14, rest: 60 }
    ] },
    legs: { name: "Beine", tag: "Quads · Hamstrings · Waden", ex: [
      { id: "kniebeuge", name: "Kniebeugen", sets: 4, reps: 8, kg: 90, rest: 150 },
      { id: "rdl", name: "Rumänisches Kreuzheben", sets: 3, reps: 10, kg: 80, rest: 120 },
      { id: "presse", name: "Beinpresse", sets: 3, reps: 12, kg: 160, rest: 90 },
      { id: "ausfall", name: "Ausfallschritte", sets: 3, reps: 10, kg: 20, rest: 90 },
      { id: "waden", name: "Wadenheben", sets: 4, reps: 15, kg: 60, rest: 60 }
    ] }
  };
  var WEEK = ["rest", "push", "pull", "legs", "push", "pull", "legs"]; // by getDay(), 0 = Sunday
  var MEALS = [["fruehstueck", "Frühstück"], ["mittag", "Mittagessen"], ["abend", "Abendessen"], ["snacks", "Snacks"]];
  var ICONS = {
    heute: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    essen: '<path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10"/>',
    training: '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>',
    fortschritt: '<path d="M4 19h16M5 15l4-5 4 3 6-7"/>',
    profil: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'
  };
  var TABS = [["heute", "Heute"], ["essen", "Ernährung"], ["training", "Training"], ["fortschritt", "Fortschritt"], ["profil", "Profil"]];

  /* Helpers --------------------------------------------------------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  function fmt(n, d) { return Number(n).toLocaleString("de-DE", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function key(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function fromKey(k) { var p = k.split("-"); return new Date(+p[0], p[1] - 1, +p[2]); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var toastTimer;
  function toast(text) {
    var t = $("[data-toast]");
    t.textContent = text;
    t.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("on"); }, 2200);
  }

  /* State ----------------------------------------------------------------- */
  var TODAY = key(new Date());

  function targets(p) {
    var bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === "w" ? -161 : 5);
    var kcal = Math.round((bmr * p.activity + ({ cut: -400, keep: 0, bulk: 250 }[p.goal] || 0)) / 10) * 10;
    var protein = Math.round(2 * p.weight), fat = Math.round(0.8 * p.weight);
    return { kcal: kcal, p: protein, f: fat, c: Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4)) };
  }

  function emptyDay() { return { meals: { fruehstueck: [], mittag: [], abend: [], snacks: [] }, water: 0, sets: {}, workout: false }; }

  function sample() {
    var now = new Date(), rand = rng(now.getDate() * 97 + now.getMonth() * 31);
    var profile = { name: "Alex", sex: "m", age: 29, height: 182, weight: 82, activity: 1.55, goal: "cut" };
    var goal = targets(profile).kcal;
    var days = {};
    for (var i = 1; i <= 13; i++) {
      var d = addDays(now, -i), kcal = Math.round((goal + (rand() - 0.42) * 520) / 10) * 10;
      days[key(d)] = {
        summary: { kcal: kcal, p: Math.round(kcal * 0.27 / 4), c: Math.round(kcal * 0.47 / 4), f: Math.round(kcal * 0.26 / 9) },
        water: 5 + Math.floor(rand() * 4),
        workout: WEEK[d.getDay()] !== "rest" && rand() > 0.2
      };
    }
    var today = emptyDay();
    today.meals.fruehstueck = [{ id: "hafer", g: 70 }, { id: "skyr", g: 150 }, { id: "banane", g: 120 }];
    today.meals.mittag = [{ id: "haehnchen", g: 180 }, { id: "reis", g: 200 }, { id: "brokkoli", g: 150 }];
    today.meals.snacks = [{ id: "mandeln", g: 25 }];
    today.water = 3;
    days[TODAY] = today;
    var weights = [], kg = 84.6;
    for (var j = 29; j >= 1; j--) {
      kg = kg - 0.085 + (rand() - 0.5) * 0.5;
      if (j % 4 !== 3) weights.push({ d: key(addDays(now, -j)), kg: Math.round(kg * 10) / 10 });
    }
    profile.weight = weights[weights.length - 1].kg;
    return { v: 1, profile: profile, days: days, weights: weights };
  }

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v === 1 && s.profile && s.days && s.weights) return s;
    } catch (e) { /* storage blocked or corrupt: start fresh */ }
    return sample();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }

  var state = load();
  function today() {
    if (!state.days[TODAY] || !state.days[TODAY].meals) state.days[TODAY] = emptyDay();
    return state.days[TODAY];
  }

  function entryValues(e) {
    var f = FOOD[e.id], k = e.g / 100;
    return { kcal: f.kcal * k, p: f.p * k, c: f.c * k, f: f.f * k };
  }
  function totals(k) {
    var day = state.days[k];
    if (!day) return null;
    if (day.summary) return day.summary;
    var t = { kcal: 0, p: 0, c: 0, f: 0 };
    MEALS.forEach(function (m) {
      (day.meals[m[0]] || []).forEach(function (e) {
        var v = entryValues(e);
        t.kcal += v.kcal; t.p += v.p; t.c += v.c; t.f += v.f;
      });
    });
    return t;
  }
  function planFor(day, date) {
    var id = day.planOverride || WEEK[date.getDay()];
    return id === "rest" ? null : PLANS[id];
  }
  function hit(k, goal) { var t = totals(k); return !!t && Math.abs(t.kcal - goal) <= goal * 0.1; }

  /* Navigation ------------------------------------------------------------ */
  $$("[data-nav]").forEach(function (nav) {
    nav.innerHTML = TABS.map(function (t) {
      return '<a href="#' + t[0] + '" data-tab="' + t[0] + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[t[0]] + "</svg>" + t[1] + "</a>";
    }).join("");
  });
  $("[data-date]").textContent = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

  function route() {
    var view = (location.hash || "#heute").slice(1);
    if (!TABS.some(function (t) { return t[0] === view; })) view = "heute";
    $$("[data-view]").forEach(function (v) { v.hidden = v.getAttribute("data-view") !== view; });
    $$("[data-tab]").forEach(function (a) {
      if (a.getAttribute("data-tab") === view) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    var name = state.profile.name || "du";
    $("[data-initial]").textContent = name.charAt(0).toUpperCase();
    $("[data-title]").textContent = {
      heute: "Hallo " + name + " 👋", essen: "Ernährung", training: "Training",
      fortschritt: "Fortschritt", profil: "Profil"
    }[view];
    ({ heute: renderToday, essen: renderFood, training: renderTraining, fortschritt: renderProgress, profil: renderProfile })[view]();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  /* Today ----------------------------------------------------------------- */
  function renderToday() {
    var goal = targets(state.profile), t = totals(TODAY), day = today();
    var eaten = Math.round(t.kcal), left = goal.kcal - eaten;
    var ring = $("[data-ring]");
    ring.style.strokeDashoffset = String(326.7 * (1 - Math.min(1, eaten / goal.kcal)));
    ring.classList.toggle("over", left < 0);
    $("[data-left]").textContent = fmt(Math.abs(left));
    $("[data-left-label]").textContent = left >= 0 ? "kcal übrig" : "kcal drüber";
    $("[data-eaten]").textContent = fmt(eaten) + " kcal";
    $("[data-goal]").textContent = fmt(goal.kcal) + " kcal";

    $("[data-macros]").innerHTML = [["Protein", t.p, goal.p, "var(--mint)"], ["Kohlenhydrate", t.c, goal.c, "var(--amber)"], ["Fett", t.f, goal.f, "var(--coral)"]]
      .map(function (m) {
        return '<div><div class="macro-top"><span>' + m[0] + "</span><span>" + fmt(m[1]) + " / " + fmt(m[2]) + ' g</span></div>' +
          '<div class="meter" style="--c:' + m[3] + '"><i data-w="' + Math.min(100, m[1] / m[2] * 100).toFixed(1) + '"></i></div></div>';
      }).join("");
    requestAnimationFrame(function () { $$(".meter i").forEach(function (i) { i.style.width = i.getAttribute("data-w") + "%"; }); });

    renderWater();

    var plan = planFor(day, new Date());
    if (plan) {
      var total = plan.ex.reduce(function (s, e) { return s + e.sets; }, 0);
      var done = doneSets(day);
      $("[data-plan-tag]").textContent = plan.tag.split(" · ")[0];
      $("[data-plan-name]").textContent = plan.name;
      $("[data-plan-progress]").style.width = (done / total * 100) + "%";
      $("[data-plan-text]").textContent = day.workout ? "Erledigt. Stark!" : done + " von " + total + " Sätzen · " + plan.ex.length + " Übungen";
      $("[data-plan-btn]").textContent = day.workout ? "Ansehen" : done ? "Weitermachen" : "Training starten";
    } else {
      $("[data-plan-tag]").textContent = "Pause";
      $("[data-plan-name]").textContent = "Ruhetag";
      $("[data-plan-progress]").style.width = "0";
      $("[data-plan-text]").textContent = "Regeneration zählt. Ein Spaziergang reicht.";
      $("[data-plan-btn]").textContent = "Plan ansehen";
    }

    var w = state.weights, last = w[w.length - 1];
    $("[data-weight]").textContent = fmt(last.kg, 1);
    var weekAgo = w.filter(function (x) { return fromKey(x.d) <= addDays(new Date(), -7); }).pop() || w[0];
    var diff = last.kg - weekAgo.kg;
    $("[data-weight-trend]").textContent = (diff <= 0 ? "▼ " : "▲ ") + fmt(Math.abs(diff), 1) + " kg in 7 Tagen";
    spark($("[data-spark]"), w.slice(-14).map(function (x) { return x.kg; }));

    var streak = 0;
    for (var i = hit(TODAY, goal.kcal) ? 0 : 1; i < 60; i++) {
      if (hit(key(addDays(new Date(), -i)), goal.kcal)) streak++;
      else break;
    }
    $("[data-streak]").textContent = "🔥 " + streak;
    $("[data-week-dots]").innerHTML = [6, 5, 4, 3, 2, 1, 0].map(function (n) {
      var d = addDays(new Date(), -n), k = key(d);
      var cls = (hit(k, goal.kcal) ? "hit" : "") + (n === 0 ? " today" : "");
      return '<span class="' + cls + '" title="' + d.toLocaleDateString("de-DE") + '">' + ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d.getDay()] + "</span>";
    }).join("");
  }

  function renderWater() {
    var day = today(), box = $("[data-water]");
    box.innerHTML = "";
    for (var i = 0; i < 8; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "glass" + (i < day.water ? " on" : "");
      b.setAttribute("aria-label", "Glas " + (i + 1) + " (250 ml)");
      b.setAttribute("aria-pressed", i < day.water ? "true" : "false");
      (function (n) {
        b.addEventListener("click", function () {
          day.water = day.water === n + 1 ? n : n + 1;
          save();
          renderWater();
          if (day.water === 8) toast("💧 2 Liter geschafft!");
        });
      })(i);
      box.appendChild(b);
    }
    $("[data-water-text]").textContent = fmt(day.water * 0.25, 2) + " / 2,0 l";
  }

  function spark(svg, values) {
    var min = Math.min.apply(null, values) - 0.2, max = Math.max.apply(null, values) + 0.2;
    var pts = values.map(function (v, i) {
      return [i / (values.length - 1) * 200, 46 - (v - min) / (max - min) * 42];
    });
    var line = "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("L");
    svg.innerHTML = '<path class="area" d="' + line + 'L200 50L0 50Z"/><path d="' + line + '"/>';
  }

  /* Food ------------------------------------------------------------------ */
  var addTo = null, picked = null;

  function renderFood() {
    var goal = targets(state.profile), t = totals(TODAY), day = today();
    $("[data-day-sum]").innerHTML = [["kcal", t.kcal, goal.kcal, ""], ["Protein", t.p, goal.p, " g"], ["Kohlenhydrate", t.c, goal.c, " g"], ["Fett", t.f, goal.f, " g"]]
      .map(function (s) { return "<div><b>" + fmt(s[1]) + "</b><span>" + s[0] + " · Ziel " + fmt(s[2]) + s[3] + "</span></div>"; }).join("");
    $("[data-meals]").innerHTML = MEALS.map(function (m) {
      var list = day.meals[m[0]] || [];
      var sum = list.reduce(function (s, e) { return s + entryValues(e).kcal; }, 0);
      var items = list.map(function (e, i) {
        var v = entryValues(e);
        return '<li data-idx="' + i + '"><span>' + esc(FOOD[e.id].name) + "<small>" + fmt(e.g) + " g · P " + fmt(v.p) + " g · K " + fmt(v.c) + " g · F " + fmt(v.f) + " g</small></span>" +
          "<b>" + fmt(v.kcal) + " kcal</b>" +
          '<button type="button" class="del" data-del="' + m[0] + ":" + i + '" aria-label="' + esc(FOOD[e.id].name) + ' entfernen">×</button></li>';
      }).join("");
      return '<article class="card meal"><div class="card-head"><h2>' + m[1] + '</h2><span class="muted">' + fmt(sum) + " kcal</span></div>" +
        (items ? "<ul>" + items + "</ul>" : '<p class="empty">Noch nichts eingetragen.</p>') +
        '<button type="button" class="add" data-add="' + m[0] + '">+ ' + m[1] + " hinzufügen</button></article>";
    }).join("");
  }

  $("[data-meals]").addEventListener("click", function (e) {
    var del = e.target.closest("[data-del]");
    if (del) {
      var parts = del.getAttribute("data-del").split(":");
      var removed = today().meals[parts[0]].splice(+parts[1], 1)[0];
      save();
      renderFood();
      toast(FOOD[removed.id].name + " entfernt");
      return;
    }
    var add = e.target.closest("[data-add]");
    if (add) openFood(add.getAttribute("data-add"));
  });

  var foodDialog = $("[data-food-dialog]");
  function openDialog(d) { if (d.showModal) d.showModal(); else d.setAttribute("open", ""); }
  function closeDialog(d) { if (d.close) d.close(); else d.removeAttribute("open"); }
  $$("[data-close]").forEach(function (b) { b.addEventListener("click", function () { closeDialog(b.closest("dialog")); }); });

  function openFood(meal) {
    addTo = meal;
    picked = null;
    $("[data-food-title]").textContent = MEALS.filter(function (m) { return m[0] === meal; })[0][1] + " hinzufügen";
    $("[data-food-search]").value = "";
    $("[data-portion]").hidden = true;
    listFoods("");
    openDialog(foodDialog);
    $("[data-food-search]").focus();
  }

  function norm(s) { return s.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss"); }
  function listFoods(q) {
    var n = norm(q.trim());
    var hits = FOODS.filter(function (f) { return !n || norm(f.name).indexOf(n) !== -1; });
    $("[data-food-list]").innerHTML = hits.length ? hits.map(function (f) {
      return '<li><button type="button" data-food="' + f.id + '"><span>' + esc(f.name) + "</span><small>" + fmt(f.kcal) + " kcal / 100 g · P " + fmt(f.p, f.p % 1 ? 1 : 0) + " g</small><b>" + fmt(f.g) + " g</b></button></li>";
    }).join("") : '<li class="muted">Nichts gefunden. In der echten App kämen hier Barcode-Scan und eine große Datenbank dazu.</li>';
  }
  $("[data-food-search]").addEventListener("input", function (e) { listFoods(e.target.value); });
  $("[data-food-search]").addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    var first = $("[data-food]", foodDialog);
    if (first) first.click();
  });
  $("[data-food-list]").addEventListener("click", function (e) {
    var b = e.target.closest("[data-food]");
    if (!b) return;
    $$("[data-food]", foodDialog).forEach(function (x) { x.setAttribute("aria-selected", x === b ? "true" : "false"); });
    picked = FOOD[b.getAttribute("data-food")];
    $("[data-portion]").hidden = false;
    $("[data-portion-name]").textContent = picked.name;
    $("[data-portion-grams]").value = picked.g;
    portionKcal();
    $("[data-portion-grams]").focus();
    $("[data-portion-grams]").select();
  });
  function portionKcal() {
    var g = +$("[data-portion-grams]").value || 0, k = g / 100;
    $("[data-portion-kcal]").textContent = fmt(picked.kcal * k) + " kcal · P " + fmt(picked.p * k) + " g · K " + fmt(picked.c * k) + " g · F " + fmt(picked.f * k) + " g";
  }
  $("[data-portion-grams]").addEventListener("input", portionKcal);
  $("[data-portion-grams]").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("[data-portion-add]").click(); } });
  $("[data-portion-add]").addEventListener("click", function () {
    var g = Math.round(+$("[data-portion-grams]").value);
    if (!picked || !(g > 0 && g <= 2000)) return;
    today().meals[addTo].push({ id: picked.id, g: g });
    save();
    closeDialog(foodDialog);
    renderFood();
    var list = $$('[data-add="' + addTo + '"]')[0].parentNode.querySelectorAll("li");
    if (list.length) list[list.length - 1].classList.add("new");
    toast(picked.name + " (" + g + " g) eingetragen");
  });

  /* Training -------------------------------------------------------------- */
  function doneSets(day) {
    var n = 0;
    Object.keys(day.sets || {}).forEach(function (k) { day.sets[k].forEach(function (s) { if (s.done) n++; }); });
    return n;
  }
  function setsOf(day, ex) {
    if (!day.sets[ex.id]) {
      day.sets[ex.id] = [];
      for (var i = 0; i < ex.sets; i++) day.sets[ex.id].push({ kg: ex.kg, reps: ex.reps, done: false });
    }
    return day.sets[ex.id];
  }

  function renderTraining() {
    var day = today(), plan = planFor(day, new Date());
    var head = $("[data-plan-head]"), list = $("[data-exercises]"), finish = $("[data-finish]");
    if (!plan) {
      head.innerHTML = "";
      head.hidden = true;
      list.innerHTML = '<article class="card rest-card"><p class="big">🧘 Ruhetag</p><p class="muted">Muskeln wachsen in der Pause. Heute reicht ein Spaziergang oder 10 Minuten Mobility.</p>' +
        '<p class="muted" style="margin-top:14px">Doch Lust auf Training?</p><div class="row" style="justify-content:center;margin-top:10px">' +
        Object.keys(PLANS).map(function (id) { return '<button type="button" class="btn" data-override="' + id + '">' + PLANS[id].name + "</button>"; }).join("") + "</div></article>";
      finish.innerHTML = "";
      return;
    }
    head.hidden = false;
    var total = plan.ex.reduce(function (s, e) { return s + e.sets; }, 0);
    var minutes = Math.round(plan.ex.reduce(function (s, e) { return s + e.sets * (45 + e.rest); }, 0) / 60);
    head.innerHTML = "<div><h2>" + plan.name + '</h2><p class="muted">' + plan.tag + " · " + plan.ex.length + " Übungen · ca. " + minutes + " Min.</p></div>" +
      '<div style="min-width:180px"><p class="muted small">' + doneSets(day) + " / " + total + ' Sätze</p><div class="progress"><span style="width:' + (doneSets(day) / total * 100) + '%"></span></div></div>';
    list.innerHTML = plan.ex.map(function (ex) {
      var sets = setsOf(day, ex);
      return '<article class="card ex" data-ex="' + ex.id + '"><h3>' + ex.name + '</h3><p class="muted">' + ex.sets + " × " + ex.reps + (ex.kg ? " · " + ex.kg + " kg" : " · Körpergewicht") + " · " + ex.rest + " s Pause</p>" +
        sets.map(function (s, i) {
          return '<div class="set' + (s.done ? " done" : "") + '"><span class="n">' + (i + 1) + ".</span>" +
            '<label><input type="number" inputmode="decimal" min="0" max="500" step="0.5" value="' + (s.kg == null ? "" : s.kg) + '" placeholder="KG" data-field="kg" data-i="' + i + '" aria-label="Gewicht Satz ' + (i + 1) + '">kg</label>' +
            '<label><input type="number" inputmode="numeric" min="0" max="100" value="' + s.reps + '" data-field="reps" data-i="' + i + '" aria-label="Wiederholungen Satz ' + (i + 1) + '">Wdh.</label>' +
            '<button type="button" class="check" data-check="' + i + '" aria-pressed="' + s.done + '" aria-label="Satz ' + (i + 1) + ' erledigt">✓</button></div>';
        }).join("") + "</article>";
    }).join("");
    renderFinish(day, plan);
  }

  function renderFinish(day, plan) {
    var finish = $("[data-finish]");
    if (day.workout) {
      var volume = 0, count = 0;
      plan.ex.forEach(function (ex) {
        setsOf(day, ex).forEach(function (s) { if (s.done) { count++; volume += (+s.kg || 0) * (+s.reps || 0); } });
      });
      finish.innerHTML = '<article class="card done-card"><p class="big">💪 Stark, ' + esc(state.profile.name || "du") + "!</p>" +
        '<p class="muted">' + count + " Sätze · " + fmt(volume) + " kg bewegt. Training ist gespeichert.</p></article>";
    } else {
      finish.innerHTML = '<button type="button" class="btn primary" data-finish-btn' + (doneSets(day) ? "" : " disabled") + ">Training abschließen</button>";
    }
  }

  $("[data-exercises]").addEventListener("click", function (e) {
    var ov = e.target.closest("[data-override]");
    if (ov) { today().planOverride = ov.getAttribute("data-override"); save(); route(); return; }
    var b = e.target.closest("[data-check]");
    if (!b) return;
    var day = today(), plan = planFor(day, new Date());
    var ex = plan.ex.filter(function (x) { return x.id === b.closest("[data-ex]").getAttribute("data-ex"); })[0];
    var s = setsOf(day, ex)[+b.getAttribute("data-check")];
    s.done = !s.done;
    save();
    b.setAttribute("aria-pressed", String(s.done));
    b.closest(".set").classList.toggle("done", s.done);
    var total = plan.ex.reduce(function (n, x) { return n + x.sets; }, 0), done = doneSets(day);
    $("[data-plan-head] .progress span").style.width = (done / total * 100) + "%";
    $("[data-plan-head] .small").textContent = done + " / " + total + " Sätze";
    renderFinish(day, plan);
    if (s.done && done < total) startTimer(ex.rest);
    if (done === total) { stopTimer(); toast("Alle Sätze erledigt! Jetzt abschließen."); }
  });
  $("[data-exercises]").addEventListener("change", function (e) {
    var input = e.target.closest("[data-field]");
    if (!input) return;
    var day = today(), plan = planFor(day, new Date());
    var ex = plan.ex.filter(function (x) { return x.id === input.closest("[data-ex]").getAttribute("data-ex"); })[0];
    var v = input.value === "" ? null : +input.value;
    setsOf(day, ex)[+input.getAttribute("data-i")][input.getAttribute("data-field")] = v;
    save();
  });
  $("[data-finish]").addEventListener("click", function (e) {
    if (!e.target.closest("[data-finish-btn]")) return;
    var day = today();
    day.workout = true;
    save();
    stopTimer();
    renderFinish(day, planFor(day, new Date()));
    toast("Training gespeichert 💪");
  });

  // Rest timer between sets.
  var timerBox = $("[data-timer]"), timerLeft = 0, timerId = null;
  function paintTimer() { $("[data-timer-left]").textContent = Math.floor(timerLeft / 60) + ":" + pad(timerLeft % 60); }
  function startTimer(sec) {
    timerLeft = sec;
    timerBox.hidden = false;
    document.body.classList.add("timing");
    paintTimer();
    clearInterval(timerId);
    timerId = setInterval(function () {
      timerLeft--;
      paintTimer();
      if (timerLeft <= 0) {
        stopTimer();
        toast("Pause vorbei, nächster Satz!");
        if (navigator.vibrate) navigator.vibrate(200);
      }
    }, 1000);
  }
  function stopTimer() { clearInterval(timerId); timerBox.hidden = true; document.body.classList.remove("timing"); }
  $("[data-timer-plus]").addEventListener("click", function () { timerLeft += 15; paintTimer(); });
  $("[data-timer-skip]").addEventListener("click", stopTimer);

  /* Progress -------------------------------------------------------------- */
  function renderProgress() {
    var goal = targets(state.profile), w = state.weights;
    var last7 = [0, 1, 2, 3, 4, 5, 6].map(function (n) { return key(addDays(new Date(), -n)); });
    var kcals = last7.map(function (k) { var t = totals(k); return t ? t.kcal : 0; }).filter(Boolean);
    var avg = kcals.reduce(function (a, b) { return a + b; }, 0) / Math.max(1, kcals.length);
    var trainings = last7.filter(function (k) { return state.days[k] && state.days[k].workout; }).length;
    var water = last7.map(function (k) { return state.days[k] ? state.days[k].water : 0; });
    var diff30 = w[w.length - 1].kg - w[0].kg;
    $("[data-stats]").innerHTML = [
      ["Gewicht", fmt(w[w.length - 1].kg, 1) + " kg", '<span class="' + (diff30 <= 0 ? "down" : "up") + '">' + (diff30 <= 0 ? "▼ " : "▲ ") + fmt(Math.abs(diff30), 1) + " kg</span> in 30 Tagen"],
      ["Ø Kalorien", fmt(avg) + " kcal", "Ziel " + fmt(goal.kcal) + " kcal"],
      ["Trainings", trainings + " / 6", "in den letzten 7 Tagen"],
      ["Ø Wasser", fmt(water.reduce(function (a, b) { return a + b; }, 0) / 7 * 0.25, 1) + " l", "pro Tag"]
    ].map(function (s) { return '<article class="card stat"><span>' + s[0] + "</span><b>" + s[1] + "</b><span>" + s[2] + "</span></article>"; }).join("");
    weightChart($("[data-weight-chart]"), w.filter(function (x) { return fromKey(x.d) >= addDays(new Date(), -30); }));
    kcalChart($("[data-kcal-chart]"), last7.slice().reverse(), goal.kcal);
  }

  function weightChart(svg, pts) {
    var W = 640, H = 240, L = 44, R = 16, T = 16, B = 30;
    var vals = pts.map(function (p) { return p.kg; });
    var min = Math.floor(Math.min.apply(null, vals) - 0.5), max = Math.ceil(Math.max.apply(null, vals) + 0.5);
    var start = addDays(new Date(), -30).getTime(), span = new Date().getTime() - start;
    function x(p) { return L + (fromKey(p.d).getTime() - start) / span * (W - L - R); }
    function y(v) { return T + (max - v) / (max - min) * (H - T - B); }
    var out = '<defs><linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.25"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient></defs>';
    for (var i = 0; i <= 4; i++) {
      var v = min + (max - min) * i / 4, yy = y(v);
      out += '<line class="grid-l" x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '"/><text x="' + (L - 8) + '" y="' + (yy + 4) + '" text-anchor="end">' + fmt(v, 1) + "</text>";
    }
    [30, 20, 10, 0].forEach(function (n) {
      var d = addDays(new Date(), -n), xx = L + (d.getTime() - start) / span * (W - L - R);
      out += '<text x="' + xx + '" y="' + (H - 8) + '" text-anchor="middle">' + (n ? pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." : "heute") + "</text>";
    });
    var line = pts.map(function (p, i) { return (i ? "L" : "M") + x(p).toFixed(1) + " " + y(p.kg).toFixed(1); }).join("");
    out += '<path class="area" d="' + line + "L" + x(pts[pts.length - 1]).toFixed(1) + " " + (H - B) + "L" + x(pts[0]).toFixed(1) + " " + (H - B) + 'Z"/>';
    out += '<path class="line" d="' + line + '"/>';
    var lp = pts[pts.length - 1];
    out += '<circle class="dot" cx="' + x(lp) + '" cy="' + y(lp.kg) + '" r="5"/>';
    pts.forEach(function (p) {
      out += '<rect class="hit" x="' + (x(p) - 8) + '" y="' + T + '" width="16" height="' + (H - T - B) + '" data-tip="' + fmt(p.kg, 1) + " kg · " + fromKey(p.d).toLocaleDateString("de-DE", { day: "numeric", month: "short" }) + '" data-x="' + x(p) + '" data-y="' + y(p.kg) + '"/>';
    });
    out += '<g class="tip" data-tipbox visibility="hidden"><rect rx="8" height="26" width="120"/><text x="10" y="17"></text></g>';
    svg.innerHTML = out;
    bindTips(svg, W);
  }

  function kcalChart(svg, keys, goal) {
    var W = 640, H = 220, L = 44, R = 16, T = 24, B = 30;
    var vals = keys.map(function (k) { var t = totals(k); return t ? Math.round(t.kcal) : 0; });
    var max = Math.max(goal * 1.25, Math.max.apply(null, vals));
    function y(v) { return T + (1 - v / max) * (H - T - B); }
    var step = (W - L - R) / keys.length, bw = Math.min(46, step * 0.6), out = "";
    [0, 0.5, 1].forEach(function (f) {
      var v = Math.round(max * f / 100) * 100;
      out += '<line class="grid-l" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + fmt(v) + "</text>";
    });
    keys.forEach(function (k, i) {
      var v = vals[i], cx = L + step * i + step / 2, d = fromKey(k);
      var cls = "bar" + (k === TODAY ? " today" : v > goal * 1.1 ? " over" : "");
      out += '<rect class="' + cls + '" x="' + (cx - bw / 2) + '" y="' + y(v) + '" width="' + bw + '" height="' + (H - B - y(v)) + '" rx="8"/>';
      out += '<text x="' + cx + '" y="' + (y(v) - 6) + '" text-anchor="middle">' + (v ? fmt(v) : "–") + "</text>";
      out += '<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + (k === TODAY ? "heute" : ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d.getDay()]) + "</text>";
    });
    out += '<line class="goal" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(goal) + '" y2="' + y(goal) + '"/>';
    out += '<text x="' + (W - R) + '" y="' + (y(goal) - 6) + '" text-anchor="end" style="fill:var(--mint)">Ziel ' + fmt(goal) + "</text>";
    svg.innerHTML = out;
  }

  function bindTips(svg, W) {
    var box = $("[data-tipbox]", svg);
    svg.onpointermove = function (e) {
      var hitRect = e.target.closest && e.target.closest("[data-tip]");
      if (!hitRect) { box.setAttribute("visibility", "hidden"); return; }
      var text = $("text", box), rect = $("rect", box);
      text.textContent = hitRect.getAttribute("data-tip");
      var w = text.getComputedTextLength() + 20;
      rect.setAttribute("width", w);
      var tx = Math.min(W - w - 4, Math.max(4, +hitRect.getAttribute("data-x") - w / 2));
      box.setAttribute("transform", "translate(" + tx + "," + Math.max(0, +hitRect.getAttribute("data-y") - 38) + ")");
      box.setAttribute("visibility", "visible");
    };
    svg.onpointerleave = function () { box.setAttribute("visibility", "hidden"); };
  }

  /* Profile --------------------------------------------------------------- */
  var form = $("[data-profile]");
  function readForm() {
    var el = form.elements;
    return {
      name: el.name.value.trim().slice(0, 30) || "du",
      sex: el.sex.value,
      age: Math.min(99, Math.max(14, +el.age.value || 30)),
      height: Math.min(230, Math.max(120, +el.height.value || 175)),
      weight: Math.min(250, Math.max(35, +el.weight.value || 75)),
      activity: +el.activity.value,
      goal: el.goal.value
    };
  }
  function paintTargets(p) {
    var t = targets(p);
    $("[data-targets]").innerHTML = [["Kalorien", fmt(t.kcal) + " kcal"], ["Protein", t.p + " g"], ["Kohlenhydrate", t.c + " g"], ["Fett", t.f + " g"]]
      .map(function (x) { return "<div><span>" + x[0] + "</span><b>" + x[1] + "</b></div>"; }).join("");
  }
  function renderProfile() {
    var p = state.profile, el = form.elements;
    el.name.value = p.name; el.sex.value = p.sex; el.age.value = p.age; el.height.value = p.height;
    el.weight.value = p.weight; el.activity.value = String(p.activity); el.goal.value = p.goal;
    paintTargets(p);
  }
  form.addEventListener("input", function () { paintTargets(readForm()); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var p = readForm();
    if (p.weight !== state.profile.weight) logWeight(p.weight);
    state.profile = p;
    save();
    route();
    toast("Gespeichert · neues Ziel " + fmt(targets(p).kcal) + " kcal");
  });

  /* Weight entry ---------------------------------------------------------- */
  var weightDialog = $("[data-weight-dialog]");
  function logWeight(kg) {
    var w = state.weights;
    if (w.length && w[w.length - 1].d === TODAY) w[w.length - 1].kg = kg;
    else w.push({ d: TODAY, kg: kg });
    state.profile.weight = kg;
  }
  $("[data-add-weight]").addEventListener("click", function () {
    $("[data-weight-input]").value = state.weights[state.weights.length - 1].kg;
    openDialog(weightDialog);
    $("[data-weight-input]").select();
  });
  $("[data-weight-form]").addEventListener("submit", function (e) {
    e.preventDefault();
    var kg = Math.round(+$("[data-weight-input]").value * 10) / 10;
    if (!(kg >= 35 && kg <= 250)) return;
    logWeight(kg);
    save();
    closeDialog(weightDialog);
    route();
    toast("Gewicht " + fmt(kg, 1) + " kg gespeichert");
  });

  /* Reset ----------------------------------------------------------------- */
  $$("[data-reset]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!confirm("Demo auf die Beispieldaten zurücksetzen?")) return;
      try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
      state = sample();
      save();
      stopTimer();
      location.hash = "#heute";
      route();
      toast("Demo zurückgesetzt");
    });
  });

  save();
  route();
})();
