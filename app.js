/**
 * CTP Training Guides - Interactive JavaScript
 * Handles all interactive components: accordions, tabs, quizzes, progress, etc.
 */

(function() {
  'use strict';

  // ========================================
  // Utility Functions
  // ========================================
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function createElement(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  // ========================================
  // Accordion Component
  // ========================================
  function initAccordions() {
    $$('.accordion-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        const content = btn.nextElementSibling;

        // Close siblings if not multi-open
        const accordion = btn.closest('.accordion');
        if (accordion && !accordion.hasAttribute('data-multi')) {
          $$('.accordion-trigger[aria-expanded="true"]', accordion).forEach(other => {
            if (other !== btn) {
              other.setAttribute('aria-expanded', 'false');
              other.nextElementSibling.style.maxHeight = '0';
            }
          });
        }

        btn.setAttribute('aria-expanded', !expanded);
        content.style.maxHeight = expanded ? '0' : content.scrollHeight + 'px';
      });

      // Keyboard support
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = btn.closest('.accordion-item').nextElementSibling?.querySelector('.accordion-trigger');
          next?.focus();
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = btn.closest('.accordion-item').previousElementSibling?.querySelector('.accordion-trigger');
          prev?.focus();
        }
      });
    });
  }

  // ========================================
  // Tabs Component
  // ========================================
  function initTabs() {
    $$('.tabs').forEach(tabList => {
      const buttons = $$('.tab-btn', tabList);
      const panelsContainer = tabList.nextElementSibling;

      if (!panelsContainer || !panelsContainer.classList.contains('tab-panels')) return;

      const panels = $$('.tab-panel', panelsContainer);

      buttons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('active'));
          panels.forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          panels[index]?.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
          buttons.filter((_, i) => i !== index).forEach(b => b.setAttribute('aria-selected', 'false'));
        });

        btn.addEventListener('keydown', (e) => {
          let newIndex = index;
          if (e.key === 'ArrowLeft') newIndex = (index - 1 + buttons.length) % buttons.length;
          if (e.key === 'ArrowRight') newIndex = (index + 1) % buttons.length;
          if (e.key === 'Home') newIndex = 0;
          if (e.key === 'End') newIndex = buttons.length - 1;
          if (newIndex !== index) {
            e.preventDefault();
            buttons[newIndex].focus();
            buttons[newIndex].click();
          }
        });
      });
    });
  }

  // ========================================
  // Quiz / Self-Check Component
  // ========================================
  function initQuizzes() {
    $$('.quiz').forEach(quiz => {
      const questions = $$('.quiz-question', quiz);
      const submitBtn = $('.quiz-submit', quiz);
      const retryBtn = $('.quiz-retry', quiz);
      const scoreEl = $('.quiz-score', quiz);

      questions.forEach((q, qIndex) => {
        const options = $$('.quiz-option', q);
        const feedback = $('.quiz-feedback', q);

        options.forEach(opt => {
          const input = $('input', opt);
          opt.addEventListener('click', () => {
            if (opt.classList.contains('answered')) return;

            options.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            input.checked = true;
          });

          input.addEventListener('change', () => {
            if (input.checked) {
              options.forEach(o => o.classList.remove('selected'));
              opt.classList.add('selected');
            }
          });
        });

        q.dataset.correct = $('input[data-correct]', q)?.value || '';
      });

      if (submitBtn) {
        submitBtn.addEventListener('click', () => {
          let correct = 0;
          questions.forEach(q => {
            const selected = $('.quiz-option.selected input:checked', q);
            const correctVal = q.dataset.correct;
            const feedback = $('.quiz-feedback', q);

            options.forEach(opt => opt.classList.add('answered'));

            if (selected && selected.value === correctVal) {
              selected.closest('.quiz-option').classList.add('correct');
              feedback.textContent = '✅ إجابة صحيحة! ' + (feedback.dataset.explanation || '');
              feedback.className = 'quiz-feedback show correct';
              correct++;
            } else if (selected) {
              selected.closest('.quiz-option').classList.add('incorrect');
              // Show correct answer
              const correctOpt = $(`input[value="${correctVal}"]`, q)?.closest('.quiz-option');
              correctOpt?.classList.add('correct');
              feedback.textContent = '❌ إجابة غير صحيحة. ' + (feedback.dataset.explanation || '');
              feedback.className = 'quiz-feedback show incorrect';
            } else {
              feedback.textContent = '⚠️ يرجى اختيار إجابة.';
              feedback.className = 'quiz-feedback show warning';
            }
          });

          if (scoreEl) scoreEl.textContent = `النتيجة: ${correct} من ${questions.length}`;
          submitBtn.style.display = 'none';
          retryBtn?.style.removeProperty('display');
        });
      }

      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          questions.forEach(q => {
            $$('.quiz-option', q).forEach(opt => {
              opt.classList.remove('selected', 'correct', 'incorrect', 'answered');
            });
            const feedback = $('.quiz-feedback', q);
            feedback.className = 'quiz-feedback';
            feedback.textContent = '';
            $('input', q).checked = false;
          });
          if (scoreEl) scoreEl.textContent = '';
          submitBtn.style.removeProperty('display');
          retryBtn.style.display = 'none';
        });
      }
    });
  }

  // ========================================
  // Progress Ring Animation
  // ========================================
  function initProgressRings() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const ring = entry.target;
          const percent = parseFloat(ring.dataset.percent || '0');
          const fill = $('.progress-ring-fill', ring);
          const text = $('.progress-ring-text', ring);
          const circumference = 2 * Math.PI * 54; // r=54
          const offset = circumference - (percent / 100) * circumference;

          if (fill) {
            fill.style.strokeDasharray = circumference;
            fill.style.strokeDashoffset = circumference;
            // Trigger animation
            requestAnimationFrame(() => {
              fill.style.strokeDashoffset = offset;
            });
          }
          if (text) {
            let current = 0;
            const target = Math.round(percent);
            const duration = 1000;
            const start = performance.now();
            function animate(now) {
              const progress = Math.min((now - start) / duration, 1);
              text.textContent = Math.round(current + (target - current) * progress) + '%';
              if (progress < 1) requestAnimationFrame(animate);
            }
            requestAnimationFrame(animate);
          }
          observer.unobserve(ring);
        }
      });
    }, { threshold: 0.5 });

    $$('.progress-ring').forEach(ring => observer.observe(ring));
  }

  // ========================================
  // Smooth Scroll for Anchor Links
  // ========================================
  function initSmoothScroll() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerOffset = 90;
        const targetPos = target.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
        target.focus({ preventScroll: true });
        history.pushState(null, '', href);
      }
    });
  }

  // ========================================
  // Table of Contents Active State
  // ========================================
  function initTocSpy() {
    const tocLinks = $$('.toc-list a[href^="#"]');
    if (!tocLinks.length) return;

    const sections = tocLinks
      .map(l => document.querySelector(l.getAttribute('href')))
      .filter(Boolean);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          tocLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
        }
      });
    }, { rootMargin: '-100px 0px -66% 0px', threshold: 0 });

    sections.forEach(s => observer.observe(s));
  }

  // ========================================
  // Mobile Sidebar Toggle
  // ========================================
  function initMobileSidebar() {
    const toggleBtn = $('.mobile-menu-btn');
    const sidebar = $('.sidebar');
    const overlay = $('.sidebar-overlay');

    if (!toggleBtn || !sidebar) return;

    toggleBtn.addEventListener('click', () => {
      const open = sidebar.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', open);
      if (overlay) overlay.classList.toggle('visible', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
        toggleBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    }

    // Close on link click
    $$('.toc-list a', sidebar).forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
          sidebar.classList.remove('open');
          overlay?.classList.remove('visible');
          toggleBtn.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });
    });
  }

  // ========================================
  // Copy Code Buttons
  // ========================================
  function initCopyCode() {
    $$('pre code').forEach(codeBlock => {
      const pre = codeBlock.parentElement;
      if (pre.dataset.copyInitialized) return;
      pre.dataset.copyInitialized = 'true';

      const btn = createElement(`
        <button class="btn btn-ghost btn-sm" style="position:absolute;top:8px;left:8px;z-index:10" aria-label="نسخ الكود">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>نسخ</span>
        </button>
      `);
      pre.style.position = 'relative';
      pre.appendChild(btn);

      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(codeBlock.textContent);
          btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span>تم النسخ</span>';
          btn.classList.add('btn-success');
          setTimeout(() => {
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>نسخ</span>';
            btn.classList.remove('btn-success');
          }, 2000);
        } catch (err) {
          btn.textContent = 'فشل النسخ';
          setTimeout(() => btn.textContent = 'نسخ', 2000);
        }
      });
    });
  }

  // ========================================
  // Print / Save PDF Button
  // ========================================
  function initPrintButton() {
    $$('.btn-print').forEach(btn => {
      btn.addEventListener('click', () => window.print());
    });
  }

  // ========================================
  // Search/Filter for TOC (optional enhancement)
  // ========================================
  function initTocSearch() {
    const searchInput = $('.toc-search');
    if (!searchInput) return;

    const tocLinks = $$('.toc-list a');

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      tocLinks.forEach(link => {
        const text = link.textContent.toLowerCase();
        const li = link.closest('li');
        li.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  // ========================================
  // Interactive Demo Frames (Simulated UI)
  // ========================================
  function initDemoFrames() {
    $$('.demo-frame').forEach(frame => {
      const triggers = $$('[data-demo-trigger]', frame);
      triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
          const targetId = trigger.dataset.demoTrigger;
          const target = $('#' + targetId, frame);
          if (target) {
            $$('[data-demo-panel]', frame).forEach(p => p.hidden = true);
            target.hidden = false;
            triggers.forEach(t => t.classList.remove('active'));
            trigger.classList.add('active');
          }
        });
      });
    });
  }

  // ========================================
  // KPI Counter Animation
  // ========================================
  function initKpiCounters() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = entry.target;
          const valueEl = $('.kpi-value', card);
          const target = parseFloat(valueEl.dataset.target || valueEl.textContent);
          const suffix = valueEl.dataset.suffix || '';
          const prefix = valueEl.dataset.prefix || '';
          const isFloat = target % 1 !== 0;

          let current = 0;
          const duration = 1500;
          const start = performance.now();

          function animate(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            const currentVal = target * eased;
            valueEl.textContent = prefix + (isFloat ? currentVal.toFixed(1) : Math.round(currentVal)) + suffix;
            if (progress < 1) requestAnimationFrame(animate);
          }
          requestAnimationFrame(animate);
          observer.unobserve(card);
        }
      });
    }, { threshold: 0.5 });

    $$('.kpi-card').forEach(card => observer.observe(card));
  }

  // ========================================
  // Checklist Persistence
  // ========================================
  function initChecklistPersistence() {
    $$('.checklist input[type="checkbox"]').forEach(checkbox => {
      const key = 'ctp-checklist-' + checkbox.closest('.checklist').dataset.listId + '-' + Array.from(checkbox.closest('.checklist').querySelectorAll('input')).indexOf(checkbox);
      const saved = localStorage.getItem(key);
      if (saved === 'true') checkbox.checked = true;

      checkbox.addEventListener('change', () => {
        localStorage.setItem(key, checkbox.checked);
      });
    });
  }

  // ========================================
  // Screenshot Zoom Modal
  // ========================================
  function initScreenshotZoom() {
    $$('.screenshot-frame img, .figure img').forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => {
        const modal = createElement(`
          <div class="zoom-modal" role="dialog" aria-modal="true" aria-label="صورة مكبرة">
            <div class="zoom-backdrop"></div>
            <div class="zoom-content">
              <button class="zoom-close" aria-label="إغلاق">&times;</button>
              <img src="${img.src}" alt="${img.alt || ''}">
            </div>
          </div>
        `);
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        const close = () => {
          modal.remove();
          document.body.style.overflow = '';
        };

        $('.zoom-close', modal).addEventListener('click', close);
        $('.zoom-backdrop', modal).addEventListener('click', close);
        modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

        // Add styles for modal if not present
        if (!$('#zoom-modal-styles')) {
          const style = document.createElement('style');
          style.id = 'zoom-modal-styles';
          style.textContent = `
            .zoom-modal { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; }
            .zoom-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.9); animation: fadeIn 0.2s ease; }
            .zoom-content { position: relative; max-width: 95vw; max-height: 95vh; animation: slideUp 0.3s ease; }
            .zoom-content img { max-width: 100%; max-height: 90vh; border-radius: 8px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
            .zoom-close { position: absolute; top: -50px; left: 0; width: 44px; height: 44px; border: 0; background: rgba(255,255,255,0.1); color: #fff; border-radius: 50%; font-size: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
            .zoom-close:hover { background: rgba(255,255,255,0.3); }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          `;
          document.head.appendChild(style);
        }
      });
    });
  }

  // ========================================
  // Initialize All Components
  // ========================================
  function init() {
    initAccordions();
    initTabs();
    initQuizzes();
    initProgressRings();
    initSmoothScroll();
    initTocSpy();
    initMobileSidebar();
    initCopyCode();
    initPrintButton();
    initTocSearch();
    initDemoFrames();
    initKpiCounters();
    initChecklistPersistence();
    initScreenshotZoom();

    // Add loaded class for CSS animations
    document.documentElement.classList.add('ctp-loaded');
  }

  onReady(init);

  // Expose for manual initialization if needed
  window.CTPGuides = {
    init,
    initAccordions,
    initTabs,
    initQuizzes
  };
})();