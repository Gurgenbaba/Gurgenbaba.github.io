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

(function () {
  var motion = document.documentElement.classList.contains("fx");
  var finePointer = matchMedia("(pointer: fine)").matches;

  // Boot line in the hero kicker
  var kicker = document.querySelector(".hero .kicker");
  if (kicker) {
    var boot = document.createElement("span");
    boot.className = "boot";
    boot.setAttribute("aria-hidden", "true");
    kicker.appendChild(boot);
    var line = "// SYSTEM ONLINE";
    if (!motion) {
      boot.textContent = line;
    } else {
      var i = 0;
      setTimeout(function tick() {
        boot.textContent = line.slice(0, ++i);
        if (i < line.length) setTimeout(tick, 38 + Math.random() * 40);
      }, 500);
    }
  }

  // Starfield behind the hero
  var hero = document.querySelector(".hero");
  var canvas = hero && hero.querySelector(".starfield");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var stars = [], w = 0, h = 0, dpr = 1, mx = 0, my = 0, px = 0, py = 0;
    var running = false, visible = true, shooter = null, raf = 0;

    var resize = function () {
      if (hero.clientWidth === w && hero.clientHeight === h) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(420, Math.round((w * h) / 4200));
      stars = [];
      for (var n = 0; n < count; n++) {
        var z = Math.random();
        stars.push({
          x: Math.random() * w, y: Math.random() * h, z: z,
          r: 0.4 + z * 1.4,
          a: 0.25 + z * 0.65,
          tw: Math.random() * Math.PI * 2,
          acid: Math.random() < 0.06
        });
      }
    };

    var draw = function (t) {
      ctx.clearRect(0, 0, w, h);
      px += (mx - px) * 0.05; py += (my - py) * 0.05;
      for (var n = 0; n < stars.length; n++) {
        var s = stars[n];
        if (motion) {
          s.x -= 0.04 + s.z * 0.22;
          if (s.x < -4) { s.x = w + 4; s.y = Math.random() * h; }
        }
        var x = s.x + px * s.z * 26, y = s.y + py * s.z * 18;
        var a = s.a * (motion ? 0.75 + 0.25 * Math.sin(t / 700 + s.tw) : 1);
        ctx.fillStyle = s.acid ? "rgba(198,240,74," + a + ")" : "rgba(220,232,238," + a + ")";
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (motion) {
        if (!shooter && Math.random() < 0.004) {
          shooter = { x: Math.random() * w * 0.8 + w * 0.2, y: Math.random() * h * 0.4, life: 1 };
        }
        if (shooter) {
          var sx = shooter.x, sy = shooter.y;
          var g = ctx.createLinearGradient(sx, sy, sx + 120, sy - 40);
          g.addColorStop(0, "rgba(198,240,74," + shooter.life + ")");
          g.addColorStop(1, "rgba(198,240,74,0)");
          ctx.strokeStyle = g; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 120, sy - 40); ctx.stroke();
          shooter.x -= 9; shooter.y += 3; shooter.life -= 0.018;
          if (shooter.life <= 0) shooter = null;
        }
      }
    };

    var loop = function (t) {
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    var sync = function () {
      var should = motion && visible && !document.hidden;
      if (should && !running) { running = true; raf = requestAnimationFrame(loop); }
      if (!should && running) { running = false; cancelAnimationFrame(raf); }
    };

    resize();
    draw(0);
    window.addEventListener("resize", function () { resize(); if (!running) draw(0); });
    document.addEventListener("visibilitychange", sync);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }).observe(hero);
    }
    sync();

    if (motion && finePointer) {
      var frame = hero.querySelector(".hero-frame");
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width - 0.5;
        my = (e.clientY - r.top) / r.height - 0.5;
        if (frame) {
          var f = frame.getBoundingClientRect();
          var fx = (e.clientX - f.left) / f.width - 0.5;
          var fy = (e.clientY - f.top) / f.height - 0.5;
          frame.style.setProperty("--ry", (Math.max(-1, Math.min(1, fx)) * 8).toFixed(2) + "deg");
          frame.style.setProperty("--rx", (Math.max(-1, Math.min(1, fy)) * -6).toFixed(2) + "deg");
        }
      });
      hero.addEventListener("pointerleave", function () {
        mx = my = 0;
        if (frame) { frame.style.setProperty("--rx", "0deg"); frame.style.setProperty("--ry", "0deg"); }
      });
    }
  }

  if (!motion) return;

  // Scroll reveal, grids fade in child by child
  document.querySelectorAll(".services, .systems, .process").forEach(function (el) { el.classList.add("stagger"); });
  document.querySelectorAll(".projects, .flag, .visuals").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (el, n) { el.style.setProperty("--d", (n % 3) * 0.08 + "s"); });
  });
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("on"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { el.classList.add("will-reveal"); io.observe(el); });
  }

  // Spotlight that follows the cursor across grid cells
  if (finePointer) {
    document.querySelectorAll(".services, .systems, .process").forEach(function (grid) {
      grid.classList.add("spot");
      grid.addEventListener("pointermove", function (e) {
        Array.prototype.forEach.call(grid.children, function (cell) {
          var r = cell.getBoundingClientRect();
          cell.style.setProperty("--mx", e.clientX - r.left + "px");
          cell.style.setProperty("--my", e.clientY - r.top + "px");
        });
      });
    });
  }

  // Endless tech ticker
  document.querySelectorAll(".stack").forEach(function (stack) {
    var track = document.createElement("div");
    track.className = "ticker-track";
    var originals = Array.prototype.slice.call(stack.children);
    originals.forEach(function (el) { track.appendChild(el); });
    originals.forEach(function (el) {
      var copy = el.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      track.appendChild(copy);
    });
    stack.appendChild(track);
    stack.classList.add("ticker");
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
  // Hidden arcade: Konami code, five quick taps on the logo, or the footer button.
  var script = document.currentScript;
  var src = script ? script.src.replace(/site\.js(\?.*)?$/, "arcade.js") : "assets/js/arcade.js";
  var loading = null;
  function launch(from) {
    if (window.GBArcade) { window.GBArcade.start(from); return; }
    if (loading) return;
    loading = document.createElement("script");
    loading.src = src;
    loading.onload = function () { if (window.GBArcade) window.GBArcade.start(from); };
    loading.onerror = function () { loading = null; };
    document.body.appendChild(loading);
  }

  var code = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
  var pos = 0;
  document.addEventListener("keydown", function (e) {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    var key = String(e.key || "").toLowerCase();
    pos = key === code[pos] ? pos + 1 : key === code[0] ? 1 : 0;
    if (pos === code.length) { pos = 0; launch(document.activeElement); }
  });

  var brand = document.querySelector(".site-header .brand");
  var taps = [];
  if (brand) {
    brand.addEventListener("click", function () {
      var now = Date.now();
      taps = taps.filter(function (t) { return now - t < 2000; });
      taps.push(now);
      if (taps.length >= 5) { taps = []; launch(brand); }
    });
  }

  document.querySelectorAll("[data-arcade]").forEach(function (btn) {
    btn.addEventListener("click", function () { launch(btn); });
  });
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
  // Section labels decode like a terminal when they scroll into view.
  if (!document.documentElement.classList.contains("fx") || !("IntersectionObserver" in window)) return;
  var glyphs = "!<>-_\/[]{}=+*^?#01";
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      var el = entry.target, text = el.textContent, start = performance.now(), duration = 700;
      (function step(now) {
        var t = Math.min(1, (now - start) / duration), out = "";
        for (var i = 0; i < text.length; i++) {
          var settle = i / text.length;
          out += text[i] === " " || t > settle * 0.7 + 0.3 ? text[i] : glyphs[Math.floor(Math.random() * glyphs.length)];
        }
        el.textContent = t < 1 ? out : text;
        if (t < 1) requestAnimationFrame(step);
      })(start);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll(".block-head .kicker, .close .kicker, .contact-main .kicker").forEach(function (el) {
    io.observe(el);
  });
})();

(function () {
  // "Ich baue Websites / Online-Shops / ..." types and deletes itself under the headline.
  var el = document.querySelector("[data-rotate]");
  if (!el) return;
  var words = el.getAttribute("data-rotate").split("|");
  if (!document.documentElement.classList.contains("fx")) return;
  var i = 0, pos = words[0].length, deleting = true;
  el.classList.add("typing");
  function step() {
    if (deleting) {
      pos--;
      if (pos < 0) { deleting = false; i = (i + 1) % words.length; pos = 0; }
    } else {
      pos++;
    }
    el.textContent = words[i].slice(0, pos) || "​";
    if (!deleting && pos >= words[i].length) { deleting = true; setTimeout(step, 1900); return; }
    setTimeout(step, deleting ? 38 : 70);
  }
  setTimeout(step, 2200);
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
  var typeBox = form.querySelector('.pick[data-field="type"]');
  var featBox = form.querySelector('.pick[data-field="features"]');
  var featQuestion = form.querySelector('[data-step="features"] .wiz-q');
  var defaultQuestion = featQuestion.textContent;
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
    var feats = pressed("features").map(function (b) { return b.getAttribute("data-phrase") || b.getAttribute("data-value"); });
    if (feats.length) intro += " " + (feats.length === 1 && t("features-one") ? t("features-one") : t("features")).replace("{list}", joinList(feats));
    var plan = pressed("timeline").concat(pressed("budget")).map(function (b) {
      return b.getAttribute("data-phrase");
    }).join(" ");
    var parts = [t("hello"), intro];
    if (plan) parts.push(plan);
    if (note.value.trim()) parts.push(t("note") + "\n" + note.value.trim());
    parts.push(t("outro"));
    parts.push(t("closing") + (name.value.trim() ? "\n" + name.value.trim() : ""));
    return parts.join("\n\n");
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

  // Step 2 only offers what fits the project type from step 1.
  function syncFeatures() {
    var type = pressed("type")[0];
    var key = type ? type.getAttribute("data-key") : null;
    var n = 0;
    featBox.querySelectorAll("button").forEach(function (b) {
      var show = !!key && b.getAttribute("data-for").split(" ").indexOf(key) !== -1;
      if (!show) { b.hidden = true; b.setAttribute("aria-pressed", "false"); return; }
      if (b.hidden) {
        b.hidden = false;
        b.style.setProperty("--i", n);
        b.classList.remove("pop");
        void b.offsetWidth;
        b.classList.add("pop");
      }
      n++;
    });
    featQuestion.textContent = type ? type.getAttribute("data-question") : defaultQuestion;
  }

  function show(index) {
    current = Math.max(0, Math.min(steps.length - 1, index));
    steps.forEach(function (step, i) { step.hidden = i !== current; });
    var step = steps[current];
    if (step.getAttribute("data-step") === "features") syncFeatures();
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
      if (box === typeBox) syncFeatures();
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
  email.addEventListener("input", function () { touch(); if (validEmail()) emailError.hidden = true; });

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
  // Primary buttons lean towards the cursor.
  if (!document.documentElement.classList.contains("fx") || !matchMedia("(pointer: fine)").matches) return;
  document.querySelectorAll(".btn.primary").forEach(function (btn) {
    btn.classList.add("magnetic");
    btn.addEventListener("pointermove", function (e) {
      var r = btn.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * 0.22;
      var y = (e.clientY - r.top - r.height / 2) * 0.35;
      btn.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
    });
    btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
  });
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
