/**
 * Renders a Google Photos-style justified grid from ./photos.json,
 * plus a minimal full-screen lightbox. No build step, no dependencies.
 */
(function () {
  'use strict';

  const GAP = 4;
  const TARGET_ROW_HEIGHT = window.innerWidth < 640 ? 130 : 240;

  const gallery = document.getElementById('gallery');
  if (!gallery) return;

  fetch('./photos.json', { cache: 'no-store' })
    .then((res) => {
      if (!res.ok) throw new Error('no manifest');
      return res.json();
    })
    .then((data) => {
      const files = (data && data.files) || [];
      if (!files.length) {
        renderEmpty();
        return;
      }
      loadDimensions(files).then((images) => {
        const rows = justify(images, gallery.clientWidth, TARGET_ROW_HEIGHT, GAP);
        renderRows(rows);
        setupLightbox(images);
      });
    })
    .catch(() => renderEmpty());

  function renderEmpty() {
    gallery.innerHTML =
      '<p class="gallery-empty">No photos here yet. Drop images into this album\u2019s <code>photos</code> folder and push \u2014 the gallery updates on its own.</p>';
  }

  function loadDimensions(files) {
    return Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () =>
              resolve({ file, w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
            img.onerror = () => resolve({ file, w: 1, h: 1, broken: true });
            img.src = './photos/' + encodeURIComponent(file);
          })
      )
    ).then((imgs) => imgs.filter((i) => !i.broken));
  }

  function justify(images, containerWidth, targetHeight, gap) {
    const rows = [];
    let row = [];
    let aspectSum = 0;

    images.forEach((img) => {
      const aspect = img.w / img.h;
      row.push({ ...img, aspect });
      aspectSum += aspect;
      const widthAtTarget = aspectSum * targetHeight + gap * (row.length - 1);
      if (widthAtTarget >= containerWidth) {
        const availableWidth = containerWidth - gap * (row.length - 1);
        const rowHeight = availableWidth / aspectSum;
        rows.push({ items: row, height: rowHeight });
        row = [];
        aspectSum = 0;
      }
    });

    if (row.length) {
      const availableWidth = containerWidth - gap * (row.length - 1);
      const naturalHeight = availableWidth / aspectSum;
      rows.push({ items: row, height: Math.min(targetHeight, naturalHeight) });
    }

    return rows;
  }

  function renderRows(rows) {
    gallery.innerHTML = '';
    let index = 0;
    rows.forEach((row) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'gallery-row';
      rowEl.style.height = row.height + 'px';

      row.items.forEach((item) => {
        const img = document.createElement('img');
        img.src = './photos/' + encodeURIComponent(item.file);
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.style.width = item.aspect * row.height + 'px';
        img.style.flexShrink = '0';
        img.dataset.index = String(index);
        img.addEventListener('load', () => img.classList.add('loaded'));
        rowEl.appendChild(img);
        index += 1;
      });

      gallery.appendChild(rowEl);
    });
  }

  function setupLightbox(images) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML =
      '<button class="lightbox-close" aria-label="Close">\u2715</button>' +
      '<button class="lightbox-prev" aria-label="Previous">\u2039</button>' +
      '<img alt="">' +
      '<button class="lightbox-next" aria-label="Next">\u203a</button>' +
      '<div class="lightbox-counter"></div>';
    document.body.appendChild(lightbox);

    const lbImg = lightbox.querySelector('img');
    const counter = lightbox.querySelector('.lightbox-counter');
    let current = 0;

    function open(i) {
      current = i;
      show();
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }

    function show() {
      const item = images[current];
      lbImg.src = './photos/' + encodeURIComponent(item.file);
      counter.textContent = current + 1 + ' / ' + images.length;
    }

    function next() {
      current = (current + 1) % images.length;
      show();
    }

    function prev() {
      current = (current - 1 + images.length) % images.length;
      show();
    }

    gallery.addEventListener('click', (e) => {
      const target = e.target;
      if (target && target.tagName === 'IMG' && target.dataset.index !== undefined) {
        open(Number(target.dataset.index));
      }
    });

    lightbox.querySelector('.lightbox-close').addEventListener('click', close);
    lightbox.querySelector('.lightbox-next').addEventListener('click', next);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', prev);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) close();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });

    // basic swipe support
    let touchStartX = null;
    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    });
    lightbox.addEventListener('touchend', (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) (dx < 0 ? next() : prev());
      touchStartX = null;
    });
  }
})();
