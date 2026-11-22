// content.js — injected into reddit.com pages
// Intercepts the notification bell and replaces its click with our custom dropdown.

(function () {
  'use strict';

  const DROPDOWN_ID   = 'rnd-dropdown';
  const NOTIFICATIONS_URL = 'https://www.reddit.com/notifications/';

  // ─── Selectors for Reddit's bell button ─────────────────────────────────────
  // Reddit (shreddit) uses web components. We try multiple selectors for resilience.
  const BELL_SELECTORS = [
    'a[href="/notifications/"]',
    'button[aria-label*="notification" i]',
    'button[aria-label*="Notification" i]',
    '[data-testid="notification-bell"]',
    'faceplate-tracker[noun="notification_bell"]',
    'a[href*="notifications"]',
  ];

  let dropdown = null;
  let isOpen   = false;

  // ─── Find the bell element ───────────────────────────────────────────────────
  function findBell() {
    for (const sel of BELL_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  // ─── Build and inject the dropdown DOM ──────────────────────────────────────
  function createDropdown() {
    const div = document.createElement('div');
    div.id = DROPDOWN_ID;
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-label', 'Notifications');
    div.innerHTML = `
      <div class="rnd-header">
        <span class="rnd-title">Notifications</span>
        <a class="rnd-view-all" href="https://www.reddit.com/notifications/" target="_blank">
          View all
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
      <div class="rnd-frame-container">
        <div class="rnd-loading" id="rnd-status">Loading notifications...</div>
        <iframe class="rnd-frame" title="Reddit notifications"></iframe>
      </div>
    `;
    document.body.appendChild(div);
    return div;
  }

  // ─── Position dropdown below the bell ───────────────────────────────────────
  function positionDropdown(bell) {
    const rect = bell.getBoundingClientRect();
    const dd   = dropdown;

    dd.style.top  = `${rect.bottom + 6}px`;

    // Try to align right edge with bell, but keep within viewport
    const width = dd.offsetWidth;
    let left = rect.right - width;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    dd.style.left = `${left}px`;
  }

  // Keep only the branch containing Reddit's notification manager visible.
  function prepareFrame(frame) {
    const status = dropdown.querySelector('#rnd-status');
    let doc;
    try {
      doc = frame.contentDocument;
      if (!doc || doc.location.origin !== location.origin) throw new Error('Unexpected origin');
    } catch (_) {
      status.textContent = 'Could not load notifications. Use View all to open Reddit.';
      return;
    }

    const isolate = () => {
      const feed = doc.querySelector('notifications-main-manager') ||
        (doc.querySelector('main notification-item') && doc.querySelector('main'));
      if (!feed) return false;

      let node = feed;
      while (node && node !== doc.body) {
        const parent = node.parentElement;
        if (!parent) return false;
        for (const sibling of parent.children) {
          if (sibling !== node) sibling.style.setProperty('display', 'none', 'important');
        }
        if (node !== feed) node.style.setProperty('display', 'block', 'important');
        node.style.setProperty('width', '100%', 'important');
        node.style.setProperty('max-width', 'none', 'important');
        node.style.setProperty('margin', '0', 'important');
        node.style.setProperty('padding', node === feed ? '12px 16px' : '0', 'important');
        node.style.setProperty('box-sizing', 'border-box', 'important');
        node = parent;
      }
      doc.body.style.setProperty('margin', '0', 'important');
      frame.classList.add('rnd-frame--ready');
      status.hidden = true;
      return true;
    };

    if (!isolate()) {
      const observer = new MutationObserver(() => {
        if (isolate()) observer.disconnect();
      });
      observer.observe(doc.documentElement, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        if (!frame.classList.contains('rnd-frame--ready')) {
          status.textContent = 'Could not load notifications. Use View all to open Reddit.';
        }
      }, 15000);
    }
  }

  // ─── Open / close dropdown ───────────────────────────────────────────────────
  function openDropdown(bell) {
    if (!dropdown) dropdown = createDropdown();

    positionDropdown(bell);
    dropdown.classList.add('rnd-open');
    isOpen = true;

    const frame = dropdown.querySelector('.rnd-frame');
    const status = dropdown.querySelector('#rnd-status');
    // Reuse the loaded feed when reopening instead of hiding it for another load.
    if (frame.classList.contains('rnd-frame--ready')) return;
    frame.classList.remove('rnd-frame--ready');
    status.hidden = false;
    status.textContent = 'Loading notifications...';
    frame.onload = () => prepareFrame(frame);
    frame.src = NOTIFICATIONS_URL;
    setTimeout(() => {
      if (!frame.classList.contains('rnd-frame--ready') && !status.hidden) {
        status.textContent = 'Could not load notifications. Use View all to open Reddit.';
      }
    }, 15000);
  }

  function closeDropdown() {
    if (dropdown) dropdown.classList.remove('rnd-open');
    isOpen = false;
  }

  // ─── Intercept the bell click ────────────────────────────────────────────────
  function interceptBell(bell) {
    // Mark so we don't double-bind
    if (bell.dataset.rndHooked) return;
    bell.dataset.rndHooked = 'true';

    bell.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown(bell);
      }
    }, true); // capture phase so we beat Reddit's own handlers
  }

  // ─── Close on outside click ──────────────────────────────────────────────────
  document.addEventListener('click', (e) => {
    if (!isOpen) return;
    if (dropdown && dropdown.contains(e.target)) return;

    const bell = findBell();
    if (bell && bell.contains(e.target)) return;

    closeDropdown();
  });

  // Keep the dropdown aligned if Reddit's navigation moves or the viewport changes.
  function repositionOpenDropdown() {
    if (!isOpen) return;
    const bell = findBell();
    if (bell) positionDropdown(bell);
  }
  window.addEventListener('scroll', repositionOpenDropdown, { passive: true });
  window.addEventListener('resize', repositionOpenDropdown);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeDropdown();
  });

  // ─── Observer: wait for the bell to appear (Reddit is a SPA) ────────────────
  function tryHook() {
    const bell = findBell();
    if (bell) {
      interceptBell(bell);
      return true;
    }
    return false;
  }

  // Try immediately, then watch for DOM changes
  if (!tryHook()) {
    const observer = new MutationObserver(() => {
      if (tryHook()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Re-hook on Reddit SPA navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      closeDropdown();
      setTimeout(tryHook, 800);
    }
  }).observe(document, { subtree: true, childList: true });

})();
