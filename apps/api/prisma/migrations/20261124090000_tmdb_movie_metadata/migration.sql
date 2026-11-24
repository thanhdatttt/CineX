ALTER TABLE "movies"
  ADD COLUMN "tmdb_id" INTEGER,
  ADD COLUMN "poster_url" VARCHAR(2048),
  ADD COLUMN "backdrop_url" VARCHAR(2048);

CREATE UNIQUE INDEX "movies_tmdb_id_key" ON "movies"("tmdb_id");
