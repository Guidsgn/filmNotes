document.addEventListener('DOMContentLoaded', () => {
  Utils.setupNavSearch();
  Utils.checkApiKey();
  setupMobileMenu();
  loadStats();
  loadReviews();
  setupHeroSearch();
});

function setupMobileMenu() {
  const btn = document.getElementById('navMenuBtn');
  const links = document.getElementById('navLinks');
  if (btn && links) {
    btn.addEventListener('click', () => links.classList.toggle('open'));
  }
}

function loadStats() {
  const stats = Storage.getStats();
  document.getElementById('statTotal').textContent = stats.total;
  document.getElementById('statMovies').textContent = stats.movies;
  document.getElementById('statSeries').textContent = stats.series;
  document.getElementById('statBooks').textContent = stats.books;
}

function loadReviews() {
  const all = Storage.getAll();

  if (all.length === 0) {
    document.getElementById('emptyState').style.display = '';
    document.getElementById('recentSection').style.display = 'none';
    return;
  }

  document.getElementById('emptyState').style.display = 'none';

  // Recent (all types, max 8)
  const recentGrid = document.getElementById('recentGrid');
  recentGrid.innerHTML = all.slice(0, 8).map(r => Utils.workCardHTML(r)).join('');

  // By type
  const movies = all.filter(r => r.type === 'movie');
  const series = all.filter(r => r.type === 'series');
  const books = all.filter(r => r.type === 'book');

  const fillSection = (items, sectionId, gridId, max = 6) => {
    if (items.length === 0) return;
    document.getElementById(sectionId).style.display = '';
    document.getElementById(gridId).innerHTML = items.slice(0, max).map(r => Utils.workCardHTML(r)).join('');
  };

  fillSection(movies, 'moviesSection', 'moviesGrid');
  fillSection(series, 'seriesSection', 'seriesGrid');
  fillSection(books, 'booksSection', 'booksGrid');
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
