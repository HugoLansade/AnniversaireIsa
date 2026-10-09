/* EmailSparks — orange sparks under the letters of a text field.
 *
 * As the text grows, a glowing line extends under it and sparks are thrown back
 * (towards the left). When the text shrinks, the line retracts and sparks fly to
 * the right. No dependencies.
 *
 *   var fx = EmailSparks.attach(document.getElementById("mailInput"));
 *   fx.set({ density: 2 });   // change a setting live
 *   fx.destroy();             // remove everything
 */
(function (global) {
  'use strict';

  // Temperature ramp, 0 = dying ember, 1 = white-hot. The site orange #F2A03D
  // sits mid-ramp, so most of a spark's life reads as that orange; fresh sparks
  // flash pale gold and cooling ones go deep red-orange.
  var RAMP = [
    [0.00, [ 92,  24,   8]],
    [0.20, [186,  66,  22]],
    [0.40, [226, 118,  40]],
    [0.56, [242, 160,  61]],  // #F2A03D
    [0.72, [255, 198,  92]],  // #FFC65C
    [0.88, [255, 229, 168]],
    [1.00, [255, 250, 238]]
  ];
  function heat(t) {
    if (t <= 0) return RAMP[0][1];
    if (t >= 1) return RAMP[RAMP.length - 1][1];
    for (var i = 1; i < RAMP.length; i++) {
      if (t <= RAMP[i][0]) {
        var a = RAMP[i - 1], b = RAMP[i], k = (t - a[0]) / (b[0] - a[0]);
        return [a[1][0] + (b[1][0] - a[1][0]) * k,
                a[1][1] + (b[1][1] - a[1][1]) * k,
                a[1][2] + (b[1][2] - a[1][2]) * k];
      }
    }
    return RAMP[RAMP.length - 1][1];
  }
  function rgba(c, a) {
    return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a < 0 ? 0 : a > 1 ? 1 : a.toFixed(3)) + ')';
  }
  function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; } // ~normal, in [-1, 1]
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  var DEFAULTS = {
    density: 1.4,     // sparks emitted per pixel the tip travels
    burst: 12,        // extra sparks popped on each keystroke
    speed: 1,         // multiplier on spark speed
    spread: 0.55,     // cone half-width (radians) for the slowest sparks; fast ones are tighter -> arrow shape
    lift: 0.16,       // upward tilt of the cone (radians)
    gravity: 420,     // px/s²
    drag: 1.8,        // air drag, 1/s
    life: 0.7,        // average spark lifetime, seconds
    streak: 0.028,    // motion-blur length: seconds of travel drawn as a line
    branch: 0.14,     // chance a spark bursts into 2-4 sub-sparks mid-flight
    drips: 0.12,      // share of slow molten droplets that just fall
    trail: true,      // glowing line under the text that grows as you type
    blend: 'lighter', // 'lighter' (additive, for dark backgrounds) or 'source-over'
    lineOffset: 0.8,  // trail position below the field's centre, in em
    stiffness: 220,   // how fast the tip catches up with the text
    max: 700,         // particle cap
    bleed: { l: 190, r: 190, t: 80, b: 180 } // how far sparks may fly outside the field, px
  };
  var VMIN = 90, VMAX = 560; // px/s before the speed multiplier

  function attach(input, opts) {
    if (!input) return null;
    var o = Object.assign({}, DEFAULTS, opts || {});
    o.bleed = Object.assign({}, DEFAULTS.bleed, (opts && opts.bleed) || {});

    var parent = input.parentElement;
    if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';

    var cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:absolute;pointer-events:none;z-index:2;';
    parent.appendChild(cv);
    var ctx = cv.getContext('2d');

    // Hidden twin of the input, used to measure the text. It copies every font
    // setting (including variable-font axes), so the tip lands exactly at the
    // end of the letters whatever the font.
    var mirror = document.createElement('span');
    mirror.setAttribute('aria-hidden', 'true');
    mirror.style.cssText = 'position:fixed;left:-9999px;top:0;visibility:hidden;white-space:pre;pointer-events:none;';
    document.body.appendChild(mirror);

    var reduce = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

    var W = 0, H = 0, m = {};
    var parts = [];
    var tipX = null, tipV = 0, heatLvl = 0, emitAcc = 0;
    var prevLen = input.value.length, dir = 1, pending = 0;
    var raf = 0, last = 0, alive = true;

    function layout() {
      var cs = getComputedStyle(input);
      ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontStretch', 'fontVariationSettings',
       'fontOpticalSizing', 'fontFeatureSettings', 'fontKerning', 'letterSpacing', 'wordSpacing',
       'textTransform', 'textRendering'].forEach(function (k) { mirror.style[k] = cs[k]; });
      m.fs = parseFloat(cs.fontSize) || 16;
      m.padL = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.borderLeftWidth) || 0);
      m.padR = (parseFloat(cs.paddingRight) || 0) + (parseFloat(cs.borderRightWidth) || 0);
      // Layout metrics (offset*) ignore CSS transforms: the envelope may be mid-fold
      // when a font finishes loading or the window resizes, and its projected rects
      // would put the trail on top of the text instead of under it.
      var own = input.offsetParent === parent, pr = parent.getBoundingClientRect(), ir = input.getBoundingClientRect();
      var ox = own ? input.offsetLeft : ir.left - pr.left - parent.clientLeft;
      var oy = own ? input.offsetTop : ir.top - pr.top - parent.clientTop;
      var px = 0;
      for (var el = input; el; el = el.offsetParent) px += el.offsetLeft;
      px -= global.scrollX || 0;
      var vw = document.documentElement.clientWidth;
      m.w = input.offsetWidth; m.h = input.offsetHeight;
      // Never let the canvas poke past the viewport (avoids horizontal scroll on phones)
      var bl = Math.max(0, Math.min(o.bleed.l, px));
      var br = Math.max(0, Math.min(o.bleed.r, vw - px - m.w));
      var bt = o.bleed.t, bb = o.bleed.b;
      W = Math.ceil(m.w + bl + br); H = Math.ceil(m.h + bt + bb);
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      cv.style.left = (ox - bl) + 'px';
      cv.style.top = (oy - bt) + 'px';
      cv.style.width = W + 'px';
      cv.style.height = H + 'px';
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      m.x0 = bl + m.padL;              // left edge of the text area, canvas coords
      m.x1 = bl + m.w - m.padR;        // right edge
      m.y = bt + m.h / 2 + m.fs * o.lineOffset;
      tipX = null;                     // re-snap after a layout change (no sparks)
    }

    function textW(s) {
      if (!s) return 0;
      mirror.textContent = s;
      return mirror.getBoundingClientRect().width;
    }
    function caretIndex() {
      try { var i = input.selectionStart; if (typeof i === 'number') return i; } catch (e) {}
      return input.value.length;       // type="email" has no selection API
    }
    function xAt(idx) {
      return clamp(m.x0 + textW(input.value.slice(0, idx)) - input.scrollLeft, m.x0, m.x1);
    }

    function spawn(x, y, d, power, spray) {
      if (parts.length >= o.max) return;
      var p = { x: x, y: y + (Math.random() - 0.5) * 1.6, age: 0, g: 1, split: 0 };
      var s, a;
      if (Math.random() < o.drips) {
        // molten droplet: slow, mostly falls, slightly behind the tip
        a = Math.PI / 2 + 0.35 * d + (Math.random() - 0.5) * 1.1;
        s = (20 + Math.random() * 70) * o.speed;
        p.life = o.life * (0.6 + Math.random() * 0.7);
        p.t0 = 0.55 + Math.random() * 0.2;
        p.w = 1.1 + Math.random() * 0.6;
        p.len = 0.6; p.g = 1.3;
        p.tint = (Math.random() - 0.5) * 0.12;
      } else {
        // thrown spark, opposite to the tip's motion. Fast sparks hug the axis,
        // slow ones fan out, which draws the arrowhead / chevron.
        var fast = Math.random();
        s = (VMIN + (VMAX - VMIN) * Math.pow(fast, 1.5)) * o.speed * power;
        var spread = o.spread * (spray ? 1.7 : 1) * (1 - 0.72 * fast);
        var base = d > 0 ? Math.PI + o.lift : -o.lift;
        a = base + gauss() * spread;
        p.life = o.life * (0.45 + Math.random() * 0.9);
        p.t0 = 0.62 + 0.38 * fast + (Math.random() - 0.5) * 0.12; // faster = hotter = paler
        p.w = 0.7 + Math.random() * 0.9;
        p.len = 0.8 + Math.random() * 0.5;
        p.tint = (Math.random() - 0.5) * 0.14;
        if (Math.random() < o.branch) p.split = p.life * (0.25 + Math.random() * 0.35);
      }
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s;
      parts.push(p);
    }

    function temp(p) { return p.t0 * (1 - Math.pow(p.age / p.life, 0.9)) + p.tint; }

    function splitSpark(p) {
      var n = 2 + (Math.random() * 3 | 0);
      var sp = Math.hypot(p.vx, p.vy), ang = Math.atan2(p.vy, p.vx);
      var t = Math.min(1, temp(p) + 0.25); // sub-sparks flare brighter for an instant
      for (var i = 0; i < n && parts.length < o.max; i++) {
        var a = ang + (Math.random() - 0.5) * 1.6;
        var s = sp * (0.45 + Math.random() * 0.5) + 40;
        parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, age: 0,
                     life: 0.12 + Math.random() * 0.25, t0: t, tint: 0,
                     w: 0.55 + Math.random() * 0.4, len: 0.7, g: 0.8, split: 0 });
      }
    }

    function line(x0, y0, x1, y1) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }

    function edgeFade(x, y) {
      var e = 30;
      return clamp(Math.min(x / e, (W - x) / e, y / e, (H - y) / e), 0, 1);
    }

    function draw(hot) {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = o.blend;
      ctx.lineCap = 'round';
      var len = tipX - m.x0;

      // Trail under the text, hottest right behind the tip
      if (o.trail && len > 0.5) {
        ctx.lineWidth = 7;
        ctx.strokeStyle = rgba(heat(0.5), 0.07 + 0.10 * hot);
        line(m.x0, m.y, tipX, m.y);
        var g = ctx.createLinearGradient(m.x0, 0, tipX, 0);
        var hz = Math.min(1, 90 / len);
        g.addColorStop(0, rgba(heat(0.44), 0.5));
        g.addColorStop(1 - hz, rgba(heat(0.52 + 0.08 * hot), 0.72));
        g.addColorStop(1, rgba(heat(0.6 + 0.4 * hot), 0.95));
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = g;
        line(m.x0, m.y, tipX, m.y);
      }

      // Sparks, drawn as short motion-blurred streaks
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var f = p.age / p.life;
        var a = (1 - Math.pow(f, 2.2)) * edgeFade(p.x, p.y) * (0.85 + 0.15 * Math.random());
        if (a < 0.01) continue;
        var t = temp(p), c = heat(t);
        var sp = Math.hypot(p.vx, p.vy) || 1;
        var L = clamp(sp * o.streak, 1.2, 42) * p.len;
        var ux = p.vx / sp, uy = p.vy / sp;
        var tx = p.x - ux * L, ty = p.y - uy * L;
        var mx = p.x - ux * L * 0.45, my = p.y - uy * L * 0.45;
        ctx.lineWidth = p.w * 3.2;
        ctx.strokeStyle = rgba(c, a * 0.13);
        line(tx, ty, p.x, p.y);
        ctx.lineWidth = p.w;
        ctx.strokeStyle = rgba(c, a * 0.35);
        line(tx, ty, mx, my);
        ctx.strokeStyle = rgba(heat(t + 0.12), a);
        line(mx, my, p.x, p.y);
      }

      // Hot point at the tip: the head of the arrow
      if (len > 0.5 && (o.trail || hot > 0.02)) {
        var r = 4 + 14 * hot;
        var rg = ctx.createRadialGradient(tipX, m.y, 0, tipX, m.y, r);
        rg.addColorStop(0, rgba(heat(1), 0.12 + 0.8 * hot));
        rg.addColorStop(0.35, rgba(heat(0.72), 0.05 + 0.4 * hot));
        rg.addColorStop(1, rgba(heat(0.45), 0));
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(tipX, m.y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function frame(now) {
      raf = 0;
      if (!alive) return;
      var dt = (now - last) / 1000; last = now;
      if (!(dt > 0)) dt = 1 / 60;
      if (dt > 1 / 24) dt = 1 / 24;

      var target = xAt(input.value.length);
      if (tipX === null) tipX = target;
      var prevTip = tipX;
      // Critically damped spring towards the end of the text
      var k = o.stiffness, c = 2 * Math.sqrt(k), h = dt / 2;
      for (var s = 0; s < 2; s++) { tipV += (k * (target - tipX) - c * tipV) * h; tipX += tipV * h; }

      var mult = reduce.matches ? 0.25 : 1;
      var moved = tipX - prevTip;
      if (Math.abs(moved) > 0.05) {
        var d = moved > 0 ? 1 : -1;
        emitAcc += Math.abs(moved) * o.density * mult;
        var n = Math.floor(emitAcc); emitAcc -= n;
        n = Math.min(n, 80);
        for (var i = 0; i < n; i++) spawn(prevTip + moved * Math.random(), m.y, d, 1, false);
      }
      if (pending) {
        var cx = xAt(caretIndex());
        var nb = Math.round(o.burst * mult * Math.min(2, 0.8 + 0.2 * pending));
        for (var j = 0; j < nb; j++) spawn(cx + (Math.random() - 0.5) * 3, m.y, dir, 1.1, true);
        pending = 0;
      }

      heatLvl *= Math.exp(-dt * 2.4);
      var hot = Math.max(heatLvl, Math.min(1, Math.abs(tipV) / 400));

      var dragF = Math.exp(-o.drag * dt);
      for (var q = parts.length - 1; q >= 0; q--) {
        var p = parts[q];
        p.age += dt;
        if (p.age >= p.life) { parts[q] = parts[parts.length - 1]; parts.pop(); continue; }
        p.vx *= dragF;
        p.vy = p.vy * dragF + o.gravity * p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.split && p.age >= p.split) { splitSpark(p); parts[q] = parts[parts.length - 1]; parts.pop(); }
      }

      var settled = !parts.length && !pending && Math.abs(target - tipX) < 0.05 && Math.abs(tipV) < 0.5 && hot < 0.01;
      if (settled) { tipX = target; tipV = 0; heatLvl = 0; hot = 0; }
      draw(hot);
      if (!settled) raf = requestAnimationFrame(frame);
    }

    function kick() {
      if (!raf && alive) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }

    function onInput() {
      var len = input.value.length;
      if (len !== prevLen) {
        dir = len > prevLen ? 1 : -1;
        pending += Math.abs(len - prevLen);
        prevLen = len;
        heatLvl = Math.min(1, heatLvl + 0.45);
      }
      kick();
    }
    function onLayout() { layout(); kick(); }

    input.addEventListener('input', onInput);
    input.addEventListener('change', onInput);
    input.addEventListener('scroll', kick);
    input.addEventListener('keyup', kick);
    input.addEventListener('focus', kick);
    global.addEventListener('resize', onLayout);
    var ro = global.ResizeObserver ? new ResizeObserver(onLayout) : null;
    if (ro) ro.observe(input);
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(onLayout);
      if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', onLayout);
    }
    layout(); kick();

    return {
      options: o,
      set: function (next) {
        var relayout = next && ('bleed' in next || 'lineOffset' in next);
        Object.assign(o, next);
        if (relayout) layout();
        kick();
      },
      // Jump to the current text with no sparks. Call after setting input.value
      // from code, which fires no "input" event.
      sync: function () {
        prevLen = input.value.length;
        parts.length = 0; pending = 0; tipV = 0; heatLvl = 0;
        layout(); kick();
      },
      destroy: function () {
        alive = false;
        if (raf) cancelAnimationFrame(raf);
        input.removeEventListener('input', onInput);
        input.removeEventListener('change', onInput);
        input.removeEventListener('scroll', kick);
        input.removeEventListener('keyup', kick);
        input.removeEventListener('focus', kick);
        global.removeEventListener('resize', onLayout);
        if (document.fonts && document.fonts.removeEventListener) document.fonts.removeEventListener('loadingdone', onLayout);
        if (ro) ro.disconnect();
        cv.remove();
        mirror.remove();
      }
    };
  }

  global.EmailSparks = { attach: attach, defaults: DEFAULTS };
})(window);
