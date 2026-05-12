// ─── GSAP SETUP ───
gsap.registerPlugin(ScrollTrigger);

// ─── CURSOR ───
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

function animCursor() {
  cursor.style.left = mx + 'px';
  cursor.style.top = my + 'px';
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = rx + 'px';
  ring.style.top = ry + 'px';
  requestAnimationFrame(animCursor);
}
animCursor();

document.querySelectorAll('a, button, .product-card, #led-container, .btn-primary, .btn-secondary').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
});

// ─── PROGRESS BAR ───
const progressBar = document.getElementById('progress-bar');
window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  progressBar.style.width = pct + '%';
});

// ─── LED INTERACTION ───
let isLit = false;
let scrollUnlocked = false;
const ledContainer = document.getElementById('led-container');
const ledBody = document.getElementById('led-body');
const ledLens = document.getElementById('led-lens');
const ledGlow = document.getElementById('led-glow');
const scrollHint = document.getElementById('scroll-hint');
const nav = document.getElementById('main-nav');

// Lock scroll initially
document.body.style.overflow = 'hidden';

// Show ignition text after load
gsap.fromTo('.ignition-text', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2, delay: 0.8, ease: 'power3.out' });
gsap.fromTo('.ignition-sub', { opacity: 0 }, { opacity: 1, duration: 1, delay: 1.6 });

// ─── BG FLASH OVERLAY ───
const flashOverlay = document.createElement('div');
flashOverlay.style.cssText = `
  position: fixed; inset: 0; pointer-events: none; z-index: 50;
  background: radial-gradient(ellipse at 50% 42%, #06b6d4 0%, #0891b2 18%, #0c4a6e 45%, transparent 75%);
  opacity: 0;
`;
document.body.appendChild(flashOverlay);

// Ripple rings canvas
const rippleCanvas = document.createElement('canvas');
rippleCanvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:49;';
document.body.appendChild(rippleCanvas);
const rCtx = rippleCanvas.getContext('2d');
rippleCanvas.width = window.innerWidth;
rippleCanvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  rippleCanvas.width = window.innerWidth;
  rippleCanvas.height = window.innerHeight;
});

let ripples = [];
function animateRipples() {
  rCtx.clearRect(0, 0, rippleCanvas.width, rippleCanvas.height);
  ripples = ripples.filter(r => r.alpha > 0.005);
  for (const r of ripples) {
    rCtx.beginPath();
    rCtx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    rCtx.strokeStyle = `rgba(6,182,212,${r.alpha})`;
    rCtx.lineWidth = r.width;
    rCtx.stroke();
    r.radius += r.speed;
    r.alpha *= 0.94;
    r.width *= 0.97;
  }
  if (ripples.length > 0) requestAnimationFrame(animateRipples);
}

ledContainer.addEventListener('click', () => {
  if (isLit) return;
  isLit = true;
  ledContainer.classList.add('lit');

  // Swap gradient fill
  document.getElementById('ledBody').innerHTML = `
    <stop offset="0%" stop-color="#67e8f9"/>
    <stop offset="100%" stop-color="#06b6d4"/>`;

  // Glow animation
  gsap.to(ledGlow, { opacity: 1, duration: 0.3 });
  gsap.to(ledGlow, { opacity: 0.7, duration: 1.5, repeat: -1, yoyo: true, ease: 'sine.inOut' });

  // ── BACKGROUND FLASH ──
  const ledRect = ledContainer.getBoundingClientRect();
  const cx = ledRect.left + ledRect.width / 2;
  const cy = ledRect.top + ledRect.height / 2;

  // 1. Radial glow burst from LED center
  gsap.timeline()
    .to(flashOverlay, { opacity: 0.55, duration: 0.12, ease: 'power2.in' })
    .to(flashOverlay, { opacity: 0.28, duration: 0.25, ease: 'power1.out' })
    .to(flashOverlay, { opacity: 0.08, duration: 1.2, ease: 'power3.out' })
    .to(flashOverlay, { opacity: 0.04, duration: 2, ease: 'sine.inOut', repeat: -1, yoyo: true });

  // 2. Ripple rings emanating from the LED
  const spawnRipple = (delay, speed, alpha) => {
    setTimeout(() => {
      ripples.push({ x: cx, y: cy, radius: 30, alpha, speed, width: 2.5 });
      if (ripples.length === 1) animateRipples();
    }, delay);
  };
  spawnRipple(0,   3.5, 0.9);
  spawnRipple(120, 3.0, 0.7);
  spawnRipple(260, 2.8, 0.55);
  spawnRipple(420, 2.5, 0.4);
  spawnRipple(600, 2.2, 0.3);
  spawnRipple(850, 2.0, 0.2);

  // 3. Section bg tint — ignition section gets a brief cyan wash
  gsap.fromTo('#ignition',
    { backgroundColor: 'rgba(6,182,212,0.12)' },
    { backgroundColor: 'rgba(6,182,212,0)', duration: 2.5, ease: 'power2.out', delay: 0.1 }
  );

  // Unlock scroll after 1s
  setTimeout(() => {
    document.body.style.overflow = '';
    scrollUnlocked = true;
    scrollHint.classList.add('visible');
    nav.classList.add('visible');
  }, 900);
});

// ─── HELPER: gsap.fromTo wrapper ───
function reveal(targets, trigger, from, toOpts, startPos) {
  const els = typeof targets === 'string' ? gsap.utils.toArray(targets) : [targets];
  els.forEach(el => {
    const toVars = {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      duration: toOpts.duration || 0.9,
      delay: toOpts.delay || 0,
      ease: toOpts.ease || 'power3.out',
      overwrite: 'auto',
      scrollTrigger: {
        trigger: trigger || el,
        start: startPos || 'top 85%',
        once: true,
        toggleActions: 'play none none none'
      }
    };
    // Only include scale in `to` if it was in `from`
    if (from.scale === undefined) delete toVars.scale;
    if (from.y === undefined) delete toVars.y;
    if (from.x === undefined) delete toVars.x;
    gsap.fromTo(el, { opacity: 0, ...from }, toVars);
  });
}

// ── Spark section ──
reveal('.sec-label', '#spark', { y: 24 }, { duration: 0.7 }, 'top 80%');
reveal('.spark-heading', '#spark', { y: 40 }, { duration: 1 }, 'top 78%');
gsap.utils.toArray('.spark-body').forEach((el, i) => {
  reveal(el, '#spark', { y: 24 }, { duration: 0.8, delay: 0.15 + i * 0.15 }, 'top 75%');
});
reveal('.tech-tags', '#spark', { y: 24 }, { duration: 0.8, delay: 0.4 }, 'top 75%');
reveal('.arduino-visual', '#spark', { x: 60 }, { duration: 1.2, delay: 0.2 }, 'top 75%');

// ── Core section ──
reveal('.core-heading', '#core', { y: 40 }, { duration: 1 }, 'top 78%');
gsap.utils.toArray('.core-body').forEach((el, i) => {
  reveal(el, '#core', { y: 24 }, { duration: 0.8, delay: 0.1 + i * 0.15 }, 'top 75%');
});
reveal('.stack-grid', '#core', { y: 24 }, { duration: 0.9, delay: 0.25 }, 'top 72%');
reveal('.nodes-svg', '#core', { scale: 0.9 }, { duration: 1.2, delay: 0.2 }, 'top 75%');
reveal('.stat-row', '.stat-row', { y: 24 }, { duration: 0.8 }, 'top 88%');

// Stats counter
document.querySelectorAll('.stat-num').forEach(el => {
  const target = parseInt(el.dataset.target);
  const suffix = el.dataset.suffix || (target === 5 || target === 20 ? '+' : '');
  ScrollTrigger.create({
    trigger: el,
    start: 'top 88%',
    once: true,
    onEnter: () => {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(obj.val) + suffix; }
      });
    }
  });
});

// ── Vision section ──
reveal('.vision-heading', '#vision', { y: 40 }, { duration: 1 }, 'top 78%');
gsap.utils.toArray('.vision-body').forEach((el, i) => {
  reveal(el, '#vision', { y: 24 }, { duration: 0.8, delay: 0.1 + i * 0.12 }, 'top 75%');
});
reveal('.vision-pillars', '#vision', { y: 24 }, { duration: 1, delay: 0.3 }, 'top 72%');

// ── Impact section ──
reveal('.impact-heading', '#impact', { y: 40 }, { duration: 1 }, 'top 78%');
reveal('.impact-sub', '#impact', { y: 24 }, { duration: 0.8, delay: 0.2 }, 'top 75%');
gsap.utils.toArray('.product-card').forEach((el, i) => {
  reveal(el, '.products-grid', { y: 50 }, { duration: 0.9, delay: i * 0.18 }, 'top 82%');
});

// ── Human section ──
[
  ['.human-eyebrow', 0],
  ['.human-heading', 0.1],
  ['.human-body', 0.2],
  ['.human-traits', 0.3],
  ['.cta-block', 0.4]
].forEach(([cls, delay]) => {
  const el = document.querySelector(cls);
  if (el) reveal(el, '#human', { y: 30 }, { duration: 0.9, delay }, 'top 78%');
});

// ── Work section ──
reveal('.work-heading', '#work', { y: 40 }, { duration: 1 }, 'top 78%');
reveal('.work-sub', '#work', { y: 24 }, { duration: 0.8, delay: 0.15 }, 'top 75%');

gsap.utils.toArray('.tl-item').forEach((item, i) => {
  // Dot
  gsap.fromTo(item.querySelector('.tl-dot'),
    { scale: 0, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.5, delay: 0.1,
      scrollTrigger: { trigger: item, start: 'top 85%', once: true } }
  );
  // Line
  const line = item.querySelector('.tl-line');
  if (line) {
    gsap.fromTo(line,
      { scaleY: 0, transformOrigin: 'top' },
      { scaleY: 1, duration: 0.8, delay: 0.3, ease: 'power2.out',
        scrollTrigger: { trigger: item, start: 'top 82%', once: true } }
    );
  }
  // Content block
  gsap.fromTo(item.querySelector('.tl-content'),
    { opacity: 0, x: 20 },
    { opacity: 1, x: 0, duration: 0.9, delay: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: item, start: 'top 83%', once: true } }
  );
  // Achievement cards stagger
  gsap.utils.toArray(item.querySelectorAll('.achievement')).forEach((ach, j) => {
    gsap.fromTo(ach,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, delay: 0.3 + j * 0.1, ease: 'power2.out',
        scrollTrigger: { trigger: item, start: 'top 80%', once: true } }
    );
  });
});


ScrollTrigger.create({
  trigger: '#core',
  start: 'top 70%',
  once: true,
  onEnter: () => {
    document.querySelectorAll('.node-conn').forEach((path, i) => {
      const len = path.getTotalLength?.() || 200;
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      gsap.to(path, {
        strokeDashoffset: 0,
        duration: 0.8,
        delay: i * 0.08,
        ease: 'power2.inOut'
      });
    });
  }
});

// ─── HORIZONTAL SCROLLING LETTER EFFECT on heading ───
gsap.to('.sec-year', {
  scrollTrigger: {
    trigger: '#spark',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true
  },
  y: -60
});

// ─── FLOATING PARTICLES ───
const canvas = document.createElement('canvas');
canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:2;opacity:0.35;';
document.body.prepend(canvas);
const ctx = canvas.getContext('2d');
let W, H;
const particles = [];

function resizeCanvas() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

for (let i = 0; i < 60; i++) {
  particles.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 1.2 + 0.3,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    a: Math.random() * 0.6 + 0.2
  });
}

function drawParticles() {
  ctx.clearRect(0, 0, W, H);
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = W;
    if (p.x > W) p.x = 0;
    if (p.y < 0) p.y = H;
    if (p.y > H) p.y = 0;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(6,182,212,${p.a})`;
    ctx.fill();
  }
  requestAnimationFrame(drawParticles);
}
drawParticles();

// ─── SMOOTH ANCHOR SCROLL ───
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ─── HIDE SCROLL HINT ON SCROLL ───
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) scrollHint.classList.remove('visible');
}, { passive: true });

// ─── MOBILE MENU ───
const navToggle = document.getElementById('nav-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = mobileMenu.querySelectorAll('a');
 
function openMenu() {
  navToggle.classList.add('open');
  mobileMenu.classList.add('open');
  document.body.style.overflow = 'hidden';
  // Stagger links in
  mobileLinks.forEach((link, i) => {
    link.style.transition = `opacity 0.35s ease ${0.08 + i * 0.06}s, transform 0.35s ease ${0.08 + i * 0.06}s`;
  });
}
 
function closeMenu() {
  navToggle.classList.remove('open');
  mobileMenu.classList.remove('open');
  if (scrollUnlocked) document.body.style.overflow = '';
}
 
navToggle.addEventListener('click', () => {
  navToggle.classList.contains('open') ? closeMenu() : openMenu();
});
 
mobileLinks.forEach(link => {
  link.addEventListener('click', () => {
    closeMenu();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 320);
  });
});
 
// Close on backdrop click
mobileMenu.addEventListener('click', e => { if (e.target === mobileMenu) closeMenu(); });
 
// ─── BACK TO TOP ───
const backToTop = document.getElementById('back-to-top');
 
window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  progressBar.style.width = pct + '%';
 
  // Show back-to-top after 20% scroll
  if (window.scrollY > window.innerHeight * 0.4) {
    backToTop.classList.add('visible');
  } else {
    backToTop.classList.remove('visible');
  }
 
  if (window.scrollY > 50) scrollHint.classList.remove('visible');
}, { passive: true });
 
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});