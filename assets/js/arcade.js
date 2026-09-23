// Hidden arcade mode. Loaded on demand by site.js (Konami code, logo taps, footer button).
(function () {
  if (window.GBArcade) return;

  var de = document.documentElement.lang !== "en";
  var T = de ? {
    score: "Punkte", wave: "Welle", shield: "Schild", exit: "ESC / × beenden",
    hint: "Maus oder Finger bewegen · Schiff feuert automatisch",
    over: "Schilde down", again: "Nochmal", close: "Zurück zur Seite",
    best: "Bestwert dieser Sitzung", power: "TRIPLE SHOT", wavePrefix: "WELLE "
  } : {
    score: "Score", wave: "Wave", shield: "Shield", exit: "ESC / × to exit",
    hint: "Move mouse or finger · ship fires automatically",
    over: "Shields down", again: "Play again", close: "Back to the site",
    best: "Best this session", power: "TRIPLE SHOT", wavePrefix: "WAVE "
  };

  var best = 0;
  var root, canvas, ctx, raf = 0, opener = null;
  var w, h, dpr, lastFrame, state;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function build() {
    root = el("div", "arcade");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Arcade");
    canvas = el("canvas");
    ctx = canvas.getContext("2d");
    var hud = el("div", "arcade-hud",
      '<span><b data-score>0</b><small>' + T.score + '</small></span>' +
      '<span><b data-wave>1</b><small>' + T.wave + '</small></span>' +
      '<span><b data-shield>●●●</b><small>' + T.shield + '</small></span>');
    var close = el("button", "arcade-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", T.close);
    close.addEventListener("click", stop);
    var hint = el("p", "arcade-hint", T.hint + " · " + T.exit);
    var banner = el("p", "arcade-banner");
    var over = el("div", "arcade-over",
      '<h2>' + T.over + '</h2><p data-final></p>' +
      '<div class="actions"><button type="button" class="btn primary" data-again>' + T.again + '</button>' +
      '<button type="button" class="btn" data-leave>' + T.close + '</button></div>');
    over.hidden = true;
    over.querySelector("[data-again]").addEventListener("click", reset);
    over.querySelector("[data-leave]").addEventListener("click", stop);
    root.append(canvas, hud, close, hint, banner, over);

    root.addEventListener("pointermove", function (e) { if (state) state.tx = e.clientX; });
    root.addEventListener("pointerdown", function (e) { if (state && e.target === canvas) state.tx = e.clientX; });
  }

  function onKey(e) {
    if (!root || !root.isConnected) return;
    var k = e.key.toLowerCase();
    if (k === "escape") { stop(); return; }
    if (e.type === "keydown" && k === "tab") {
      var list = Array.prototype.filter.call(root.querySelectorAll("button"), function (b) { return b.offsetParent !== null; });
      if (list.length) {
        var i = list.indexOf(document.activeElement);
        e.preventDefault();
        list[(i + (e.shiftKey ? -1 : 1) + list.length) % list.length].focus();
      }
      return;
    }
    if (state) state.keys[k] = e.type === "keydown";
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (state) state.y = h - Math.max(110, h * 0.16);
  }

  function reset() {
    root.querySelector(".arcade-over").hidden = true;
    state = {
      x: w / 2, tx: w / 2, y: h - Math.max(110, h * 0.16), keys: {},
      bullets: [], rocks: [], sparks: [], orbs: [], stars: [],
      score: 0, wave: 1, shield: 3, spawned: 0, toSpawn: 8, nextSpawn: 0,
      lastShot: 0, triple: 0, hurt: 0, shake: 0, over: false, nextOrb: 1500
    };
    for (var i = 0; i < 140; i++) state.stars.push({ x: Math.random() * w, y: Math.random() * h, z: Math.random() });
    announce(T.wavePrefix + 1);
    hud();
  }

  function announce(text) {
    var b = root.querySelector(".arcade-banner");
    b.textContent = text;
    b.classList.remove("show");
    void b.offsetWidth;
    b.classList.add("show");
  }

  function hud() {
    root.querySelector("[data-score]").textContent = state.score;
    root.querySelector("[data-wave]").textContent = state.wave;
    root.querySelector("[data-shield]").textContent = "●●●".slice(0, Math.max(0, state.shield)) + "○○○".slice(0, 3 - Math.max(0, state.shield));
  }

  function rock(size, x, y) {
    var r = size === 2 ? 30 + Math.random() * 12 : 14 + Math.random() * 6;
    var pts = [], n = 9 + Math.floor(Math.random() * 4);
    for (var i = 0; i < n; i++) pts.push(0.72 + Math.random() * 0.4);
    var speed = 1.1 + state.wave * 0.28 + Math.random() * 0.8;
    return {
      x: x != null ? x : 40 + Math.random() * (w - 80), y: y != null ? y : -50,
      vx: (Math.random() - 0.5) * (size === 2 ? 0.8 : 2.4), vy: speed * (size === 2 ? 1 : 1.25),
      r: r, size: size, pts: pts, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.04,
      hp: size === 2 ? 3 : 1, flash: 0
    };
  }

  function burst(x, y, n, color, speed) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, v = (0.4 + Math.random()) * speed;
      state.sparks.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, color: color });
    }
  }

  function gameOver() {
    state.over = true;
    best = Math.max(best, state.score);
    var o = root.querySelector(".arcade-over");
    o.querySelector("[data-final]").textContent = T.score + ": " + state.score + " · " + T.best + ": " + best;
    o.hidden = false;
    o.querySelector("[data-again]").focus();
    burst(state.x, state.y, 60, "#ff8a3d", 6);
  }

  function frame(t) {
    if (!state) return;
    raf = requestAnimationFrame(frame);
    var k = lastFrame ? Math.min(t - lastFrame, 50) / (1000 / 60) : 1;
    lastFrame = t;
    var s = state;

    if (!s.over) {
      if (s.keys.arrowleft || s.keys.a) s.tx -= 10 * k;
      if (s.keys.arrowright || s.keys.d) s.tx += 10 * k;
      s.tx = Math.max(24, Math.min(w - 24, s.tx));
      var prev = s.x;
      s.x += (s.tx - s.x) * (1 - Math.pow(0.8, k));
      s.tilt = Math.max(-0.5, Math.min(0.5, (s.x - prev) / k * 0.05));

      if (t - s.lastShot > (s.triple > t ? 110 : 150)) {
        s.lastShot = t;
        s.bullets.push({ x: s.x, y: s.y - 20, vx: 0 });
        if (s.triple > t) {
          s.bullets.push({ x: s.x - 8, y: s.y - 14, vx: -2.2 }, { x: s.x + 8, y: s.y - 14, vx: 2.2 });
        }
      }

      if (s.spawned < s.toSpawn && t > s.nextSpawn) {
        s.rocks.push(rock(Math.random() < 0.45 ? 2 : 1));
        s.spawned++;
        s.nextSpawn = t + Math.max(260, 1100 - s.wave * 90) * (0.6 + Math.random() * 0.8);
      }
      if (s.spawned >= s.toSpawn && s.rocks.length === 0) {
        s.wave++; s.spawned = 0; s.toSpawn = 8 + s.wave * 3;
        s.nextSpawn = t + 900;
        announce(T.wavePrefix + s.wave);
        hud();
      }
    }

    ctx.save();
    if (s.shake > 0.3) { ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake); s.shake *= Math.pow(0.86, k); }
    ctx.clearRect(-20, -20, w + 40, h + 40);

    s.stars.forEach(function (st) {
      st.y += (0.4 + st.z * 2.4) * k;
      if (st.y > h) { st.y = 0; st.x = Math.random() * w; }
      ctx.fillStyle = "rgba(220,232,238," + (0.15 + st.z * 0.55) + ")";
      ctx.fillRect(st.x, st.y, 1 + st.z, 1 + st.z * 3);
    });

    // Orbs (triple shot power-up)
    for (var o = s.orbs.length - 1; o >= 0; o--) {
      var orb = s.orbs[o];
      orb.y += 2 * k;
      var pulse = 8 + Math.sin(t / 120) * 2;
      ctx.fillStyle = "#c6f04a"; ctx.shadowColor = "#c6f04a"; ctx.shadowBlur = 24;
      ctx.beginPath(); ctx.arc(orb.x, orb.y, pulse, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
      if (!s.over && Math.abs(orb.x - s.x) < 26 && Math.abs(orb.y - s.y) < 26) {
        s.triple = t + 7000; s.orbs.splice(o, 1);
        announce(T.power); burst(orb.x, orb.y, 30, "#c6f04a", 4);
      } else if (orb.y > h + 20) s.orbs.splice(o, 1);
    }

    // Rocks
    for (var i = s.rocks.length - 1; i >= 0; i--) {
      var r = s.rocks[i];
      r.x += r.vx * k; r.y += r.vy * k; r.rot += r.vr * k;
      if (r.x < r.r || r.x > w - r.r) r.vx *= -1;
      ctx.save();
      ctx.translate(r.x, r.y); ctx.rotate(r.rot);
      ctx.beginPath();
      r.pts.forEach(function (p, j) {
        var a = (j / r.pts.length) * 6.283;
        ctx[j ? "lineTo" : "moveTo"](Math.cos(a) * r.r * p, Math.sin(a) * r.r * p);
      });
      ctx.closePath();
      ctx.fillStyle = r.flash > 0 ? "#f3f6f7" : "#0b1116";
      ctx.strokeStyle = r.size === 2 ? "#ff8a3d" : "#9eb4cc";
      ctx.lineWidth = 2;
      ctx.fill(); ctx.stroke();
      ctx.restore();
      r.flash = Math.max(0, r.flash - k);

      if (!s.over && s.hurt < t && Math.hypot(r.x - s.x, r.y - s.y) < r.r * 0.8 + 14) {
        s.rocks.splice(i, 1);
        damage(t, r.x, r.y);
        continue;
      }
      if (r.y - r.r > h) {
        s.rocks.splice(i, 1);
        if (!s.over) damage(t, r.x, h - 4);
      }
    }

    // Bullets
    ctx.fillStyle = "#c6f04a";
    for (var b = s.bullets.length - 1; b >= 0; b--) {
      var p = s.bullets[b];
      p.y -= 14 * k; p.x += p.vx * k;
      var hit = false;
      for (var q = 0; q < s.rocks.length; q++) {
        var rk = s.rocks[q];
        if (Math.hypot(p.x - rk.x, p.y - rk.y) < rk.r) {
          hit = true; rk.hp--; rk.flash = 3;
          burst(p.x, p.y, 4, "#c6f04a", 2.5);
          if (rk.hp <= 0) {
            s.rocks.splice(q, 1);
            s.score += rk.size === 2 ? 50 : 20;
            s.shake = rk.size === 2 ? 9 : 4;
            burst(rk.x, rk.y, rk.size === 2 ? 34 : 16, rk.size === 2 ? "#ff8a3d" : "#9eb4cc", 5);
            if (rk.size === 2) s.rocks.push(rock(1, rk.x - 10, rk.y), rock(1, rk.x + 10, rk.y));
            if (s.score >= s.nextOrb) { s.nextOrb += 1500; s.orbs.push({ x: rk.x, y: rk.y }); }
            hud();
          }
          break;
        }
      }
      if (hit || p.y < -20) { s.bullets.splice(b, 1); continue; }
      ctx.fillRect(p.x - 1.5, p.y, 3, 12);
    }

    // Sparks
    for (var m = s.sparks.length - 1; m >= 0; m--) {
      var sp = s.sparks[m];
      sp.x += sp.vx * k; sp.y += sp.vy * k; sp.vy += 0.06 * k; sp.life -= 0.022 * k;
      if (sp.life <= 0) { s.sparks.splice(m, 1); continue; }
      ctx.globalAlpha = sp.life; ctx.fillStyle = sp.color; ctx.fillRect(sp.x, sp.y, 3, 3);
    }
    ctx.globalAlpha = 1;

    // Ship
    if (!s.over && (s.hurt < t || Math.floor(t / 90) % 2)) {
      ctx.translate(s.x, s.y); ctx.rotate(s.tilt || 0);
      ctx.fillStyle = "#ff8a3d";
      ctx.beginPath(); ctx.moveTo(-6, 14); ctx.lineTo(0, 24 + Math.random() * 10); ctx.lineTo(6, 14); ctx.fill();
      ctx.fillStyle = "#c6f04a"; ctx.shadowColor = "#c6f04a"; ctx.shadowBlur = s.triple > t ? 34 : 18;
      ctx.beginPath();
      ctx.moveTo(0, -22); ctx.lineTo(18, 16); ctx.lineTo(6, 10); ctx.lineTo(0, 16);
      ctx.lineTo(-6, 10); ctx.lineTo(-18, 16); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  function damage(t, x, y) {
    state.shield--;
    state.hurt = t + 1400;
    state.shake = 14;
    burst(x, y, 30, "#ff8a3d", 5);
    root.classList.remove("hit"); void root.offsetWidth; root.classList.add("hit");
    hud();
    if (state.shield <= 0) gameOver();
  }

  function start(from) {
    if (root && root.isConnected) return;
    opener = from || document.activeElement;
    if (!root) build();
    document.body.appendChild(root);
    document.documentElement.classList.add("gate-open");
    document.querySelectorAll("body > header, body > main, body > footer").forEach(function (n) { n.setAttribute("inert", ""); });
    resize();
    reset();
    lastFrame = 0;
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    document.addEventListener("keydown", onKey);
    document.addEventListener("keyup", onKey);
    root.querySelector(".arcade-close").focus();
  }

  function stop() {
    cancelAnimationFrame(raf);
    if (state) best = Math.max(best, state.score);
    state = null;
    window.removeEventListener("resize", resize);
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("keyup", onKey);
    document.documentElement.classList.remove("gate-open");
    document.querySelectorAll("body > header, body > main, body > footer").forEach(function (n) { n.removeAttribute("inert"); });
    if (root) root.remove();
    if (opener && opener.focus) opener.focus();
  }

  window.GBArcade = { start: start, stop: stop };
})();
