const Storage = {
  TABLE: 'reviews',
  LS_KEY: 'fn_reviews',
  _sb: null,

  init() {
    const url = localStorage.getItem('fn_sb_url');
    const key = localStorage.getItem('fn_sb_key');
    if (url && key && window.supabase) {
      try {
        this._sb = window.supabase.createClient(url, key);
      } catch (e) {
        console.warn('Supabase init failed:', e);
      }
    }
  },

  isCloud() { return !!this._sb; },

  // ── Row mappers ──────────────────────────────────────────

  _toRow(r) {
    return {
      id: `${r.type}_${r.workId}`,
      work_id: String(r.workId),
      type: r.type,
      title: r.title,
      year: r.year || null,
      poster: r.poster || null,
      rating: r.rating || null,
      status: r.status || null,
      review_text: r.reviewText || null,
      date_seen: r.dateSeen || null,
      tags: r.tags || [],
      is_favorite: r.isFavorite || false,
      updated_at: new Date().toISOString(),
    };
  },

  _fromRow(row) {
    return {
      id: row.id,
      workId: row.work_id,
      type: row.type,
      title: row.title,
      year: row.year || '',
      poster: row.poster || null,
      rating: row.rating || null,
      status: row.status || null,
      reviewText: row.review_text || '',
      dateSeen: row.date_seen || '',
      tags: row.tags || [],
      isFavorite: row.is_favorite || false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  // ── CRUD ─────────────────────────────────────────────────

  async getAll() {
    if (this._sb) {
      const { data, error } = await this._sb
        .from(this.TABLE)
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) { console.error('SB getAll:', error); return this._getLS(); }
      return (data || []).map(r => this._fromRow(r));
    }
    return this._getLS();
  },

  async get(workId, type) {
    if (this._sb) {
      const { data, error } = await this._sb
        .from(this.TABLE)
        .select('*')
        .eq('work_id', String(workId))
        .eq('type', type)
        .maybeSingle();
      if (error) { console.error('SB get:', error); return null; }
      return data ? this._fromRow(data) : null;
    }
    return this._getLS().find(r => r.workId === String(workId) && r.type === type) || null;
  },

  async save(review) {
    const entry = { ...review, workId: String(review.workId) };
    const now = new Date().toISOString();

    if (this._sb) {
      const row = { ...this._toRow(entry), created_at: now };
      const { error } = await this._sb
        .from(this.TABLE)
        .upsert(row, { onConflict: 'id' });
      if (error) throw error;
      return entry;
    }

    // localStorage
    const all = this._getLS();
    const idx = all.findIndex(r => r.workId === entry.workId && r.type === entry.type);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...entry, updatedAt: now };
    } else {
      all.unshift({ ...entry, createdAt: now, updatedAt: now });
    }
    this._setLS(all);
    return entry;
  },

  async delete(workId, type) {
    if (this._sb) {
      const { error } = await this._sb
        .from(this.TABLE)
        .delete()
        .eq('work_id', String(workId))
        .eq('type', type);
      if (error) throw error;
      return;
    }
    this._setLS(this._getLS().filter(r => !(r.workId === String(workId) && r.type === type)));
  },

  async getStats() {
    const all = await this.getAll();
    const rated = all.filter(r => r.rating);
    return {
      total: all.length,
      movies: all.filter(r => r.type === 'movie').length,
      series: all.filter(r => r.type === 'series').length,
      books: all.filter(r => r.type === 'book').length,
      avgRating: rated.length ? (rated.reduce((s, r) => s + r.rating, 0) / rated.length).toFixed(1) : null,
    };
  },

  // Migrate all localStorage reviews to Supabase
  async migrateFromLS() {
    if (!this._sb) throw new Error('Supabase não configurado.');
    const local = this._getLS();
    if (!local.length) return 0;
    let count = 0;
    for (const r of local) {
      try { await this.save(r); count++; } catch (e) { console.warn('migrate err', e); }
    }
    return count;
  },

  // ── LocalStorage helpers ──────────────────────────────────

  _getLS() {
    try { return JSON.parse(localStorage.getItem(this.LS_KEY) || '[]'); }
    catch { return []; }
  },

  _setLS(data) {
    localStorage.setItem(this.LS_KEY, JSON.stringify(data));
  },
};

// Auto-init when script loads
document.addEventListener('DOMContentLoaded', () => Storage.init(), { once: true });
