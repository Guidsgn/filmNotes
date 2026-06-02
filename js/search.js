let activeType = 'all';
let lastQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  Utils.setupNavSearch();
  Utils.checkApiKey();
  setupMobileMenu();

  const params = Utils.params();
  const input = document.getElementById('searchInput');

  if (params.q) {
    input.value = params.q;
    lastQuery = params.q;
  }

  if (params.type) {
    activeType = params.type;
    document.querySelectorAll('.type-chips .chip').forEach(c => {
      c.classList.toggle('active', c.dataset.type === activeType);
    });
  }

  setupChips();
  input.addEventListener('input', Utils.debounce(handleSearch, 450));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSearch(); });

  if (params.q) handleSearch();
});

function setupMobileMenu() {
  const btn = document.getElementById('navMenuBtn');
  const links = document.getElementById('navLinks');
  if (btn && links) btn.addEventListener('click', () => links.classList.toggle('open'));
}

function setupChips() {
  document.querySelectorAll('.type-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.type-chips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeType = chip.dataset.type;
      if (lastQuery) handleSearch();
    });
  });
}

async function handleSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) {
    showState('empty');
    return;
  }
  lastQuery = q;
  showState('loading');

  try {
    let results = [];

    if (activeType === 'all') {
      results = await API.searchAll(q);
    } else if (activeType === 'movie') {
      results = await API.searchMovies(q);
    } else if (activeType === 'series') {
      results = await API.searchSeries(q);
    } else if (activeType === 'book') {
      results = await API.searchBooks(q);
    }

    if (results.length === 0) {
      showState('noResults');
      return;
    }

    showState('results');
    renderResults(results, q);
  } catch (err) {
    console.error(err);
    showState('noResults');
    Utils.toast('Erro ao buscar. Verifique sua conexão.', 'error');
  }
}

function renderResults(results, q) {
  const container = document.getElementById('resultsContainer');
  const count = document.getElementById('resultsCount');

  count.textContent = `${results.length} resultado${results.length !== 1 ? 's' : ''} para "${q}"`;

  container.innerHTML = results.map(item => {
    const review = Storage.get(item.id, item.type);
    const hasReview = !!review;
    const authors = item.authors?.length ? item.authors.slice(0, 2).join(', ') : '';

    const poster = item.poster
      ? `<img src="${item.poster}" alt="${item.title}" loading="lazy">`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.8rem;color:var(--text-dim)">${Utils.typeIcon(item.type)}</div>`;

    const meta = [
      Utils.typeBadge(item.type),
      item.year ? `<span>${item.year}</span>` : '',
      (item.type === 'movie' || item.type === 'series') && item.tmdbRating
        ? `<span style="color:var(--star)">★ ${item.tmdbRating}</span>` : '',
      authors ? `<span>${authors}</span>` : '',
    ].filter(Boolean).join('<span class="dot"> · </span>');

    const reviewBadge = hasReview
      ? `<div class="result-has-review">✓ Review salva${review.rating ? ` — ${review.rating}/5` : ''}</div>` : '';

    return `
      <a class="result-card" href="work.html?id=${item.id}&type=${item.type}">
        <div class="result-poster">${poster}</div>
        <div class="result-body">
          <div class="result-title">${item.title}</div>
          <div class="result-meta">${meta}</div>
          ${item.overview ? `<div class="result-overview">${Utils.truncate(item.overview, 120)}</div>` : ''}
          ${reviewBadge}
        </div>
      </a>`;
  }).join('');
}

function showState(state) {
  document.getElementById('resultsContainer').innerHTML = '';
  document.getElementById('resultsCount').textContent = '';
  document.getElementById('loadingState').style.display = state === 'loading' ? 'flex' : 'none';
  document.getElementById('emptyState').style.display = state === 'empty' ? '' : 'none';
  document.getElementById('noResultsState').style.display = state === 'noResults' ? '' : 'none';
}
