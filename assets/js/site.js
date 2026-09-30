/* ==========================================================================
   ABBES Digital // site.js
   Shared progressive-enhancement script for the portfolio, case studies and
   legal pages. Modules exit early when their markup is absent.

   Current responsibilities:
   - language preference
   - screenshot lightbox
   - copy-to-clipboard
   - Genesis live stats
   - scroll progress / reveal helpers
   - contact wizard and attachments
   - mobile sticky CTA
   - ABBES hero slideshow
   - persistent light/dark theme
   - mobile project disclosure
   - back-to-top control

   Public backend calls intentionally stay on the stable public API endpoints.
   ========================================================================== */

(function () {
  // First visit: ask for the language once, remember it; the header switch updates it.
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
  // Screenshot lightbox: [data-full] buttons open the large image.
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
  // [data-copy] buttons copy their value and confirm with [data-copied].
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



(function () {
  // Live counters from the Genesis Colonies server. Stays hidden unless real data arrives.
  var box = document.querySelector("[data-stats-src]");
  if (!box || !window.fetch) return;
  var motion = document.documentElement.classList.contains("fx");
  var fmt = new Intl.NumberFormat(box.getAttribute("data-locale") || undefined);
  var ctrl = window.AbortController ? new AbortController() : null;
  var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 6000);

  fetch(box.getAttribute("data-stats-src"), { credentials: "omit", signal: ctrl ? ctrl.signal : undefined })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) {
      clearTimeout(timer);
      // Below this the counters read more like an empty server than a living universe.
      var minPlayers = Number(box.getAttribute("data-min-players")) || 1;
      if (!data || !data.ok || !(data.players >= minPlayers)) return;
      var cells = [];
      box.querySelectorAll("[data-stat]").forEach(function (cell) {
        var value = Number(data[cell.getAttribute("data-stat")]);
        if (!(value >= (Number(cell.getAttribute("data-min")) || 1))) { cell.remove(); return; }
        cells.push({ el: cell.querySelector("dd"), value: value });
      });
      box.hidden = false;

      var run = function () {
        if (!motion) {
          cells.forEach(function (c) { c.el.textContent = fmt.format(c.value); });
          return;
        }
        var start = performance.now(), duration = 1400;
        (function step(now) {
          var t = Math.min(1, (now - start) / duration);
          var eased = 1 - Math.pow(1 - t, 3);
          cells.forEach(function (c) { c.el.textContent = fmt.format(Math.round(c.value * eased)); });
          if (t < 1) requestAnimationFrame(step);
        })(start);
      };
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) { io.disconnect(); run(); }
        }, { threshold: 0.4 });
        io.observe(box);
      } else {
        run();
      }
    })
    .catch(function () { clearTimeout(timer); });
})();



(function () {
  // Scroll progress under the sticky header.
  var bar = document.createElement("span");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  var header = document.querySelector(".site-header");
  if (!header) return;
  header.appendChild(bar);
  var queued = false;
  var update = function () {
    queued = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")";
  };
  window.addEventListener("scroll", function () {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();





(function () {
  // Contact wizard: one question at a time; the answers are written up as a ready-to-send message.
  var form = document.querySelector("[data-wizard]");
  if (!form) return;
  var motion = document.documentElement.classList.contains("fx");
  var steps = Array.prototype.slice.call(form.querySelectorAll(".wiz-step"));
  var bar = form.querySelector(".wiz-bar span");
  var preview = document.querySelector("[data-preview]");
  var empty = document.querySelector(".letter-empty");
  var letter = form.querySelector("[data-letter]");
  var send = form.querySelector("[data-send]");
  var note = form.querySelector('[data-input="note"]');
  var name = form.querySelector('[data-input="name"]');
  var call = form.querySelector('[data-input="call"]');
  var typeBox = form.querySelector('.pick[data-field="type"]');
  var featBox = form.querySelector('.pick[data-field="features"]');
  var featQuestion = form.querySelector('[data-step="features"] .wiz-q');
  var featHint = form.querySelector("[data-feature-hint]");
  var featureContext = form.querySelector("[data-feature-context]");
  var featureLabel = form.querySelector("[data-feature-label]");
  var featureCopy = form.querySelector("[data-feature-copy]");
  var budgetBox = form.querySelector('.pick[data-field="budget"]');
  var budgetHint = form.querySelector("[data-budget-hint]");
  var defaultQuestion = featQuestion.textContent;
  var defaultHint = featHint ? featHint.textContent : "";
  var defaultBudgetHint = budgetHint ? budgetHint.textContent : "";
  var defaultNotePlaceholder = note.getAttribute("data-default-placeholder") || note.getAttribute("placeholder") || "";
  var current = 0, edited = false, startedAt = 0, files = [];
  var email = form.querySelector('[data-input="email"]');
  var emailError = form.querySelector("[data-email-error]");
  var fileInput = form.querySelector("[data-files]");
  var fileList = form.querySelector("[data-file-list]");
  var fileError = form.querySelector("[data-file-error]");
  var drop = form.querySelector("[data-drop]");
  var submitBtn = form.querySelector("[data-submit]");
  var submitError = form.querySelector("[data-submit-error]");
  var attachInfo = form.querySelector("[data-attach-info]");
  var honeypot = form.querySelector("[data-hp]");
  var doneIndex = steps.indexOf(form.querySelector('[data-step="done"]'));
  var MAX_FILES = 5, MAX_FILE = 8 * 1024 * 1024, MAX_TOTAL = 10 * 1024 * 1024;
  var EXT = /\.(pdf|png|jpe?g|webp|gif|heic|txt|md|csv|rtf|docx?|odt|xlsx?|ods|pptx?|odp|fig|sketch|psd|ai)$/i;

  function touch() { if (!startedAt) startedAt = Date.now(); }
  function validEmail() { return /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/.test(email.value.trim()); }

  function t(key) { return form.getAttribute("data-t-" + key) || ""; }

  function pressed(field) {
    var box = form.querySelector('.pick[data-field="' + field + '"]');
    return Array.prototype.filter.call(box.querySelectorAll("button"), function (b) {
      return !b.hidden && b.getAttribute("aria-pressed") === "true";
    });
  }

  function joinList(items) {
    if (items.length < 2) return items.join("");
    return items.slice(0, -1).join(", ") + " " + form.getAttribute("data-and") + " " + items[items.length - 1];
  }

  function compose() {
    var type = pressed("type")[0];
    if (!type) return "";
    var intro = t("intro").replace("{type}", type.getAttribute("data-phrase"));
    var picked = pressed("features");
    var feats = picked.map(function (b) { return b.getAttribute("data-phrase") || b.getAttribute("data-value"); });
    // German needs "wäre" for one singular item, "wären" otherwise.
    var one = feats.length === 1 && !picked[0].hasAttribute("data-plural") && t("features-one");
    if (feats.length) intro += " " + (one ? t("features-one") : t("features")).replace("{list}", joinList(feats));
    var plan = pressed("timeline").concat(pressed("budget")).map(function (b) {
      return b.getAttribute("data-phrase");
    }).join(" ");
    var parts = [t("hello"), intro];
    if (plan) parts.push(plan);
    if (note.value.trim()) parts.push(t("note") + "\n" + note.value.trim());
    if (call.checked) parts.push(t("call"));
    parts.push(t("outro"));
    parts.push(t("closing") + (name.value.trim() ? "\n" + name.value.trim() : ""));
    return parts.join("\n\n");
  }

  // The same answers as language-neutral ids. The backend turns them into a work
  // order for the owner; the customer only ever sees the letter above.
  function brief() {
    var type = pressed("type")[0];
    var id = function (b) { return b.getAttribute("data-id"); };
    return JSON.stringify({
      v: 1,
      lang: document.documentElement.lang === "en" ? "en" : "de",
      type: type ? type.getAttribute("data-key") : "",
      features: pressed("features").map(id),
      timeline: pressed("timeline").map(id)[0] || "",
      budget: pressed("budget").map(id)[0] || "",
      note: note.value.trim(),
      call: call.checked,
      edited: edited
    });
  }

  function updateSend() {
    var type = pressed("type")[0];
    var subject = form.getAttribute("data-subject") + (type ? ": " + type.getAttribute("data-value") : "");
    send.href = "mailto:" + form.getAttribute("data-mail") +
      "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(letter.value);
  }

  function refresh() {
    var text = compose();
    empty.hidden = !!text;
    preview.hidden = !text;
    if (preview.textContent !== text) {
      preview.textContent = text;
      preview.classList.remove("flash");
      void preview.offsetWidth;
      preview.classList.add("flash");
    }
    if (!edited) letter.value = text;
    updateSend();
  }

  // Step 2 only offers plain-language goals that fit the chosen project type.
  function syncFeatures() {
    var type = pressed("type")[0];
    var key = type ? type.getAttribute("data-key") : null;
    var n = 0;
    featBox.querySelectorAll("button").forEach(function (b) {
      var scope = (b.getAttribute("data-for") || "").split(" ");
      var show = !!key && scope.indexOf(key) !== -1;
      if (!show) {
        b.hidden = true;
        b.setAttribute("aria-pressed", "false");
        return;
      }
      if (b.hidden) {
        b.hidden = false;
        b.style.setProperty("--i", n);
        b.classList.remove("pop");
        void b.offsetWidth;
        b.classList.add("pop");
      }
      n++;
    });

    featQuestion.textContent = type ? (type.getAttribute("data-question") || defaultQuestion) : defaultQuestion;
    if (featHint) featHint.textContent = type ? (type.getAttribute("data-hint") || defaultHint) : defaultHint;
    if (featureContext) featureContext.hidden = !type;
    if (featureLabel) featureLabel.textContent = type ? type.getAttribute("data-value") : "";
    if (featureCopy) featureCopy.textContent = type ? (type.getAttribute("data-context") || "") : "";
    note.placeholder = type ? (type.getAttribute("data-note-placeholder") || defaultNotePlaceholder) : defaultNotePlaceholder;
  }

  // Budget bands are deliberately project-specific. A compact website and
  // an individual business application should not present the same ranges.
  function syncBudget() {
    if (!budgetBox) return;
    var type = pressed("type")[0];
    var key = type ? type.getAttribute("data-key") : null;
    var buttons = Array.prototype.slice.call(budgetBox.querySelectorAll("button"));
    var hasScopes = buttons.some(function (b) { return b.hasAttribute("data-for"); });
    if (!hasScopes) return;

    buttons.forEach(function (b) {
      var scope = (b.getAttribute("data-for") || "").split(" ");
      var show = !!key && scope.indexOf(key) !== -1;
      b.hidden = !show;
      if (!show) b.setAttribute("aria-pressed", "false");
    });

    if (budgetHint) budgetHint.textContent = defaultBudgetHint;
  }

  function show(index) {
    current = Math.max(0, Math.min(steps.length - 1, index));
    steps.forEach(function (step, i) { step.hidden = i !== current; });
    var step = steps[current];
    if (step.getAttribute("data-step") === "features") syncFeatures();
    if (step.getAttribute("data-step") === "budget") syncBudget();
    if (step.getAttribute("data-step") === "done") refresh();
    bar.style.transform = "scaleX(" + Math.min(1, current / doneIndex) + ")";
    if (step.getAttribute("data-step") === "done") {
      attachInfo.textContent = files.length ? "📎 " + files.map(function (f) { return f.name; }).join(", ") : "";
      submitError.hidden = true;
    }
    if (motion) {
      step.classList.remove("enter");
      void step.offsetWidth;
      step.classList.add("enter");
    }
    var top = form.getBoundingClientRect().top;
    if (top < 60) form.scrollIntoView({ block: "start", behavior: motion ? "smooth" : "auto" });
    var q = step.querySelector(".wiz-q");
    if (q) q.focus({ preventScroll: true });
  }

  form.querySelectorAll(".pick").forEach(function (box) {
    var single = box.hasAttribute("data-single");
    var auto = box.hasAttribute("data-auto");
    box.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var on = btn.getAttribute("aria-pressed") !== "true";
      if (single) box.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      btn.setAttribute("aria-pressed", on || auto ? "true" : "false");
      edited = false;
      touch();
      if (box === typeBox) {
        syncFeatures();
        syncBudget();
      }
      refresh();
      if (auto) {
        var from = current;
        setTimeout(function () { if (current === from) show(current + 1); }, motion ? 280 : 0);
      }
    });
  });

  form.addEventListener("click", function (e) {
    var next = e.target.closest("[data-next]");
    if (next && steps[current].getAttribute("data-step") === "details" && !validEmail()) {
      emailError.hidden = false;
      email.focus();
      return;
    }
    if (next) show(current + 1);
    else if (e.target.closest("[data-back]")) show(current - 1);
    else if (e.target.closest("[data-restart]")) {
      form.querySelectorAll('.pick button').forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      note.value = "";
      name.value = "";
      call.checked = false;
      email.value = "";
      files = [];
      renderFiles();
      edited = false;
      startedAt = 0;
      refresh();
      show(0);
    }
  });

  [note, name].forEach(function (input) {
    input.addEventListener("input", function () { edited = false; touch(); refresh(); });
  });
  call.addEventListener("change", function () { edited = false; touch(); refresh(); });
  email.addEventListener("input", function () { touch(); if (validEmail()) emailError.hidden = true; });

  // "Anfragen" on a price card starts the wizard with that project type picked.
  document.querySelectorAll("[data-pick-type]").forEach(function (link) {
    link.addEventListener("click", function () {
      var btn = typeBox.querySelector('[data-key="' + link.getAttribute("data-pick-type") + '"]');
      if (btn && current === 0) btn.click();
    });
  });

  function formatSize(bytes) {
    return bytes < 1024 * 1024 ? Math.max(1, Math.round(bytes / 1024)) + " KB" : (bytes / 1048576).toFixed(1) + " MB";
  }

  function renderFiles() {
    fileList.innerHTML = "";
    files.forEach(function (file, i) {
      var li = document.createElement("li");
      var label = document.createElement("span");
      label.textContent = file.name;
      var size = document.createElement("small");
      size.textContent = formatSize(file.size);
      var remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", fileList.getAttribute("data-remove") + ": " + file.name);
      remove.addEventListener("click", function () { files.splice(i, 1); renderFiles(); });
      li.append(label, size, remove);
      fileList.appendChild(li);
    });
  }

  function addFiles(list) {
    var problem = "";
    var total = files.reduce(function (sum, f) { return sum + f.size; }, 0);
    Array.prototype.forEach.call(list, function (file) {
      if (files.length >= MAX_FILES) { problem = "count"; return; }
      if (!EXT.test(file.name)) { problem = "type"; return; }
      if (file.size > MAX_FILE || total + file.size > MAX_TOTAL) { problem = "size"; return; }
      total += file.size;
      files.push(file);
    });
    fileError.hidden = !problem;
    fileError.textContent = problem ? fileList.getAttribute("data-cerr-" + problem) : "";
    touch();
    renderFiles();
  }

  fileInput.addEventListener("change", function () { addFiles(fileInput.files); fileInput.value = ""; });
  ["dragenter", "dragover"].forEach(function (type) {
    drop.addEventListener(type, function (e) { e.preventDefault(); drop.classList.add("over"); });
  });
  ["dragleave", "drop"].forEach(function (type) {
    drop.addEventListener(type, function (e) { e.preventDefault(); drop.classList.remove("over"); });
  });
  drop.addEventListener("drop", function (e) { if (e.dataTransfer) addFiles(e.dataTransfer.files); });

  function submitErrorText(code) {
    return submitError.getAttribute("data-err-" + String(code || "").replace(/_/g, "-")) ||
      submitError.getAttribute("data-err-fallback");
  }

  submitBtn.addEventListener("click", function () {
    if (submitBtn.disabled) return;
    var type = pressed("type")[0];
    var data = new FormData();
    data.append("name", name.value.trim());
    data.append("email", email.value.trim());
    data.append("subject", form.getAttribute("data-subject") + (type ? ": " + type.getAttribute("data-value") : ""));
    data.append("message", letter.value);
    data.append("brief", brief());
    data.append("elapsed_ms", String(startedAt ? Date.now() - startedAt : 0));
    data.append("website", honeypot.value);
    files.forEach(function (file) { data.append("files", file, file.name); });

    var label = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.classList.add("busy");
    submitBtn.textContent = submitBtn.getAttribute("data-sending");
    submitError.hidden = true;

    var done = function () {
      submitBtn.disabled = false;
      submitBtn.classList.remove("busy");
      submitBtn.textContent = label;
    };
    fetch(form.getAttribute("data-endpoint"), { method: "POST", body: data, credentials: "omit" })
      .then(function (res) { return res.json().catch(function () { return { ok: false }; }); })
      .then(function (reply) {
        done();
        if (!reply || !reply.ok) {
          submitError.textContent = submitErrorText(reply && reply.error);
          submitError.hidden = false;
          return;
        }
        var sent = form.querySelector('[data-step="sent"]');
        var who = name.value.trim().split(" ")[0];
        sent.querySelector("[data-sent-title]").textContent =
          sent.querySelector("[data-sent-title]").getAttribute("data-sent-title").replace("{name}", who ? ", " + who : "");
        sent.querySelector("[data-sent-text]").textContent =
          sent.querySelector("[data-sent-text]").getAttribute("data-sent-text").replace("{email}", email.value.trim());
        show(steps.indexOf(sent));
      })
      .catch(function () {
        done();
        submitError.textContent = submitErrorText("");
        submitError.hidden = false;
      });
  });
  letter.addEventListener("input", function () { edited = true; updateSend(); });

  form.addEventListener("submit", function (e) { e.preventDefault(); });

  var copyBtn = form.querySelector("[data-copy-letter]");
  copyBtn.addEventListener("click", function () {
    if (!navigator.clipboard) return;
    var label = copyBtn.textContent;
    navigator.clipboard.writeText(letter.value).then(function () {
      copyBtn.textContent = copyBtn.getAttribute("data-copied");
      copyBtn.classList.add("copied");
      setTimeout(function () { copyBtn.textContent = label; copyBtn.classList.remove("copied"); }, 1800);
    });
  });

  refresh();
})();



(function () {
  // Mobile: "Projekt anfragen" bar once the hero is gone, hidden again at the contact section.
  var cta = document.querySelector("[data-sticky-cta]");
  var hero = document.querySelector(".hero");
  var target = cta && document.querySelector(cta.getAttribute("href"));
  if (!cta || !hero || !target || !("IntersectionObserver" in window)) return;
  var pastHero = false, atTarget = false, atFooter = false;
  var sync = function () { cta.classList.toggle("show", pastHero && !atTarget && !atFooter); };
  new IntersectionObserver(function (e) { pastHero = !e[0].isIntersecting; sync(); }).observe(hero);
  new IntersectionObserver(function (e) { atTarget = e[0].isIntersecting; sync(); }, { rootMargin: "0px 0px -30% 0px" }).observe(target);
  var footer = document.querySelector(".site-footer");
  if (footer) new IntersectionObserver(function (e) { atFooter = e[0].isIntersecting; sync(); }).observe(footer);
})();







(function () {
  // ABBES hero project reel: calm crossfades, manual controls, hover/focus pause,
  // visibility-aware autoplay and reduced-motion support.
  var box = document.querySelector("[data-hero-slider]");
  if (!box) return;

  var slides = Array.prototype.slice.call(box.querySelectorAll(".abbes-slide"));
  if (slides.length < 2) return;

  var prev = box.querySelector("[data-hero-prev]");
  var next = box.querySelector("[data-hero-next]");
  var caption = box.querySelector("[data-hero-caption]");
  var count = box.querySelector("[data-hero-count]");
  var progress = box.querySelector("[data-hero-progress]");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var delay = 6200;
  var current = Math.max(0, slides.findIndex(function (slide) { return slide.classList.contains("is-active"); }));
  var timer = 0;
  var hover = false;
  var focused = false;
  var visible = true;
  var touchX = null;

  slides.forEach(function (slide, i) {
    slide.setAttribute("aria-hidden", i === current ? "false" : "true");
  });

  function two(n) { return String(n).padStart(2, "0"); }

  function updateMeta() {
    if (caption) caption.textContent = slides[current].getAttribute("data-slide-title") || "";
    if (count) count.textContent = two(current + 1) + " / " + two(slides.length);
  }

  function restartProgress() {
    box.classList.remove("is-running");
    if (progress) {
      progress.style.animation = "none";
      void progress.offsetWidth;
      progress.style.animation = "";
    }
    if (!reduced && !hover && !focused && visible && !document.hidden) {
      requestAnimationFrame(function () { box.classList.add("is-running"); });
    }
  }

  function stop() {
    clearTimeout(timer);
    timer = 0;
    box.classList.remove("is-running");
  }

  function schedule() {
    stop();
    if (reduced || hover || focused || !visible || document.hidden) return;
    restartProgress();
    timer = window.setTimeout(function () {
      show(current + 1, true);
    }, delay);
  }

  function show(index, autoplay) {
    var target = (index + slides.length) % slides.length;
    if (target === current) {
      schedule();
      return;
    }

    var old = slides[current];
    var incoming = slides[target];

    old.classList.remove("is-active");
    old.classList.add("is-leaving");
    old.setAttribute("aria-hidden", "true");

    incoming.classList.remove("is-leaving");
    incoming.classList.add("is-active");
    incoming.setAttribute("aria-hidden", "false");

    current = target;
    updateMeta();

    window.setTimeout(function () {
      old.classList.remove("is-leaving");
    }, 1150);

    if (!autoplay) box.dataset.manual = "true";
    schedule();
  }

  if (prev) prev.addEventListener("click", function () { show(current - 1, false); });
  if (next) next.addEventListener("click", function () { show(current + 1, false); });

  box.addEventListener("pointerenter", function () { hover = true; stop(); });
  box.addEventListener("pointerleave", function () { hover = false; schedule(); });
  box.addEventListener("focusin", function () { focused = true; stop(); });
  box.addEventListener("focusout", function () {
    window.setTimeout(function () {
      focused = box.contains(document.activeElement);
      schedule();
    }, 0);
  });

  box.addEventListener("touchstart", function (e) {
    if (e.touches && e.touches.length === 1) touchX = e.touches[0].clientX;
  }, { passive: true });
  box.addEventListener("touchend", function (e) {
    if (touchX === null || !e.changedTouches || !e.changedTouches.length) return;
    var dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 45) show(current + (dx < 0 ? 1 : -1), false);
  }, { passive: true });

  document.addEventListener("visibilitychange", schedule);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = !!entries[0].isIntersecting;
      schedule();
    }, { threshold: 0.25 }).observe(box);
  }

  

  updateMeta();
  schedule();
})();


(function () {
  // ABBES persistent color theme. Light is the permanent default;
  // only an explicit user choice is saved and shared between DE/EN.
  var key = "abbes-theme";
  var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-theme-toggle]"));
  if (!buttons.length) return;

  var root = document.documentElement;
  function storedTheme() {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function currentTheme() {
    var value = root.getAttribute("data-theme");
    return value === "dark" ? "dark" : "light";
  }

  function syncButton(button, theme) {
    var dark = theme === "dark";
    button.setAttribute("aria-pressed", dark ? "true" : "false");
    button.setAttribute("aria-label", dark
      ? (button.getAttribute("data-label-light") || "Switch to light mode")
      : (button.getAttribute("data-label-dark") || "Switch to dark mode"));
    button.setAttribute("title", button.getAttribute("aria-label"));
  }

  function apply(theme, remember) {
    theme = theme === "dark" ? "dark" : "light";
    root.setAttribute("data-theme", theme);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#09111f" : "#f2f0ea");

    buttons.forEach(function (button) { syncButton(button, theme); });

    if (remember) {
      try { localStorage.setItem(key, theme); } catch (e) {}
    }
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      apply(currentTheme() === "dark" ? "light" : "dark", true);
    });
  });

  apply(storedTheme() || currentTheme() || "light", false);
})();


(function () {
  // ABBES mobile project disclosure: keep the first proof visible and let visitors
  // opt into the deeper product portfolio instead of forcing a long mobile scroll.
  var list = document.querySelector("[data-mobile-collapsible]");
  var button = document.querySelector("[data-projects-toggle]");
  if (!list || !button) return;

  var label = button.querySelector("[data-projects-toggle-label]");
  var section = document.getElementById("projects");

  function sync(expanded) {
    list.classList.toggle("is-expanded", expanded);
    button.setAttribute("aria-expanded", expanded ? "true" : "false");
    if (label) {
      label.textContent = expanded
        ? (button.getAttribute("data-label-open") || "Show fewer projects")
        : (button.getAttribute("data-label-closed") || "Show more projects");
    }
  }

  button.addEventListener("click", function () {
    var expanded = !list.classList.contains("is-expanded");
    sync(expanded);

    if (!expanded && section && window.matchMedia("(max-width: 720px)").matches) {
      var top = section.getBoundingClientRect().top;
      if (top < 0) {
        var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        section.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
    }
  });

  sync(false);
})();

(function () {
  // Familiar, unobtrusive back-to-top control. Main pages provide the button in
  // markup; legal pages get the same control automatically from this shared script.
  var button = document.querySelector("[data-back-to-top]");
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "back-to-top";
    button.setAttribute("data-back-to-top", "");
    button.setAttribute("aria-label", document.documentElement.lang === "de" ? "Nach oben" : "Back to top");
    button.setAttribute("title", button.getAttribute("aria-label"));
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.5 14.5 5.5-5.5 5.5 5.5"/></svg>';
    document.body.appendChild(button);
  }

  var threshold = Math.max(460, Math.round(window.innerHeight * 0.65));
  var ticking = false;

  function sync() {
    button.classList.toggle("is-visible", window.scrollY > threshold);
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(sync);
  }, { passive: true });

  window.addEventListener("resize", function () {
    threshold = Math.max(460, Math.round(window.innerHeight * 0.65));
    sync();
  }, { passive: true });

  button.addEventListener("click", function () {
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  });

  sync();
})();


(function () {
  // Business ROI calculator: transparent local-only model, no network requests.
  var root = document.querySelector("[data-roi-calculator]");
  if (!root) return;

  var defaults = {
    techs: 8,
    reports: 2,
    days: 220,
    docMinutes: 20,
    savedMinutes: 15,
    techRate: 45,
    officeMinutes: 5,
    officeRate: 35,
    investment: 30000
  };

  var inputs = {};
  Object.keys(defaults).forEach(function (key) {
    inputs[key] = root.querySelector('[data-roi="' + key + '"]');
  });

  var money = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  });
  var whole = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
  var one = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  function value(key) {
    var el = inputs[key];
    var n = el ? Number(String(el.value).replace(",", ".")) : defaults[key];
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function out(name, text) {
    var el = root.querySelector('[data-roi-out="' + name + '"]');
    if (el) el.textContent = text;
  }

  function monthsFor(cost, annualSavings) {
    if (!(annualSavings > 0)) return Infinity;
    if (!(cost > 0)) return 0;
    return cost / annualSavings * 12;
  }

  function formatMonths(months) {
    if (!Number.isFinite(months)) return "—";
    if (months <= 0) return "sofort";
    if (months > 1200) return "> 100 Jahre";
    return one.format(months) + " Monate";
  }

  function calculate() {
    var techs = value("techs");
    var reports = value("reports");
    var days = value("days");
    var docMinutes = value("docMinutes");
    var savedMinutes = Math.min(value("savedMinutes"), docMinutes);
    var techRate = value("techRate");
    var officeMinutes = value("officeMinutes");
    var officeRate = value("officeRate");
    var investment = value("investment");

    var reportsYear = techs * reports * days;
    var currentTechCost = reportsYear * (docMinutes / 60) * techRate;
    var currentOfficeCost = reportsYear * (officeMinutes / 60) * officeRate;
    var currentCost = currentTechCost + currentOfficeCost;

    var techSavings = reportsYear * (savedMinutes / 60) * techRate;
    var officeSavings = reportsYear * (officeMinutes / 60) * officeRate;
    var savingsYear = techSavings + officeSavings;
    var hoursSaved = reportsYear * ((savedMinutes + officeMinutes) / 60);

    var months = monthsFor(investment, savingsYear);
    var threeYear = savingsYear * 3 - investment;

    out("reportsYear", whole.format(Math.round(reportsYear)));
    out("currentCost", money.format(currentCost));
    out("savingsYear", money.format(savingsYear));
    out("hoursSaved", whole.format(Math.round(hoursSaved)) + " h");
    out("investmentLabel", money.format(investment));

    var monthsEl = root.querySelector('[data-roi-out="months"]');
    if (monthsEl) {
      monthsEl.textContent = Number.isFinite(months) ? (months <= 0 ? "0" : one.format(months)) : "—";
    }

    var payback = root.querySelector('[data-roi-out="paybackText"]');
    if (payback) {
      if (!(savingsYear > 0)) {
        payback.textContent = "Mit diesen Eingaben entsteht keine modellierte Einsparung.";
      } else if (months <= 12) {
        payback.textContent = "Die eingegebene Investition wäre in dieser Modellrechnung innerhalb eines Jahres amortisiert.";
      } else {
        payback.textContent = "Danach übersteigt die kumulierte modellierte Einsparung die Investition.";
      }
    }

    out("threeYear", (threeYear >= 0 ? "+" : "−") + money.format(Math.abs(threeYear)));

    root.querySelectorAll("[data-roi-scenario]").forEach(function (el) {
      var cost = Number(el.getAttribute("data-roi-scenario")) || 0;
      el.textContent = formatMonths(monthsFor(cost, savingsYear));
    });

    var bar = root.querySelector("[data-roi-bar]");
    if (bar) {
      var annualCoverage = investment > 0 ? savingsYear / investment : (savingsYear > 0 ? 1 : 0);
      bar.style.width = Math.max(0, Math.min(100, annualCoverage * 100)) + "%";
    }
  }

  Object.keys(inputs).forEach(function (key) {
    if (!inputs[key]) return;
    inputs[key].addEventListener("input", calculate);
    inputs[key].addEventListener("change", calculate);
  });

  var reset = root.querySelector("[data-roi-reset]");
  if (reset) {
    reset.addEventListener("click", function () {
      Object.keys(defaults).forEach(function (key) {
        if (inputs[key]) inputs[key].value = defaults[key];
      });
      calculate();
    });
  }

  calculate();
})();
