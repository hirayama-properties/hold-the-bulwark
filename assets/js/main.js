/* HOLD THE BULWARK — site script (no cookies, no tracking) */
(function () {
  'use strict';
  var cfg = window.BULWARK || {};

  /* ---------- language: first visit follows the browser, manual choice wins ---------- */
  var LANG_KEY = 'htb-lang-chosen';
  function store(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  function read(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }

  document.querySelectorAll('[data-lang]').forEach(function (a) {
    a.addEventListener('click', function () { store(LANG_KEY, a.getAttribute('data-lang')); });
  });
  if (cfg.lang === 'ja' && !read(LANG_KEY)) {
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    store(LANG_KEY, 'auto');
    if (nav && nav.toLowerCase().indexOf('ja') !== 0) {
      location.replace('en/' + location.hash);
      return;
    }
  }

  /* ---------- store buttons: iPhone / iPad ---------- */
  var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) {
    document.querySelectorAll('[data-cta="live"]').forEach(function (el) {
      if (cfg.appStoreUrl) { el.href = cfg.appStoreUrl; el.textContent = cfg.ctaIos; }
      else el.hidden = true;
    });
    if (!cfg.appStoreUrl) document.querySelectorAll('[data-cta="off"]').forEach(function (el) { el.hidden = false; });
  }

  /* ---------- mobile menu ---------- */
  var menu = document.getElementById('mobile-menu');
  var menuBtn = document.querySelector('[data-action="menu"]');
  function setMenu(open) {
    if (!menu || !menuBtn) return;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
  document.querySelectorAll('[data-action="close-menu"]').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  /* ---------- screenshot lightbox ---------- */
  var box = document.getElementById('lightbox');
  var img = document.getElementById('lightbox-img');
  var shots = Array.prototype.slice.call(document.querySelectorAll('[data-shot]'));
  var current = 0, opener = null;

  function show(i) {
    current = (i + shots.length) % shots.length;
    var src = shots[current].querySelector('img');
    img.src = src.getAttribute('src');
    img.alt = src.getAttribute('alt');
    box.setAttribute('aria-label', src.getAttribute('alt'));
  }
  function open(i, btn) {
    opener = btn;
    show(i);
    box.hidden = false;
    document.body.classList.add('no-scroll');
    box.querySelector('[data-action="zoom-close"]').focus();
  }
  function close() {
    box.hidden = true;
    document.body.classList.remove('no-scroll');
    if (opener) opener.focus();
  }
  if (box && img) {
    shots.forEach(function (btn, i) { btn.addEventListener('click', function () { open(i, btn); }); });
    box.querySelector('[data-action="zoom-prev"]').addEventListener('click', function () { show(current - 1); });
    box.querySelector('[data-action="zoom-next"]').addEventListener('click', function () { show(current + 1); });
    box.querySelector('[data-action="zoom-close"]').addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
      else if (e.key === 'Tab') {
        var f = box.querySelectorAll('button');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
})();
