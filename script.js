// ============================================
// JUDAS · GALACTIC EXPERIENCE
// Interactive Cyberpunk Experience
// ============================================

// ============================================
// STARFIELD GENERATOR
// ============================================
function createStarfield() {
  const starfield = document.getElementById('starfield');
  const starCount = 200;
  
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    
    const size = Math.random() * 3 + 1;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const duration = Math.random() * 3 + 2;
    const delay = Math.random() * 5;
    
    star.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}%;
      top: ${y}%;
      animation-delay: ${delay}s;
      animation-duration: ${duration}s;
      opacity: ${Math.random() * 0.5 + 0.3};
    `;
    
    starfield.appendChild(star);
  }
}

// ============================================
// CUSTOM CURSOR
// ============================================
function initCursor() {
  const cursor = document.getElementById('cursor');
  const trail = document.getElementById('cursorTrail');
  
  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let trailX = 0, trailY = 0;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  
  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.1;
    cursorY += (mouseY - cursorY) * 0.1;
    trailX += (mouseX - trailX) * 0.05;
    trailY += (mouseY - trailY) * 0.05;
    
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    trail.style.left = trailX + 'px';
    trail.style.top = trailY + 'px';
    
    requestAnimationFrame(animateCursor);
  }
  
  animateCursor();
  
  // Hover effects
  const interactiveElements = document.querySelectorAll('a, button, .glass-card, .track');
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = 'scale(1.5)';
      cursor.style.borderColor = 'var(--neon-red-light)';
    });
    
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = 'scale(1)';
      cursor.style.borderColor = 'var(--neon-red)';
    });
  });
}

// ============================================
// SMOOTH SCROLL
// ============================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// ============================================
// COUNTER ANIMATION
// ============================================
function animateCounters() {
  const counters = document.querySelectorAll('.stat-number');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
          current += step;
          if (current < target) {
            counter.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target;
          }
        };
        
        updateCounter();
        observer.unobserve(counter);
      }
    });
  }, { threshold: 0.5 });
  
  counters.forEach(counter => observer.observe(counter));
}

// ============================================
// PARALLAX EFFECT
// ============================================
function initParallax() {
  const parallaxElements = document.querySelectorAll('.orbit-container, .kiss-orb');
  
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    
    parallaxElements.forEach(el => {
      const speed = 0.5;
      const yPos = -(scrolled * speed);
      el.style.transform = `translateY(${yPos}px)`;
    });
  });
}

// ============================================
// SECTION REVEAL ANIMATION
// ============================================
function initRevealAnimations() {
  const reveals = document.querySelectorAll('.glass-card, .section-header, .betrayal-card, .narrative-chapter, .track');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  reveals.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(50px)';
    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    observer.observe(el);
  });
}

// ============================================
// GLITCH EFFECT
// ============================================
function initGlitchEffect() {
  const glitchTitle = document.querySelector('.glitch-title');
  
  setInterval(() => {
    if (Math.random() > 0.95) {
      glitchTitle.style.textShadow = `
        ${Math.random() * 10 - 5}px ${Math.random() * 10 - 5}px 0 rgba(255, 0, 64, 0.8),
        ${Math.random() * 10 - 5}px ${Math.random() * 10 - 5}px 0 rgba(0, 255, 255, 0.8)
      `;
      
      setTimeout(() => {
        glitchTitle.style.textShadow = `
          0 0 20px var(--neon-red-glow),
          0 0 40px var(--neon-red-glow),
          0 0 60px var(--neon-red-glow)
        `;
      }, 100);
    }
  }, 100);
}

// ============================================
// TIMELINE ANIMATION
// ============================================
function initTimeline() {
  const timelineEvents = document.querySelectorAll('.timeline-event');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateX(0)';
      }
    });
  }, { threshold: 0.3 });
  
  timelineEvents.forEach((event, index) => {
    event.style.opacity = '0';
    event.style.transform = index % 2 === 0 ? 'translateX(-50px)' : 'translateX(50px)';
    event.style.transition = `opacity 0.8s ease ${index * 0.2}s, transform 0.8s ease ${index * 0.2}s`;
    observer.observe(event);
  });
}

// ============================================
// TRACK HOVER EFFECTS
// ============================================
function initTrackEffects() {
  const tracks = document.querySelectorAll('.track');
  
  tracks.forEach(track => {
    track.addEventListener('mouseenter', () => {
      const playBtn = track.querySelector('.track-play');
      playBtn.style.transform = 'scale(1.2)';
    });
    
    track.addEventListener('mouseleave', () => {
      const playBtn = track.querySelector('.track-play');
      playBtn.style.transform = 'scale(1)';
    });
    
    track.addEventListener('click', () => {
      const title = track.querySelector('.track-title').textContent;
      showNotification(`Reproduciendo: ${title}`);
    });
  });
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 1rem 2rem;
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--neon-red);
    border-radius: 10px;
    color: var(--neon-red);
    font-family: var(--font-display);
    letter-spacing: 0.1rem;
    box-shadow: 0 0 30px var(--neon-red-glow);
    z-index: 10001;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function enterExperience() {
  document.body.style.overflow = 'hidden';
  
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--neon-red);
    z-index: 9999;
    animation: flash 0.5s ease;
  `;
  
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    overlay.remove();
    document.body.style.overflow = '';
    document.querySelector('#traicion').scrollIntoView({ behavior: 'smooth' });
  }, 500);
}

function showTrailer() {
  const modal = document.getElementById('trailerModal');
  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('trailerModal');
  modal.classList.remove('active');
}

// Close modal on outside click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    closeModal();
  }
});

// Close modal on ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// ============================================
// SCROLL PROGRESS INDICATOR
// ============================================
function initScrollProgress() {
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 3px;
    background: linear-gradient(90deg, var(--neon-red), var(--neon-red-light));
    box-shadow: 0 0 20px var(--neon-red-glow);
    z-index: 10000;
    transition: width 0.1s ease;
  `;
  
  document.body.appendChild(progressBar);
  
  window.addEventListener('scroll', () => {
    const scrollPercent = (window.pageYOffset / (document.body.scrollHeight - window.innerHeight)) * 100;
    progressBar.style.width = scrollPercent + '%';
  });
}

// ============================================
// PARTICLE EFFECT ON CLICK
// ============================================
function initParticleEffect() {
  document.addEventListener('click', (e) => {
    for (let i = 0; i < 10; i++) {
      createParticle(e.clientX, e.clientY);
    }
  });
}

function createParticle(x, y) {
  const particle = document.createElement('div');
  const size = Math.random() * 10 + 5;
  const angle = Math.random() * Math.PI * 2;
  const velocity = Math.random() * 100 + 50;
  const vx = Math.cos(angle) * velocity;
  const vy = Math.sin(angle) * velocity;
  
  particle.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    width: ${size}px;
    height: ${size}px;
    background: var(--neon-red);
    border-radius: 50%;
    pointer-events: none;
    box-shadow: 0 0 20px var(--neon-red-glow);
    z-index: 9999;
  `;
  
  document.body.appendChild(particle);
  
  let posX = x;
  let posY = y;
  let opacity = 1;
  
  function animate() {
    posX += vx * 0.016;
    posY += vy * 0.016 + 0.5; // gravity
    opacity -= 0.02;
    
    particle.style.left = posX + 'px';
    particle.style.top = posY + 'px';
    particle.style.opacity = opacity;
    
    if (opacity > 0) {
      requestAnimationFrame(animate);
    } else {
      particle.remove();
    }
  }
  
  animate();
}

// ============================================
// AUDIO VISUALIZER (PLACEHOLDER)
// ============================================
function initAudioVisualizer() {
  // Placeholder for future audio integration
  console.log('🎵 Audio system ready');
}

// ============================================
// INITIALIZE EVERYTHING
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  createStarfield();
  initCursor();
  initSmoothScroll();
  animateCounters();
  initParallax();
  initRevealAnimations();
  initGlitchEffect();
  initTimeline();
  initTrackEffects();
  initScrollProgress();
  initParticleEffect();
  initAudioVisualizer();
  
  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes flash {
      0% { opacity: 0; }
      50% { opacity: 1; }
      100% { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  
  console.log('✞ JUDAS · GALACTIC EXPERIENCE initialized');
  console.log('🌌 The betrayal begins...');
});

// ============================================
// EASTER EGG: KONAMI CODE
// ============================================
let konamiCode = [];
const konamiSequence = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

document.addEventListener('keydown', (e) => {
  konamiCode.push(e.keyCode);
  
  if (konamiCode.length > konamiSequence.length) {
    konamiCode.shift();
  }
  
  if (JSON.stringify(konamiCode) === JSON.stringify(konamiSequence)) {
    activateEasterEgg();
  }
});

function activateEasterEgg() {
  document.body.style.animation = 'rainbow 2s linear';
  
  setTimeout(() => {
    document.body.style.animation = '';
    showNotification('✞ 30 MONEDAS DESBLOQUEADAS ✞');
  }, 2000);
}

// ============================================
// PERFORMANCE OPTIMIZATION
// ============================================
// Debounce scroll events
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle for better performance
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
