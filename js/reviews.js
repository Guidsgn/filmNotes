let activeFilter = 'all';
let activeSort = 'recent';
let viewMode = 'blog';

document.addEventListener('DOMContentLoaded', async () => {
  Utils.setupNavSearch();
  Utils.setupMobileMenu();

  const params = Utils.params();
  if (params.filter) activeFilter = params.filter;

  setupFilterChips();
  setupSort();
  setupViewToggle();
  await render();
});

function setupFilterChips() {
  document.querySelectorAll('[data-filter]').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.filter === activeFilter);
    chip.addEventListener('click', async () => {
      document.querySelectorAll('[data-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      await render();
    });
  });
}

function setupSort() {
  const sel = document.getElementById('sortSelect');
  sel.value = activeSort;
  sel.addEventListener('change', async () => {
    activeSort = sel.value;
    await render();
  });
}

function setupViewToggle() {
  document.getElementById('viewBlog').addEventListener('click', async () => {
    viewMode = 'blog';
    document.getElementById('viewBlog').classList.add('active');
    document.getElementById('viewGrid').classList.remove('active');
    await render();
  });
  document.getElementById('viewGrid').addEventListener('click', async () => {
    viewMode = 'grid';
    document.getElementById('viewGrid').classList.add('active');
    document.getElementById('viewBlog').classList.remove('active');
    await render();
  });
}

async function render() {
  const all = await Storage.getAll();
  const stats = await Storage.getStats();

  document.getElementById('reviewsSubtitle').textContent =
    `${stats.total} review${stats.total !== 1 ? 's' : ''} · ${stats.movies} filmes, ${stats.series} séries, ${stats.books} livros`;

  let items = activeFilter === 'all' ? all : all.filter(r => r.type === activeFilter);

  const sortFns = {
    recent: (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
    rating_desc: (a, b) => (b.rating || 0) - (a.rating || 0),
    rating_asc: (a, b) => (a.rating || 0) - (b.rating || 0),
    title: (a, b) => a.title.localeCompare(b.title, 'pt'),
    year_desc: (a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0),
  };

  items = [...items].sort(sortFns[activeSort] || sortFns.recent);

  const container = document.getElementById('reviewsContainer');
  const empty = document.getElementById('emptyState');
  const countEl = document.getElementById('reviewsCount');

  if (!items.length) {
    container.innerHTML = '';
    empty.removeAttribute('hidden');
    countEl.textContent = '';
    document.getElementById('emptyTitle').textContent =
      activeFilter !== 'all' ? `Nenhuma review de ${Utils.typeLabel(activeFilter).toLowerCase()}` : 'Nenhuma review ainda';
    document.getElementById('emptyText').textContent =
      'Explore obras e adicione suas reviews.';
    return;
  }

  empty.setAttribute('hidden', '');
  countEl.textContent = `${items.length} review${items.length !== 1 ? 's' : ''}`;

  if (viewMode === 'grid') {
    container.innerHTML = `<div class="works-grid">${items.map(r => Utils.workCardHTML(r)).join('')}</div>`;
  } else {
    container.innerHTML = `<div style="display:flex;flex-direction:column;gap:16px">${items.map(r => Utils.reviewBlogCardHTML(r)).join('')}</div>`;
  }
}
