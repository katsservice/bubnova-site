(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let still = false;

  /* меню */
  const header = $('#header');
  const burger = $('#burger');
  const setMenu = open => {
    header.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('#nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* прокрутка: шапка, полоса прогресса, этапы, фоновые слова, кнопка связи */
  const progress = $('#progress');
  const steps = $('#steps');
  const items = $$('li', steps);
  const stepNum = $('#stepNum');
  const navLinks = $$('#nav a');
  const targets = navLinks.map(a => $(a.getAttribute('href')));
  const fab = $('#fab');
  const contacts = $('#contacts');
  let ticking = false;

  const onScroll = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    header.classList.toggle('is-solid', y > 20);
    progress.style.transform = `scaleX(${y / Math.max(1, document.documentElement.scrollHeight - vh)})`;

    const line = vh * 0.6;
    const first = items[0].getBoundingClientRect().top + 50;
    const last = items[items.length - 1].getBoundingClientRect().top + 50;
    const fill = Math.min(1, Math.max(0, (line - first) / (last - first)));
    steps.style.setProperty('--fill', fill);
    let now = 0;
    items.forEach((li, i) => {
      const on = li.getBoundingClientRect().top + 40 <= line;
      li.classList.toggle('is-on', on);
      if (on) now = i;
    });
    items.forEach((li, i) => li.classList.toggle('is-now', i === now));
    stepNum.textContent = now + 1;

    let current = -1;
    targets.forEach((t, i) => { if (t.getBoundingClientRect().top <= vh * 0.4) current = i; });
    navLinks.forEach((a, i) => a.classList.toggle('is-current', i === current));

    /* плавающая кнопка не должна закрывать форму */
    const c = contacts.getBoundingClientRect();
    const away = c.top < vh * 0.55 && c.bottom > vh * 0.55;
    fab.classList.toggle('is-away', away);
    if (away) setFab(false);

    if (!reduced.matches && !still) {
      $$('.ghost').forEach(g => {
        const r = g.parentElement.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh) g.style.setProperty('--shift', `${(r.top / vh) * 120}px`);
      });
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);

  /* появление блоков */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* плитки клиентов */
  const tiles = $$('.tile');
  const activate = tile => tiles.forEach(t => {
    t.classList.toggle('is-active', t === tile);
    $('.tile__head', t).setAttribute('aria-expanded', t === tile);
  });
  tiles.forEach(t => {
    t.addEventListener('click', () => activate(t));
    t.addEventListener('pointerenter', () => { if (finePointer.matches && innerWidth > 900) activate(t); });
  });

  /* выбор из плиток и карточек подставляется в форму */
  const form = $('#form');
  $$('[data-client]').forEach(a => a.addEventListener('click', () => {
    const radio = $$('input[name=client]', form).find(r => r.value === a.dataset.client);
    if (radio) radio.checked = true;
    showForm();
  }));
  $$('[data-service]').forEach(a => a.addEventListener('click', () => {
    form.elements.service.value = a.dataset.service;
    showForm();
  }));

  /* свет за курсором на карточках и наклон портрета */
  $$('.card').forEach(card => card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));
  const hero = $('.hero');
  const portrait = $('#portrait');
  const mouse = { x: 0.5, y: 0.5 };
  hero.addEventListener('pointermove', e => {
    if (!finePointer.matches || reduced.matches || still) return;
    const r = hero.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) / r.width;
    mouse.y = (e.clientY - r.top) / r.height;
    portrait.style.transform = `translate(${(mouse.x - 0.5) * -14}px, ${(mouse.y - 0.5) * -10}px)`;
  });

  /* фирменные красные волны */
  const canvas = $('#waves');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, t = 0, raf = 0, visible = true, mx = 0.5, my = 0.5, prev = 0;

  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  };
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    mx += (mouse.x - mx) * 0.04;
    my += (mouse.y - my) * 0.04;
    const narrow = W < 900;
    const lines = narrow ? 6 : 9;
    for (let i = 0; i < lines; i++) {
      ctx.beginPath();
      for (let x = -10; x <= W + 10; x += 8) {
        const p = x / W;
        const base = H * (narrow ? 0.58 : 0.66) - H * 0.34 * Math.sin(p * 3.6 - 1.25 + t * 0.35 + (mx - 0.5) * 0.6);
        const spread = (i - lines / 2) * (6 + 20 * Math.sin(p * 2.7 + t * 0.5) ** 2);
        const ripple = Math.sin(p * 7 + t + i * 0.22) * 10;
        const pull = Math.exp(-Math.pow((p - mx) * 4, 2)) * (my - 0.5) * 70;
        const y = base + spread + ripple + pull;
        x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(224,38,43,${0.16 + 0.5 * (1 - Math.abs(i - lines / 2) / lines * 1.6)})`;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
  };
  const loop = now => {
    t += Math.min(50, now - (prev || now)) / 1000;
    prev = now;
    draw();
    raf = requestAnimationFrame(loop);
  };
  const run = () => {
    cancelAnimationFrame(raf);
    prev = 0;
    if (visible && !still && !reduced.matches) raf = requestAnimationFrame(loop);
    else draw();
  };
  new ResizeObserver(size).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }).observe(canvas);
  reduced.addEventListener('change', run);

  /* пауза всех движущихся элементов */
  const pause = $('#pause');
  pause.addEventListener('click', () => {
    still = !still;
    document.body.classList.toggle('is-still', still);
    pause.setAttribute('aria-pressed', still);
    pause.textContent = still ? 'Включить анимацию' : 'Остановить анимацию';
    run();
  });

  /* всплывающее сообщение и кнопка связи */
  const toast = $('#toast');
  let toastTimer;
  const say = text => {
    toast.textContent = text;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 3200);
  };
  $$('[data-stub]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    say('Этот контакт скоро появится.');
  }));
  const fabBtn = $('#fabBtn');
  const fabMenu = $('#fabMenu');
  function setFab(open) {
    fabMenu.hidden = !open;
    fabBtn.setAttribute('aria-expanded', open);
  }
  fabBtn.addEventListener('click', () => setFab(fabMenu.hidden));
  $$('[data-open-contacts]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); setFab(true); }));
  document.addEventListener('click', e => { if (!fab.contains(e.target)) setFab(false); });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!fabMenu.hidden) { setFab(false); fabBtn.focus(); }
    if (header.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });

  /* форма: отправка пока не подключена */
  const done = $('#done');
  const phone = form.elements.phone;
  phone.addEventListener('input', e => {
    if (e.inputType && e.inputType.startsWith('delete')) return;
    let d = phone.value.replace(/\D/g, '');
    if (!d) { phone.value = ''; return; }
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    let out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length > 4) out += ') ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    phone.value = out;
  });

  const rules = {
    name: el => el.value.trim().length >= 2 ? '' : 'Напишите, как к вам обращаться',
    phone: el => el.value.replace(/\D/g, '').length === 11 ? '' : 'Введите номер полностью',
    agree: el => el.checked ? '' : 'Без согласия заявку не принять'
  };
  const check = name => {
    const el = form.elements[name];
    const message = rules[name](el);
    const box = el.closest('label');
    box.classList.toggle('is-bad', !!message);
    $('em', box).textContent = message;
    el.setAttribute('aria-invalid', !!message);
    return !message;
  };
  Object.keys(rules).forEach(name => {
    const el = form.elements[name];
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => {
      if (el.closest('label').classList.contains('is-bad')) check(name);
    });
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const bad = Object.keys(rules).filter(name => !check(name));
    if (bad.length) { form.elements[bad[0]].focus(); return; }
    $('#doneTitle').textContent = `${form.elements.name.value.trim()}, всё заполнено верно`;
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });
  function showForm() { done.hidden = true; form.hidden = false; }
  $('#again').addEventListener('click', () => { form.reset(); showForm(); });

  size();
  onScroll();
})();
