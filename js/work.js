let currentWork = null;
let currentReview = null;
let isEditing = false;

document.addEventListener('DOMContentLoaded', async () => {
  Utils.setupNavSearch();
  Utils.setupMobileMenu();
  Utils.checkApiKey();

  const { id, type } = Utils.params();
  if (!id || !type) return showError('Parâmetros inválidos na URL.');
  await loadWork(id, type);
});

// ── Load & render work ────────────────────────────────────────

async function loadWork(id, type) {
  document.getElementById('loadingState').style.display = 'flex';
  document.getElementById('workContent').classList.add('work-detail-hidden');
  document.getElementById('errorState').classList.add('work-detail-hidden');

  try {
    let work;
    if (type === 'movie') work = await API.getMovieDetails(id);
    else if (type === 'series') work = await API.getSeriesDetails(id);
    else if (type === 'book') work = await API.getBookDetails(id);
    else throw new Error('Tipo inválido');

    currentWork = work;
    currentReview = await Storage.get(id, type);

    renderWork(work);
    renderReviewSection();
    document.title = `${work.title} — FilmNotes`;
  } catch (err) {
    console.error(err);
    if (err.message === 'NO_KEY' || String(err).includes('401')) {
      showError('Configure sua chave TMDB para ver dados de filmes e séries.', true);
    } else {
      showError('Não foi possível carregar os dados desta obra.');
    }
    return;
  }

  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('workContent').classList.remove('work-detail-hidden');
}

function renderWork(w) {
  if (w.backdrop) {
    document.getElementById('backdropWrap').innerHTML = `
      <img class="work-backdrop-img" src="${w.backdrop}" alt="">
      <div class="work-backdrop-overlay"></div>`;
  }

  document.getElementById('breadcrumbTitle').textContent = w.title;

  document.getElementById('workPoster').innerHTML = w.poster
    ? `<img src="${w.poster}" alt="${w.title}">`
    : `<div class="work-poster-placeholder">${Utils.typeIcon(w.type)}</div>`;

  document.getElementById('workTypeTag').innerHTML =
    `${Utils.typeIcon(w.type)} ${Utils.typeLabel(w.type).toUpperCase()}`;

  document.getElementById('workTitle').textContent = w.title;

  const tagEl = document.getElementById('workTagline');
  tagEl.textContent = w.tagline || '';
  tagEl.style.display = w.tagline ? '' : 'none';

  if (w.genres?.length) {
    document.getElementById('workGenres').innerHTML =
      w.genres.map(g => `<span class="genre-pill">${g}</span>`).join('');
  }

  document.getElementById('workOverview').textContent = w.overview || 'Sem descrição disponível.';

  document.getElementById('workMeta').innerHTML = buildMeta(w).map(m => `
    <div class="work-meta-item">
      <div class="meta-label">${m.label}</div>
      <div class="meta-value">${m.value}</div>
    </div>`).join('');

  if (w.tmdbRating) {
    document.getElementById('tmdbRatingWrap').style.display = 'block';
    document.getElementById('tmdbRatingVal').textContent = `${w.tmdbRating} / 10`;
  }

  if (w.cast?.length) {
    document.getElementById('castSection').style.display = 'block';
    document.getElementById('castRow').innerHTML = w.cast.map(c => `
      <div class="cast-card">
        <div class="cast-photo">
          ${c.photo
            ? `<img src="${c.photo}" alt="${c.name}" loading="lazy">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.4rem;color:var(--text-dim)">👤</div>`}
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

// ── Review section ────────────────────────────────────────────

function renderReviewSection() {
  if (currentReview && !isEditing) renderReviewDisplay();
  else renderReviewForm();
}

function renderReviewDisplay() {
  const r = currentReview;
  document.getElementById('reviewBoxTitle').textContent = 'Minha review';

  document.getElementById('reviewBoxActions').innerHTML = `
    <div style="display:flex;gap:8px;align-items:center">
      <button class="fav-btn ${r.isFavorite ? 'active' : ''}" id="favBtn" title="${r.isFavorite ? 'Remover dos favoritos' : 'Marcar como favorito'}">♥</button>
      <button class="btn btn-ghost btn-sm" onclick="startEdit()">✎ Editar</button>
      <button class="btn btn-danger-ghost btn-sm" onclick="openDeleteModal()">Excluir</button>
    </div>`;

  document.getElementById('favBtn')?.addEventListener('click', toggleFavorite);

  const dateLabel = r.type === 'book' ? 'Data de leitura' : 'Data de exibição';
  const dateVal = r.dateSeen ? Utils.formatDate(r.dateSeen) : null;
  const tags = r.tags?.length ? r.tags.map(t => `<span class="tag-pill">${t}</span>`).join('') : '';

  document.getElementById('reviewBoxBody').innerHTML = `
    <div class="review-blog">

      <div class="review-blog-hero">
        <div class="review-blog-score">
          ${r.rating ? `<div class="score-num">${r.rating}</div><div class="score-max">de 5</div>` : '<div class="score-max" style="font-size:0.85rem;color:var(--text-dim)">Sem nota</div>'}
          <div class="score-stars">${Utils.stars(r.rating)}</div>
        </div>
        <div class="review-blog-meta">
          <div class="review-blog-meta-row">
            ${r.status ? Utils.statusPill(r.status, r.type) : ''}
            ${r.isFavorite ? '<span style="color:#e05c6e;font-weight:700;font-size:0.85rem">♥ Favorito</span>' : ''}
          </div>
          <div class="review-blog-info-grid">
            ${dateVal ? `<div class="review-blog-info-item"><div class="meta-label">${dateLabel}</div><div class="meta-value" style="font-size:0.875rem">${dateVal}</div></div>` : ''}
            ${r.updatedAt ? `<div class="review-blog-info-item"><div class="meta-label">Adicionado</div><div class="meta-value" style="font-size:0.875rem">${Utils.relativeDate(r.updatedAt)}</div></div>` : ''}
          </div>
        </div>
      </div>

      <div class="review-blog-body">
        ${r.reviewText
          ? `<div class="review-blog-text">${r.reviewText.replace(/\n/g, '<br>')}</div>`
          : `<div class="review-blog-text-empty">Nenhuma nota escrita para esta obra ainda.<br>Clique em <strong>Editar</strong> para adicionar sua review.</div>`}
      </div>

      <div class="review-blog-footer">
        ${tags ? `<div class="review-tags">${tags}</div>` : '<div></div>'}
        <div style="font-size:0.75rem;color:var(--text-dim)">
          ${Storage.isCloud() ? '☁ Salvo no Supabase' : '💾 Salvo localmente'}
        </div>
      </div>

    </div>`;

  setupDeleteModal();
}

function renderReviewForm() {
  const r = currentReview;
  const w = currentWork;
  const isNew = !r;

  document.getElementById('reviewBoxTitle').textContent = isNew ? 'Adicionar review' : 'Editar review';
  document.getElementById('reviewBoxActions').innerHTML = isNew
    ? ''
    : `<button class="btn btn-ghost btn-sm" onclick="cancelEdit()">Cancelar</button>`;

  const defaultDate = r?.dateSeen || new Date().toISOString().slice(0, 10);
  const dateLabel = w.type === 'book' ? 'Data de leitura' : 'Data de exibição';

  document.getElementById('reviewBoxBody').innerHTML = `
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
            ${buildStatusOptions(w.type, r?.status)}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="dateSeen">${dateLabel}</label>
          <input type="date" class="form-input" id="dateSeen" value="${defaultDate}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="reviewText">
          Sua review
          <span style="color:var(--text-dim);font-weight:400;text-transform:none;letter-spacing:0"> — opcional</span>
        </label>
        <textarea class="form-textarea" id="reviewText" placeholder="O que você achou? Como te marcou? Escreva livremente..." style="min-height:180px">${r?.reviewText || ''}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label" for="tagsInput">
          Tags
          <span style="color:var(--text-dim);font-weight:400;text-transform:none;letter-spacing:0"> — separadas por vírgula</span>
        </label>
        <input type="text" class="form-input" id="tagsInput"
          placeholder="favorito, releitura, indicaria..." value="${r?.tags?.join(', ') || ''}">
      </div>

      <div class="form-group">
        <label class="form-check">
          <input type="checkbox" id="isFavorite" ${r?.isFavorite ? 'checked' : ''}>
          <span>♥ Marcar como favorito</span>
        </label>
      </div>

      <div style="display:flex;gap:10px;margin-top:8px">
        <button type="submit" class="btn btn-primary">
          ${isNew ? '✓ Salvar review' : '✓ Atualizar review'}
        </button>
        ${!isNew ? `<button type="button" class="btn btn-ghost" onclick="cancelEdit()">Cancelar</button>` : ''}
      </div>
    </form>`;
}

function buildStatusOptions(type, current) {
  const opts = type === 'book'
    ? [['completed','Lido'], ['in_progress','Lendo'], ['want','Quero ler'], ['dropped','Abandonado']]
    : [['completed','Assistido'], ['in_progress','Assistindo'], ['want','Quero assistir'], ['dropped','Abandonado'], ['rewatching','Reassistindo']];
  return opts.map(([v, l]) => `<option value="${v}" ${current === v ? 'selected' : ''}>${l}</option>`).join('');
}

async function submitReview(e) {
  e.preventDefault();
  const w = currentWork;
  const ratingEl = document.querySelector('input[name="rating"]:checked');
  const status = document.getElementById('statusSelect').value;

  if (!status) return Utils.toast('Selecione um status para a obra.', 'error');

  const review = {
    workId: w.id,
    type: w.type,
    title: w.title,
    year: w.year || '',
    poster: w.poster || null,
    rating: ratingEl ? parseInt(ratingEl.value) : null,
    status,
    reviewText: document.getElementById('reviewText').value.trim(),
    dateSeen: document.getElementById('dateSeen').value,
    tags: document.getElementById('tagsInput').value
      .split(',').map(t => t.trim()).filter(Boolean),
    isFavorite: document.getElementById('isFavorite').checked,
  };

  const btn = document.querySelector('#reviewForm button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    await Storage.save(review);
    currentReview = await Storage.get(w.id, w.type);
    isEditing = false;
    renderReviewSection();
    Utils.toast('Review salva!', 'success');
  } catch (err) {
    console.error(err);
    Utils.toast('Erro ao salvar: ' + err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Salvar review';
  }
}

function startEdit() { isEditing = true; renderReviewSection(); }
function cancelEdit() { isEditing = false; renderReviewSection(); }

async function toggleFavorite() {
  if (!currentReview) return;
  currentReview.isFavorite = !currentReview.isFavorite;
  try {
    await Storage.save(currentReview);
    renderReviewSection();
    Utils.toast(currentReview.isFavorite ? '♥ Adicionado aos favoritos' : 'Removido dos favoritos', 'info');
  } catch {
    Utils.toast('Erro ao atualizar.', 'error');
  }
}

function openDeleteModal() {
  document.getElementById('deleteModal').classList.add('open');
}

function setupDeleteModal() {
  const btn = document.getElementById('confirmDeleteBtn');
  if (!btn) return;
  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = 'Excluindo...';
    try {
      await Storage.delete(currentWork.id, currentWork.type);
      currentReview = null;
      isEditing = false;
      document.getElementById('deleteModal').classList.remove('open');
      renderReviewSection();
      Utils.toast('Review excluída.', 'info');
    } catch {
      Utils.toast('Erro ao excluir.', 'error');
      btn.disabled = false;
      btn.textContent = 'Sim, excluir';
    }
  };
  document.getElementById('deleteModal').addEventListener('click', (e) => {
    if (e.target.id === 'deleteModal') document.getElementById('deleteModal').classList.remove('open');
  });
}

function showError(msg, apiKey = false) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('workContent').style.display = 'none';
  document.getElementById('errorState').classList.remove('work-detail-hidden');
  const el = document.getElementById('errorMsg');
  if (apiKey) {
    el.innerHTML = msg + ' <a href="#" style="color:var(--accent);text-decoration:underline" onclick="Utils.openSettingsModal();return false">Configurar →</a>';
  } else {
    el.textContent = msg;
  }
}
