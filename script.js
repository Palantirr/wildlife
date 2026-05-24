// ==========================================
//  WILDFRAME — Interactive Wildlife Website
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

  // --- PRELOADER ---
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('hidden');
      document.querySelector('.hero').classList.add('in-view');
    }, 2200);
  });

  // --- CURSOR GLOW ---
  const cursorGlow = document.getElementById('cursorGlow');
  let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateGlow() {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    cursorGlow.style.left = glowX + 'px';
    cursorGlow.style.top = glowY + 'px';
    requestAnimationFrame(animateGlow);
  }
  animateGlow();

  // --- NAVBAR SCROLL ---
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 80);
  });

  // --- INTERSECTION OBSERVER FOR SCROLL ANIMATIONS ---
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.15
  };

  const animateObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');

        // Trigger counter animation for counter items
        const counter = entry.target.querySelector('.counter-num');
        if (counter && !counter.dataset.counted) {
          animateCounter(counter);
          counter.dataset.counted = 'true';
        }
      }
    });
  }, observerOptions);

  document.querySelectorAll('[data-animate]').forEach(el => {
    animateObserver.observe(el);
  });

  // Also observe section-headers, parallax-content, quote-section, featured-cards
  document.querySelectorAll('.section-header, .parallax-content, .quote-section, .featured-card, .masonry-item, .counter-item').forEach(el => {
    animateObserver.observe(el);
  });

  // --- COUNTER ANIMATION ---
  function animateCounter(el) {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.floor(eased * target);

      if (target >= 1000000) {
        el.textContent = (current / 1000000).toFixed(1) + 'M+';
      } else if (target >= 1000) {
        el.textContent = (current / 1000).toFixed(current >= 10000 ? 0 : 1) + 'K+';
      } else {
        el.textContent = current + '+';
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  // --- PARALLAX EFFECT ---
  const parallaxElements = document.querySelectorAll('[data-parallax]');

  function updateParallax() {
    const scrollY = window.scrollY;
    parallaxElements.forEach(el => {
      const speed = parseFloat(el.dataset.parallax);
      const rect = el.parentElement.getBoundingClientRect();
      const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.transform = `translateY(${centerOffset * speed}px)`;
    });
  }

  window.addEventListener('scroll', updateParallax, { passive: true });
  updateParallax();

  // --- HORIZONTAL SCROLL GALLERY ---
  const gallerySection = document.querySelector('.gallery-section');
  const galleryTrack = document.getElementById('galleryTrack');

  if (galleryTrack && gallerySection) {
    let isDown = false;
    let startX, scrollLeft;

    // Mouse drag scroll
    galleryTrack.addEventListener('mousedown', (e) => {
      isDown = true;
      galleryTrack.style.cursor = 'grabbing';
      startX = e.pageX;
      scrollLeft = currentTranslateX;
    });
    
    document.addEventListener('mouseup', () => {
      isDown = false;
      galleryTrack.style.cursor = 'grab';
    });

    let currentTranslateX = 0;

    document.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX;
      const walk = (x - startX) * 1.5;
      const maxScroll = -(galleryTrack.scrollWidth - gallerySection.clientWidth + 120);
      currentTranslateX = Math.max(maxScroll, Math.min(0, scrollLeft + walk));
      galleryTrack.style.transform = `translateX(${currentTranslateX}px)`;
    });

    // Wheel horizontal scroll — only hijack when gallery has room left to scroll
    gallerySection.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const maxScroll = -(galleryTrack.scrollWidth - gallerySection.clientWidth + 120);
        const atStart = currentTranslateX >= 0 && e.deltaY < 0;
        const atEnd   = currentTranslateX <= maxScroll && e.deltaY > 0;

        // If already at the edge, let the page scroll normally
        if (atStart || atEnd) return;

        e.preventDefault();
        currentTranslateX = Math.max(maxScroll, Math.min(0, currentTranslateX - e.deltaY * 2));
        galleryTrack.style.transform = `translateX(${currentTranslateX}px)`;
      }
    }, { passive: false });

    galleryTrack.style.cursor = 'grab';
  }

  // --- LIGHTBOX ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  document.querySelectorAll('[data-lightbox]').forEach(item => {
    item.addEventListener('click', (e) => {
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

  // --- SMOOTH SCROLL FOR NAV LINKS ---
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // --- STAGGERED MASONRY ANIMATIONS ---
  const masonryItems = document.querySelectorAll('.masonry-item');
  masonryItems.forEach((item, i) => {
    item.style.transitionDelay = `${(i % 3) * 0.12}s`;
  });

  // --- FEATURED CARD STAGGER ---
  const featuredCards = document.querySelectorAll('.featured-card');
  featuredCards.forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.15}s`;
  });

  // --- TILT EFFECT ON FEATURED CARDS ---
  featuredCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateY(0) rotateX(0) scale(1)';
    });
  });

  // --- HERO PARALLAX ON SCROLL ---
  const heroImg = document.getElementById('heroImg');
  window.addEventListener('scroll', () => {
    if (heroImg) {
      const scrolled = window.scrollY;
      heroImg.style.transform = `scale(${1.1 + scrolled * 0.0002}) translateY(${scrolled * 0.3}px)`;
      heroImg.style.filter = `brightness(${Math.max(0.15, 0.35 - scrolled * 0.0003)})`;
    }
  }, { passive: true });

});
