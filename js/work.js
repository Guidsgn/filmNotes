let currentWork = null;
let currentReview = null;
let isEditing = false;

document.addEventListener('DOMContentLoaded', () => {
  Utils.setupNavSearch();
  setupMobileMenu();

  const { id, type } = Utils.params();
  if (!id || !type) return showError('Parâmetros inválidos.');

  loadWork(id, type);
});

function setupMobileMenu() {
  const btn = document.getElementById('navMenuBtn');
  const links = document.getElementById('navLinks');
  if (btn && links) btn.addEventListener('click', () => links.classList.toggle('open'));
}

async function loadWork(id, type) {
  document.getElementById('loadingState').style.display = 'flex';
  document.getElementById('workContent').style.display = 'none';

  try {
    let work;
    if (type === 'movie') work = await API.getMovieDetails(id);
    else if (type === 'series') work = await API.getSeriesDetails(id);
    else if (type === 'book') work = await API.getBookDetails(id);
    else throw new Error('Tipo desconhecido');

    currentWork = work;
    currentReview = Storage.get(id, type);

    renderWork(work);
    renderReviewSection();

    document.title = `${work.title} — film notes`;
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('workContent').style.display = '';
  } catch (err) {
    console.error(err);
    if (err.message === 'NO_KEY' || err.message?.includes('401')) {
      showError('Configure sua chave TMDB para ver dados de filmes e séries.', true);
    } else {
      showError('Não foi possível carregar os dados desta obra.');
    }
  }
}

function renderWork(w) {
  // Backdrop
  if (w.backdrop) {
    const wrap = document.getElementById('backdropWrap');
    wrap.innerHTML = `
      <img class="work-backdrop-img" src="${w.backdrop}" alt="">
      <div class="work-backdrop-overlay"></div>`;
  }

  // Breadcrumb
  document.getElementById('breadcrumbTitle').textContent = w.title;

  // Poster
  const posterEl = document.getElementById('workPoster');
  posterEl.innerHTML = w.poster
    ? `<img src="${w.poster}" alt="${w.title}">`
    : `<div class="work-poster-placeholder">${Utils.typeIcon(w.type)}</div>`;

  // Type tag
  document.getElementById('workTypeTag').innerHTML =
    `${Utils.typeIcon(w.type)} ${Utils.typeLabel(w.type).toUpperCase()}`;

  // Title & tagline
  document.getElementById('workTitle').textContent = w.title;
  const tagEl = document.getElementById('workTagline');
  tagEl.textContent = w.tagline || '';
  tagEl.style.display = w.tagline ? '' : 'none';

  // Genres
  const genresEl = document.getElementById('workGenres');
  if (w.genres?.length) {
    genresEl.innerHTML = w.genres.map(g => `<span class="genre-pill">${g}</span>`).join('');
  }

  // Overview
  document.getElementById('workOverview').textContent = w.overview || 'Sem descrição disponível.';

  // Meta info
  const metaEl = document.getElementById('workMeta');
  const metas = buildMeta(w);
  metaEl.innerHTML = metas.map(m => `
    <div class="work-meta-item">
      <div class="meta-label">${m.label}</div>
      <div class="meta-value">${m.value}</div>
    </div>`).join('');

  // TMDB Rating
  if (w.tmdbRating) {
    document.getElementById('tmdbRatingWrap').style.display = '';
    document.getElementById('tmdbRatingVal').textContent = `${w.tmdbRating} / 10`;
  }

  // Cast
  if (w.cast?.length) {
    document.getElementById('castSection').style.display = '';
    document.getElementById('castRow').innerHTML = w.cast.map(c => `
      <div class="cast-card">
        <div class="cast-photo">
          ${c.photo ? `<img src="${c.photo}" alt="${c.name}" loading="lazy">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:var(--text-dim)">👤</div>`}
        </div>
        <div class="cast-name">${c.name}</div>
        ${c.character ? `<div class="cast-char">${c.character}</div>` : ''}
      </div>`).join('');
  }
}

function buildMeta(w) {
  const items = [];
  if (w.year) items.push({ label: 'Ano', value: w.year });
  if (w.type === 'movie') {
    if (w.runtime) items.push({ label: 'Duração', value: w.runtime });
    if (w.director) items.push({ label: 'Diretor', value: w.director });
    if (w.productionCountries) items.push({ label: 'País', value: w.productionCountries });
  } else if (w.type === 'series') {
    if (w.seasons) items.push({ label: 'Temporadas', value: w.seasons });
    if (w.episodes) items.push({ label: 'Episódios', value: w.episodes });
    if (w.runtime) items.push({ label: 'Duração', value: w.runtime });
    if (w.creator) items.push({ label: 'Criador', value: w.creator });
    if (w.status) items.push({ label: 'Status', value: w.status });
  } else if (w.type === 'book') {
    if (w.authors?.length) items.push({ label: 'Autor', value: w.authors.join(', ') });
    if (w.publisher) items.push({ label: 'Editora', value: w.publisher });
    if (w.pageCount) items.push({ label: 'Páginas', value: w.pageCount });
    if (w.isbn) items.push({ label: 'ISBN', value: w.isbn });
  }
  return items;
}

// ── Review Section ──────────────────────────────────────────

function renderReviewSection() {
  if (currentReview && !isEditing) {
    renderReviewDisplay();
  } else {
    renderReviewForm();
  }
}

function renderReviewDisplay() {
  const r = currentReview;
  const title = document.getElementById('reviewBoxTitle');
  const actions = document.getElementById('reviewBoxActions');
  const body = document.getElementById('reviewBoxBody');

  title.textContent = 'Minha review';

  actions.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center">
      <button class="fav-btn ${r.isFavorite ? 'active' : ''}" id="favBtn" title="Favorito">♥</button>
      <button class="btn btn-ghost btn-sm" onclick="startEdit()">✎ Editar</button>
      <button class="btn btn-danger-ghost btn-sm" onclick="openDeleteModal()">Excluir</button>
    </div>`;

  document.getElementById('favBtn')?.addEventListener('click', toggleFavorite);

  const starsHTML = Utils.stars(r.rating, 'lg');
  const statusHTML = r.status ? Utils.statusPill(r.status, r.type) : '';
  const dateLabel = r.type === 'book' ? 'Lido em' : 'Visto em';
  const dateVal = r.dateSeen ? Utils.formatDate(r.dateSeen) : null;
  const tagsHTML = r.tags?.length
    ? r.tags.map(t => `<span class="tag-pill">${t}</span>`).join('') : '';

  body.innerHTML = `
    <div class="review-display-rating">
      ${starsHTML}
      ${statusHTML}
      ${r.isFavorite ? '<span style="color:#e05c6e;font-size:1rem">♥ Favorito</span>' : ''}
    </div>
    ${r.reviewText
      ? `<div class="review-display-text has-content">${r.reviewText.replace(/\n/g, '<br>')}</div>`
      : `<div class="review-display-text" style="font-style:italic;color:var(--text-dim)">Nenhuma nota escrita.</div>`}
    <div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:18px">
      ${dateVal ? `<div><div class="meta-label">${dateLabel}</div><div class="meta-value" style="font-size:0.875rem">${dateVal}</div></div>` : ''}
      ${r.updatedAt ? `<div><div class="meta-label">Adicionado</div><div class="meta-value" style="font-size:0.875rem">${Utils.relativeDate(r.updatedAt)}</div></div>` : ''}
    </div>
    ${tagsHTML ? `<div class="review-tags" style="margin-top:14px">${tagsHTML}</div>` : ''}`;

  setupDeleteModal();
}

function renderReviewForm() {
  const r = currentReview;
  const w = currentWork;
  const isNew = !r;
  const title = document.getElementById('reviewBoxTitle');
  const actions = document.getElementById('reviewBoxActions');
  const body = document.getElementById('reviewBoxBody');

  title.textContent = isNew ? 'Adicionar review' : 'Editar review';
  actions.innerHTML = isNew ? '' : `<button class="btn btn-ghost btn-sm" onclick="cancelEdit()">Cancelar</button>`;

  const statusOpts = buildStatusOptions(w.type, r?.status);
  const dateLabel = w.type === 'book' ? 'Data de leitura' : 'Data de exibição';
  const defaultDate = r?.dateSeen || new Date().toISOString().slice(0, 10);

  body.innerHTML = `
    <form id="reviewForm" onsubmit="submitReview(event)">
      <div class="form-group">
        <label class="form-label">Avaliação</label>
        <div class="star-input-wrap">
          ${[5,4,3,2,1].map(n => `
            <input type="radio" name="rating" id="star${n}" value="${n}" ${r?.rating === n ? 'checked' : ''}>
            <label for="star${n}" title="${n} estrela${n > 1 ? 's' : ''}">★</label>
          `).join('')}
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="statusSelect">Status</label>
          <select class="form-select" id="statusSelect" required>
            <option value="">Selecionar...</option>
            ${statusOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="dateSeen">${dateLabel}</label>
          <input type="date" class="form-input" id="dateSeen" value="${defaultDate}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="reviewText">Sua review <span style="color:var(--text-dim);font-weight:400;text-transform:none;letter-spacing:0">(opcional)</span></label>
        <textarea class="form-textarea" id="reviewText" placeholder="O que você achou? Como te marcou?">${r?.reviewText || ''}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label" for="tagsInput">Tags <span style="color:var(--text-dim);font-weight:400;text-transform:none;letter-spacing:0">(separadas por vírgula)</span></label>
        <input type="text" class="form-input" id="tagsInput" placeholder="ex: favorito, recomendo, releitura" value="${r?.tags?.join(', ') || ''}">
      </div>

      <div class="form-group">
        <label class="form-check">
          <input type="checkbox" id="isFavorite" ${r?.isFavorite ? 'checked' : ''}>
          <span>♥ Marcar como favorito</span>
        </label>
      </div>

      <div style="display:flex;gap:10px;margin-top:4px">
        <button type="submit" class="btn btn-primary">
          ${isNew ? '✓ Salvar review' : '✓ Atualizar review'}
        </button>
        ${!isNew ? `<button type="button" class="btn btn-ghost" onclick="cancelEdit()">Cancelar</button>` : ''}
      </div>
    </form>`;
}

function buildStatusOptions(type, current) {
  const opts = type === 'book'
    ? [['completed','Lido'],['in_progress','Lendo'],['want','Quero ler'],['dropped','Abandonado']]
    : [['completed','Assistido'],['in_progress','Assistindo'],['want','Quero assistir'],['dropped','Abandonado'],['rewatching','Reassistindo']];
  return opts.map(([v, l]) => `<option value="${v}" ${current === v ? 'selected' : ''}>${l}</option>`).join('');
}

function submitReview(e) {
  e.preventDefault();
  const w = currentWork;
  const ratingInput = document.querySelector('input[name="rating"]:checked');
  const rating = ratingInput ? parseInt(ratingInput.value) : null;
  const status = document.getElementById('statusSelect').value;
  const reviewText = document.getElementById('reviewText').value.trim();
  const dateSeen = document.getElementById('dateSeen').value;
  const tagsRaw = document.getElementById('tagsInput').value;
  const isFavorite = document.getElementById('isFavorite').checked;
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

  if (!status) {
    Utils.toast('Selecione um status para a obra.', 'error');
    return;
  }

  const review = {
    workId: w.id,
    type: w.type,
    title: w.title,
    year: w.year || '',
    poster: w.poster || null,
    rating,
    status,
    reviewText,
    dateSeen,
    tags,
    isFavorite,
  };

  Storage.save(review);
  currentReview = Storage.get(w.id, w.type);
  isEditing = false;
  renderReviewSection();
  Utils.toast(currentReview ? 'Review salva!' : 'Review atualizada!', 'success');
}

function startEdit() {
  isEditing = true;
  renderReviewSection();
}

function cancelEdit() {
  isEditing = false;
  renderReviewSection();
}

function toggleFavorite() {
  if (!currentReview) return;
  currentReview.isFavorite = !currentReview.isFavorite;
  Storage.save(currentReview);
  renderReviewSection();
  Utils.toast(currentReview.isFavorite ? '♥ Adicionado aos favoritos' : 'Removido dos favoritos', 'info');
}

function openDeleteModal() {
  document.getElementById('deleteModal').classList.add('open');
}

function setupDeleteModal() {
  document.getElementById('confirmDeleteBtn').onclick = () => {
    Storage.delete(currentWork.id, currentWork.type);
    currentReview = null;
    isEditing = false;
    document.getElementById('deleteModal').classList.remove('open');
    renderReviewSection();
    Utils.toast('Review excluída.', 'info');
  };
  document.getElementById('deleteModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('deleteModal')) {
      document.getElementById('deleteModal').classList.remove('open');
    }
  });
}

function showError(msg, apiKey = false) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('workContent').style.display = 'none';
  document.getElementById('errorState').style.display = '';
  document.getElementById('errorMsg').textContent = msg;
  if (apiKey) {
    document.getElementById('errorMsg').innerHTML =
      msg + ' <a href="#" style="color:var(--accent);text-decoration:underline" onclick="Utils.openApiKeyModal();return false">Configurar chave →</a>';
  }
}
