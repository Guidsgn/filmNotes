const Storage = {
  KEY: 'fn_reviews',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY) || '[]');
    } catch {
      return [];
    }
  },

  get(workId, type) {
    return this.getAll().find(r => r.workId === String(workId) && r.type === type) || null;
  },

  save(review) {
    const all = this.getAll();
    const idx = all.findIndex(r => r.workId === String(review.workId) && r.type === review.type);
    const now = new Date().toISOString();
    const entry = { ...review, workId: String(review.workId) };
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...entry, updatedAt: now };
    } else {
      all.unshift({ ...entry, id: Date.now().toString(), createdAt: now, updatedAt: now });
    }
    localStorage.setItem(this.KEY, JSON.stringify(all));
    return entry;
  },

  delete(workId, type) {
    const filtered = this.getAll().filter(r => !(r.workId === String(workId) && r.type === type));
    localStorage.setItem(this.KEY, JSON.stringify(filtered));
  },

  getStats() {
    const all = this.getAll();
    const avg = all.filter(r => r.rating).reduce((s, r) => s + r.rating, 0);
    return {
      total: all.length,
      movies: all.filter(r => r.type === 'movie').length,
      series: all.filter(r => r.type === 'series').length,
      books: all.filter(r => r.type === 'book').length,
      avgRating: all.length ? (avg / all.filter(r => r.rating).length).toFixed(1) : 0,
    };
  },

  getRecent(n = 10) {
    return this.getAll().slice(0, n);
  },

  getByType(type) {
    return this.getAll().filter(r => r.type === type);
  },
};
