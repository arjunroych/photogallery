/**
 * Renders the album list on the landing page from ./albums.json.
 */
(function () {
  'use strict';

  const list = document.getElementById('album-list');
  if (!list) return;

  fetch('./albums.json', { cache: 'no-store' })
    .then((res) => {
      if (!res.ok) throw new Error('no manifest');
      return res.json();
    })
    .then((albums) => {
      if (!albums || !albums.length) {
        renderEmpty();
        return;
      }
      list.innerHTML = albums.map(renderAlbum).join('');
    })
    .catch(renderEmpty);

  function renderEmpty() {
    list.innerHTML =
      '<p class="empty-state">No albums yet. Duplicate the <code>template</code> folder, add photos, and push \u2014 it\u2019ll show up here automatically.</p>';
  }

  function renderAlbum(album) {
    const cover = album.cover
      ? '<img src="./' + album.slug + '/photos/' + encodeURIComponent(album.cover) + '" alt="" loading="lazy">'
      : '';
    return (
      '<a class="album-row" href="./' + album.slug + '/">' +
      '<div class="album-cover">' + cover + '</div>' +
      '<div class="album-info">' +
      '<p class="album-title">' + escapeHtml(album.title) + '</p>' +
      '<p class="album-meta">' + album.count + (album.count === 1 ? ' photo' : ' photos') + '</p>' +
      '</div>' +
      '</a>'
    );
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }
})();
