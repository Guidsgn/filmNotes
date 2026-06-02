const API = {
  async _tmdb(path, params = {}) {
    const key = CONFIG.TMDB_API_KEY;
    if (!key) throw new Error('NO_KEY');
    const q = new URLSearchParams({ api_key: key, language: CONFIG.LANG, ...params });
    const res = await fetch(`${CONFIG.TMDB_BASE}${path}?${q}`);
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    return res.json();
  },

  async _books(path, params = {}) {
    const q = new URLSearchParams({ ...params });
    const res = await fetch(`${CONFIG.GOOGLE_BOOKS}${path}?${q}`);
    if (!res.ok) throw new Error(`Books ${res.status}`);
    return res.json();
  },

  // ── SEARCH ──────────────────────────────────────────────

  async searchMovies(query, page = 1) {
    try {
      const data = await this._tmdb('/search/movie', { query, page, include_adult: false });
      return (data.results || []).map(m => this._movieSnippet(m));
    } catch (e) {
      if (e.message === 'NO_KEY') return [];
      throw e;
    }
  },

  async searchSeries(query, page = 1) {
    try {
      const data = await this._tmdb('/search/tv', { query, page, include_adult: false });
      return (data.results || []).map(s => this._seriesSnippet(s));
    } catch (e) {
      if (e.message === 'NO_KEY') return [];
      throw e;
    }
  },

  async searchBooks(query, startIndex = 0) {
    const data = await this._books('/volumes', {
      q: query, maxResults: 20, startIndex,
      printType: 'books', langRestrict: 'pt',
    });
    // Try without language restriction if no results
    if (!data.items?.length) {
      const data2 = await this._books('/volumes', { q: query, maxResults: 20, startIndex });
      return (data2.items || []).map(b => this._bookSnippet(b));
    }
    return (data.items || []).map(b => this._bookSnippet(b));
  },

  async searchAll(query) {
    const [movies, series, books] = await Promise.allSettled([
      this.searchMovies(query),
      this.searchSeries(query),
      this.searchBooks(query),
    ]);
    return [
      ...(movies.value || []),
      ...(series.value || []),
      ...(books.value || []),
    ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  },

  // ── DETAILS ─────────────────────────────────────────────

  async getMovieDetails(id) {
    const data = await this._tmdb(`/movie/${id}`, {
      append_to_response: 'credits,videos,images',
      include_image_language: 'null',
    });
    return this._movieDetail(data);
  },

  async getSeriesDetails(id) {
    const data = await this._tmdb(`/tv/${id}`, {
      append_to_response: 'credits,videos',
    });
    return this._seriesDetail(data);
  },

  async getBookDetails(id) {
    const data = await this._books(`/volumes/${id}`);
    return this._bookDetail(data);
  },

  // ── FORMATTERS ──────────────────────────────────────────

  _movieSnippet(m) {
    return {
      id: String(m.id),
      type: 'movie',
      title: m.title || m.original_title,
      year: m.release_date?.slice(0, 4) || '',
      poster: m.poster_path ? `${CONFIG.TMDB_IMG_SM}${m.poster_path}` : null,
      backdrop: m.backdrop_path ? `${CONFIG.TMDB_IMG_LG}${m.backdrop_path}` : null,
      overview: m.overview || '',
      tmdbRating: m.vote_average ? m.vote_average.toFixed(1) : null,
      popularity: m.popularity,
    };
  },

  _seriesSnippet(s) {
    return {
      id: String(s.id),
      type: 'series',
      title: s.name || s.original_name,
      year: s.first_air_date?.slice(0, 4) || '',
      poster: s.poster_path ? `${CONFIG.TMDB_IMG_SM}${s.poster_path}` : null,
      backdrop: s.backdrop_path ? `${CONFIG.TMDB_IMG_LG}${s.backdrop_path}` : null,
      overview: s.overview || '',
      tmdbRating: s.vote_average ? s.vote_average.toFixed(1) : null,
      popularity: s.popularity,
    };
  },

  _bookSnippet(b) {
    const v = b.volumeInfo || {};
    const img = v.imageLinks;
    let poster = img?.thumbnail || img?.smallThumbnail || null;
    if (poster) poster = poster.replace('http://', 'https://');
    return {
      id: b.id,
      type: 'book',
      title: v.title || 'Sem título',
      year: v.publishedDate?.slice(0, 4) || '',
      poster,
      overview: v.description || '',
      authors: v.authors || [],
      publisher: v.publisher || '',
      pageCount: v.pageCount || null,
      popularity: v.ratingsCount || 0,
    };
  },

  _movieDetail(m) {
    const director = (m.credits?.crew || []).find(c => c.job === 'Director');
    const cast = (m.credits?.cast || []).slice(0, 10).map(c => ({
      name: c.name,
      character: c.character,
      photo: c.profile_path ? `${CONFIG.TMDB_IMG_FACE}${c.profile_path}` : null,
    }));
    const trailer = (m.videos?.results || []).find(v => v.type === 'Trailer' && v.site === 'YouTube');
    return {
      id: String(m.id),
      type: 'movie',
      title: m.title || m.original_title,
      originalTitle: m.original_title,
      tagline: m.tagline || '',
      year: m.release_date?.slice(0, 4) || '',
      releaseDate: m.release_date || '',
      poster: m.poster_path ? `${CONFIG.TMDB_IMG_MD}${m.poster_path}` : null,
      backdrop: m.backdrop_path ? `${CONFIG.TMDB_IMG_LG}${m.backdrop_path}` : null,
      overview: m.overview || '',
      genres: (m.genres || []).map(g => g.name),
      runtime: m.runtime ? `${m.runtime} min` : null,
      tmdbRating: m.vote_average ? m.vote_average.toFixed(1) : null,
      director: director?.name || null,
      cast,
      trailerKey: trailer?.key || null,
      status: m.status || '',
      budget: m.budget || null,
      revenue: m.revenue || null,
      productionCountries: (m.production_countries || []).map(c => c.name).join(', '),
    };
  },

  _seriesDetail(s) {
    const creators = (s.created_by || []).map(c => c.name).join(', ');
    const cast = (s.credits?.cast || []).slice(0, 10).map(c => ({
      name: c.name,
      character: c.character,
      photo: c.profile_path ? `${CONFIG.TMDB_IMG_FACE}${c.profile_path}` : null,
    }));
    const trailer = (s.videos?.results || []).find(v => v.type === 'Trailer' && v.site === 'YouTube');
    return {
      id: String(s.id),
      type: 'series',
      title: s.name || s.original_name,
      originalTitle: s.original_name,
      tagline: s.tagline || '',
      year: s.first_air_date?.slice(0, 4) || '',
      releaseDate: s.first_air_date || '',
      poster: s.poster_path ? `${CONFIG.TMDB_IMG_MD}${s.poster_path}` : null,
      backdrop: s.backdrop_path ? `${CONFIG.TMDB_IMG_LG}${s.backdrop_path}` : null,
      overview: s.overview || '',
      genres: (s.genres || []).map(g => g.name),
      runtime: s.episode_run_time?.[0] ? `~${s.episode_run_time[0]} min/ep` : null,
      tmdbRating: s.vote_average ? s.vote_average.toFixed(1) : null,
      creator: creators || null,
      cast,
      trailerKey: trailer?.key || null,
      seasons: s.number_of_seasons || null,
      episodes: s.number_of_episodes || null,
      status: s.status || '',
    };
  },

  _bookDetail(b) {
    const snippet = this._bookSnippet(b);
    const v = b.volumeInfo || {};
    const img = v.imageLinks;
    let posterLg = img?.large || img?.extraLarge || img?.thumbnail || null;
    if (posterLg) posterLg = posterLg.replace('http://', 'https://');
    return {
      ...snippet,
      poster: posterLg || snippet.poster,
      tagline: '',
      genres: v.categories || [],
      isbn: (v.industryIdentifiers || []).find(i => i.type === 'ISBN_13')?.identifier || null,
      language: v.language || '',
      publisher: v.publisher || '',
      publishedDate: v.publishedDate || '',
      pageCount: v.pageCount || null,
      averageRating: v.averageRating || null,
      previewLink: v.previewLink || null,
    };
  },
};
