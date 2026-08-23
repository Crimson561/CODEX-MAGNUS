/* =========================================================
   CODEX MAGNUM — script.js
   A living digital library. Vanilla JS only.
   ========================================================= */
(() => {
  'use strict';

  const STORAGE_KEY = 'codexMagnusBooks_v1';
  const SPINE_COLORS = [
    '#6b2b2b', '#2f4a3a', '#3a3f6b', '#7a5a2a', '#4a3728',
    '#5c1f1f', '#264a4a', '#6b4423', '#3f2a1a', '#59462f',
    '#2e2e4a', '#704214', '#4a2540', '#33482e'
  ];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Utilities
  --------------------------------------------------------- */
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const escAttr = (s) => String(s ?? '').replace(/"/g, '&quot;');
  const rand = (min, max) => Math.random() * (max - min) + min;
  const randomColor = () => SPINE_COLORS[Math.floor(Math.random() * SPINE_COLORS.length)];
  const randomWidth = () => Math.round(rand(26, 50));
  const randomHeight = () => Math.round(rand(148, 214));
  const shortTitle = (t) => (t && t.length > 24) ? t.slice(0, 22) + '…' : (t || 'Untitled');

  /* One distinctive word per spine — never a full title crammed vertically. */
  const SPINE_STOPWORDS = new Set([
    'the','a','an','of','to','and','or','in','on','at','for','with','from',
    'by','into','onto','about','over','under','after','before','it','its',
    'is','are','was','were','be','that','this','these','those','you','your',
    'my','his','her','their','our','not','do','does','did','as','than','then'
  ]);
  function spineWord(title) {
    if (!title) return 'UNTITLED';
    const cleaned = title.replace(/['’]s\b/gi, '');
    const words = cleaned.split(/[\s:—–-]+/).filter(Boolean);
    const candidates = words
      .map((w) => w.replace(/[^A-Za-z]/g, ''))
      .filter((w) => w.length > 2 && !SPINE_STOPWORDS.has(w.toLowerCase()));
    let word = candidates.length
      ? candidates.reduce((best, w) => (w.length > best.length ? w : best), candidates[0])
      : (words[0] || 'UNTITLED').replace(/[^A-Za-z]/g, '') || 'UNTITLED';
    if (word.length > 16) word = word.slice(0, 16);
    return word.toUpperCase();
  }
  const formatDate = (iso) => {
    if (!iso) return 'today';
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return 'today'; }
  };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ---------------------------------------------------------
     Seed content — original placeholder volumes
  --------------------------------------------------------- */
  function seedBooks() {
    const seeds = [
      ['The Cartographer\u2019s Silence', 'Elin Marrow', 'A mapmaker who has charted every coastline in the known world sets out to draw the one place that refuses to hold still.'],
      ['Letters to a Distant Star', 'Josef Kade', 'Two lighthouse keepers, generations apart, discover the same bottle washed against the same rocks.'],
      ['The Ember Chronicles', 'Ada Voss', 'When the last hearth-fire in the valley goes out, a girl is sent to ask the mountain why.'],
      ['A Study in Quiet Hours', 'Mireille Auvergne', 'An unhurried account of the small rituals that hold a household together through a long winter.'],
      ['The Clockmaker\u2019s Debt', 'Tomas Rill', 'Every clock in the city runs seven minutes fast, and only one apprentice wants to know why.'],
      ['Salt and Marrow', 'Bea Ostrander', 'A fisherman\u2019s daughter inherits a boat, a debt, and a sea that seems to remember her name.'],
      ['The Orchard at the End of April', 'Petra Lin', 'A season spent tending a dying orchard becomes a lesson in what can and cannot be saved.'],
      ['Nine Doors to Morning', 'Salim Haddad', 'A locksmith who has never left his village is asked to open a door that isn\u2019t supposed to exist.'],
      ['The Weight of Small Kindnesses', 'Norah Quill', 'A collection of quiet essays on the debts we never think to repay.'],
      ['Wintering', 'Casimir Bly', 'A hibernating town wakes early, and no one can agree on what the extra month has cost them.'],
      ['The Glassblower\u2019s Apprentice', 'Yuki Tanabe', 'A boy who cannot speak learns to shape breath into something the whole village comes to depend on.'],
      ['Rivers That Do Not Meet', 'Delphine Cros', 'Two sisters travel opposite banks of the same river for a hundred miles, never quite touching.'],
      ['The Archive of Lost Weather', 'Otto Berg', 'A meteorologist keeps private records of storms that, officially, never happened.'],
      ['Everything the Garden Knew', 'Rosalind Fen', 'A gardener catalogs forty years of visitors through the plants they left behind.'],
      ['The Quiet Insurrection', 'Marcus Adeyemi', 'A history of the small, unrecorded refusals that eventually add up to change.'],
      ['Paper Boats for the Drowned', 'Ines Solano', 'A grief manual disguised as a children\u2019s book, and a children\u2019s book disguised as a grief manual.'],
      ['The Last Cartographer of Dreams', 'Hollis Vane', 'A dream-mapper realizes the territory is shrinking, one forgotten dream at a time.'],
      ['Correspondence with a Locked Room', 'Anwen Pryce', 'A prisoner and her jailer exchange letters neither is permitted to read.'],
      ['The Beekeeper\u2019s Long Silence', 'Nikolai Fen', 'After the hives fall silent, an old beekeeper listens for what comes next.'],
      ['A Brief History of Almost', 'Delia Osei', 'Interviews with people who nearly changed history, and chose not to.'],
      ['The Tide Tables', 'Soren Aas', 'A coastal town runs entirely on a schedule dictated by a tide no one can predict anymore.'],
      ['Ash and Ordinary Light', 'Camille Duret', 'A painter loses her sight and begins to describe color to the person holding her brush.'],
      ['The Uncatalogued Hours', 'Femi Okoro', 'A librarian discovers a wing of the archive that exists only between certain hours of the night.'],
      ['Everything Small Remembers', 'Ingrid Solheim', 'A meditation on memory, told through the objects that outlive the people who loved them.'],
      ['The Grammar of Migrating Birds', 'Tobias Lindqvist', 'A linguist spends a decade trying to translate a language spoken entirely in flight patterns.'],
      ['Bread for the Watchman', 'Farrah Idris', 'A night baker and a night guard share the only warm hour either of them gets.'],
      ['The Ferryman\u2019s Apprentice', 'Cato Renn', 'A reluctant heir to a family ferry learns the river charges more than coin.'],
      ['Diary of a Reluctant Oracle', 'Wren Achebe', 'A woman who can only predict small, useless things is asked to predict something large.']
    ];

    return seeds.map(([title, author, description]) => ({
      id: uid(),
      title, author, description,
      cover: '',
      color: randomColor(),
      width: randomWidth(),
      height: randomHeight(),
      dateAdded: new Date(Date.now() - Math.floor(rand(1, 400)) * 86400000).toISOString()
    }));
  }

  /* ---------------------------------------------------------
     Persistence
  --------------------------------------------------------- */
  function loadBooks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (e) { /* ignore corrupted storage */ }
    const seeded = seedBooks();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded)); } catch (e) {}
    return seeded;
  }

  function saveBooks() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(books)); }
    catch (e) { console.warn('Codex Magnum: could not save the library.', e); }
  }

  let books = loadBooks();

  /* ---------------------------------------------------------
     Elements
  --------------------------------------------------------- */
  const shelvesEl = $('shelves');
  const stage = $('stage');
  const stageBackdrop = $('stageBackdrop');
  const book3d = $('book3d');
  const bookCover = $('bookCover');
  const coverTitle = $('coverTitle');
  const coverAuthor = $('coverAuthor');
  const bookClose = $('bookClose');
  const pageLeftContent = $('pageLeftContent');
  const pageRightContent = $('pageRightContent');
  const leafRight = $('leafRight');
  const leafLeft = $('leafLeft');
  const leafRightContent = $('leafRightContent');
  const leafLeftContent = $('leafLeftContent');
  const pagePrev = $('pagePrev');
  const pageNext = $('pageNext');
  const bookPages = $('bookPages');
  const addBookBtn = $('addBookBtn');
  const audioToggle = $('audioToggle');
  const ambience = $('ambience');
  const sfxOpen = $('sfxOpen');
  const sfxClose = $('sfxClose');
  const sfxPage = $('sfxPage');
  const confirmVeil = $('confirmVeil');
  const confirmCancel = $('confirmCancel');
  const confirmRemove = $('confirmRemove');

  /* ---------------------------------------------------------
     Centralized Audio Manager
     One place that owns every sound in the library. Missing or
     broken audio assets never throw — the app just stays silent.
  --------------------------------------------------------- */
  const AudioManager = (() => {
    // pools support multiple takes per sound (e.g. sfxPage, sfxPage2, ...)
    // so a real page-turn variant set can be dropped in later without
    // touching this code — today each pool just has the one <audio>.
    const pools = {
      bookOpen:  [sfxOpen].filter(Boolean),
      bookClose: [sfxClose].filter(Boolean),
      pageTurn:  [sfxPage].filter(Boolean)
    };
    const VOLUME = { bookOpen: .55, bookClose: .5, pageTurn: .4, ambience: .32 };

    function play(name) {
      const pool = pools[name];
      if (!pool || !pool.length) return; // asset missing — fail silently
      const el = pool[Math.floor(Math.random() * pool.length)];
      try {
        el.currentTime = 0;
        // tiny pitch/speed variance so repeated sounds never feel identical
        el.playbackRate = 0.94 + Math.random() * 0.12;
        el.volume = VOLUME[name] ?? 0.5;
        el.play().catch(() => {});
      } catch (e) { /* never let sound break the experience */ }
    }

    function setAmbience(on) {
      try {
        if (on) { ambience.volume = VOLUME.ambience; ambience.play().catch(() => {}); }
        else { ambience.pause(); }
      } catch (e) {}
    }

    return { play, setAmbience };
  })();

  /* ---------------------------------------------------------
     Shelf rendering
  --------------------------------------------------------- */
  function rowCount() {
    return window.innerWidth < 560 ? 3 : 4;
  }

  function render() {
    shelvesEl.innerHTML = '';
    const rows = rowCount();
    const perRow = Math.max(1, Math.ceil(books.length / rows));

    for (let r = 0; r < rows; r++) {
      const rowBooks = books.slice(r * perRow, (r + 1) * perRow);
      const rowEl = document.createElement('div');
      rowEl.className = 'shelf-row';
      rowBooks.forEach((b) => rowEl.appendChild(createSpine(b)));
      shelvesEl.appendChild(rowEl);
      if (r < rows - 1) {
        const board = document.createElement('div');
        board.className = 'shelf-board';
        shelvesEl.appendChild(board);
      }
    }
  }

  function createSpine(book) {
    const el = document.createElement('div');
    el.className = 'book';
    el.dataset.id = book.id;
    el.style.setProperty('--w', book.width + 'px');
    el.style.setProperty('--h', book.height + 'px');
    el.style.setProperty('--c', book.color);

    // stable, per-book pseudo-random variation (seeded from id so it never re-jitters on re-render)
    const seed = [...String(book.id)].reduce((a, c) => a + c.charCodeAt(0), 0);
    const seededRand = (n) => ((seed * 9301 + 49297 * n) % 233280) / 233280;
    const tilt = (seededRand(1) - 0.5) * 2.4; // -1.2deg .. 1.2deg, restrained
    el.style.setProperty('--tilt', tilt.toFixed(2) + 'deg');
    if (seededRand(2) > 0.6) el.classList.add('has-emboss');
    const hasGoldAccent = seededRand(3) > 0.55;

    const word = spineWord(book.title);
    // shrink label to guarantee it always fits the spine, however long the word
    // (vertical glyph advance for this uppercase geometric font is ~0.68em)
    const availablePx = book.height - 48;
    const fontSize = Math.max(7, Math.min(12.5, availablePx / (word.length * 0.68)));
    const letterSpacing = fontSize > 10.5 ? 1 : 0.4;

    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Open "${book.title}" by ${book.author}`);
    el.innerHTML = `
      <span class="book-pageblock" aria-hidden="true"></span>
      <span class="book-cover-face" aria-hidden="true"></span>
      <span class="book-headband top" style="background:${hasGoldAccent ? 'linear-gradient(90deg,transparent,var(--brass),transparent)' : 'rgba(0,0,0,.25)'}"></span>
      <span class="book-headband bottom" style="background:${hasGoldAccent ? 'linear-gradient(90deg,transparent,var(--brass),transparent)' : 'rgba(0,0,0,.25)'}"></span>
      <span class="band top"></span>
      <span class="band bottom"></span>
      <span class="label" style="font-size:${fontSize.toFixed(1)}px;letter-spacing:${letterSpacing}px;">${esc(word)}</span>
    `;
    el.addEventListener('click', () => openBookFromShelf(book.id, el));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBookFromShelf(book.id, el); }
    });
    return el;
  }

  /* ---------------------------------------------------------
     Stage state
  --------------------------------------------------------- */
  let currentBookId = null;
  let pendingBook = null;   // book being created via "+"
  let isAdding = false;
  let currentPage = 0;      // 0 or 1
  let coverOpened = false;
  let dragging = false;
  let dragStartX = 0;
  let dragAngle = 0;
  let dragLastX = 0;
  let dragLastT = 0;
  let dragVelocity = 0; // px/ms, signed — used for flick-to-complete

  function currentBook() {
    if (isAdding) return pendingBook;
    return books.find((b) => b.id === currentBookId) || null;
  }

  /* ---------------------------------------------------------
     Spread content
  --------------------------------------------------------- */
  function spreadHTML(book, idx) {
    if (idx === 0) {
      const swatch = book.cover
        ? `background-image:url("${escAttr(book.cover)}")`
        : `background:${book.color}`;
      return {
        left: `
          <div class="book-swatch" style="${swatch}"></div>
          <h3 class="book-title">${esc(book.title)}</h3>
          <p class="book-author">by ${esc(book.author)}</p>
        `,
        right: `
          <p class="book-desc">${esc(book.description) || 'No description was left for this volume &mdash; perhaps its story is still being written.'}</p>
        `
      };
    }
    return {
      left: `
        <p class="book-desc" style="font-style:italic;">Some pages are best left to the imagination.</p>
      `,
      right: `
        <p class="book-meta">Added to the shelf on ${formatDate(book.dateAdded)}.</p>
        <button class="remove-btn" id="removeBtn" type="button">
          <svg class="trash-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0h10l-.8 12.1a2 2 0 0 1-2 1.9H9.8a2 2 0 0 1-2-1.9L7 7z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Delete Book
        </button>
      `
    };
  }

  function fillSpread(book, idx) {
    const s = spreadHTML(book, idx);
    pageLeftContent.innerHTML = s.left;
    pageRightContent.innerHTML = s.right;
  }

  function updateNav() {
    pagePrev.disabled = currentPage === 0;
    pageNext.disabled = currentPage === 1;
  }

  function flipPage(dir) {
    if (isAdding) return;
    const nextIdx = currentPage + dir;
    if (nextIdx < 0 || nextIdx > 1) return;
    const book = currentBook();
    if (!book) return;

    const oldSpread = spreadHTML(book, currentPage);
    const newSpread = spreadHTML(book, nextIdx);
    const leaf = dir === 1 ? leafRight : leafLeft;
    const leafContentEl = dir === 1 ? leafRightContent : leafLeftContent;

    leafContentEl.innerHTML = dir === 1 ? oldSpread.right : oldSpread.left;
    pageLeftContent.innerHTML = newSpread.left;
    pageRightContent.innerHTML = newSpread.right;

    leaf.classList.remove('flipping');
    void leaf.offsetWidth; // reflow to restart transition
    leaf.classList.add('flipping');
    AudioManager.play('pageTurn');

    currentPage = nextIdx;
    updateNav();

    setTimeout(() => leaf.classList.remove('flipping'), reducedMotion ? 0 : 620);
  }

  /* ---------------------------------------------------------
     Add-book form
  --------------------------------------------------------- */
  function renderForm() {
    coverTitle.textContent = 'A New Volume';
    coverAuthor.textContent = '';
    pageLeftContent.innerHTML = `
      <div class="book-form">
        <label for="fTitle">Title *</label>
        <input id="fTitle" type="text" maxlength="80" placeholder="The title of your book" autocomplete="off">
        <label for="fAuthor">Author *</label>
        <input id="fAuthor" type="text" maxlength="60" placeholder="Who wrote it" autocomplete="off">
        <label for="fCover">Cover image URL (optional)</label>
        <input id="fCover" type="text" placeholder="https://..." autocomplete="off">
      </div>
    `;
    pageRightContent.innerHTML = `
      <div class="book-form">
        <label for="fDesc">Description (optional)</label>
        <textarea id="fDesc" rows="8" placeholder="What is this book about?"></textarea>
        <div class="form-actions">
          <button class="btn" id="cancelAdd" type="button">Cancel</button>
          <button class="btn btn-primary" id="doneAdd" type="button">Done</button>
        </div>
      </div>
    `;
    pagePrev.style.display = 'none';
    pageNext.style.display = 'none';
  }

  function restoreNavButtons() {
    pagePrev.style.display = '';
    pageNext.style.display = '';
  }

  /* ---------------------------------------------------------
     FLIP animation helpers
  --------------------------------------------------------- */
  // A tiny extra bounce once a big move finishes — the moment a real
  // object settles under its own weight rather than simply stopping.
  function settleBook3d() {
    setTimeout(() => {
      book3d.classList.add('settling');
      setTimeout(() => book3d.classList.remove('settling'), reducedMotion ? 0 : 480);
    }, reducedMotion ? 0 : 550);
  }

  function flipFromRect(fromRect, spineEl) {
    const targetRect = book3d.getBoundingClientRect();
    const scaleX = fromRect.width / targetRect.width;
    const scaleY = fromRect.height / targetRect.height;
    const tx = fromRect.left + fromRect.width / 2 - (targetRect.left + targetRect.width / 2);
    const ty = fromRect.top + fromRect.height / 2 - (targetRect.top + targetRect.height / 2);
    // start rotated to the spine's own shelf tilt and turned away from the
    // reader, like a book still mid-pull, then straighten as it arrives
    const tilt = spineEl ? (spineEl.style.getPropertyValue('--tilt') || '0deg') : '0deg';

    book3d.style.transition = 'none';
    book3d.style.opacity = '1';
    book3d.style.transform = `translate(${tx}px, ${ty}px) scale(${scaleX}, ${scaleY}) rotateY(-22deg) rotateZ(${tilt})`;
    // force reflow, then animate to resting pose
    void book3d.offsetWidth;
    requestAnimationFrame(() => {
      book3d.style.transition = '';
      book3d.style.transform = 'rotateX(6deg) rotateY(0deg) rotateZ(0deg)';
      settleBook3d();
    });
  }

  function fallFromAbove() {
    book3d.style.transition = 'none';
    book3d.style.opacity = '1';
    book3d.style.transform = 'translateY(-140vh) rotateZ(-10deg) scale(.55)';
    void book3d.offsetWidth;
    requestAnimationFrame(() => {
      book3d.style.transition = '';
      book3d.style.transform = 'rotateX(6deg) rotateY(0deg) rotateZ(0deg)';
      settleBook3d();
    });
  }

  function resetBook3d() {
    book3d.style.transition = 'none';
    book3d.style.transform = 'rotateX(6deg) rotateY(0deg) rotateZ(0deg)';
    void book3d.offsetWidth;
    book3d.style.transition = '';
  }

  /* ---------------------------------------------------------
     Cover open / close
  --------------------------------------------------------- */
  function setCoverAngle(angle, animated) {
    bookCover.classList.toggle('animating', !!animated);
    bookCover.style.transform = `rotateY(${angle}deg)`;
  }

  function openCoverFully() {
    if (coverOpened) return;
    coverOpened = true;
    setCoverAngle(-162, true);
    AudioManager.play('bookOpen');
  }

  function closeCoverFully(cb) {
    if (!coverOpened) { if (cb) cb(); return; }
    coverOpened = false;
    setCoverAngle(0, true);
    setTimeout(() => { if (cb) cb(); }, reducedMotion ? 0 : 560);
  }

  function onCoverPointerDown(e) {
    if (isAdding) return; // form flow opens automatically
    dragging = true;
    dragStartX = e.clientX;
    dragLastX = e.clientX;
    dragLastT = performance.now();
    dragVelocity = 0;
    dragAngle = coverOpened ? -162 : 0;
    bookCover.classList.remove('animating');
    bookCover.setPointerCapture && bookCover.setPointerCapture(e.pointerId);
  }
  function onCoverPointerMove(e) {
    if (!dragging) return;
    const now = performance.now();
    const dt = Math.max(1, now - dragLastT);
    dragVelocity = (e.clientX - dragLastX) / dt; // px per ms — a real flick reads fast here
    dragLastX = e.clientX;
    dragLastT = now;

    const delta = e.clientX - dragStartX;
    const base = coverOpened ? -162 : 0;
    let angle = base + delta;
    angle = Math.max(-162, Math.min(0, angle));
    bookCover.style.transform = `rotateY(${angle}deg)`;
    dragAngle = angle;
  }
  function onCoverPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    const delta = e.clientX - dragStartX;
    const flick = Math.abs(dragVelocity) > 0.55; // a fast release completes the motion, physics-style
    if (Math.abs(delta) < 6 && !flick) {
      // treat as a simple click
      coverOpened ? closeCoverFully() : openCoverFully();
      return;
    }
    if (flick) {
      dragVelocity < 0 ? openCoverFully() : closeCoverFully();
      return;
    }
    if (dragAngle < -70) openCoverFully();
    else closeCoverFully();
  }

  bookCover.addEventListener('pointerdown', onCoverPointerDown);
  window.addEventListener('pointermove', onCoverPointerMove);
  window.addEventListener('pointerup', onCoverPointerUp);

  /* ---------------------------------------------------------
     Open / close the stage
  --------------------------------------------------------- */
  function openBookFromShelf(id, spineEl) {
    if (stage.classList.contains('active')) return;
    const book = books.find((b) => b.id === id);
    if (!book) return;

    currentBookId = id;
    isAdding = false;
    currentPage = 0;
    coverOpened = false;
    hideDeleteConfirm();

    coverTitle.textContent = book.title;
    coverAuthor.textContent = 'by ' + book.author;
    setCoverAngle(0, false);
    fillSpread(book, 0);
    updateNav();
    restoreNavButtons();

    spineEl.classList.add('picked');
    stage.setAttribute('aria-hidden', 'false');
    stage.classList.add('active');
    flipFromRect(spineEl.getBoundingClientRect(), spineEl);
  }

  function openNewBook() {
    if (stage.classList.contains('active')) return;
    isAdding = true;
    currentBookId = null;
    currentPage = 0;
    coverOpened = false;
    hideDeleteConfirm();
    pendingBook = {
      id: null, title: '', author: '', description: '', cover: '',
      color: randomColor(), width: randomWidth(), height: randomHeight(),
      dateAdded: null
    };

    renderForm();
    stage.setAttribute('aria-hidden', 'false');
    stage.classList.add('active');
    fallFromAbove();
    setTimeout(openCoverFully, reducedMotion ? 0 : 560);
  }

  function closeStage(targetSpineEl) {
    const finish = () => {
      if (targetSpineEl) {
        flipToRectAndClose(targetSpineEl);
      } else {
        // no shelf slot to return to (a cancelled add, or a removed book) —
        // the book physically leaves the library rather than teleporting away
        AudioManager.play('bookClose');
        book3d.style.transform = 'translateY(55vh) rotateX(26deg) rotateZ(-6deg) scale(.42)';
        book3d.style.opacity = '0';
        setTimeout(() => {
          stage.classList.remove('active');
          stage.setAttribute('aria-hidden', 'true');
          book3d.style.opacity = '';
          resetBook3d();
        }, reducedMotion ? 0 : 560);
      }
    };
    closeCoverFully(finish);
  }

  function flipToRectAndClose(spineEl) {
    const spineRect = spineEl.getBoundingClientRect();
    const currentRect = book3d.getBoundingClientRect();
    const scaleX = spineRect.width / currentRect.width;
    const scaleY = spineRect.height / currentRect.height;
    const tx = spineRect.left + spineRect.width / 2 - (currentRect.left + currentRect.width / 2);
    const ty = spineRect.top + spineRect.height / 2 - (currentRect.top + currentRect.height / 2);
    const tilt = spineEl.style.getPropertyValue('--tilt') || '0deg';
    book3d.style.transform = `translate(${tx}px, ${ty}px) scale(${scaleX}, ${scaleY}) rotateY(18deg) rotateZ(${tilt})`;
    AudioManager.play('bookClose');
    setTimeout(() => {
      stage.classList.remove('active');
      stage.setAttribute('aria-hidden', 'true');
      spineEl.classList.remove('picked');
      resetBook3d();
    }, reducedMotion ? 0 : 560);
  }

  function handleCloseButton() {
    if (confirmVeil.classList.contains('active')) { hideDeleteConfirm(); return; }
    if (isAdding) {
      isAdding = false;
      pendingBook = null;
      restoreNavButtons();
      closeStage(null);
      return;
    }
    const spineEl = shelvesEl.querySelector(`.book[data-id="${CSS.escape(currentBookId || '')}"]`);
    closeStage(spineEl || null);
    currentBookId = null;
  }

  function finishAddingBook() {
    const title = ($('fTitle').value || '').trim();
    const author = ($('fAuthor').value || '').trim();
    if (!title || !author) {
      const t = $('fTitle'), a = $('fAuthor');
      if (!title) t.style.borderBottomColor = '#8a2d2d';
      if (!author) a.style.borderBottomColor = '#8a2d2d';
      return;
    }
    const cover = ($('fCover').value || '').trim();
    const description = ($('fDesc').value || '').trim();

    const newBook = {
      ...pendingBook,
      id: uid(),
      title, author, cover, description,
      dateAdded: new Date().toISOString()
    };
    books.push(newBook);
    saveBooks();

    isAdding = false;
    pendingBook = null;
    restoreNavButtons();
    render();

    const spineEl = shelvesEl.querySelector(`.book[data-id="${CSS.escape(newBook.id)}"]`);
    if (spineEl) spineEl.classList.add('picked');
    // show the finished cover briefly, then send it home to the shelf
    coverTitle.textContent = newBook.title;
    coverAuthor.textContent = 'by ' + newBook.author;
    closeStage(spineEl || null);
  }

  /* Custom confirmation — a small card laid over the open book itself,
     never a native browser alert()/confirm(). */
  function showDeleteConfirm() {
    if (!currentBook()) return;
    confirmVeil.classList.add('active');
    confirmVeil.setAttribute('aria-hidden', 'false');
  }

  function hideDeleteConfirm() {
    confirmVeil.classList.remove('active');
    confirmVeil.setAttribute('aria-hidden', 'true');
  }

  function removeCurrentBook() {
    showDeleteConfirm();
  }

  function performDelete() {
    const book = currentBook();
    hideDeleteConfirm();
    if (!book) return;
    books = books.filter((b) => b.id !== book.id);
    saveBooks();
    currentBookId = null;
    closeStage(null);
    setTimeout(render, reducedMotion ? 0 : 620);
  }

  /* ---------------------------------------------------------
     Event delegation inside the book
  --------------------------------------------------------- */
  bookPages.addEventListener('click', (e) => {
    if (e.target.closest('#removeBtn')) removeCurrentBook();
    if (e.target.id === 'doneAdd') finishAddingBook();
    if (e.target.id === 'cancelAdd') handleCloseButton();
  });

  confirmCancel.addEventListener('click', hideDeleteConfirm);
  confirmRemove.addEventListener('click', performDelete);
  confirmVeil.addEventListener('click', (e) => {
    if (e.target === confirmVeil) hideDeleteConfirm(); // click outside the card cancels
  });

  pagePrev.addEventListener('click', () => flipPage(-1));
  pageNext.addEventListener('click', () => flipPage(1));
  bookClose.addEventListener('click', handleCloseButton);
  stageBackdrop.addEventListener('click', handleCloseButton);
  addBookBtn.addEventListener('click', openNewBook);

  document.addEventListener('keydown', (e) => {
    if (!stage.classList.contains('active')) return;
    if (e.key === 'Escape') {
      if (confirmVeil.classList.contains('active')) { hideDeleteConfirm(); return; }
      handleCloseButton();
      return;
    }
    if (confirmVeil.classList.contains('active')) return; // don't flip pages behind the dialog
    if (e.key === 'ArrowRight') flipPage(1);
    if (e.key === 'ArrowLeft') flipPage(-1);
  });

  /* ---------------------------------------------------------
     Ambient audio toggle (sfx playback lives in AudioManager above)
  --------------------------------------------------------- */
  audioToggle.addEventListener('click', () => {
    const muted = audioToggle.getAttribute('data-muted') !== 'false';
    audioToggle.setAttribute('data-muted', muted ? 'false' : 'true');
    AudioManager.setAmbience(muted);
  });

  /* ---------------------------------------------------------
     Ambient dust
  --------------------------------------------------------- */
  function createDust() {
    if (reducedMotion) return;
    const dust = $('dust');
    for (let i = 0; i < 16; i++) {
      const m = document.createElement('div');
      m.className = 'dust-mote';
      m.style.left = rand(2, 98) + '%';
      m.style.bottom = rand(0, 35) + '%';
      m.style.animationDuration = rand(12, 24) + 's';
      m.style.animationDelay = rand(0, 14) + 's';
      dust.appendChild(m);
    }
  }

  /* ---------------------------------------------------------
     Resize handling
  --------------------------------------------------------- */
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    if (stage.classList.contains('active')) return; // don't disturb an open book
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 200);
  });

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */
  render();
  createDust();
})();
