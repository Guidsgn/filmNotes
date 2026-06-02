const Utils = {

  // ── Stars ─────────────────────────────────────────────────

  stars(rating, size = '') {
    if (!rating) return '<span style="color:var(--text-dim);font-size:0.85rem">Sem nota</span>';
    const cls = size === 'lg' ? 'stars stars-lg' : 'stars';
    let html = `<div class="${cls}">`;
    for (let i = 1; i <= 5; i++) html += `<span class="s${i <= rating ? ' on' : ''}">★</span>`;
    html += '</div>';
    return html;
  },

  // ── Status / Type helpers ─────────────────────────────────

  statusLabel(status, type) {
    const map = {
      completed: type === 'book' ? 'Lido' : 'Assistido',
      in_progress: type === 'book' ? 'Lendo' : 'Assistindo',
      want: type === 'book' ? 'Quero ler' : 'Quero assistir',
      dropped: 'Abandonado',
      rewatching: 'Reassistindo',
    };
    return map[status] || status;
  },

  statusIcon(status) {
    return { completed: '✓', in_progress: '▶', want: '♡', dropped: '✕', rewatching: '↺' }[status] || '';
  },

  statusPill(status, type) {
    return `<span class="status-pill s-${status}">${this.statusIcon(status)} ${this.statusLabel(status, type)}</span>`;
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

  // ── Date ─────────────────────────────────────────────────

  formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  },

  relativeDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const days = Math.floor((new Date() - d) / 86400000);
    if (days === 0) return 'hoje';
    if (days === 1) return 'ontem';
    if (days < 7) return `${days} dias atrás`;
    if (days < 30) return `${Math.floor(days / 7)} sem. atrás`;
    if (days < 365) return `${Math.floor(days / 30)} meses atrás`;
    return `${Math.floor(days / 365)} ano${Math.floor(days / 365) > 1 ? 's' : ''} atrás`;
  },

  // ── Misc ─────────────────────────────────────────────────

  truncate(str, n = 160) {
    if (!str || str.length <= n) return str || '';
    return str.slice(0, n).trimEnd() + '…';
  },

  debounce(fn, ms = 400) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  },

  params() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
  },

  // ── Toast ─────────────────────────────────────────────────

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
    }, 3200);
  },

  // ── Nav search ────────────────────────────────────────────

  setupNavSearch() {
    const input = document.getElementById('navSearchInput');
    if (!input) return;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        window.location.href = `search.html?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
  },

  setupMobileMenu() {
    const btn = document.getElementById('navMenuBtn');
    const links = document.getElementById('navLinks');
    if (btn && links) btn.addEventListener('click', () => links.classList.toggle('open'));
  },

  // ── API Key / storage banners ─────────────────────────────

  checkApiKey() {
    const banner = document.getElementById('apiBanner');
    if (!banner) return;
    banner.classList.toggle('hidden', !!CONFIG.TMDB_API_KEY);
  },

  // ── Card HTML ─────────────────────────────────────────────

  posterFallback(type) {
    return `<div class="poster-placeholder">${this.typeIcon(type)}</div>`;
  },

  workCardHTML(r) {
    const poster = r.poster
      ? `<img src="${r.poster}" alt="${r.title}" loading="lazy">`
      : this.posterFallback(r.type);
    return `
      <a class="work-card" href="work.html?id=${r.workId}&type=${r.type}" title="${r.title}">
        <div class="work-card-poster">
          ${poster}
          ${this.typeBadge(r.type)}
          ${r.rating ? `<div class="card-rating">★ ${r.rating}</div>` : ''}
        </div>
        <div class="work-card-title">${r.title}</div>
        <div class="work-card-meta">${r.year || ''}</div>
      </a>`;
  },

  reviewBlogCardHTML(r) {
    const poster = r.poster
      ? `<img src="${r.poster}" alt="${r.title}" loading="lazy">`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem;color:var(--text-dim)">${this.typeIcon(r.type)}</div>`;

    const tags = r.tags?.length
      ? r.tags.map(t => `<span class="tag-pill">${t}</span>`).join('') : '';

    const textBlock = r.reviewText
      ? `<div class="rbc-excerpt">${r.reviewText}</div>`
      : `<div class="rbc-no-text">Nenhuma nota escrita.</div>`;

    return `
      <a class="review-blog-card" href="work.html?id=${r.workId}&type=${r.type}">
        <div class="rbc-poster">${poster}</div>
        <div class="rbc-body">
          <div class="rbc-type-row">
            ${this.typeBadge(r.type)}
            ${r.year ? `<span style="font-size:0.78rem;color:var(--text-muted)">${r.year}</span>` : ''}
            ${r.isFavorite ? '<span style="color:#e05c6e;font-size:0.85rem">♥</span>' : ''}
          </div>
          <div class="rbc-title">${r.title}</div>
          <div class="rbc-rating-row">
            ${this.stars(r.rating)}
            ${r.status ? this.statusPill(r.status, r.type) : ''}
          </div>
          ${textBlock}
          ${tags ? `<div class="review-tags" style="margin-bottom:12px">${tags}</div>` : ''}
          <div class="rbc-footer">
            <span class="rbc-date">${r.updatedAt ? this.relativeDate(r.updatedAt) : ''}</span>
            <span style="font-size:0.78rem;color:var(--accent);font-weight:600">Ler review →</span>
          </div>
        </div>
      </a>`;
  },

  // kept for grid view on reviews page
  reviewListCardHTML(r) {
    return this.reviewBlogCardHTML(r);
  },

  // ── Settings Modal ────────────────────────────────────────

  _settingsInjected: false,

  injectSettingsModal() {
    if (this._settingsInjected) return;
    this._settingsInjected = true;

    const sql = `CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  year TEXT, poster TEXT,
  rating INTEGER,
  status TEXT,
  review_text TEXT,
  date_seen TEXT,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON reviews
  FOR ALL USING (true) WITH CHECK (true);`;

    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay" id="settingsModal">
        <div class="modal-box" style="max-width:540px;max-height:90vh;overflow-y:auto">
          <div class="modal-title" style="margin-bottom:20px">⚙ Configurações</div>

          <div id="storageStatus" style="margin-bottom:20px"></div>

          <div class="settings-section">
            <div class="settings-section-title">🎬 TMDB — filmes e séries</div>
            <div class="form-group" style="margin-bottom:6px">
              <label class="form-label">Chave de API v3</label>
              <div class="input-with-action">
                <input type="password" class="form-input" id="settingsTmdbKey" placeholder="Cole sua chave TMDB...">
                <button class="btn btn-ghost btn-sm" onclick="document.getElementById('settingsTmdbKey').type = document.getElementById('settingsTmdbKey').type === 'password' ? 'text' : 'password'">👁</button>
              </div>
            </div>
            <div style="font-size:0.75rem;color:var(--text-dim)">
              Crie uma conta gratuita em <a href="https://www.themoviedb.org/settings/api" target="_blank" style="color:var(--accent)">themoviedb.org → Configurações → API</a>
            </div>
          </div>

          <div class="settings-section">
            <div class="settings-section-title">☁ Supabase — banco de dados na nuvem</div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:14px;line-height:1.6">
              Persiste suas reviews no Vercel. Crie um projeto grátis em
              <a href="https://supabase.com" target="_blank" style="color:var(--accent)">supabase.com</a>,
              vá em <strong style="color:var(--text)">Project Settings → API</strong> e copie a URL e a anon key.
            </div>
            <div class="form-group">
              <label class="form-label">URL do projeto</label>
              <input type="text" class="form-input" id="settingsSbUrl" placeholder="https://xxxxxxxx.supabase.co">
            </div>
            <div class="form-group" style="margin-bottom:10px">
              <label class="form-label">Anon Key (pública)</label>
              <div class="input-with-action">
                <input type="password" class="form-input" id="settingsSbKey" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI...">
                <button class="btn btn-ghost btn-sm" onclick="document.getElementById('settingsSbKey').type = document.getElementById('settingsSbKey').type === 'password' ? 'text' : 'password'">👁</button>
              </div>
            </div>
            <details>
              <summary style="font-size:0.8rem;font-weight:600;color:var(--text-muted);cursor:pointer;user-select:none">
                📋 Ver SQL para criar a tabela no Supabase
              </summary>
              <pre class="settings-sql">${sql}</pre>
            </details>
          </div>

          <div class="modal-actions" style="flex-wrap:wrap;gap:8px">
            <button class="btn btn-primary" onclick="Utils.saveSettings()">Salvar</button>
            <button class="btn btn-ghost" onclick="Utils.closeSettingsModal()">Cancelar</button>
            <button class="btn btn-ghost btn-sm" id="migrateBtn" onclick="Utils.migrateLStoSB()" style="margin-left:auto" title="Enviar reviews do localStorage para o Supabase">
              ↑ Migrar dados locais
            </button>
          </div>
        </div>
      </div>`);

    document.getElementById('settingsModal').addEventListener('click', (e) => {
      if (e.target.id === 'settingsModal') this.closeSettingsModal();
    });
  },

  openSettingsModal() {
    this.injectSettingsModal();
    const hasSB = !!(localStorage.getItem('fn_sb_url') && localStorage.getItem('fn_sb_key'));

    document.getElementById('settingsTmdbKey').value = localStorage.getItem('fn_tmdb_key') || '';
    document.getElementById('settingsSbUrl').value = localStorage.getItem('fn_sb_url') || '';
    document.getElementById('settingsSbKey').value = localStorage.getItem('fn_sb_key') || '';

    document.getElementById('storageStatus').innerHTML = hasSB
      ? `<div class="storage-badge supabase">☁ Armazenando no Supabase</div>`
      : `<div class="storage-badge local">💾 Armazenando no localStorage (apenas neste dispositivo)</div>`;

    document.getElementById('settingsModal').classList.add('open');
  },

  closeSettingsModal() {
    document.getElementById('settingsModal')?.classList.remove('open');
  },

  saveSettings() {
    const tmdb = document.getElementById('settingsTmdbKey')?.value.trim();
    const sbUrl = document.getElementById('settingsSbUrl')?.value.trim();
    const sbKey = document.getElementById('settingsSbKey')?.value.trim();

    if (tmdb) localStorage.setItem('fn_tmdb_key', tmdb);
    else localStorage.removeItem('fn_tmdb_key');

    if (sbUrl && sbKey) {
      localStorage.setItem('fn_sb_url', sbUrl);
      localStorage.setItem('fn_sb_key', sbKey);
    } else {
      localStorage.removeItem('fn_sb_url');
      localStorage.removeItem('fn_sb_key');
    }

    this.closeSettingsModal();
    this.toast('Configurações salvas! Recarregando...', 'success');
    setTimeout(() => location.reload(), 1100);
  },

  async migrateLStoSB() {
    const btn = document.getElementById('migrateBtn');
    if (!Storage.isCloud()) {
      return this.toast('Configure o Supabase primeiro.', 'error');
    }
    btn.textContent = 'Migrando...';
    btn.disabled = true;
    try {
      const n = await Storage.migrateFromLS();
      this.toast(`${n} review${n !== 1 ? 's' : ''} migrada${n !== 1 ? 's' : ''} com sucesso!`, 'success');
    } catch (e) {
      this.toast('Erro na migração: ' + e.message, 'error');
    }
    btn.textContent = '↑ Migrar dados locais';
    btn.disabled = false;
  },

  // Legacy (kept for old api-key modal references)
  openApiKeyModal() { this.openSettingsModal(); },
  closeApiKeyModal() { this.closeSettingsModal(); },
  saveApiKey() { this.saveSettings(); },
};
