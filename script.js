/* =============================================================
   VIERSA · interactions
   GSAP + ScrollTrigger + Lenis + custom micro-interactions
   ============================================================= */

(() => {
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine    = matchMedia('(pointer: fine)').matches;

  /* ---------- Loader ---------- */
  window.addEventListener('load', () => {
    setTimeout(() => $('#loader')?.classList.add('is-done'), 600);
  });

  /* ---------- Theme toggle (dark <-> light) ---------- */
  (() => {
    const html = document.documentElement;
    const btn = $('#themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isLight = html.getAttribute('data-theme') === 'light';
      if (isLight) {
        html.removeAttribute('data-theme');
        try { localStorage.setItem('viersa-theme', 'dark'); } catch(_) {}
      } else {
        html.setAttribute('data-theme', 'light');
        try { localStorage.setItem('viersa-theme', 'light'); } catch(_) {}
      }
      // Refresh ScrollTrigger so any layout shifts get repositioned
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  })();

  /* ---------- Rotating word in hero ---------- */
  (() => {
    const container = $('#rotatingWord');
    if (!container) return;
    const words = ['precisión', 'confianza', 'experiencia', 'calidad', 'oficio', 'garantía'];

    // Measure max width to avoid layout shift
    function measureMax(){
      const ghost = document.createElement('span');
      ghost.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:inherit;';
      container.appendChild(ghost);
      let max = 0;
      words.forEach(w => { ghost.textContent = w; max = Math.max(max, ghost.offsetWidth); });
      container.removeChild(ghost);
      container.style.setProperty('--rot-w', max + 'px');
    }
    measureMax();
    window.addEventListener('resize', () => {
      // re-measure when font size changes (clamp on viewport)
      requestAnimationFrame(measureMax);
    }, { passive: true });

    function setWord(text, cls){
      const span = document.createElement('span');
      span.className = 'rot__item ' + cls;
      span.textContent = text;
      container.appendChild(span);
      return span;
    }

    let i = 0;
    setWord(words[0], 'is-active');

    setInterval(() => {
      const current = container.querySelector('.is-active');
      if (current){
        current.className = 'rot__item is-exit';
        current.addEventListener('animationend', () => current.remove(), { once: true });
      }
      i = (i + 1) % words.length;
      setWord(words[i], 'is-active');
    }, 2400);
  })();

  /* ---------- Year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Live time + open status ---------- */
  function updateClock() {
    const now = new Date();
    const t = now.toLocaleTimeString('es-CR', {
      hour: '2-digit', minute: '2-digit', hour12: false,
      timeZone: 'America/Costa_Rica'
    });
    const liveTime = $('#liveTime');
    if (liveTime) liveTime.textContent = t;

    // Open: Mon-Fri 7:00-17:00
    const day = now.getDay();
    const minutes = now.getHours() * 60 + now.getMinutes();
    let open = false;
    if (day >= 1 && day <= 5) open = minutes >= 7*60 && minutes <= 17*60;

    const pill = $('.status-pill');
    const statusText = $('#statusText');
    if (pill && statusText) {
      pill.classList.toggle('is-closed', !open);
      statusText.textContent = open ? 'Abierto ahora' : 'Cerrado';
    }
  }
  updateClock();
  setInterval(updateClock, 30_000);

  /* ---------- Lenis smooth scroll ---------- */
  let lenis;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    // Sync ScrollTrigger
    if (window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* Smooth anchor clicks (work with or without lenis) */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -60, duration: 1.2 });
      else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ---------- Scroll progress bar + nav state ---------- */
  const progress = $('#scrollProgress');
  const nav = $('#nav');
  function updateScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progress) progress.style.width = pct + '%';
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  updateScroll();
  window.addEventListener('scroll', updateScroll, { passive: true });

  /* ---------- Cursor halo (desktop only) ---------- */
  if (fine && !reduced) {
    const halo = $('.cursor-halo');
    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let tx = x, ty = y;
    document.body.classList.add('cursor-ready');
    window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
    function loop() {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      if (halo) halo.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* ---------- Magnetic buttons ---------- */
  if (fine && !reduced) {
    $$('.btn--magnetic').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const mx = e.clientX - r.left - r.width / 2;
        const my = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${mx * 0.18}px, ${my * 0.18}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Service card spotlight ---------- */
  $$('.service').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
      card.style.setProperty('--my', ((e.clientY - r.top)  / r.height) * 100 + '%');
    });
  });

  /* ---------- Hero entrance with GSAP ---------- */
  if (window.gsap && !reduced) {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.kicker', { y: 14, opacity: 0, duration: .6, delay: .8 })
      .to('.hero__title .word', {
        y: 0, duration: 1.1, stagger: .08, ease: 'expo.out'
      }, '-=.3')
      .to('.hero__title .word__dot', { y: 0, duration: .8, ease: 'expo.out' }, '-=.6')
      .from('.hero__lede', { y: 18, opacity: 0, duration: .6 }, '-=.6')
      .from('.hero__ctas .btn', { y: 16, opacity: 0, duration: .5, stagger: .08 }, '-=.4')
      .from('.hero__meta .meta', { y: 20, opacity: 0, duration: .55, stagger: .1 }, '-=.3')
      .from('.hero__panel .panel', { y: 30, opacity: 0, duration: .9, ease: 'expo.out' }, '-=1.1')
      .to('.rpm__arc', {
        strokeDashoffset: 540 - (540 * 0.98),
        duration: 1.6, ease: 'power2.out'
      }, '-=.6');
  }

  /* ---------- Counters ---------- */
  function easeOut(t){ return 1 - Math.pow(1 - t, 3); }
  function runCounter(el) {
    const target = parseInt(el.dataset.count || '0', 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();
    function step(now) {
      const p = Math.min(1, (now - start) / duration);
      const v = Math.round(target * easeOut(p));
      el.textContent = v.toLocaleString('es-CR') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Reveal + counters via IntersectionObserver ---------- */
  const sections = $$('.section, .brands-bar, .services__cta, .panel, .step, .service, .part, .faq__item, .map__card, .map__frame');
  sections.forEach(el => el.setAttribute('data-reveal',''));

  // Stagger delay for grouped items
  const staggerGroups = [
    { sel: '.services .service', step: 70 },
    { sel: '.steps .step',       step: 90 },
    { sel: '.parts .part',       step: 90 },
    { sel: '.faq .faq__item',    step: 60 },
  ];
  staggerGroups.forEach(({ sel, step }) => {
    $$(sel).forEach((el, i) => {
      el.style.transitionDelay = (i * step) + 'ms';
    });
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  sections.forEach(el => io.observe(el));

  // Safety net: if anything is still hidden after 3s, force-reveal it
  setTimeout(() => {
    sections.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
    });
  }, 3000);

  // Counter trigger
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      runCounter(entry.target);
      counterIO.unobserve(entry.target);
    });
  }, { threshold: 0.5 });
  $$('.meta__num').forEach(el => counterIO.observe(el));

  /* ---------- Scroll spy ---------- */
  const links = $$('.nav__menu a[href^="#"]');
  const targets = links
    .map(l => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = '#' + entry.target.id;
      links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  targets.forEach(t => spy.observe(t));

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = $('#navToggle');
  const navMenu = $('.nav__menu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const open = navMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        navMenu.style.cssText = `
          display:flex; position:fixed; inset:64px 16px auto 16px;
          flex-direction:column; padding:16px; gap:6px; border-radius:18px;
          background:rgba(8,8,11,.96); backdrop-filter:blur(18px);
          border:1px solid var(--line); z-index:60;
        `;
      } else {
        navMenu.style.cssText = '';
      }
    });
    // Close on link click
    navMenu.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && navMenu.classList.contains('is-open')) {
        navToggle.click();
      }
    });
  }

  /* ---------- ScrollTrigger parallax + section reveals ---------- */
  if (window.gsap && window.ScrollTrigger && !reduced) {
    gsap.registerPlugin(ScrollTrigger);

    // Orbs subtle parallax
    gsap.to('.orb--1', {
      yPercent: 20, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.orb--2', {
      yPercent: -25, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero__grid', {
      yPercent: 15, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    // Section title sliding from left
    $$('.section__title').forEach(t => {
      gsap.from(t, {
        x: -40, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: t, start: 'top 80%' }
      });
    });

    // Section id reveal
    $$('.section__id').forEach(id => {
      gsap.from(id, {
        opacity: 0, y: 16, duration: .6,
        scrollTrigger: { trigger: id, start: 'top 85%' }
      });
    });

    // CTA final big text (no IntersectionObserver dupe)
    gsap.from('.cta-final h2', {
      scale: 0.94, opacity: 0, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.cta-final', start: 'top 70%' }
    });
  }

  /* ---------- FAQ accordion smooth height ---------- */
  $$('.faq__item').forEach(item => {
    const summary = item.querySelector('summary');
    const body = item.querySelector('.faq__body');
    if (!summary || !body) return;

    // Initial state
    if (!item.open) body.style.height = '0px';
    else body.style.height = 'auto';

    summary.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = item.open;
      if (isOpen) {
        // Close
        body.style.height = body.scrollHeight + 'px';
        requestAnimationFrame(() => {
          body.style.transition = 'height .35s cubic-bezier(.65,0,.35,1)';
          body.style.height = '0px';
        });
        body.addEventListener('transitionend', function te(){
          item.open = false;
          body.style.transition = '';
          body.removeEventListener('transitionend', te);
        });
      } else {
        item.open = true;
        const h = body.scrollHeight;
        body.style.height = '0px';
        requestAnimationFrame(() => {
          body.style.transition = 'height .4s cubic-bezier(.2,.8,.2,1)';
          body.style.height = h + 'px';
        });
        body.addEventListener('transitionend', function te(){
          body.style.height = 'auto';
          body.style.transition = '';
          body.removeEventListener('transitionend', te);
        });
      }
    });
  });
})();
