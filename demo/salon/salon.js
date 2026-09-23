// Kamm & Kante — demo salon. Everything runs in the browser: no request leaves
// the page and nothing is stored. Occupied slots are generated deterministically
// so the calendar looks lived-in without a backend.
(function () {
  "use strict";

  var TEAM = [
    { id: "mira", name: "Mira", role: "Inhaberin · Farbe & Balayage", color: "#c2562f",
      text: "Seit 15 Jahren im Beruf. Macht aus „irgendwie blonder“ genau den Ton, den Sie im Kopf haben." },
    { id: "jonas", name: "Jonas", role: "Herren & Bart", color: "#7d8b6a",
      text: "Fades, klassische Schnitte und Bartpflege. Schnell, präzise und immer mit einem guten Tipp für zuhause." },
    { id: "leyla", name: "Leyla", role: "Hochsteck- & Brautfrisuren", color: "#8a6a9c",
      text: "Für den großen Tag und jeden anderen. Probetermin inklusive, damit am Tag selbst alles sitzt." }
  ];

  var SERVICES = [
    { id: "wsf", cat: "damen", name: "Waschen, Schneiden, Föhnen", desc: "Beratung, Pflege und Styling", min: 60, price: "49 €", team: ["mira", "leyla"] },
    { id: "kurz", cat: "damen", name: "Kurzhaarschnitt", desc: "inkl. Waschen und Styling", min: 45, price: "39 €", team: ["mira", "leyla", "jonas"] },
    { id: "hoch", cat: "damen", name: "Hochsteckfrisur", desc: "für Feiern, Hochzeiten, Abschlussball", min: 60, price: "65 €", team: ["leyla"] },
    { id: "herr", cat: "herren", name: "Herrenschnitt", desc: "Waschen, Schneiden, Styling", min: 30, price: "28 €", team: ["jonas", "mira"] },
    { id: "masch", cat: "herren", name: "Maschinenschnitt", desc: "eine Länge, schnell erledigt", min: 20, price: "18 €", team: ["jonas"] },
    { id: "bart", cat: "herren", name: "Bart trimmen & formen", desc: "mit heißem Tuch", min: 20, price: "15 €", team: ["jonas"] },
    { id: "kind", cat: "kinder", name: "Kinderschnitt bis 10 Jahre", desc: "mit Geduld und Gummibärchen", min: 20, price: "16 €", team: ["mira", "jonas", "leyla"] },
    { id: "teen", cat: "kinder", name: "Jugendliche bis 16 Jahre", desc: "Waschen, Schneiden, Styling", min: 30, price: "22 €", team: ["mira", "jonas", "leyla"] },
    { id: "ansatz", cat: "farbe", name: "Ansatzfarbe", desc: "inkl. Pflege und Föhnen", min: 60, price: "ab 45 €", team: ["mira", "leyla"] },
    { id: "straehnen", cat: "farbe", name: "Strähnen", desc: "Folientechnik, inkl. Schnitt", min: 90, price: "ab 69 €", team: ["mira"] },
    { id: "balayage", cat: "farbe", name: "Balayage", desc: "natürlicher Verlauf, inkl. Toning", min: 150, price: "ab 119 €", team: ["mira"] }
  ];

  // Opening hours per weekday (0 = Sunday), in hours.
  var HOURS = { 2: [9, 18], 3: [9, 18], 4: [9, 20], 5: [9, 18], 6: [9, 14] };
  var DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  var DAY_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  var motion = document.documentElement.classList.contains("fx");

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function fmtTime(mins) { return pad(Math.floor(mins / 60)) + ":" + pad(mins % 60); }
  function member(id) { return TEAM.filter(function (m) { return m.id === id; })[0]; }
  function avatar(m) {
    var a = el("span", "avatar", m.name[0]);
    a.style.background = m.color;
    a.setAttribute("aria-hidden", "true");
    return a;
  }

  /* Open-now badge and opening hours table ------------------------------- */
  (function () {
    var now = new Date(), day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
    var status = $("[data-open-status]");
    var h = HOURS[day];
    var text;
    if (h && mins >= h[0] * 60 && mins < h[1] * 60) {
      status.classList.add("open");
      text = "Jetzt geöffnet · bis " + h[1] + ":00 Uhr";
    } else {
      for (var i = 0; i < 8; i++) {
        var d = (day + i) % 7;
        if (HOURS[d] && (i > 0 || mins < HOURS[d][0] * 60)) {
          text = "Geschlossen · öffnet " + (i === 0 ? "heute" : i === 1 ? "morgen" : DAY_NAMES[d]) + " um " + HOURS[d][0] + ":00 Uhr";
          break;
        }
      }
    }
    status.lastElementChild.textContent = text;

    var body = $("[data-hours] tbody");
    [2, 3, 4, 5, 6, 0, 1].forEach(function (d) {
      var tr = el("tr");
      if (d === day) tr.className = "today";
      if (!HOURS[d]) tr.className += " closed";
      tr.appendChild(el("th", "", DAY_NAMES[d] + (d === day ? " (heute)" : "")));
      tr.appendChild(el("td", "", HOURS[d] ? HOURS[d][0] + ":00 – " + HOURS[d][1] + ":00" : "geschlossen"));
      body.appendChild(tr);
    });
  })();

  /* Team ------------------------------------------------------------------ */
  var teamBox = $("[data-team]");
  TEAM.forEach(function (m) {
    var card = el("article", "member");
    card.appendChild(avatar(m));
    card.appendChild(el("h3", "", m.name));
    card.appendChild(el("p", "role", m.role));
    card.appendChild(el("p", "", m.text));
    teamBox.appendChild(card);
  });

  /* Price menu with tabs -------------------------------------------------- */
  var menus = $("[data-menus]");
  var tabs = $$('[role="tab"]');
  ["damen", "herren", "kinder", "farbe"].forEach(function (cat, i) {
    var list = el("ul", "menu");
    list.id = "cat-" + cat;
    list.setAttribute("role", "tabpanel");
    list.setAttribute("aria-labelledby", "tab-" + cat);
    list.hidden = i !== 0;
    SERVICES.filter(function (s) { return s.cat === cat; }).forEach(function (s, n) {
      var li = el("li");
      li.style.setProperty("--i", n);
      var info = el("div");
      info.appendChild(el("h3", "", s.name));
      info.appendChild(el("p", "", s.desc + " · ca. " + s.min + " Min."));
      var book = el("button", "book", "Buchen");
      book.type = "button";
      book.setAttribute("aria-label", s.name + " buchen");
      book.addEventListener("click", function () { startWith(s.id); });
      li.appendChild(info);
      li.appendChild(el("span", "price", s.price));
      li.appendChild(book);
      list.appendChild(li);
    });
    menus.appendChild(list);
  });
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      panel.hidden = !on;
      if (on && motion) {
        $$("li", panel).forEach(function (li) { li.style.animation = "none"; void li.offsetWidth; li.style.animation = ""; });
      }
    });
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab); });
    tab.addEventListener("keydown", function (e) {
      var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!dir) return;
      var next = tabs[(i + dir + tabs.length) % tabs.length];
      selectTab(next);
      next.focus();
    });
  });

  /* Booking --------------------------------------------------------------- */
  var box = $("[data-booking]");
  var panels = {};
  $$(".b-panel", box).forEach(function (p) { panels[p.getAttribute("data-panel")] = p; });
  var order = ["service", "stylist", "time", "contact", "done"];
  var stepMarks = $$(".b-steps li", box);
  var state = {};

  function show(name, focus) {
    order.forEach(function (key) { panels[key].hidden = key !== name; });
    var idx = order.indexOf(name);
    stepMarks.forEach(function (li, i) { li.classList.toggle("on", i <= idx); });
    if (focus !== false) {
      var h = $("h3", panels[name]);
      if (h) h.focus({ preventScroll: true });
    }
  }

  // Deterministic "occupied" pattern per stylist, day and time.
  function busy(stylist, dateKey, mins) {
    var s = stylist + dateKey + mins, h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % 7 < 3;
  }

  function freeStylist(service, stylist, date, mins) {
    var key = date.toDateString();
    var pool = stylist === "any" ? service.team : [stylist];
    for (var i = 0; i < pool.length; i++) {
      var ok = true;
      for (var t = mins; t < mins + service.min; t += 30) if (busy(pool[i], key, t)) ok = false;
      if (ok) return pool[i];
    }
    return null;
  }

  var serviceBox = $("[data-services]");
  SERVICES.forEach(function (s) {
    var b = el("button", "choice");
    b.type = "button";
    b.setAttribute("aria-pressed", "false");
    b.dataset.id = s.id;
    b.appendChild(el("b", "", s.name));
    b.appendChild(el("span", "p", s.price));
    b.appendChild(el("small", "", "ca. " + s.min + " Min."));
    b.addEventListener("click", function () { pickService(s.id); });
    serviceBox.appendChild(b);
  });

  function pickService(id) {
    state = { service: SERVICES.filter(function (s) { return s.id === id; })[0] };
    $$(".choice", serviceBox).forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.id === id ? "true" : "false"); });
    var list = $("[data-stylists]");
    list.innerHTML = "";
    var any = el("button", "choice");
    any.type = "button";
    var anyAvatar = el("span", "avatar", "★");
    anyAvatar.style.background = "#221c18";
    any.appendChild(anyAvatar);
    any.appendChild(el("b", "", "Egal, Hauptsache bald"));
    any.appendChild(el("small", "", "Wir wählen, wer zuerst frei ist"));
    any.addEventListener("click", function () { pickStylist("any"); });
    list.appendChild(any);
    state.service.team.forEach(function (id) {
      var m = member(id);
      var b = el("button", "choice");
      b.type = "button";
      b.appendChild(avatar(m));
      b.appendChild(el("b", "", m.name));
      b.appendChild(el("small", "", m.role));
      b.addEventListener("click", function () { pickStylist(id); });
      list.appendChild(b);
    });
    show("stylist");
  }

  function pickStylist(id) {
    state.stylist = id;
    var days = $("[data-days]");
    days.innerHTML = "";
    var first = null;
    for (var i = 0; i < 21; i++) {
      var d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + i);
      var slots = slotsFor(d);
      var b = el("button", "day");
      b.type = "button";
      b.setAttribute("role", "option");
      b.setAttribute("aria-selected", "false");
      b.appendChild(el("small", "", i === 0 ? "Heute" : DAY_SHORT[d.getDay()]));
      b.appendChild(el("b", "", String(d.getDate())));
      b.setAttribute("aria-label", DAY_NAMES[d.getDay()] + ", " + d.toLocaleDateString("de-DE"));
      b.disabled = !slots.some(function (s) { return s.who; });
      (function (date, btn) { btn.addEventListener("click", function () { pickDay(date, btn); }); })(d, b);
      days.appendChild(b);
      if (!b.disabled && !first) first = [d, b];
    }
    show("time");
    if (first) pickDay(first[0], first[1]);
  }

  function slotsFor(date) {
    var h = HOURS[date.getDay()];
    if (!h) return [];
    var now = new Date(), out = [];
    var isToday = date.toDateString() === now.toDateString();
    var nowMins = now.getHours() * 60 + now.getMinutes();
    for (var m = h[0] * 60; m + state.service.min <= h[1] * 60; m += 30) {
      var past = isToday && m < nowMins + 60;
      out.push({ mins: m, who: past ? null : freeStylist(state.service, state.stylist, date, m) });
    }
    return out;
  }

  function pickDay(date, btn) {
    $$(".day").forEach(function (b) { b.setAttribute("aria-selected", b === btn ? "true" : "false"); });
    state.date = date;
    var box = $("[data-slots]");
    box.innerHTML = "";
    var slots = slotsFor(date);
    slots.forEach(function (s) {
      var b = el("button", "slot", fmtTime(s.mins));
      b.type = "button";
      b.disabled = !s.who;
      if (!s.who) b.setAttribute("aria-label", fmtTime(s.mins) + " belegt");
      b.addEventListener("click", function () { pickSlot(s); });
      box.appendChild(b);
    });
    if (!slots.length) box.appendChild(el("p", "none", "An diesem Tag ist geschlossen."));
  }

  function pickSlot(slot) {
    state.mins = slot.mins;
    state.who = slot.who;
    var summary = $("[data-summary]");
    summary.innerHTML = "";
    var parts = [
      ["", state.service.name],
      [" bei ", member(slot.who).name],
      [" am ", DAY_NAMES[state.date.getDay()] + ", " + state.date.toLocaleDateString("de-DE")],
      [" um ", fmtTime(slot.mins) + " Uhr"]
    ];
    parts.forEach(function (p) {
      summary.appendChild(document.createTextNode(p[0]));
      summary.appendChild(el("b", "", p[1]));
    });
    summary.appendChild(document.createTextNode(" · " + state.service.price));
    show("contact");
  }

  panels.contact.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = panels.contact;
    var name = f.elements.name.value.trim(), contact = f.elements.contact.value.trim();
    $("[data-err]", f).hidden = !!(name && contact);
    if (!name || !contact) return;
    state.name = name;
    $("[data-done-title]").textContent = "Danke, " + name.split(" ")[0] + "! Ihr Termin steht.";
    $("[data-done-text]").textContent = state.service.name + " bei " + member(state.who).name + ", " +
      DAY_NAMES[state.date.getDay()] + " " + state.date.toLocaleDateString("de-DE") + " um " + fmtTime(state.mins) + " Uhr.";
    show("done");
  });

  $$("[data-back]", box).forEach(function (b) {
    b.addEventListener("click", function () {
      var idx = order.indexOf(b.closest(".b-panel").getAttribute("data-panel"));
      show(order[Math.max(0, idx - 1)]);
    });
  });

  $("[data-restart]").addEventListener("click", function () {
    panels.contact.reset();
    $$(".choice", serviceBox).forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    state = {};
    show("service");
  });

  // Calendar file, generated locally.
  $("[data-ics]").addEventListener("click", function () {
    var d = state.date;
    var stamp = function (mins) {
      return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(Math.floor(mins / 60)) + pad(mins % 60) + "00";
    };
    var ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Kamm & Kante Demo//DE", "BEGIN:VEVENT",
      "UID:" + Date.now() + "@kamm-und-kante.demo",
      "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z",
      "DTSTART:" + stamp(state.mins), "DTEND:" + stamp(state.mins + state.service.min),
      "SUMMARY:" + state.service.name + " bei " + member(state.who).name + " (Kamm & Kante, Demo)",
      "LOCATION:Musterstraße 12\\, 12345 Musterstadt", "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    var a = el("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "termin-kamm-und-kante.ics";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });

  function startWith(serviceId) {
    pickService(serviceId);
    document.getElementById("termin").scrollIntoView({ behavior: motion ? "smooth" : "auto" });
  }

  // The floating mobile button steps aside while the booking box is visible.
  var mobileBook = $("[data-mobile-book]");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      mobileBook.classList.toggle("away", entries[0].isIntersecting);
    }, { threshold: 0.15 }).observe(document.getElementById("termin"));
  }
})();
