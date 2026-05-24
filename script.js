// ==========================================
//  WILDFRAME — Interactive Wildlife Website
//  Performance: 120fps RAF-based engine
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  // SMOOTH SCROLL ENGINE  — replaces CSS scroll-behavior:smooth
  // Uses RAF + lerp for butter-smooth 120fps scrolling
  // ============================================================
  let targetScrollY = window.scrollY;
  let currentScrollY = window.scrollY;
  let isScrolling = false;
  const SCROLL_LERP = 0.10; // lower = smoother but slower (0.08–0.12 sweet spot)
  const SCROLL_EASE_THRESHOLD = 0.5; // stop animating below 0.5px diff

  function scrollLoop() {
    const diff = targetScrollY - currentScrollY;
    if (Math.abs(diff) < SCROLL_EASE_THRESHOLD) {
      currentScrollY = targetScrollY;
      window.scrollTo(0, currentScrollY);
      isScrolling = false;
      return;
    }
    currentScrollY += diff * SCROLL_LERP;
    window.scrollTo(0, currentScrollY);
    requestAnimationFrame(scrollLoop);
  }

  // --- Shared helper: will the gallery consume this wheel event? ---
  // Both the page scroller and gallery handler call this to avoid gaps
  // where neither fires preventDefault (which causes native-scroll jank).
  function galleryWillHandle(e) {
    const gs = document.querySelector('.gallery-section');
    const gt = document.getElementById('galleryTrack');
    if (!gs || !gt) return false;
    const rect = gs.getBoundingClientRect();
    if (e.clientY < rect.top || e.clientY > rect.bottom) return false;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return false;
    const maxScroll = -(gt.scrollWidth - gs.clientWidth + 120);
    // expose the gallery state via a closure-friendly global flag
    const atStart = (window._galleryX || 0) >= 0 && e.deltaY < 0;
    const atEnd   = (window._galleryX || 0) <= maxScroll && e.deltaY > 0;
    return !atStart && !atEnd; // gallery will handle it
  }

  // Intercept wheel events for smooth page scroll
  window.addEventListener('wheel', (e) => {
    // Always call preventDefault so native scroll never fires.
    // If the gallery will handle this, skip updating targetScrollY.
    e.preventDefault();
    if (galleryWillHandle(e)) return; // gallery's own handler will run next

    targetScrollY = Math.max(0,
      Math.min(
        document.documentElement.scrollHeight - window.innerHeight,
        targetScrollY + e.deltaY * 1.4
      )
    );
    currentScrollY = window.scrollY;
    if (!isScrolling) {
      isScrolling = true;
      requestAnimationFrame(scrollLoop);
    }
  }, { passive: false });

  // Touch support for smooth scroll
  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    currentScrollY = window.scrollY;
    targetScrollY = currentScrollY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    const delta = touchStartY - e.touches[0].clientY;
    touchStartY = e.touches[0].clientY;
    targetScrollY = Math.max(0,
      Math.min(document.documentElement.scrollHeight - window.innerHeight, targetScrollY + delta)
    );
    if (!isScrolling) {
      isScrolling = true;
      requestAnimationFrame(scrollLoop);
    }
  }, { passive: true });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('href');
      const target = document.querySelector(id);
      if (target) {
        currentScrollY = window.scrollY;
        targetScrollY = target.getBoundingClientRect().top + window.scrollY - 80;
        if (!isScrolling) {
          isScrolling = true;
          requestAnimationFrame(scrollLoop);
        }
      }
    });
  });


  // ============================================================
  // CURSOR GLOW — RAF lerp, translate3d for GPU composite layer
  // ============================================================
  const cursorGlow = document.getElementById('cursorGlow');
  let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  function animateGlow() {
    glowX += (mouseX - glowX) * 0.07;
    glowY += (mouseY - glowY) * 0.07;
    cursorGlow.style.transform = `translate3d(calc(${glowX}px - 50%), calc(${glowY}px - 50%), 0)`;
    requestAnimationFrame(animateGlow);
  }
  // Override inline left/top with transform3d
  cursorGlow.style.left = '0';
  cursorGlow.style.top = '0';
  animateGlow();


  // ============================================================
  // PRELOADER
  // ============================================================
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('hidden');
      document.querySelector('.hero').classList.add('in-view');
    }, 2200);
  });


  // ============================================================
  // NAVBAR SCROLL — batched via RAF flag
  // ============================================================
  const navbar = document.getElementById('navbar');
  let navTicking = false;

  window.addEventListener('scroll', () => {
    if (!navTicking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 80);
        navTicking = false;
      });
      navTicking = true;
    }
  }, { passive: true });


  // ============================================================
  // INTERSECTION OBSERVER — scroll-triggered animations
  // ============================================================
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.12
  };

  const animateObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        const counter = entry.target.querySelector('.counter-num');
        if (counter && !counter.dataset.counted) {
          animateCounter(counter);
          counter.dataset.counted = 'true';
        }
      }
    });
  }, observerOptions);

  document.querySelectorAll('[data-animate]').forEach(el => animateObserver.observe(el));
  document.querySelectorAll(
    '.section-header, .parallax-content, .quote-section, .featured-card, .masonry-item, .counter-item'
  ).forEach(el => animateObserver.observe(el));


  // ============================================================
  // COUNTER ANIMATION
  // ============================================================
  function animateCounter(el) {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);

      if (target >= 1000000) {
        el.textContent = (current / 1000000).toFixed(1) + 'M+';
      } else if (target >= 1000) {
        el.textContent = (current / 1000).toFixed(current >= 10000 ? 0 : 1) + 'K+';
      } else {
        el.textContent = current + '+';
      }
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }


  // ============================================================
  // PARALLAX — RAF batched, translate3d for GPU
  // ============================================================
  const parallaxElements = document.querySelectorAll('[data-parallax]');
  let parallaxTicking = false;

  function updateParallax() {
    const scrollY = window.scrollY;
    parallaxElements.forEach(el => {
      const speed = parseFloat(el.dataset.parallax);
      const rect = el.parentElement.getBoundingClientRect();
      const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${centerOffset * speed}px, 0)`;
    });
    parallaxTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!parallaxTicking) {
      requestAnimationFrame(updateParallax);
      parallaxTicking = true;
    }
  }, { passive: true });
  updateParallax();


  // ============================================================
  // HERO PARALLAX — RAF batched
  // ============================================================
  const heroImg = document.getElementById('heroImg');
  let heroTicking = false;

  window.addEventListener('scroll', () => {
    if (!heroTicking && heroImg) {
      requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        const scale = 1.1 + scrolled * 0.00015;
        const ty = scrolled * 0.25;
        const brightness = Math.max(0.15, 0.35 - scrolled * 0.0003);
        heroImg.style.transform = `scale3d(${scale},${scale},1) translate3d(0,${ty}px,0)`;
        heroImg.style.filter = `brightness(${brightness})`;
        heroTicking = false;
      });
      heroTicking = true;
    }
  }, { passive: true });


  // ============================================================
  // HORIZONTAL SCROLL GALLERY
  // Full RAF momentum scroller — no CSS transitions on the track
  // ============================================================
  const gallerySection = document.querySelector('.gallery-section');
  const galleryTrack = document.getElementById('galleryTrack');

  if (galleryTrack && gallerySection) {
    let targetX = 0;
    let currentX = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartTranslate = 0;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let galleryRafId = null;
    const GALLERY_LERP = 0.12;
    const FRICTION = 0.88; // momentum friction

    function getMaxScroll() {
      return -(galleryTrack.scrollWidth - gallerySection.clientWidth + 120);
    }

    function clamp(val, min, max) {
      return Math.max(min, Math.min(max, val));
    }

    // Expose current gallery X for the galleryWillHandle() helper above
    function syncGalleryState() { window._galleryX = targetX; }

    function galleryLoop() {
      const diff = targetX - currentX;
      syncGalleryState();
      if (Math.abs(diff) < 0.05 && Math.abs(velocity) < 0.05) {
        currentX = targetX;
        galleryTrack.style.transform = `translate3d(${currentX}px, 0, 0)`;
        galleryRafId = null;
        return;
      }
      currentX += diff * GALLERY_LERP;
      galleryTrack.style.transform = `translate3d(${currentX}px, 0, 0)`;
      galleryRafId = requestAnimationFrame(galleryLoop);
    }

    function startGalleryLoop() {
      if (!galleryRafId) galleryRafId = requestAnimationFrame(galleryLoop);
    }

    // Mouse drag
    galleryTrack.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartTranslate = currentX;
      velocity = 0;
      lastX = e.clientX;
      lastTime = performance.now();
      galleryTrack.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const now = performance.now();
      const dt = now - lastTime;
      if (dt > 0) {
        velocity = (e.clientX - lastX) / dt * 16; // normalize to ~16ms frame
        lastX = e.clientX;
        lastTime = now;
      }
      const walk = e.clientX - dragStartX;
      targetX = clamp(dragStartTranslate + walk, getMaxScroll(), 0);
      startGalleryLoop();
    }, { passive: true });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      galleryTrack.style.cursor = 'grab';
      // Apply momentum
      function momentum() {
        velocity *= FRICTION;
        if (Math.abs(velocity) < 0.1) return;
        targetX = clamp(targetX + velocity, getMaxScroll(), 0);
        startGalleryLoop();
        requestAnimationFrame(momentum);
      }
      requestAnimationFrame(momentum);
    });

    // Touch drag
    let touchStartXGallery = 0;
    let touchStartTranslate = 0;
    galleryTrack.addEventListener('touchstart', (e) => {
      touchStartXGallery = e.touches[0].clientX;
      touchStartTranslate = currentX;
      velocity = 0;
      lastX = touchStartXGallery;
      lastTime = performance.now();
    }, { passive: true });

    galleryTrack.addEventListener('touchmove', (e) => {
      const now = performance.now();
      const dt = now - lastTime;
      if (dt > 0) {
        velocity = (e.touches[0].clientX - lastX) / dt * 16;
        lastX = e.touches[0].clientX;
        lastTime = now;
      }
      const walk = e.touches[0].clientX - touchStartXGallery;
      targetX = clamp(touchStartTranslate + walk, getMaxScroll(), 0);
      startGalleryLoop();
    }, { passive: true });

    galleryTrack.addEventListener('touchend', () => {
      function momentum() {
        velocity *= FRICTION;
        if (Math.abs(velocity) < 0.1) return;
        targetX = clamp(targetX + velocity, getMaxScroll(), 0);
        startGalleryLoop();
        requestAnimationFrame(momentum);
      }
      requestAnimationFrame(momentum);
    });

    // Wheel on gallery section — horizontal scroll with smooth momentum.
    // The window handler already called preventDefault on ALL wheel events,
    // so we just need to move the gallery track when appropriate.
    gallerySection.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const max = getMaxScroll();
        const atStart = targetX >= 0 && e.deltaY < 0;
        const atEnd   = targetX <= max && e.deltaY > 0;
        if (atStart || atEnd) {
          // Edge reached — hand back to page smooth-scroll.
          // Update the page targetScrollY directly.
          targetScrollY = Math.max(0,
            Math.min(
              document.documentElement.scrollHeight - window.innerHeight,
              targetScrollY + e.deltaY * 1.4
            )
          );
          currentScrollY = window.scrollY;
          if (!isScrolling) { isScrolling = true; requestAnimationFrame(scrollLoop); }
          return;
        }
        targetX = clamp(targetX - e.deltaY * 1.8, max, 0);
        startGalleryLoop();
      }
    }, { passive: false });

    galleryTrack.style.cursor = 'grab';
    // Set initial position without transition
    galleryTrack.style.transform = `translate3d(0, 0, 0)`;
  }


  // ============================================================
  // LIGHTBOX
  // ============================================================
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  document.querySelectorAll('[data-lightbox]').forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (img) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  lightboxClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeLightbox();
  });
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });


  // ============================================================
  // TILT EFFECT ON FEATURED CARDS — RAF-throttled
  // ============================================================
  const featuredCards = document.querySelectorAll('.featured-card');
  featuredCards.forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.15}s`;

    let tiltRaf = null;
    card.addEventListener('mousemove', (e) => {
      if (tiltRaf) return;
      tiltRaf = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale3d(1.02,1.02,1)`;
        tiltRaf = null;
      });
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateY(0) rotateX(0) scale3d(1,1,1)';
    });
  });


  // ============================================================
  // STAGGERED MASONRY ANIMATIONS
  // ============================================================
  document.querySelectorAll('.masonry-item').forEach((item, i) => {
    item.style.transitionDelay = `${(i % 3) * 0.1}s`;
  });

});
