/* ============ SMOOTH SCROLL (Lenis) ============ */
if (window.Lenis && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  window.lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.4
  });
  (function raf(time) {
    window.lenis.raf(time);
    requestAnimationFrame(raf);
  })(0);
}
 
/* ============ 3D BACKGROUND ============ */
(function () {
  const canvas = document.getElementById('bg');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.THREE || !canvas.getContext('webgl')) return; // graceful fallback to CSS gradient
 
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
 
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xb9c1d6, 0.035);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.z = 14;
 
  // Starfield with two tones
  const COUNT = 2200;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  const cA = new THREE.Color(0x3d62e0), cB = new THREE.Color(0x9a3fd6), cC = new THREE.Color(0x2a2f4a);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 60;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    const r = Math.random();
    const c = r < 0.45 ? cA : r < 0.8 ? cB : cC;
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.09, vertexColors: true, transparent: true, opacity: 0.85,
    blending: THREE.NormalBlending, depthWrite: false
  }));
  scene.add(stars);
 
  // Central group: wireframe knot + icosahedron + ring
  const group = new THREE.Group();
  scene.add(group);
 
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(2.6, 0.55, 220, 28),
    new THREE.MeshBasicMaterial({ color: 0x7c9cff, wireframe: true, transparent: true, opacity: 0.28 })
  );
  group.add(knot);
 
  const ico = new THREE.Mesh(
    new THREE.IcosahedronGeometry(5.2, 1),
    new THREE.MeshBasicMaterial({ color: 0xc77dff, wireframe: true, transparent: true, opacity: 0.1 })
  );
  group.add(ico);
 
  const ringGeo = new THREE.TorusGeometry(7.5, 0.02, 8, 200);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 }));
  ring.rotation.x = Math.PI / 2.4;
  scene.add(ring);
 
  // Inner glowing core
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x9bb4ff, transparent: true, opacity: 0.18 })
  );
  group.add(core);
 
  // Layout the scene's centre to the right on desktop, centred on mobile
  function place() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const narrow = w < 860;
    group.position.x = narrow ? 0 : 4.5;
    group.position.y = narrow ? 2 : 0;
    group.scale.setScalar(narrow ? 0.7 : 1);
  }
  place();
  window.addEventListener('resize', place);
 
  // Input
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });
 
  let scrollT = 0, scrollTarget = 0;
  function updateScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollTarget = max > 0 ? window.scrollY / max : 0;
  }
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();
 
  const clock = new THREE.Clock();
  function frame() {
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    scrollT += (scrollTarget - scrollT) * 0.08;
 
    if (!reduce) {
      knot.rotation.x = t * 0.15 + mouse.y * 0.4;
      knot.rotation.y = t * 0.22 + mouse.x * 0.5;
      ico.rotation.x = -t * 0.06;
      ico.rotation.y = t * 0.09;
      ring.rotation.z = t * 0.05;
      core.scale.setScalar(1 + Math.sin(t * 1.6) * 0.08);
      stars.rotation.y = t * 0.015;
    }
 
    // Cinematic camera: dolly and orbit with scroll + pointer parallax
    camera.position.x = mouse.x * 0.8;
    camera.position.y = -mouse.y * 0.5 + 0.6 * Math.sin(scrollT * Math.PI);
    camera.position.z = 14 - scrollT * 6;
    camera.lookAt(0, 0, 0);
    group.rotation.z = scrollT * 0.6;
 
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
})();
 
/* ============ NAVBAR, PROGRESS, CURSOR ============ */
(function () {
  const navWrap = document.getElementById('navWrap');
  const progress = document.getElementById('progress');
  const indicator = document.getElementById('indicator');
  const links = [...document.querySelectorAll('[data-link]')];
  const burger = document.getElementById('burger');
  const mobile = document.getElementById('mobileMenu');
 
  // Scroll state
  function onScroll() {
    const y = window.scrollY;
    navWrap.classList.toggle('scrolled', y > 40);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
 
  // Sliding pill indicator
  function moveIndicator(el) {
    if (!el) { indicator.style.opacity = 0; return; }
    indicator.style.opacity = 1;
    indicator.style.width = el.offsetWidth + 'px';
    indicator.style.transform = `translateX(${el.offsetLeft}px)`;
  }
  links.forEach((a) => {
    a.addEventListener('mouseenter', () => moveIndicator(a));
    a.addEventListener('focus', () => moveIndicator(a));
    // Magnetic hover
    a.addEventListener('mousemove', (e) => {
      const r = a.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * 0.15;
      const dy = (e.clientY - (r.top + r.height / 2)) * 0.25;
      a.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    a.addEventListener('mouseleave', () => { a.style.transform = ''; });
  });
  document.getElementById('links').addEventListener('mouseleave', () => {
    moveIndicator(links.find((l) => l.classList.contains('active')));
  });
 
  // Active section highlight
  const sections = ['about', 'work', 'skills', 'contact'].map((id) => document.getElementById(id));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
        moveIndicator(links.find((l) => l.getAttribute('href') === '#' + en.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));
 
  // Mobile menu
  function setMenu(open) {
    burger.classList.toggle('open', open);
    mobile.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', () => setMenu(!mobile.classList.contains('open')));
  mobile.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
 
  // Smooth scroll for in-page anchors with offset
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      window.lenis ? window.lenis.scrollTo(target, { duration: 1.6 }) : target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  document.getElementById('toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
 
  // Custom cursor
  const dot = document.getElementById('cursor');
  const ring = document.getElementById('cursorRing');
  let rx = 0, ry = 0, x = 0, y = 0;
  window.addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  });
  (function loop() {
    rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('a, button, .project, .glass-card').forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });
})();
 
/* ============ REVEALS, COUNTERS, TILT, SPLIT TEXT ============ */
(function () {
  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        // Count-up stats
        en.target.querySelectorAll('[data-count]').forEach((n) => {
          const end = +n.dataset.count, start = performance.now(), dur = 1600;
          (function tick(now) {
            const p = Math.min((now - start) / dur, 1);
            n.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + (end > 9 ? '+' : '');
            if (p < 1) requestAnimationFrame(tick);
          })(start);
        });
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
 
  // 3D tilt on cards (pointer aware, with a light glow that follows the cursor)
  const tiltEls = document.querySelectorAll('[data-tilt]');
  tiltEls.forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 8}deg) rotateY(${(px - 0.5) * 10}deg) translateZ(0)`;
      el.style.setProperty('--mx', px * 100 + '%');
      el.style.setProperty('--my', py * 100 + '%');
    });
    el.addEventListener('pointerdown', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
    el.addEventListener('pointerdown', (e) => { el.dataset.ptr = e.pointerType; });
    el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') el.classList.add('swept'); });
    el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') el.classList.remove('swept'); });
    el.addEventListener('click', () => { if (el.dataset.ptr !== 'mouse') el.classList.toggle('swept'); });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform .7s cubic-bezier(.2,.7,.1,1)';
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; }, 700);
    });
  });
 
  // Split hero name into letters for a staggered reveal
  document.querySelectorAll('.hero-title .word:not(.gradient-text)').forEach((w) => {
    const txt = w.textContent;
    w.setAttribute('aria-hidden', 'true');
    w.innerHTML = [...txt].map((c, i) =>
      `<span class="char" style="animation: rise 1s var(--ease) ${i * 0.04}s forwards;transform:translateY(110%) rotate(6deg)">${c}</span>`
    ).join('');
  });
})();
document.getElementById('contactForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const f = new FormData(this);
  const subject = encodeURIComponent('Website project request from ' + f.get('name'));
  const body = encodeURIComponent('Name: ' + f.get('name') + '\nEmail: ' + f.get('email') + '\nProject type: ' + f.get('type') + '\n\n' + f.get('message'));
  window.location.href = 'mailto:Aryanmangal083@gmail.com?subject=' + subject + '&body=' + body;
});
 
/* ============ BUTTERY SMOOTH SCROLL (mouse wheel, desktop only) ============ */
(function () {
  const fine = window.matchMedia('(pointer: fine)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduce) return;
 
  const EASE = 0.075;
  let target = window.scrollY, current = window.scrollY, running = false;
  const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
 
  function step() {
    current += (target - current) * EASE;
    if (Math.abs(target - current) < 0.5) current = target;
    window.scrollTo({ top: current, behavior: 'instant' });
    if (current === target) { running = false; return; }
    requestAnimationFrame(step);
  }
 
  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return; // leave pinch-zoom alone
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
    target = Math.min(Math.max(target + e.deltaY * unit, 0), maxScroll());
    if (!running) {
      running = true;
      current = window.scrollY;
      requestAnimationFrame(step);
    }
  }, { passive: false });
 
  // Keep in sync when scrolling by keyboard, scrollbar, or anchor links
  window.addEventListener('scroll', () => {
    if (!running) target = current = window.scrollY;
  }, { passive: true });
})();