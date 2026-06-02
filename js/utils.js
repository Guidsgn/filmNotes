const Utils = {
  // Stars HTML
  stars(rating, size = '') {
    if (!rating) return '';
    const cls = size === 'lg' ? 'stars stars-lg' : 'stars';
    let html = `<div class="${cls}">`;
    for (let i = 1; i <= 5; i++) {
      html += `<span class="s${i <= rating ? ' on' : ''}">★</span>`;
    }
    html += '</div>';
    return html;
  },

  // Status label
  statusLabel(status, type) {
    const map = {
      completed: type === 'book' ? 'Lido' : 'Assistido',
      in_progress: type === 'book' ? 'Lendo' : 'Assistindo',
      want: type === 'book' ? 'Quero ler' : 'Quero assistir',
      dropped: type === 'book' ? 'Abandonado' : 'Abandonado',
      rewatching: 'Reassistindo',
    };
    return map[status] || status;
  },

  statusIcon(status) {
    const icons = {
      completed: '✓',
      in_progress: '▶',
      want: '♡',
      dropped: '✕',
      rewatching: '↺',
    };
    return icons[status] || '';
  },

  statusPill(status, type) {
    const label = this.statusLabel(status, type);
    const icon = this.statusIcon(status);
    return `<span class="status-pill s-${status}">${icon} ${label}</span>`;
  },

  typeBadge(type) {
    const map = { movie: 'Filme', series: 'Série', book: 'Livro' };
    return `<span class="type-badge badge-${type}">${map[type] || type}</span>`;
  },

  typeIcon(type) {
    return type === 'movie' ? '🎬' : type === 'series' ? '📺' : '📚';
  },

  typeLabel(type) {
    return type === 'movie' ? 'Filme' : type === 'series' ? 'Série' : 'Livro';
  },

  formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  relativeDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'hoje';
    if (days === 1) return 'ontem';
    if (days < 7) return `${days} dias atrás`;
    if (days < 30) return `${Math.floor(days / 7)} sem. atrás`;
    if (days < 365) return `${Math.floor(days / 30)} meses atrás`;
    return `${Math.floor(days / 365)} anos atrás`;
  },

  truncate(str, n = 160) {
    if (!str || str.length <= n) return str || '';
    return str.slice(0, n).trimEnd() + '…';
  },

  debounce(fn, ms = 400) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  },

  // Toast notifications
  toast(msg, type = 'info') {
    const wrap = document.getElementById('toastWrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = `toast-item ${type}`;
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'toast-slide 0.25s ease reverse forwards';
      setTimeout(() => el.remove(), 280);
    }, 3000);
  },

  // Parse URL params
  params() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
  },

  // Poster fallback HTML
  posterFallback(type) {
    return `<div class="poster-placeholder">${this.typeIcon(type)}</div>`;
  },

  // Work card HTML
  workCardHTML(review) {
    const poster = review.poster
      ? `<img src="${review.poster}" alt="${review.title}" loading="lazy">`
      : this.posterFallback(review.type);

    return `
      <a class="work-card" href="work.html?id=${review.workId}&type=${review.type}" title="${review.title}">
        <div class="work-card-poster">
          ${poster}
          ${this.typeBadge(review.type)}
          ${review.rating ? `<div class="card-rating">★ ${review.rating}</div>` : ''}
        </div>
        <div class="work-card-title">${review.title}</div>
        <div class="work-card-meta">${review.year || ''}</div>
      </a>`;
  },

  // Review list card HTML
  reviewListCardHTML(review) {
    const poster = review.poster
      ? `<img src="${review.poster}" alt="${review.title}" loading="lazy">`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.6rem;color:var(--text-dim)">${this.typeIcon(review.type)}</div>`;

    const tags = review.tags?.length
      ? review.tags.map(t => `<span class="tag-pill">${t}</span>`).join('')
      : '';

    return `
      <a class="review-list-card" href="work.html?id=${review.workId}&type=${review.type}">
        <div class="rlc-poster">${poster}</div>
        <div class="rlc-body">
          <div class="rlc-title">${review.title}</div>
          <div class="rlc-meta">
            ${this.typeBadge(review.type)}
            ${review.year ? `<span>${review.year}</span>` : ''}
            ${review.status ? this.statusPill(review.status, review.type) : ''}
          </div>
          ${review.reviewText ? `<div class="rlc-text">${this.truncate(review.reviewText, 140)}</div>` : ''}
          ${tags ? `<div class="review-tags" style="margin-top:8px">${tags}</div>` : ''}
          <div class="rlc-foot">
            <div>${this.stars(review.rating)}</div>
            <span style="font-size:0.72rem;color:var(--text-dim)">${review.updatedAt ? this.relativeDate(review.updatedAt) : ''}</span>
          </div>
        </div>
      </a>`;
  },

  setupNavSearch() {
    const input = document.getElementById('navSearchInput');
    if (!input) return;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        window.location.href = `search.html?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
  },

  checkApiKey() {
    const banner = document.getElementById('apiBanner');
    if (!banner) return;
    if (!CONFIG.TMDB_API_KEY) {
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  },

  openApiKeyModal() {
    const modal = document.getElementById('apiKeyModal');
    if (modal) modal.classList.add('open');
  },

  closeApiKeyModal() {
    const modal = document.getElementById('apiKeyModal');
    if (modal) modal.classList.remove('open');
  },

  saveApiKey() {
    const input = document.getElementById('apiKeyInput');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return Utils.toast('Digite uma chave de API válida.', 'error');
    localStorage.setItem('fn_tmdb_key', val);
    Utils.closeApiKeyModal();
    Utils.checkApiKey();
    Utils.toast('Chave de API salva! Recarregando...', 'success');
    setTimeout(() => location.reload(), 1200);
  },
};
