document.addEventListener('DOMContentLoaded', async () => {
  Utils.setupNavSearch();
  Utils.setupMobileMenu();
  Utils.checkApiKey();
  setupHeroSearch();
  await loadAll();
});

async function loadAll() {
  const [stats, all] = await Promise.all([Storage.getStats(), Storage.getAll()]);
  renderStats(stats);
  renderReviews(all);
}

function renderStats(stats) {
  document.getElementById('statTotal').textContent = stats.total;
  document.getElementById('statMovies').textContent = stats.movies;
  document.getElementById('statSeries').textContent = stats.series;
  document.getElementById('statBooks').textContent = stats.books;
}

function renderReviews(all) {
  if (all.length === 0) {
    document.getElementById('emptyState').style.display = '';
    document.getElementById('recentSection').style.display = 'none';
    return;
  }

  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('recentGrid').innerHTML = all.slice(0, 8).map(r => Utils.workCardHTML(r)).join('');

  const fill = (type, sectionId, gridId) => {
    const items = all.filter(r => r.type === type).slice(0, 6);
    if (!items.length) return;
    document.getElementById(sectionId).style.display = '';
    document.getElementById(gridId).innerHTML = items.map(r => Utils.workCardHTML(r)).join('');
  };

  fill('movie', 'moviesSection', 'moviesGrid');
  fill('series', 'seriesSection', 'seriesGrid');
  fill('book', 'booksSection', 'booksGrid');
}

function setupHeroSearch() {
  const input = document.getElementById('heroSearch');
  const chips = document.querySelectorAll('.type-chips .chip');
  let activeType = 'all';

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeType = chip.dataset.type;
    });
  });

  const go = () => {
    const q = input.value.trim();
    if (!q) return;
    const params = new URLSearchParams({ q });
    if (activeType !== 'all') params.set('type', activeType);
    window.location.href = `search.html?${params}`;
  };

  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
}
