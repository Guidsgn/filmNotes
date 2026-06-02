let activeFilter = 'all';
let activeSort = 'recent';
let viewMode = 'list';

document.addEventListener('DOMContentLoaded', () => {
  Utils.setupNavSearch();
  setupMobileMenu();

  const params = Utils.params();
  if (params.filter) activeFilter = params.filter;

  setupFilterChips();
  setupSort();
  setupViewToggle();
  render();
});

function setupMobileMenu() {
  const btn = document.getElementById('navMenuBtn');
  const links = document.getElementById('navLinks');
  if (btn && links) btn.addEventListener('click', () => links.classList.toggle('open'));
}

function setupFilterChips() {
  document.querySelectorAll('[data-filter]').forEach(chip => {
    if (chip.dataset.filter === activeFilter) chip.classList.add('active');
    else chip.classList.remove('active');

    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      render();
    });
  });
}

function setupSort() {
  const sel = document.getElementById('sortSelect');
  sel.value = activeSort;
  sel.addEventListener('change', () => {
    activeSort = sel.value;
    render();
  });
}

function setupViewToggle() {
  document.getElementById('viewList').addEventListener('click', () => {
    viewMode = 'list';
    document.getElementById('viewList').classList.add('active');
    document.getElementById('viewGrid').classList.remove('active');
    render();
  });
  document.getElementById('viewGrid').addEventListener('click', () => {
    viewMode = 'grid';
    document.getElementById('viewGrid').classList.add('active');
    document.getElementById('viewList').classList.remove('active');
    render();
  });
}

function getFiltered() {
  let items = Storage.getAll();
  if (activeFilter !== 'all') items = items.filter(r => r.type === activeFilter);

  const sortFns = {
    recent: (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
    rating_desc: (a, b) => (b.rating || 0) - (a.rating || 0),
    rating_asc: (a, b) => (a.rating || 0) - (b.rating || 0),
    title: (a, b) => a.title.localeCompare(b.title, 'pt'),
    year_desc: (a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0),
  };

  return items.sort(sortFns[activeSort] || sortFns.recent);
}

function render() {
  const items = getFiltered();
  const container = document.getElementById('reviewsContainer');
  const empty = document.getElementById('emptyState');
  const countEl = document.getElementById('reviewsCount');
  const subtitle = document.getElementById('reviewsSubtitle');
  const stats = Storage.getStats();

  subtitle.textContent = `${stats.total} review${stats.total !== 1 ? 's' : ''} • ${stats.movies} filmes, ${stats.series} séries, ${stats.books} livros`;

  if (items.length === 0) {
    container.innerHTML = '';
    empty.style.display = '';
    countEl.textContent = '';
    const emptyTitle = document.getElementById('emptyTitle');
    const emptyText = document.getElementById('emptyText');
    if (activeFilter !== 'all') {
      emptyTitle.textContent = `Nenhuma review de ${Utils.typeLabel(activeFilter).toLowerCase()}`;
      emptyText.textContent = 'Explore obras e adicione suas reviews.';
    } else {
      emptyTitle.textContent = 'Nenhuma review ainda';
      emptyText.textContent = 'Comece explorando obras para adicionar suas primeiras reviews.';
    }
    return;
  }

  empty.style.display = 'none';
  countEl.textContent = `${items.length} review${items.length !== 1 ? 's' : ''}`;

  if (viewMode === 'list') {
    container.innerHTML = `<div class="reviews-list">${items.map(r => Utils.reviewListCardHTML(r)).join('')}</div>`;
  } else {
    container.innerHTML = `<div class="works-grid">${items.map(r => Utils.workCardHTML(r)).join('')}</div>`;
  }
}
