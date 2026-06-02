const CONFIG = {
  get TMDB_API_KEY() {
    return localStorage.getItem('fn_tmdb_key') || '';
  },
  TMDB_BASE: 'https://api.themoviedb.org/3',
  TMDB_IMG_SM: 'https://image.tmdb.org/t/p/w342',
  TMDB_IMG_MD: 'https://image.tmdb.org/t/p/w500',
  TMDB_IMG_LG: 'https://image.tmdb.org/t/p/w1280',
  TMDB_IMG_FACE: 'https://image.tmdb.org/t/p/w185',
  GOOGLE_BOOKS: 'https://www.googleapis.com/books/v1',
  LANG: 'pt-BR',
};
