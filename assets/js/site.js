(function () {
  var KEY = "gb-lang";
  var root = document.documentElement;
  var pageLang = root.lang === "en" ? "en" : "de";
  var switchLink = document.querySelector("[data-set-lang]");

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) { /* storage blocked: choice lasts for this page only */ }
  }

  if (switchLink) {
    switchLink.addEventListener("click", function () {
      save(switchLink.getAttribute("data-set-lang"));
    });
  }

  var stored = read();
  if (stored === "de" || stored === "en") return;

  var langs = navigator.languages || [navigator.language || ""];
  var suggested = String(langs[0] || "").toLowerCase().indexOf("de") === 0 ? "de" : "en";
  var options = [
    { lang: "de", label: "Deutsch", hint: "Weiter auf Deutsch" },
    { lang: "en", label: "English", hint: "Continue in English" }
  ];
  if (suggested === "en") options.reverse();

  var gate = document.createElement("div");
  gate.className = "lang-gate";
  gate.setAttribute("role", "dialog");
  gate.setAttribute("aria-modal", "true");
  gate.setAttribute("aria-labelledby", "lang-gate-title");
  gate.innerHTML =
    '<div class="lang-gate-panel">' +
      '<span class="brand-mark" aria-hidden="true">G</span>' +
      '<p class="kicker">Gurgenbaba</p>' +
      '<h2 id="lang-gate-title"><span lang="de">Sprache wählen</span> <span aria-hidden="true">/</span> <span lang="en">Choose language</span></h2>' +
      '<div class="lang-gate-options"></div>' +
      '<p class="lang-gate-note"><span lang="de">Jederzeit oben rechts änderbar.</span> <span lang="en">Change it anytime in the header.</span></p>' +
    "</div>";

  var list = gate.querySelector(".lang-gate-options");
  options.forEach(function (opt, i) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn" + (i === 0 ? " primary" : "");
    btn.lang = opt.lang;
    btn.innerHTML = "<strong>" + opt.label + "</strong><small>" + opt.hint + "</small>";
    btn.addEventListener("click", function () { choose(opt.lang); });
    list.appendChild(btn);
  });

  var background = document.querySelectorAll("body > header, body > main, body > footer");
  function setInert(on) {
    background.forEach(function (el) { if (on) el.setAttribute("inert", ""); else el.removeAttribute("inert"); });
    root.classList.toggle("gate-open", on);
  }

  function choose(lang) {
    save(lang);
    if (lang !== pageLang && switchLink) {
      window.location.href = switchLink.href + window.location.hash;
      return;
    }
    setInert(false);
    gate.remove();
  }

  gate.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    var btns = list.querySelectorAll("button");
    var first = btns[0], last = btns[btns.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  document.body.appendChild(gate);
  setInert(true);
  list.querySelector("button").focus();
})();

(function () {
  var box = document.getElementById("lightbox");
  var boxImg = box ? box.querySelector("img") : null;
  var opener = null;
  function close() {
    box.classList.remove("open");
    box.setAttribute("hidden", "");
    if (boxImg) boxImg.removeAttribute("src");
    if (opener) opener.focus();
  }
  document.querySelectorAll("[data-full]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!box || !boxImg) return;
      opener = btn;
      boxImg.src = btn.getAttribute("data-full");
      boxImg.alt = btn.getAttribute("data-alt") || "";
      box.classList.add("open");
      box.removeAttribute("hidden");
      var closeBtn = box.querySelector("[data-close]");
      if (closeBtn) closeBtn.focus();
    });
  });
  if (box) {
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.closest("[data-close]")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.classList.contains("open")) close();
    });
  }
})();

(function () {
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    var label = btn.textContent;
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () {
        btn.textContent = btn.getAttribute("data-copied") || "✓";
        btn.classList.add("copied");
        setTimeout(function () { btn.textContent = label; btn.classList.remove("copied"); }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { window.location.href = "mailto:" + text; });
      } else {
        window.location.href = "mailto:" + text;
      }
    });
  });
})();
