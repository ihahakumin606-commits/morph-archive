document.body.classList.add('is-loading');

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const heroImage = document.querySelector('.hero-media img');
const specimenImages = [...document.querySelectorAll('.specimen-media img')];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
let loadingFinished = false;
let loadingComplete = false;

function finishLoading() {
  if (loadingFinished) return;
  loadingFinished = true;
  document.body.classList.add('is-ready');
  document.body.classList.remove('is-loading');
}
setTimeout(finishLoading, 3000);

if (reduced) {
  finishLoading();
} else {
  const count = document.querySelector('.loader-count');
  const bar = document.querySelector('.loader-track i');
  const startedAt = performance.now();
  let value = 0;
  const paint = () => {
    if (count) count.textContent = String(value).padStart(3, '0');
    if (bar) bar.style.transform = `scaleX(${value / 100})`;
  };
  const tick = (now) => {
    if (loadingComplete) return;
    const target = Math.min(92, ((now - startedAt) / 1100) * 92);
    value += Math.max(.5, (target - value) * .12);
    value = Math.round(Math.min(value, 92));
    paint();
    if (!loadingFinished && value < 92) requestAnimationFrame(tick);
  };
  const heroReady = heroImage?.decode ? heroImage.decode().catch(() => undefined) : Promise.resolve();
  const minimumDisplay = new Promise((resolve) => setTimeout(resolve, 620));
  const complete = () => {
    if (loadingComplete) return;
    loadingComplete = true;
    value = 100;
    paint();
    setTimeout(finishLoading, 220);
  };
  requestAnimationFrame(tick);
  Promise.all([heroReady, minimumDisplay]).then(complete);
  setTimeout(complete, 2400);
}

if ('IntersectionObserver' in window && !reduced) {
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .18 });
document.documentElement.classList.add('has-reveals');
document.querySelectorAll('.reveal, .reveal-media').forEach((node) => revealObserver.observe(node));
}

const progress = document.querySelector('.progress i');
let scrollY = window.scrollY;
let ticking = false;

function renderScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  if (progress) progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  if (!reduced) {
    if (heroImage) heroImage.style.translate = `0 ${scrollY * .08}px`;
    specimenImages.forEach((image) => {
      const section = image.closest('.specimen');
      const media = image.closest('.specimen-media');
      const rect = section.getBoundingClientRect();
      const local = clamp((innerHeight - rect.top) / (rect.height + innerHeight), 0, 1);
      media?.style.setProperty('--progress', local.toFixed(3));
      if (section.classList.contains('specimen-blue')) {
        const x = (local - .5) * 7;
        const y = -7 + local * 4;
        image.style.transform = `translate3d(${x.toFixed(2)}%, ${y.toFixed(2)}%, 0) scale(1.07)`;
      } else if (section.classList.contains('specimen-acid')) {
        const scale = 1.01 + local * .075;
        const y = -7 + local * 3;
        image.style.transform = `translate3d(0, ${y.toFixed(2)}%, 0) scale(${scale.toFixed(3)})`;
        image.style.filter = `saturate(${(.86 + local * .32).toFixed(2)})`;
      } else {
        const scale = 1.13 - local * .09;
        const y = -3 - local * 2;
        image.style.transform = `translate3d(0, ${y.toFixed(2)}%, 0) scale(${scale.toFixed(3)})`;
        image.style.filter = `brightness(${(1.04 - local * .22).toFixed(2)}) contrast(${(1.03 + local * .12).toFixed(2)})`;
      }
    });
  }
  ticking = false;
}

addEventListener('scroll', () => {
  scrollY = window.scrollY;
  if (!ticking) {
    requestAnimationFrame(renderScroll);
    ticking = true;
  }
}, { passive: true });
renderScroll();
addEventListener('load', () => {
  scrollY = window.scrollY;
  renderScroll();
}, { once: true });

if (finePointer && !reduced) {
  document.documentElement.classList.add('has-custom-cursor');
  const cursor = document.querySelector('.cursor');
  const cursorLabel = cursor?.querySelector('span');
  let cx = innerWidth / 2;
  let cy = innerHeight / 2;
  let tx = cx;
  let ty = cy;

  addEventListener('pointermove', (event) => {
    tx = event.clientX;
    ty = event.clientY;
    cursor?.classList.add('is-visible');
  }, { passive: true });

  const cursorLoop = () => {
    cx += (tx - cx) * .18;
    cy += (ty - cy) * .18;
    if (cursor) {
      cursor.style.left = `${cx}px`;
      cursor.style.top = `${cy}px`;
    }
    requestAnimationFrame(cursorLoop);
  };
  cursorLoop();
  document.documentElement.addEventListener('pointerleave', () => cursor?.classList.remove('is-visible'));
  addEventListener('scroll', () => {
    cursor?.classList.remove('is-visible', 'is-active');
    if (cursorLabel) cursorLabel.textContent = 'VIEW';
  }, { passive: true });

  document.querySelectorAll('[data-cursor]').forEach((node) => {
    node.addEventListener('pointerenter', () => {
      cursor?.classList.add('is-active');
      if (cursorLabel) cursorLabel.textContent = node.dataset.cursor;
    });
    node.addEventListener('pointerleave', () => {
      cursor?.classList.remove('is-active');
      if (cursorLabel) cursorLabel.textContent = 'VIEW';
    });
  });

  document.querySelectorAll('.magnetic').forEach((node) => {
    node.addEventListener('pointermove', (event) => {
      const rect = node.getBoundingClientRect();
      node.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .16}px, ${(event.clientY - rect.top - rect.height / 2) * .16}px)`;
    });
    node.addEventListener('pointerleave', () => { node.style.transform = ''; });
  });

  const preview = document.querySelector('.archive-preview');
  const previewImage = preview?.querySelector('img');
  const showPreview = (row) => {
    if (previewImage && previewImage.getAttribute('src') !== row.dataset.preview) {
      preview?.classList.remove('is-visible');
      previewImage.src = row.dataset.preview;
      requestAnimationFrame(() => preview?.classList.add('is-visible'));
    } else {
      preview?.classList.add('is-visible');
    }
    if (preview) {
      const rect = row.getBoundingClientRect();
      const halfWidth = preview.offsetWidth / 2;
      const halfHeight = preview.offsetHeight / 2;
      preview.style.left = `${clamp(innerWidth * .72, halfWidth + 20, innerWidth - halfWidth - 20)}px`;
      preview.style.top = `${clamp(rect.top + rect.height / 2, halfHeight + 20, innerHeight - halfHeight - 20)}px`;
    }
  };
  document.querySelectorAll('.archive-row').forEach((row) => {
    row.addEventListener('pointerenter', () => showPreview(row));
    row.addEventListener('focus', () => showPreview(row));
    row.addEventListener('pointermove', (event) => {
      if (preview) {
        const halfWidth = preview.offsetWidth / 2;
        const halfHeight = preview.offsetHeight / 2;
        preview.style.left = `${clamp(event.clientX, halfWidth + 20, innerWidth - halfWidth - 20)}px`;
        preview.style.top = `${clamp(event.clientY, halfHeight + 20, innerHeight - halfHeight - 20)}px`;
      }
    });
    row.addEventListener('pointerleave', () => preview?.classList.remove('is-visible'));
    row.addEventListener('blur', () => preview?.classList.remove('is-visible'));
  });
}

document.querySelector('.to-top')?.addEventListener('click', () => {
  scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
});
