BEGIN;

ALTER TABLE "cinema_rooms"
  ADD COLUMN "layout_locked" BOOLEAN NOT NULL DEFAULT false;

-- Block inventory writes until backfill and the insert trigger are both in place.
LOCK TABLE "showtime_seats" IN SHARE ROW EXCLUSIVE MODE;

UPDATE "cinema_rooms"
SET "layout_locked" = true
WHERE "id" IN (
  SELECT s."room_id" FROM "showtime_seats" i JOIN "showtimes" s ON s."id" = i."showtime_id"
  UNION
  SELECT s."room_id" FROM "showtime_seats" i JOIN "seats" s ON s."id" = i."seat_id"
);

CREATE FUNCTION "protect_room_layout"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD."layout_locked" THEN
      RAISE EXCEPTION 'Room layout is locked' USING ERRCODE = '23514';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD."layout_locked" AND (
    NEW."id" IS DISTINCT FROM OLD."id" OR
    NEW."name" IS DISTINCT FROM OLD."name" OR
    NEW."cinema_id" IS DISTINCT FROM OLD."cinema_id" OR
    NOT NEW."layout_locked"
  ) THEN
    RAISE EXCEPTION 'Room layout is locked' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "protect_room_layout"
BEFORE UPDATE OF "id", "name", "cinema_id", "layout_locked" OR DELETE ON "cinema_rooms"
FOR EACH ROW EXECUTE FUNCTION "protect_room_layout"();

CREATE FUNCTION "protect_seat_layout"() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  target_room UUID;
  locked BOOLEAN;
  structural BOOLEAN := true;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW."room_id" IS DISTINCT FROM OLD."room_id" THEN
      RAISE EXCEPTION 'A seat cannot move between rooms' USING ERRCODE = '23514';
    END IF;
    structural :=
      NEW."id" IS DISTINCT FROM OLD."id" OR
      NEW."row_label" IS DISTINCT FROM OLD."row_label" OR
      NEW."seat_number" IS DISTINCT FROM OLD."seat_number" OR
      NEW."seat_type" IS DISTINCT FROM OLD."seat_type";
    IF NOT structural AND NEW."is_enabled" = OLD."is_enabled" THEN
      RETURN NEW;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    target_room := OLD."room_id";
  ELSE
    target_room := NEW."room_id";
  END IF;

  SELECT "layout_locked" INTO locked
  FROM "cinema_rooms" WHERE "id" = target_room FOR NO KEY UPDATE;

  IF locked AND structural THEN
    RAISE EXCEPTION 'Room layout is locked' USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "protect_seat_layout"
BEFORE INSERT OR UPDATE OF "id", "room_id", "row_label", "seat_number", "seat_type", "is_enabled" OR DELETE ON "seats"
FOR EACH ROW EXECUTE FUNCTION "protect_seat_layout"();

CREATE FUNCTION "lock_layout_for_inventory"() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  target_room UUID;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW."showtime_id" IS DISTINCT FROM OLD."showtime_id"
       OR NEW."seat_id" IS DISTINCT FROM OLD."seat_id" THEN
      RAISE EXCEPTION 'Inventory seat identity is immutable' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  -- A room reassignment cannot race the first inventory write for a showtime.
  SELECT "room_id" INTO target_room FROM "showtimes"
  WHERE "id" = NEW."showtime_id" FOR SHARE;

  UPDATE "cinema_rooms" SET "layout_locked" = true
  WHERE "id" = target_room AND NOT "layout_locked";

  IF NOT EXISTS (
    SELECT 1 FROM "seats" WHERE "id" = NEW."seat_id" AND "room_id" = target_room
  ) THEN
    RAISE EXCEPTION 'Seat does not belong to the showtime room' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "lock_layout_for_inventory"
BEFORE INSERT OR UPDATE OF "showtime_id", "seat_id" ON "showtime_seats"
FOR EACH ROW EXECUTE FUNCTION "lock_layout_for_inventory"();

CREATE FUNCTION "protect_showtime_room"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."room_id" IS DISTINCT FROM OLD."room_id" AND EXISTS (
    SELECT 1 FROM "showtime_seats" WHERE "showtime_id" = OLD."id"
  ) THEN
    RAISE EXCEPTION 'Showtime room is immutable after inventory generation' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "protect_showtime_room"
BEFORE UPDATE OF "room_id" ON "showtimes"
FOR EACH ROW EXECUTE FUNCTION "protect_showtime_room"();

COMMIT;
