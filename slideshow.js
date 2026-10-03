(() => {
  const PHOTOS_DIR = 'photos';
  const $ = (id) => document.getElementById(id);

  const els = {
    events: $('events'), empty: $('empty'), viewer: $('viewer'), title: $('viewer-title'),
    counter: $('counter'), stage: $('stage'), slides: [$('slide-a'), $('slide-b')],
    thumbs: $('thumbs'), progress: $('progress'), speed: $('speed'),
    play: $('btn-play'), full: $('btn-full'), close: $('btn-close'),
    prev: $('btn-prev'), next: $('btn-next'),
  };

  let events = [];
  let current = null;   // 表示中のイベント
  let index = 0;        // 表示中の画像番号
  let front = 0;        // els.slides のうち表示中のほう（クロスフェード用）
  let playing = true;
  let timer = null;

  const src = (ev, file) =>
    `${PHOTOS_DIR}/${encodeURIComponent(ev.folder)}/${encodeURIComponent(file)}`;

  // ---------- イベント一覧 ----------
  async function loadEvents() {
    try {
      const res = await fetch(`${PHOTOS_DIR}/manifest.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      events = (await res.json()).events || [];
    } catch (e) {
      console.error('manifest.json を読み込めません', e);
      events = [];
    }
    renderEvents();
    openFromHash();
  }

  function renderEvents() {
    els.empty.hidden = events.length > 0;
    els.events.replaceChildren(...events.map((ev) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'event-card';
      btn.innerHTML = `<img loading="lazy" alt=""><div class="meta"><div class="title"></div><div class="sub"></div></div>`;
      btn.querySelector('img').src = src(ev, ev.cover);
      btn.querySelector('.title').textContent = ev.title;
      btn.querySelector('.sub').textContent =
        [ev.date, `${ev.images.length}枚`].filter(Boolean).join(' ・ ');
      btn.addEventListener('click', () => { location.hash = encodeURIComponent(ev.folder); });
      li.append(btn);
      return li;
    }));
  }

  // ---------- URL ハッシュ（#フォルダ名 で直接開ける） ----------
  function openFromHash() {
    const folder = decodeURIComponent(location.hash.slice(1));
    const ev = events.find((e) => e.folder === folder);
    if (ev) open(ev); else close(false);
  }
  window.addEventListener('hashchange', openFromHash);

  // ---------- スライドショー ----------
  function open(ev) {
    if (current === ev) return;
    current = ev;
    index = 0;
    els.title.textContent = ev.date ? `${ev.title}（${ev.date}）` : ev.title;
    els.slides.forEach((img) => { img.classList.remove('show'); img.removeAttribute('src'); });
    els.thumbs.replaceChildren(...ev.images.map((file, i) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', `${i + 1}枚目`);
      b.innerHTML = '<img loading="lazy" alt="">';
      b.firstChild.src = src(ev, file);
      b.addEventListener('click', () => show(i));
      return b;
    }));
    els.viewer.hidden = false;
    document.body.style.overflow = 'hidden';
    show(0);
  }

  function close(updateHash = true) {
    stopTimer();
    current = null;
    els.viewer.hidden = true;
    document.body.style.overflow = '';
    if (document.fullscreenElement) document.exitFullscreen();
    if (updateHash && location.hash) history.pushState('', '', location.pathname + location.search);
  }

  function show(i) {
    if (!current) return;
    const n = current.images.length;
    index = (i + n) % n;

    const next = els.slides[1 - front];
    const prev = els.slides[front];
    next.alt = `${current.title} ${index + 1}枚目`;
    next.onload = () => { next.classList.add('show'); prev.classList.remove('show'); };
    next.src = src(current, current.images[index]);
    front = 1 - front;

    els.counter.textContent = `${index + 1} / ${n}`;
    [...els.thumbs.children].forEach((b, j) => b.classList.toggle('active', j === index));
    els.thumbs.children[index]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });

    // 次の画像を先読み
    new Image().src = src(current, current.images[(index + 1) % n]);
    restartTimer();
  }

  function restartTimer() {
    stopTimer();
    if (!playing || !current || current.images.length < 2) return;
    const ms = Number(els.speed.value);
    els.progress.style.transitionDuration = `${ms}ms`;
    void els.progress.offsetWidth; // リフローしてアニメーションをリセット
    els.progress.classList.add('run');
    timer = setTimeout(() => show(index + 1), ms);
  }

  function stopTimer() {
    clearTimeout(timer);
    els.progress.classList.remove('run');
    els.progress.style.transitionDuration = '0ms';
  }

  function togglePlay() {
    playing = !playing;
    els.play.textContent = playing ? '❚❚' : '▶';
    restartTimer();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else els.viewer.requestFullscreen?.();
  }

  // ---------- 操作 ----------
  els.prev.addEventListener('click', () => show(index - 1));
  els.next.addEventListener('click', () => show(index + 1));
  els.play.addEventListener('click', togglePlay);
  els.full.addEventListener('click', toggleFullscreen);
  els.close.addEventListener('click', () => close());
  els.speed.addEventListener('change', restartTimer);

  document.addEventListener('keydown', (e) => {
    if (els.viewer.hidden || e.target.tagName === 'SELECT') return;
    switch (e.key) {
      case 'ArrowLeft': show(index - 1); break;
      case 'ArrowRight': show(index + 1); break;
      case ' ': e.preventDefault(); togglePlay(); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 'Escape': if (!document.fullscreenElement) close(); break;
    }
  });

  // スワイプ
  let touchX = null;
  els.stage.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  els.stage.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  // タブが裏に回ったら止める
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopTimer(); else if (current) restartTimer();
  });

  loadEvents();
})();
