export interface TmdbMovieMetadata {
  tmdbId: number;
  title: string;
  synopsis: string | null;
  durationMins: number | null;
  ageRating: string | null;
  genres: string[];
  trailerUrl: string | null;
  releaseDate: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  sourceUrl: string;
}

export interface TmdbMovieCandidate {
  tmdbId: number;
  title: string;
  synopsis: string | null;
  releaseDate: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  sourceUrl: string;
}
