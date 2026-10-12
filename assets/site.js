/* Les Coquillages — site runtime (remplace le moteur Claude Design / React).
   Reprend à l'identique les animations d'origine : transition de page, apparitions
   au scroll, parallax, barre de nav, diaporama d'accueil, galeries, lecteur vidéo,
   formulaire de contact. Aucune dépendance externe. */
(function () {
  'use strict';
  var D = document;
  var CFG = window.LC || {};
  var $ = function (s, c) { return (c || D).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || D).querySelectorAll(s)); };
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };

  /* ---------- Transition de page (fondu + logo) ---------- */
  function initTransition() {
    var tr = $('#lc-transition');
    if (!tr) return;
    var tlogo = $('[data-lct-logo]', tr);
    var tsub = $('[data-lct-sub]', tr);
    var tsubText = $('[data-lct-subtext]', tr);
    var labels = {
      'index.html': 'Photographe & Vidéaste de mariage',
      'photo.html': 'Emeline à la photo',
      'video.html': 'Alex à la vidéo',
      'films.html': 'Nos films',
      'duo.html': 'Emeline & Alex',
      'portfolio.html': 'Nos histoires',
      'contact.html': 'Racontez-nous votre histoire'
    };
    if (tlogo) tlogo.style.opacity = '1';
    if (tsub) tsub.style.opacity = '1';

    var cleared = false;
    var clearTr = function () {
      if (cleared) return;
      cleared = true;
      if (tlogo) tlogo.style.opacity = '0';
      if (tsub) tsub.style.opacity = '0';
      tr.style.opacity = '0';
      setTimeout(function () { tr.style.visibility = 'hidden'; }, 640);
    };
    // fondu d'arrivée
    var arrive = function () { setTimeout(clearTr, 380); };
    if (D.readyState === 'complete') arrive();
    else window.addEventListener('load', arrive);
    // filet de sécurité : jamais bloqué sur l'écran de transition
    setTimeout(clearTr, 2600);
    // retour de cache (bouton précédent) : on ré-affiche la page
    window.addEventListener('pageshow', function (e) { if (e.persisted) clearTr(); });

    // préchargement des pages internes
    var warmed = {};
    var warm = function (href) {
      if (!href || warmed[href]) return warmed[href];
      warmed[href] = fetch(href, { credentials: 'same-origin' }).then(function (r) { return r.text(); }).catch(function () { return null; });
      return warmed[href];
    };
    var internal = $$('a[href$=".html"]').filter(function (a) {
      var h = a.getAttribute('href') || '';
      return h.indexOf('//') === -1 && h.charAt(0) !== '#';
    });
    var hrefs = internal.map(function (a) { return a.getAttribute('href'); }).filter(function (v, i, s) { return s.indexOf(v) === i; });
    setTimeout(function () { hrefs.forEach(warm); }, 1000);

    internal.forEach(function (a) {
      var href = a.getAttribute('href');
      a.addEventListener('pointerenter', function () { warm(href); });
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (a.target === '_blank') return;
        e.preventDefault();
        cleared = false;
        tr.style.transition = 'opacity .4s ease';
        tr.style.visibility = 'visible';
        raf(function () { tr.style.opacity = '1'; });
        var lab = labels[href.split('/').pop()];
        if (lab && tsubText) tsubText.textContent = lab;
        setTimeout(function () { if (tlogo) tlogo.style.opacity = '1'; }, 240);
        setTimeout(function () { if (tsub) tsub.style.opacity = '1'; }, 400);
        var go = function () { window.location.href = href; };
        var ready = warm(href) || Promise.resolve();
        Promise.race([ready, new Promise(function (res) { setTimeout(res, 1300); })]).then(function () { setTimeout(go, 440); });
      });
    });
  }

  /* ---------- Préchargeur d'accueil ---------- */
  function initPreloader() {
    var loader = $('#lc-loader');
    if (!loader) return;
    var seen = false;
    try { seen = sessionStorage.getItem('lc-intro-seen') === '1'; sessionStorage.setItem('lc-intro-seen', '1'); } catch (e) {}
    if (seen) { loader.style.display = 'none'; return; }
    var start = (window.performance && performance.now) ? performance.now() : Date.now();
    var hide = function () {
      loader.style.opacity = '0';
      setTimeout(function () { loader.style.display = 'none'; }, 1100);
    };
    var now = function () { return (window.performance && performance.now) ? performance.now() : Date.now(); };
    var finish = function () { setTimeout(hide, Math.max(0, 2900 - (now() - start))); };
    if (D.readyState === 'complete') finish();
    else window.addEventListener('load', finish);
    setTimeout(hide, 5200);
  }

  /* ---------- Diaporama d'accueil ---------- */
  function initHero() {
    var slides = $$('[data-hero-slide]');
    if (slides.length < 2) return;
    var HOLD = 5000, WIPE = 1500;
    var cur = 0, z = 1;
    slides.forEach(function (el, i) {
      el.style.opacity = '1';
      el.style.zIndex = i === 0 ? '1' : '0';
      el.style.clipPath = i === 0 ? 'inset(0 0 0 0)' : 'inset(0 0 0 100%)';
      el.style.transform = 'none';
    });
    var advance = function () {
      var from = slides[cur], nx = (cur + 1) % slides.length, to = slides[nx];
      cur = nx; z += 1;
      to.style.zIndex = String(z);
      to.style.clipPath = 'inset(0 0 0 100%)';
      var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
      var step = function (now) {
        now = now || ((window.performance && performance.now) ? performance.now() : Date.now());
        var t = (now - t0) / WIPE; if (t > 1) t = 1;
        var e = t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
        to.style.clipPath = 'inset(0 0 0 ' + ((1 - e) * 100).toFixed(2) + '%)';
        from.style.transform = 'translateX(' + (-2.5 * e).toFixed(3) + '%)';
        if (t < 1) raf(step);
        else {
          to.style.clipPath = 'inset(0 0 0 0)';
          from.style.transform = 'none';
          from.style.clipPath = 'inset(0 0 0 100%)';
          from.style.zIndex = '0';
          setTimeout(advance, HOLD);
        }
      };
      raf(step);
    };
    setTimeout(advance, HOLD);
  }

  /* ---------- Mot qui défile (accueil) ---------- */
  function initCycleWord() {
    var wEl = $('#cycle-word');
    if (!wEl) return;
    var words = (CFG.cycleWords && CFG.cycleWords.length) ? CFG.cycleWords : ['Vibrent', 'Respirent', 'Dansent', 'S’aiment fort'];
    var wi = 0;
    setInterval(function () {
      wEl.style.opacity = '0';
      setTimeout(function () { wi = (wi + 1) % words.length; wEl.textContent = words[wi]; wEl.style.opacity = '1'; }, 750);
    }, 2800);
  }

  /* ---------- Apparitions au scroll ---------- */
  function initReveals() {
    var revEls = $$('[data-reveal]');
    revEls.forEach(function (el) { el.style.opacity = '0'; });
    var done = [];
    var animateIn = function (el, delay) {
      if (done.indexOf(el) !== -1) return;
      done.push(el);
      var isImg = !!el.querySelector('img, image-slot');
      var dur = isImg ? 1400 : 1150;
      var startY = isImg ? 0 : 14;
      var now0 = (window.performance && performance.now) ? performance.now() : Date.now();
      var startTime = now0 + delay;
      if (isImg) el.style.transform = 'none';
      var frame = function (now) {
        now = now || ((window.performance && performance.now) ? performance.now() : Date.now());
        var t = (now - startTime) / dur;
        if (t < 0) { raf(frame); return; }
        if (t > 1) t = 1;
        var e = 1 - Math.pow(1 - t, 4);
        el.style.opacity = String(e);
        if (!isImg) el.style.transform = t < 1 ? ('translateY(' + ((1 - e) * startY).toFixed(2) + 'px)') : 'none';
        if (t < 1) raf(frame);
      };
      raf(frame);
    };
    var fire = function (el) {
      var d = Math.min(parseFloat(el.getAttribute('data-reveal')) || 0, 3) * 90;
      animateIn(el, d);
    };
    if (typeof IntersectionObserver !== 'undefined') {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { fire(en.target); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
      revEls.forEach(function (el) { io.observe(el); });
    }
    var check = function () {
      var vh = window.innerHeight;
      revEls.forEach(function (el) {
        if (done.indexOf(el) !== -1) return;
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.88 && r.bottom > 0) fire(el);
      });
    };
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    setTimeout(check, 80);
    window.addEventListener('load', function () { setTimeout(check, 100); });
    // filet de sécurité
    setTimeout(function () { revEls.forEach(function (el) { animateIn(el, 0); }); }, 5000);
  }

  /* ---------- Parallax ---------- */
  function initParallax() {
    var para = $$('[data-parallax]');
    if (!para.length) return;
    var apply = function () {
      var vh = window.innerHeight;
      para.forEach(function (el) {
        var sp = parseFloat(el.getAttribute('data-parallax')) || 0.15;
        var host = el.parentElement;
        var r = host.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var off = (r.top + r.height / 2 - vh / 2);
        el.style.transform = 'translateY(' + (off * sp).toFixed(1) + 'px)';
      });
    };
    var queued = false;
    var schedule = function () { if (queued) return; queued = true; raf(function () { queued = false; apply(); }); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
  }

  /* ---------- Barre de navigation (état "solide" au scroll) ---------- */
  function initNav() {
    var nav = $('[data-nav]');
    if (!nav) return;
    var solid = false;
    var onScroll = function () {
      var y = window.pageYOffset || D.documentElement.scrollTop;
      var want = solid ? y > 40 : y > 90;
      if (want !== solid) { solid = want; nav.classList.toggle('nav-solid', solid); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Galerie défilante (marquee) ---------- */
  function initMarquee() {
    var track = $('#gallery-track');
    if (!track || track.dataset.cloned) return;
    track.dataset.cloned = '1';
    track.innerHTML += track.innerHTML;
    var vp = $('#gal-viewport');
    if (vp) {
      vp.addEventListener('pointerenter', function () { track.style.animationPlayState = 'paused'; });
      vp.addEventListener('pointerleave', function () { track.style.animationPlayState = 'running'; });
    }
  }

  /* ---------- Portfolio : révélation des images + lightbox ---------- */
  function initPortfolio() {
    var grid = $('#pf-grid');
    if (!grid) return;
    $$('img', grid).forEach(function (im) {
      var show = function () { im.style.opacity = '1'; im.style.transform = 'scale(1)'; };
      if (im.complete && im.naturalWidth) show();
      else { im.addEventListener('load', show); im.addEventListener('error', show); }
    });
    var lb = $('#pf-lightbox');
    var lbImg = $('#pf-lightbox-img');
    if (lb && lbImg) {
      grid.addEventListener('click', function (e) {
        var cell = e.target.closest('[data-item]');
        if (!cell) return;
        var inner = cell.querySelector('img');
        var url = inner && inner.src;
        if (!url) return;
        lbImg.src = url;
        lb.style.display = 'flex';
        D.body.style.overflow = 'hidden';
      });
      var close = function () { lb.style.display = 'none'; lbImg.src = ''; D.body.style.overflow = ''; };
      lb.addEventListener('click', close);
      window.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }
  }

  /* ---------- Films : lecteur vidéo ---------- */
  function initFilms() {
    var player = $('#lc-player');
    if (!player) return;
    var frame = $('[data-player-frame]', player);
    var ptitle = $('[data-player-title]', player);
    var emptyFrame = frame ? frame.innerHTML : '';
    var closePlayer = function () {
      player.style.display = 'none';
      if (frame) frame.innerHTML = emptyFrame;
      D.body.style.overflow = '';
    };
    var closeBtn = $('[data-player-close]', player);
    if (closeBtn) closeBtn.addEventListener('click', closePlayer);
    player.addEventListener('click', function (e) { if (e.target === player) closePlayer(); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePlayer(); });

    $$('[data-film]').forEach(function (card) {
      card.style.transition = 'transform .45s cubic-bezier(.4,0,.2,1)';
      card.addEventListener('click', function () {
        var url = (card.getAttribute('data-video') || '').trim();
        var yt = url.match(/(?:youtu\.be\/|[?&]v=|youtube\.com\/embed\/)([\w-]{6,})/);
        if (yt) url = 'https://www.youtube.com/embed/' + yt[1] + '?rel=0&autoplay=1';
        var t = card.querySelector('div[style*="Instrument Serif"]');
        if (ptitle) ptitle.textContent = t ? t.textContent : '';
        if (frame) frame.innerHTML = url
          ? '<iframe src="' + url + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0;"></iframe>'
          : emptyFrame;
        player.style.display = 'flex';
        D.body.style.overflow = 'hidden';
      });
      var veil = card.querySelector('[data-film-veil]');
      var play = card.querySelector('[data-film-play]');
      card.addEventListener('pointerenter', function () {
        card.style.transform = 'translateY(-4px)';
        if (veil) veil.style.opacity = '1';
        if (play) { play.style.opacity = '1'; play.style.transform = 'translate(-50%,-50%) scale(1)'; }
      });
      card.addEventListener('pointerleave', function () {
        card.style.transform = 'none';
        if (veil) veil.style.opacity = '0';
        if (play) { play.style.opacity = '0'; play.style.transform = 'translate(-50%,-50%) scale(.9)'; }
      });
    });
  }

  /* ---------- Contact : puces + envoi du formulaire ---------- */
  function initContact() {
    var form = $('#lc-form');
    if (!form) return;
    $$('[data-pill]').forEach(function (p) {
      p.addEventListener('click', function () {
        var on = p.getAttribute('data-on') === '1';
        if (on) {
          p.removeAttribute('data-on');
          p.style.color = '#0D3844'; p.style.background = '#F6F1EA'; p.style.borderColor = '#E8DDCF';
        } else {
          p.setAttribute('data-on', '1');
          p.style.color = '#F6F1EA'; p.style.background = '#FC7058'; p.style.borderColor = '#FC7058';
        }
      });
    });
    var success = $('#lc-success');
    var error = $('#lc-error');
    var submit = $('#lc-submit');
    var submitLabel = submit ? submit.innerHTML : '';
    var sending = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      var val = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
      var pills = $$('#lc-pills [data-pill][data-on]').map(function (b) { return b.textContent.trim(); }).join(', ');
      sending = true;
      if (success) success.style.display = 'none';
      if (error) error.style.display = 'none';
      if (submit) { submit.textContent = 'Envoi en cours…'; submit.style.opacity = '.7'; submit.disabled = true; }
      fetch('https://formsubmit.co/ajax/alexemeline25@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          'Prénoms': val('prenoms'),
          'Email': val('email'),
          'Date du mariage': val('date'),
          'Lieu': val('lieu'),
          'Prestation souhaitée': pills,
          'Leur histoire': val('histoire'),
          _subject: 'Demande mariage — ' + (val('prenoms') || 'site Les Coquillages'),
          _replyto: val('email'),
          _template: 'table',
          _captcha: 'false',
          _honey: val('_honey')
        })
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) {
          if (!r.ok || String(data.success) === 'false') throw new Error(data.message || ('HTTP ' + r.status));
        });
      }).then(function () {
        form.querySelectorAll('input:not([name="_honey"]), textarea').forEach(function (el) { el.value = ''; });
        if (success) success.style.display = 'flex';
        if (submit) { submit.textContent = 'Message envoyé ✓'; submit.style.background = '#1F5E78'; submit.style.opacity = '1'; }
      }).catch(function (err) {
        console.error('Envoi du formulaire :', err);
        if (error) error.style.display = 'flex';
        if (submit) { submit.innerHTML = submitLabel; submit.style.opacity = '1'; submit.disabled = false; }
        sending = false;
      });
    });
  }

  function boot() {
    try { initTransition(); } catch (e) { console.error(e); }
    try { initPreloader(); } catch (e) { console.error(e); }
    try { initHero(); } catch (e) { console.error(e); }
    try { initCycleWord(); } catch (e) { console.error(e); }
    try { initMarquee(); } catch (e) { console.error(e); }
    try { initPortfolio(); } catch (e) { console.error(e); }
    try { initFilms(); } catch (e) { console.error(e); }
    try { initContact(); } catch (e) { console.error(e); }
    try { initReveals(); } catch (e) { console.error(e); }
    try { initParallax(); } catch (e) { console.error(e); }
    try { initNav(); } catch (e) { console.error(e); }
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
