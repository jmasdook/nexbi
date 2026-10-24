// NEXBI Solutions website interactions. No libraries.
(function () {
  'use strict';

  const CONTACT_EMAIL = 'info@nexbisolutions.ae';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  window.addEventListener('load', () => document.body.classList.add('is-loaded'));
  setTimeout(() => document.body.classList.add('is-loaded'), 600);
  $('#year').textContent = String(new Date().getFullYear());

  // Header and mobile menu
  const header = $('#header');
  const onScrollHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  const toggle = $('.nav-toggle');
  const nav = $('#site-nav');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach((a) => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }));

  // Reveal on scroll
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); revealer.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('[data-reveal]').forEach((el) => revealer.observe(el));

  // ---------------------------------------------------------------
  // Hero: Connected Pathways network with travelling signals
  // ---------------------------------------------------------------
  (function network() {
    const canvas = $('#network');
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, nodes = [], edges = [], packets = [], running = true, visible = true;
    const mouse = { x: -9999, y: -9999 };
    const BLUE = '31,67,150', PURPLE = '88,49,111';

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const step = w < 700 ? 90 : 120;
      const cols = Math.ceil(w / step) + 1, rows = Math.ceil(h / step) + 1;
      nodes = []; edges = [];
      let seed = 7;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          nodes.push({ x: c * step + (rnd() - 0.5) * step * 0.35, y: r * step + (rnd() - 0.5) * step * 0.35, links: [], flash: 0 });
        }
      }
      const id = (c, r) => r * cols + c;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (c < cols - 1 && rnd() < 0.62) addEdge(id(c, r), id(c + 1, r));
          if (r < rows - 1 && rnd() < 0.5) addEdge(id(c, r), id(c, r + 1));
        }
      }
      packets = [];
      const count = Math.round((w * h) / 52000);
      for (let i = 0; i < count; i++) spawn(rnd);
    }
    function addEdge(a, b) {
      const e = { a, b };
      edges.push(e); nodes[a].links.push(e); nodes[b].links.push(e);
    }
    function spawn(rnd) {
      const r = rnd || Math.random;
      const e = edges[Math.floor(r() * edges.length)];
      if (!e) return;
      packets.push({ e, from: e.a, t: r(), speed: 0.006 + r() * 0.01, purple: r() < 0.3 });
    }
    // Orthogonal route: horizontal first, then vertical, like the brand pathways.
    function point(e, from, t) {
      const A = nodes[from], B = nodes[from === e.a ? e.b : e.a];
      const corner = { x: B.x, y: A.y };
      const l1 = Math.abs(corner.x - A.x), l2 = Math.abs(B.y - corner.y), L = l1 + l2 || 1;
      const d = t * L;
      if (d <= l1) return { x: A.x + Math.sign(corner.x - A.x) * d, y: A.y };
      return { x: corner.x, y: corner.y + Math.sign(B.y - corner.y) * (d - l1) };
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (const e of edges) {
        const A = nodes[e.a], B = nodes[e.b];
        const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
        const near = clamp(1 - Math.hypot(mx - mouse.x, my - mouse.y) / 240, 0, 1);
        ctx.strokeStyle = `rgba(${BLUE},${0.09 + near * 0.35})`;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      }
      for (const n of nodes) {
        if (!n.links.length) continue;
        const near = clamp(1 - Math.hypot(n.x - mouse.x, n.y - mouse.y) / 200, 0, 1);
        const r = 2 + near * 3 + n.flash * 4;
        ctx.fillStyle = n.flash > 0.05 ? `rgba(${PURPLE},${0.5 + n.flash * 0.5})` : `rgba(${BLUE},${0.22 + near * 0.6})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill();
        n.flash *= 0.92;
      }
      for (const p of packets) {
        p.t += p.speed;
        if (p.t >= 1) {
          const to = p.from === p.e.a ? p.e.b : p.e.a;
          nodes[to].flash = 1;
          const options = nodes[to].links.filter((x) => x !== p.e);
          p.e = options.length ? options[Math.floor(Math.random() * options.length)] : p.e;
          p.from = to; p.t = 0;
        }
        const head = point(p.e, p.from, p.t), tail = point(p.e, p.from, Math.max(0, p.t - 0.18));
        const col = p.purple ? PURPLE : BLUE;
        const grad = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
        grad.addColorStop(0, `rgba(${col},0)`); grad.addColorStop(1, `rgba(${col},0.95)`);
        ctx.strokeStyle = grad; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(head.x, head.y); ctx.stroke();
        ctx.fillStyle = `rgba(${col},1)`;
        ctx.beginPath(); ctx.arc(head.x, head.y, 2.6, 0, Math.PI * 2); ctx.fill();
      }
    }
    function loop() {
      if (running && visible) draw();
      requestAnimationFrame(loop);
    }
    build();
    if (reduceMotion) { draw(); return; }
    loop();
    window.addEventListener('resize', () => { clearTimeout(build.t); build.t = setTimeout(build, 150); });
    canvas.parentElement.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(canvas);
    document.addEventListener('visibilitychange', () => { running = !document.hidden; });
  })();

  // ---------------------------------------------------------------
  // Pillars: pinned scroll story
  // ---------------------------------------------------------------
  (function pillars() {
    const section = $('#pillars');
    const cards = $$('.pillar-card', section);
    const steps = $$('.pillar-step', section);
    const bar = $('.pillar-steps', section);
    let current = -1;
    const pinned = () => window.innerWidth > 1000;
    function set(i) {
      if (i === current) return;
      current = i;
      cards.forEach((c, k) => { c.classList.toggle('is-active', k === i); c.classList.toggle('is-past', k < i); });
      steps.forEach((s, k) => { s.classList.toggle('is-active', k === i); s.setAttribute('aria-selected', String(k === i)); });
    }
    function onScroll() {
      if (!pinned()) return;
      const r = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const p = clamp(-r.top / total, 0, 1);
      bar.style.setProperty('--p', p.toFixed(3));
      set(Math.min(cards.length - 1, Math.floor(p * cards.length * 0.999)));
    }
    steps.forEach((s, k) => s.addEventListener('click', () => {
      if (!pinned()) return;
      const total = section.offsetHeight - window.innerHeight;
      window.scrollTo({ top: section.offsetTop + total * ((k + 0.5) / cards.length), behavior: reduceMotion ? 'auto' : 'smooth' });
    }));
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    set(0); onScroll();
  })();

  // ---------------------------------------------------------------
  // Odoo orbit
  // ---------------------------------------------------------------
  (function orbit() {
    const ICON = {
      hr: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
      inv: '<path d="M21 16V8l-9-5-9 5v8l9 5 9-5z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/>',
      sales: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
      fin: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
      pur: '<path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6L5 3H2"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/>',
      mnt: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
      fleet: '<path d="M3 16V9l3-4h9l3 4h3v7"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/>',
      proj: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 13h3M8 16h6"/>',
    };
    const APPS = [
      { k: 'hr', name: 'HR & Payroll', line: 'Hire, manage and pay your people in one place.', items: ['Visa, ID and contract expiry alerts', 'Biometric attendance', 'Leave requests and self-service', 'Payroll with UAE WPS files', 'Appraisals and gratuity'] },
      { k: 'inv', name: 'Inventory', line: 'Know what you have, where it is and what to reorder.', items: ['Multiple warehouses and bins', 'Barcode scanning', 'Automatic reorder rules', 'Lot, serial and expiry tracking', 'Live stock valuation'] },
      { k: 'sales', name: 'Sales & Operations', line: 'From first enquiry to delivered order, in one flow.', items: ['Leads, pipeline and quotations', 'Sales orders to delivery', 'Order and delivery tracking', 'Sales performance dashboards'] },
      { k: 'fin', name: 'Finance & Accounting', line: 'Clear numbers, updated as the business runs.', items: ['Invoicing and payments', 'UAE VAT reports', 'Bank reconciliation', 'Budgets and cost centres', 'Financial dashboards'] },
      { k: 'pur', name: 'Purchase', line: 'Buy the right items at the right price.', items: ['Requests for quotation', 'Vendor comparison', 'Purchase approvals', 'Bills matched to orders'] },
      { k: 'mnt', name: 'Maintenance', line: 'Keep equipment running with planned servicing.', items: ['Equipment register and warranties', 'Preventive schedules', 'Breakdown requests', 'Cost and downtime reports'] },
      { k: 'fleet', name: 'Fleet', line: 'Every vehicle and its running cost in one place.', items: ['Vehicles and drivers', 'Service schedules', 'Fuel and expense logs', 'Insurance and renewal alerts'] },
      { k: 'proj', name: 'Projects', line: 'Tasks, timesheets and real project cost.', items: ['Tasks and deadlines', 'Timesheets', 'Project profitability', 'Customer portal'] },
    ];
    const el = $('#orbit');
    const link = $('#orbit-link');
    const panel = $('#app-panel');
    let angle = -Math.PI / 2, active = 0, paused = false, inView = false;
    const nodes = APPS.map((a, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'orbit-node';
      b.innerHTML = '<i><svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[a.k] + '</svg></i><span></span>';
      b.querySelector('span').textContent = a.name;
      b.addEventListener('click', () => select(i, true));
      b.addEventListener('mouseenter', () => { paused = true; });
      b.addEventListener('mouseleave', () => { paused = false; });
      el.appendChild(b);
      return b;
    });
    function select(i, user) {
      active = i;
      nodes.forEach((n, k) => n.classList.toggle('is-active', k === i));
      const a = APPS[i];
      panel.innerHTML = '';
      const wrap = document.createElement('div'); wrap.className = 'swap';
      wrap.innerHTML = '<span class="kicker">Odoo app</span><h3></h3><p></p><ul></ul>';
      wrap.querySelector('h3').textContent = a.name;
      wrap.querySelector('p').textContent = a.line;
      const ul = wrap.querySelector('ul');
      a.items.forEach((t) => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
      panel.appendChild(wrap);
      if (user) { paused = true; clearTimeout(select.t); select.t = setTimeout(() => { paused = false; }, 6000); }
    }
    function layout() {
      const size = el.clientWidth, R = size * 0.4, c = size / 2;
      nodes.forEach((n, i) => {
        const a = angle + (i / nodes.length) * Math.PI * 2;
        n.style.left = (c + Math.cos(a) * R) + 'px';
        n.style.top = (c + Math.sin(a) * R) + 'px';
        if (i === active) {
          link.setAttribute('x2', 300 + Math.cos(a) * 240);
          link.setAttribute('y2', 300 + Math.sin(a) * 240);
        }
      });
    }
    let last = 0, autoNext = 0;
    function tick(ts) {
      const dt = Math.min(50, ts - (last || ts)); last = ts;
      if (inView && !paused && !reduceMotion) {
        angle += dt * 0.00012;
        autoNext += dt;
        if (autoNext > 4200) { autoNext = 0; select((active + 1) % APPS.length, false); }
      }
      layout();
      requestAnimationFrame(tick);
    }
    new IntersectionObserver(([en]) => { inView = en.isIntersecting; }, { threshold: 0.3 }).observe(el);
    select(0, false); layout(); requestAnimationFrame(tick);
  })();

  // ---------------------------------------------------------------
  // AI dashboard demo (illustrative data)
  // ---------------------------------------------------------------
  (function ai() {
    const DATA = [
      { q: 'Which products sold most this month?', k: [['Revenue', 'AED 412K'], ['Orders', '1,284'], ['Top item', 'Product D']], labels: ['A', 'B', 'C', 'D', 'E', 'F'], v: [46, 62, 38, 94, 55, 70], insight: 'Product D is your best seller and will run out in 9 days. Reorder suggested.' },
      { q: 'Which customers owe us the most?', k: [['Receivable', 'AED 186K'], ['Overdue', '23 invoices'], ['Largest', 'Client 3']], labels: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'], v: [40, 58, 92, 35, 66, 28], insight: 'Three customers hold 60% of overdue balances. Payment reminders are ready to send.' },
      { q: 'Where is stock running low?', k: [['Items low', '14'], ['Warehouses', '3'], ['Most urgent', 'Item 5']], labels: ['I1', 'I2', 'I3', 'I4', 'I5', 'I6'], v: [62, 30, 48, 26, 12, 40], insight: 'Item 5 drops below minimum stock this week. A purchase order draft is prepared.' },
    ];
    const text = $('#ai-text'), chart = $('#ai-chart'), insight = $('#ai-insight'), itext = $('#ai-insight-text');
    const chips = $$('.ai-chip');
    const kpi = [['#k1l', '#k1'], ['#k2l', '#k2'], ['#k3l', '#k3']].map(([l, v]) => [$(l), $(v)]);
    chart.innerHTML = '';
    const cols = Array.from({ length: 6 }, () => {
      const c = document.createElement('div'); c.className = 'ai-col';
      c.innerHTML = '<i></i><span></span>'; chart.appendChild(c); return c;
    });
    let token = 0, started = false;
    async function run(i) {
      const my = ++token, d = DATA[i];
      chips.forEach((c, k) => c.classList.toggle('is-active', k === i));
      insight.classList.remove('is-on');
      cols.forEach((c) => { c.querySelector('i').style.height = '4%'; });
      kpi.forEach(([l, v]) => { v.textContent = '—'; });
      text.textContent = '';
      for (let n = 1; n <= d.q.length; n++) {
        if (my !== token) return;
        text.textContent = d.q.slice(0, n);
        await wait(reduceMotion ? 0 : 28);
      }
      await wait(350);
      if (my !== token) return;
      const max = Math.max(...d.v);
      cols.forEach((c, k) => {
        c.classList.toggle('top', d.v[k] === max);
        c.querySelector('span').textContent = d.labels[k];
        setTimeout(() => { if (my === token) c.querySelector('i').style.height = d.v[k] + '%'; }, k * 90);
      });
      kpi.forEach(([l, v], k) => { l.textContent = d.k[k][0]; v.textContent = d.k[k][1]; });
      await wait(900);
      if (my !== token) return;
      itext.textContent = d.insight;
      insight.classList.add('is-on');
    }
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    chips.forEach((c, k) => c.addEventListener('click', () => run(k)));
    new IntersectionObserver(([en]) => { if (en.isIntersecting && !started) { started = true; run(0); } }, { threshold: 0.35 }).observe($('.ai-window'));
  })();

  // ---------------------------------------------------------------
  // Process line follows scroll
  // ---------------------------------------------------------------
  (function processLine() {
    const track = $('#process-track');
    const stages = $$('.stage', track);
    function onScroll() {
      const r = track.getBoundingClientRect();
      const p = clamp((window.innerHeight * 0.75 - r.top) / (r.height + window.innerHeight * 0.25), 0, 1);
      track.style.setProperty('--p', p.toFixed(3));
      stages.forEach((s, i) => s.classList.toggle('is-on', p >= (i + 0.2) / stages.length));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  // ---------------------------------------------------------------
  // Pointer effects: spotlight cards, tilt cards, magnetic buttons
  // ---------------------------------------------------------------
  if (finePointer && !reduceMotion) {
    $$('.spot').forEach((card) => card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--x', (e.clientX - r.left) + 'px');
      card.style.setProperty('--y', (e.clientY - r.top) + 'px');
    }));
    $$('.tilt').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `rotateX(${(-y * 10).toFixed(2)}deg) rotateY(${(x * 12).toFixed(2)}deg) translateZ(0)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1)}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  // ---------------------------------------------------------------
  // Contact form: opens the visitor's email app (no server needed)
  // ---------------------------------------------------------------
  (function contact() {
    const form = $('#contact-form'), status = $('#form-status');
    const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    const setStatus = (t, kind) => { status.textContent = t; status.className = 'form-status' + (kind ? ' is-' + kind : ''); };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const v = (k) => String(d.get(k) || '').trim();
      if (!v('name')) { setStatus('Please enter your name.', 'error'); form.name.focus(); return; }
      if (!EMAIL_RE.test(v('email'))) { setStatus('Please enter a valid email address.', 'error'); form.email.focus(); return; }
      if (!v('message')) { setStatus('Please add a short message.', 'error'); form.message.focus(); return; }
      const subject = `Website enquiry: ${v('interest')} - ${v('company') || v('name')}`;
      const body = [v('message'), '', `Name: ${v('name')}`, `Company: ${v('company') || '-'}`, `Email: ${v('email')}`, `Phone: ${v('phone') || '-'}`, `Interested in: ${v('interest')}`].join('\n');
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus(`Your email app should open with the message ready. If it doesn't, write to ${CONTACT_EMAIL}.`, 'ok');
    });
  })();
})();
