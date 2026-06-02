const CONFIG = {
  // Prioridade: window.ENV (env.js gerado no build) → localStorage (settings modal)
  get TMDB_API_KEY() {
    return window.ENV?.TMDB_KEY || localStorage.getItem('fn_tmdb_key') || '';
  },
  get SUPABASE_URL() {
    return window.ENV?.SUPABASE_URL || localStorage.getItem('fn_sb_url') || '';
  },
  get SUPABASE_KEY() {
    return window.ENV?.SUPABASE_KEY || localStorage.getItem('fn_sb_key') || '';
  },
  get BOOKS_API_KEY() {
    return window.ENV?.BOOKS_KEY || localStorage.getItem('fn_books_key') || '';
  },
  TMDB_BASE: 'https://api.themoviedb.org/3',
  TMDB_IMG_SM: 'https://image.tmdb.org/t/p/w342',
  TMDB_IMG_MD: 'https://image.tmdb.org/t/p/w500',
  TMDB_IMG_LG: 'https://image.tmdb.org/t/p/w1280',
  TMDB_IMG_FACE: 'https://image.tmdb.org/t/p/w185',
  GOOGLE_BOOKS: 'https://www.googleapis.com/books/v1',
  LANG: 'pt-BR',
};
