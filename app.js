/* Rose Jim's Pickle Yard — NFC landing
   GSAP + ScrollTrigger, Lenis smooth scroll, canvas-confetti, vanilla canvas game */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const BRAND = ["#ff2338", "#1e9bff", "#74d11a", "#c6ff6b", "#ffffff"];
  const SCOREBOARD = "https://rosejims-pickle-yard-scoreboard.vercel.app/";
  const HOME = "https://rose-jims-pickle-yard-final.vercel.app/";

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  const buzz = (p = 12) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

  /* ---------- toast ---------- */
  const toastEl = $("#toast");
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("is-on"), 2600);
  }

  /* ---------- confetti ---------- */
  function burst(x = 0.5, y = 0.5, power = 1) {
    if (reduce || typeof window.confetti !== "function") return;
    confetti({ particleCount: Math.round(70 * power), spread: 75, startVelocity: 38, origin: { x, y }, colors: BRAND, scalar: 0.9, ticks: 160, disableForReducedMotion: true });
    confetti({ particleCount: Math.round(14 * power), spread: 100, origin: { x, y }, colors: ["#c6ff6b"], shapes: ["circle"], scalar: 1.6, ticks: 200 });
  }
  $$("[data-confetti]").forEach((el) =>
    el.addEventListener("click", (e) => {
      burst(e.clientX / innerWidth, e.clientY / innerHeight);
      buzz([10, 40, 10]);
    })
  );

  /* ---------- greeting, clock, visits ---------- */
  const h = new Date().getHours();
  $("#greeting").textContent =
    h < 5 ? "Night owl session" : h < 12 ? "Good morning, player" : h < 17 ? "Good afternoon, player" : h < 21 ? "Good evening, player" : "Late-night rally";
  const tick = () => ($("#clock").textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  tick(); setInterval(tick, 15000);
  $("#year").textContent = new Date().getFullYear();

  const visits = store.get("rj_visits", 0) + 1;
  store.set("rj_visits", visits);
  $("#visitCount").textContent = visits;
  $("#visitNote").textContent =
    visits === 1 ? "first time on the Yard" : visits < 5 ? "good to see you back" : visits < 15 ? "certified regular" : "basically lives here";

  /* ---------- save contact (vCard) ---------- */
  $("#saveContact").addEventListener("click", (e) => {
    const vcf = [
      "BEGIN:VCARD", "VERSION:3.0",
      "N:;Rose Jim's Pickle Yard;;;", "FN:Rose Jim's Pickle Yard", "ORG:Rose Jim's Pickle Yard",
      `URL;TYPE=Home:${HOME}`, `URL;TYPE=Scoreboard:${SCOREBOARD}`, `URL;TYPE=Tap:${location.href.split("#")[0]}`,
      "NOTE:Pickleball club — live scoreboard\\, fair randomizer\\, sessions & monthly rankings.",
      "END:VCARD",
    ].join("\r\n");
    const blob = new Blob([vcf], { type: "text/vcard" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "RoseJims-Pickle-Yard.vcf" });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    burst(e.clientX / innerWidth, e.clientY / innerHeight, 0.7);
    buzz(20);
    toast("Contact card ready. Open it to save.");
  });

  /* ---------- share ---------- */
  $("#shareBtn").addEventListener("click", async (e) => {
    const data = { title: "Rose Jim's Pickle Yard", text: "Need a fourth for doubles. Tap in:", url: location.href.split("#")[0] };
    buzz(15);
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(data.url);
      toast("Link copied. Send it to your partner.");
      burst(e.clientX / innerWidth, e.clientY / innerHeight, 0.5);
    } catch (err) {
      if (err && err.name !== "AbortError") toast("Copy this page's link to share it.");
    }
  });

  /* ---------- flip cards ---------- */
  $$("[data-flipcard]").forEach((c) => c.addEventListener("click", () => { c.classList.toggle("is-flipped"); buzz(8); }));

  /* ---------- background canvas: drifting court dots + pointer glow ---------- */
  (function bg() {
    const c = $("#bgCanvas"), ctx = c.getContext("2d");
    let w, hgt, dpr, dots = [];
    const mouse = { x: -999, y: -999 };
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = c.width = innerWidth * dpr; hgt = c.height = innerHeight * dpr;
      const n = Math.round(Math.min(70, (innerWidth * innerHeight) / 22000));
      dots = Array.from({ length: n }, (_, i) => ({
        x: Math.random() * w, y: Math.random() * hgt, r: (Math.random() * 1.6 + 0.6) * dpr,
        vx: (Math.random() - 0.5) * 0.18 * dpr, vy: (Math.random() - 0.5) * 0.18 * dpr,
        col: ["255,35,56", "30,155,255", "116,209,26"][i % 3],
      }));
    }
    size(); addEventListener("resize", size);
    addEventListener("pointermove", (e) => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; }, { passive: true });
    function frame() {
      ctx.clearRect(0, 0, w, hgt);
      const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 380 * dpr);
      g.addColorStop(0, "rgba(30,155,255,0.10)"); g.addColorStop(1, "rgba(30,155,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, hgt);
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > hgt) d.vy *= -1;
        const dist = Math.hypot(d.x - mouse.x, d.y - mouse.y);
        const a = dist < 220 * dpr ? 0.9 : 0.35;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${d.col},${a})`; ctx.fill();
      }
      for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i], b = dots[j], dd = Math.hypot(a.x - b.x, a.y - b.y);
        if (dd < 130 * dpr) { ctx.strokeStyle = `rgba(160,190,255,${0.08 * (1 - dd / (130 * dpr))})`; ctx.lineWidth = dpr; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      if (!reduce) requestAnimationFrame(frame);
    }
    frame();
  })();

  /* ---------- custom cursor ---------- */
  if (finePointer && !reduce) {
    const cur = $("#cursor");
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() { cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2; cur.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
    $$("a, button, [data-card], .game").forEach((el) => {
      el.addEventListener("pointerenter", () => cur.classList.add("is-hover"));
      el.addEventListener("pointerleave", () => cur.classList.remove("is-hover"));
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduce && hasGSAP) {
    $$("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.3); yTo((e.clientY - r.top - r.height / 2) * 0.4);
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- card tilt + spotlight ---------- */
  $$("[data-card]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--gx", px * 100 + "%"); card.style.setProperty("--gy", py * 100 + "%");
      if (finePointer && !reduce && hasGSAP) gsap.to(card, { rotateY: (px - 0.5) * 8, rotateX: (0.5 - py) * 8, transformPerspective: 900, duration: 0.5, ease: "power3.out" });
    });
    card.addEventListener("pointerleave", () => hasGSAP && gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.8, ease: "elastic.out(1, 0.5)" }));
  });

  /* ---------- hero logo tilt + shine (pointer + device orientation) ---------- */
  const logo = $("[data-tilt]");
  function tiltLogo(px, py) {
    logo.style.setProperty("--mx", px * 100 + "%"); logo.style.setProperty("--my", py * 100 + "%");
    if (hasGSAP && !reduce) gsap.to(logo, { rotateY: (px - 0.5) * 14, rotateX: (0.5 - py) * 10, transformPerspective: 1000, duration: 0.8, ease: "power3.out" });
  }
  $("#hero").addEventListener("pointermove", (e) => tiltLogo(e.clientX / innerWidth, e.clientY / innerHeight));
  addEventListener("deviceorientation", (e) => {
    if (e.gamma == null) return;
    tiltLogo(Math.min(1, Math.max(0, 0.5 + e.gamma / 60)), Math.min(1, Math.max(0, 0.5 + (e.beta - 45) / 60)));
  });

  /* ---------- text splitting ---------- */
  $$("[data-split]").forEach((el) => {
    el.innerHTML = [...el.textContent].map((ch) => `<span class="ch">${ch === " " ? "&nbsp;" : ch}</span>`).join("");
  });
  $$("[data-split-words]").forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w"><span>${w}</span></span>`).join(" ");
  });

  /* ================= RALLY GAME ================= */
  (function rally() {
    const wrap = $("#game"), cv = $("#gameCanvas"), ctx = cv.getContext("2d");
    const overlay = $("#gameOverlay"), startBtn = $("#gameStart");
    const hudScore = $("#hudScore"), hudBest = $("#hudBest");
    let W, H, dpr, running = false, score = 0, best = store.get("rj_best", 0), last = 0;
    const paddle = { x: 0, w: 120, h: 18, target: 0 };
    const ball = { x: 0, y: 0, vx: 0, vy: 0, r: 13, spin: 0 };
    let trail = [], sparks = [], shake = 0;
    hudBest.textContent = best;

    function size() {
      const r = wrap.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paddle.w = Math.max(90, Math.min(150, W * 0.2)); ball.r = Math.max(10, Math.min(15, W * 0.02));
      if (!running) { paddle.x = paddle.target = W / 2; ball.x = W / 2; ball.y = H * 0.35; }
      draw();
    }
    new ResizeObserver(size).observe(wrap);

    function setTarget(clientX) { const r = cv.getBoundingClientRect(); paddle.target = clientX - r.left; }
    wrap.addEventListener("pointermove", (e) => setTarget(e.clientX));
    wrap.addEventListener("pointerdown", (e) => setTarget(e.clientX));
    addEventListener("keydown", (e) => {
      if (!running) return;
      if (e.key === "ArrowLeft") paddle.target -= 60;
      if (e.key === "ArrowRight") paddle.target += 60;
    });

    function start() {
      score = 0; hudScore.textContent = 0;
      ball.x = W / 2; ball.y = H * 0.25;
      const sp = Math.max(260, H * 0.65);
      ball.vx = (Math.random() > 0.5 ? 1 : -1) * sp * 0.45; ball.vy = sp * 0.6;
      trail = []; sparks = []; running = true; last = performance.now();
      overlay.classList.add("is-off");
      buzz(15);
      requestAnimationFrame(loop);
    }
    startBtn.addEventListener("click", (e) => { e.stopPropagation(); start(); });

    function end() {
      running = false; buzz([30, 60, 30]);
      const isBest = score > best;
      if (isBest) { best = score; store.set("rj_best", best); hudBest.textContent = best; }
      $("#gameTag").textContent = isBest && score > 0 ? "new personal best" : "into the net";
      $("#gameTitle").textContent = score === 0 ? "Pickled! 0 hits" : `${score}-shot rally`;
      startBtn.querySelector(".btn__label").textContent = "Serve again";
      overlay.classList.remove("is-off");
      if (isBest && score >= 3) { const r = wrap.getBoundingClientRect(); burst((r.left + r.width / 2) / innerWidth, (r.top + r.height / 2) / innerHeight, 1.3); }
    }

    function spark(x, y, n, col) {
      for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 220; sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 1, col }); }
    }

    function loop(t) {
      if (!running) return;
      const dt = Math.min(0.033, (t - last) / 1000); last = t;
      paddle.target = Math.max(paddle.w / 2, Math.min(W - paddle.w / 2, paddle.target));
      paddle.x += (paddle.target - paddle.x) * Math.min(1, dt * 18);

      ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.vy += 140 * dt; ball.spin += ball.vx * dt * 0.02;
      if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); spark(ball.x, ball.y, 6, "#7cc8ff"); }
      if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); spark(ball.x, ball.y, 6, "#7cc8ff"); }
      if (ball.y < ball.r + 30) { ball.y = ball.r + 30; ball.vy = Math.abs(ball.vy); spark(ball.x, ball.y, 6, "#ff6b7a"); }

      const py = H - 46;
      if (ball.vy > 0 && ball.y + ball.r >= py && ball.y + ball.r <= py + paddle.h + 14 && Math.abs(ball.x - paddle.x) <= paddle.w / 2 + ball.r) {
        const off = (ball.x - paddle.x) / (paddle.w / 2);
        const speed = Math.min(Math.hypot(ball.vx, ball.vy) * 1.045, H * 2.2);
        const ang = off * 1.0;
        ball.vx = Math.sin(ang) * speed; ball.vy = -Math.abs(Math.cos(ang) * speed);
        ball.y = py - ball.r;
        score++; hudScore.textContent = score; shake = 6; buzz(10);
        spark(ball.x, py, 16, score % 5 === 0 ? "#ff2338" : "#c6ff6b");
        if (score % 10 === 0) { const r = wrap.getBoundingClientRect(); burst((r.left + (ball.x / W) * r.width) / innerWidth, (r.top + (py / H) * r.height) / innerHeight, 0.5); }
      }
      if (ball.y - ball.r > H) { draw(); end(); return; }

      trail.push({ x: ball.x, y: ball.y }); if (trail.length > 14) trail.shift();
      sparks.forEach((s) => { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 500 * dt; s.life -= dt * 1.8; });
      sparks = sparks.filter((s) => s.life > 0);
      shake *= 0.86;
      draw();
      requestAnimationFrame(loop);
    }

    function draw() {
      if (!W) return;
      ctx.save();
      ctx.clearRect(0, 0, W, H);
      if (shake > 0.3) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      // court
      ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 2;
      const m = 18; ctx.strokeRect(m, m + 22, W - m * 2, H - m * 2 - 22);
      ctx.beginPath(); ctx.moveTo(W / 2, m + 22); ctx.lineTo(W / 2, H * 0.62); ctx.stroke();
      // kitchen
      ctx.fillStyle = "rgba(255,35,56,0.07)"; ctx.fillRect(m, H * 0.62, W - m * 2, H * 0.14);
      ctx.strokeStyle = "rgba(255,107,122,0.4)"; ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(m, H * 0.62); ctx.lineTo(W - m, H * 0.62); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,107,122,0.5)"; ctx.font = `600 11px "JetBrains Mono", monospace`; ctx.textAlign = "center";
      ctx.fillText("K I T C H E N", W / 2, H * 0.69 + 4);
      // net (top)
      ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(m, m + 22, W - m * 2, 8);
      // trail
      trail.forEach((p, i) => { const a = i / trail.length; ctx.beginPath(); ctx.arc(p.x, p.y, ball.r * a * 0.9, 0, Math.PI * 2); ctx.fillStyle = `rgba(198,255,107,${a * 0.25})`; ctx.fill(); });
      // ball
      ctx.save(); ctx.translate(ball.x, ball.y); ctx.rotate(ball.spin);
      ctx.shadowColor = "rgba(198,255,107,0.8)"; ctx.shadowBlur = 24;
      ctx.beginPath(); ctx.arc(0, 0, ball.r, 0, Math.PI * 2); ctx.fillStyle = "#d8ff3a"; ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = "rgba(60,90,0,0.55)";
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ctx.beginPath(); ctx.arc(Math.cos(a) * ball.r * 0.55, Math.sin(a) * ball.r * 0.55, ball.r * 0.14, 0, Math.PI * 2); ctx.fill(); }
      ctx.beginPath(); ctx.arc(0, 0, ball.r * 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // sparks
      sparks.forEach((s) => { ctx.globalAlpha = Math.max(0, s.life); ctx.fillStyle = s.col; ctx.fillRect(s.x, s.y, 3, 3); });
      ctx.globalAlpha = 1;
      // paddle
      const py = H - 46, px = paddle.x - paddle.w / 2;
      const g = ctx.createLinearGradient(px, 0, px + paddle.w, 0); g.addColorStop(0, "#1e9bff"); g.addColorStop(1, "#7cc8ff");
      ctx.shadowColor = "rgba(30,155,255,0.8)"; ctx.shadowBlur = 20; ctx.fillStyle = g;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(px, py, paddle.w, paddle.h, 9) : ctx.rect(px, py, paddle.w, paddle.h); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = "#0b1530"; ctx.fillRect(paddle.x - 12, py + paddle.h, 24, 14);
      ctx.restore();
    }
  })();

  /* ================= INTRO + SCROLL ANIMATIONS ================= */
  function introThenReveal() {
    const seen = sessionStorage && (() => { try { return sessionStorage.getItem("rj_intro"); } catch { return null; } })();
    const intro = $("#intro");
    const done = () => { document.body.classList.remove("is-loading"); intro.remove(); heroIn(); };
    if (!hasGSAP || reduce) { done(); return; }
    try { sessionStorage.setItem("rj_intro", "1"); } catch {}
    const dur = seen ? 0.5 : 1.6;
    const msgs = ["Tap detected", "Reading tag", "Welcome to the Yard"];
    let i = 0; const iv = setInterval(() => { i = Math.min(i + 1, msgs.length - 1); $("#introText").textContent = msgs[i]; }, (dur * 1000) / 3);
    gsap.timeline({ onComplete: () => { clearInterval(iv); done(); } })
      .to("#introBar", { scaleX: 1, duration: dur, ease: "power2.inOut" })
      .to(".intro__nfc, .intro__label, .intro__bar", { y: -20, opacity: 0, duration: 0.4, stagger: 0.05, ease: "power2.in" })
      .to(intro, { clipPath: "circle(0% at 50% 50%)", duration: 0.9, ease: "expo.inOut" }, "-=0.1");
    gsap.set(intro, { clipPath: "circle(150% at 50% 50%)" });
  }

  function heroIn() {
    document.dispatchEvent(new CustomEvent("rj:ready"));
    if (!hasGSAP || reduce) return;
    gsap.registerPlugin(ScrollTrigger);

    // Lenis smooth scroll
    if (window.Lenis) {
      const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => { const t = $(a.getAttribute("href")); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -20, duration: 1.4 }); } }));
      // hide nav on scroll down
      let lastY = 0; const nav = $("#nav");
      lenis.on("scroll", ({ scroll }) => { nav.classList.toggle("is-hidden", scroll > lastY && scroll > 200); lastY = scroll; });
    }

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(".hero__logo", { scale: 0.6, opacity: 0, rotateX: 40, duration: 1.6 })
      .from(".hero__title .ch", { yPercent: 120, rotate: 8, duration: 1.1, stagger: 0.025 }, "-=1.2")
      .from("[data-reveal]", { y: 30, opacity: 0, duration: 1, stagger: 0.08 }, "-=0.9")
      .from("#nav", { y: -80, opacity: 0, duration: 1 }, "-=1")
      .from(".scroll-hint", { opacity: 0, duration: 1 }, "-=0.6");

    // hero parallax out
    gsap.to(".hero__inner", { yPercent: 25, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    // marquee: base loop + scroll velocity
    const track = $("#marquee");
    const loop = gsap.to(track, { xPercent: -50, duration: 22, ease: "none", repeat: -1 });
    ScrollTrigger.create({ onUpdate: (self) => { const v = self.getVelocity() / 300; gsap.to(loop, { timeScale: 1 + Math.abs(v), duration: 0.3, overwrite: true }); gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.3 }); } });

    // section titles word reveal
    $$("[data-split-words]").forEach((el) => gsap.from(el.querySelectorAll(".w > span"), { yPercent: 110, duration: 1.1, stagger: 0.06, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } }));
    $$(".kicker, .section__lead").forEach((el) => gsap.from(el, { y: 20, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } }));

    // bento cards
    gsap.from("[data-card]", { y: 80, opacity: 0, rotateX: -15, duration: 1.2, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: ".bento", start: "top 80%" } });

    // score flip-count
    $$("[data-flip]").forEach((el) => {
      const o = { v: 0 };
      gsap.to(o, { v: +el.dataset.flip, duration: 2.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" }, onUpdate: () => (el.textContent = Math.round(o.v)) });
    });
    // live score jitter every few seconds to feel "live"
    setInterval(() => {
      const els = $$("[data-flip]"); const el = els[Math.random() > 0.5 ? 0 : 1];
      let v = +el.textContent + 1; if (v > 11) { els.forEach((e) => (e.textContent = 0)); return; }
      el.textContent = v; gsap.fromTo(el, { yPercent: -30, opacity: 0.2 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: "back.out(2)" });
    }, 4200);

    // podium grow + rose draw
    gsap.from(".podium i", { scaleY: 0, duration: 1.2, stagger: 0.12, ease: "elastic.out(1, 0.6)", scrollTrigger: { trigger: ".podium", start: "top 90%" } });
    ScrollTrigger.create({ trigger: ".rose", start: "top 85%", once: true, onEnter: () => $(".rose").classList.add("is-drawn") });

    // game entrance
    gsap.from(".game", { y: 100, scale: 0.92, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".game", start: "top 85%" } });

    // yard steps activate + progress
    const steps = $$("[data-step]");
    steps.forEach((s) => ScrollTrigger.create({ trigger: s, start: "top 60%", end: "bottom 40%", toggleClass: { targets: s, className: "is-active" } }));
    gsap.to("#yardProgress", { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".yard__steps", start: "top 60%", end: "bottom 60%", scrub: true } });

    // flips stagger in
    gsap.from(".flip", { y: 60, opacity: 0, rotateY: -30, duration: 1.1, stagger: 0.07, ease: "expo.out", scrollTrigger: { trigger: ".flips", start: "top 85%" } });

    // outro
    gsap.from(".outro__title span", { yPercent: 100, opacity: 0, duration: 1.3, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: ".outro", start: "top 70%" } });
    gsap.fromTo(".outro__ring span", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.15, ease: "none", scrollTrigger: { trigger: ".outro", start: "top bottom", end: "center center", scrub: true } });
    ScrollTrigger.create({ trigger: ".outro__title", start: "top 70%", once: true, onEnter: () => setTimeout(() => burst(0.5, 0.6, 1.2), 500) });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", introThenReveal);
  else introThenReveal();
})();
