// ===== UI Utilities =====

// Toast notifications
function showToast(message, type = 'default', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn .3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Modal helpers
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('show');
  }
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
    // Also close lightbox
    const lb = document.getElementById('lightbox');
    if (lb && lb.classList.contains('show')) {
      closeLightbox();
    }
  }
});

// Loading overlay
function showLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.add('show');
}

function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.remove('show');
}

// Format date
function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Format file size
function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ===== Lightbox / Slideshow =====
let lightboxPhotos = [];
let lightboxIndex = 0;
let slideshowTimer = null;
let slideshowInterval = 3000;

function openLightbox(photos, startIndex = 0) {
  lightboxPhotos = photos;
  lightboxIndex = startIndex;
  const lb = document.getElementById('lightbox');
  lb.classList.add('show');
  renderLightboxImage();
  renderDots();
  document.body.style.overflow = 'hidden';

  // Reset slideshow UI state when opening lightbox manually
  stopSlideshow();
  const btn = document.getElementById('slideshow-btn');
  const indicator = document.getElementById('slideshow-indicator');
  if (btn) btn.classList.remove('active');
  if (indicator) indicator.classList.remove('show');
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('show');
  stopSlideshow();
  document.body.style.overflow = '';
}

function renderLightboxImage() {
  const img = document.getElementById('lightbox-img');
  const title = document.getElementById('lightbox-title');
  const counter = document.getElementById('lightbox-counter');

  const photo = lightboxPhotos[lightboxIndex];
  if (!photo) return;

  img.classList.add('fade');
  setTimeout(() => {
    img.src = Photos.imageUrl(photo.id);
    img.alt = photo.original_name;
    img.classList.remove('fade');
  }, 200);

  if (title) title.textContent = photo.original_name;
  if (counter) counter.textContent = `${lightboxIndex + 1} / ${lightboxPhotos.length}`;

  // Update dots
  document.querySelectorAll('.lightbox-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === lightboxIndex);
  });
}

function renderDots() {
  const footer = document.getElementById('lightbox-footer');
  if (!footer) return;
  footer.innerHTML = '';
  if (lightboxPhotos.length <= 1) return;

  const maxDots = Math.min(lightboxPhotos.length, 20);
  for (let i = 0; i < maxDots; i++) {
    const dot = document.createElement('div');
    dot.className = `lightbox-dot${i === lightboxIndex ? ' active' : ''}`;
    dot.onclick = () => { lightboxIndex = i; renderLightboxImage(); };
    footer.appendChild(dot);
  }
}

function lightboxPrev() {
  lightboxIndex = (lightboxIndex - 1 + lightboxPhotos.length) % lightboxPhotos.length;
  renderLightboxImage();
}

function lightboxNext() {
  lightboxIndex = (lightboxIndex + 1) % lightboxPhotos.length;
  renderLightboxImage();
}

function toggleSlideshow() {
  const btn = document.getElementById('slideshow-btn');
  const indicator = document.getElementById('slideshow-indicator');

  if (slideshowTimer) {
    stopSlideshow();
    if (btn) btn.classList.remove('active');
    if (indicator) indicator.classList.remove('show');
  } else {
    startSlideshow();
    if (btn) btn.classList.add('active');
    if (indicator) indicator.classList.add('show');
  }
}

function startSlideshow() {
  slideshowTimer = setInterval(() => {
    lightboxNext();
  }, slideshowInterval);
}

function stopSlideshow() {
  if (slideshowTimer) {
    clearInterval(slideshowTimer);
    slideshowTimer = null;
  }
}

// Keyboard navigation for lightbox
document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('show')) return;

  if (e.key === 'ArrowLeft') lightboxPrev();
  if (e.key === 'ArrowRight') lightboxNext();
  if (e.key === ' ') { e.preventDefault(); toggleSlideshow(); }
});

// Touch/swipe support for lightbox
let touchStartX = 0;
document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('show')) return;

  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) {
    if (diff > 0) lightboxNext();
    else lightboxPrev();
  }
}, { passive: true });
