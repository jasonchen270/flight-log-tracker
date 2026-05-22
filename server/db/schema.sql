-- Flight Log Tracker schema
-- Normalized: flights + endorsements (1-to-many via flight_id FK).
-- We tried JSONB for endorsements first but filter queries like
--   "all flights with a complex-aircraft endorsement signed by instructor X"
-- got awkward (jsonb_path_exists + nested operators). A join table
-- with two btree indexes on (flight_id) and (kind) keeps filters trivial.

CREATE TABLE IF NOT EXISTS pilots (
    id              SERIAL PRIMARY KEY,
    email           TEXT UNIQUE NOT NULL,
    display_name    TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flights (
    id                  SERIAL PRIMARY KEY,
    pilot_id            INTEGER NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
    -- DATE not TIMESTAMPTZ. Pilots log a calendar date in local airport time,
    -- not an instant. Storing as TIMESTAMPTZ caused the "off by one day"
    -- bug where a flight on 2026-04-15 PDT showed as 2026-04-16 UTC.
    flight_date         DATE NOT NULL,
    aircraft_type       TEXT NOT NULL,
    tail_number         TEXT NOT NULL,
    route               TEXT,
    -- Hours stored as NUMERIC(4,1): supports up to 999.9 in a single leg,
    -- to one decimal place. FAA logbooks round to 0.1 hours (6 minutes).
    total_hours         NUMERIC(4,1) NOT NULL CHECK (total_hours >= 0),
    pic_hours           NUMERIC(4,1) NOT NULL DEFAULT 0 CHECK (pic_hours >= 0),
    dual_received_hours NUMERIC(4,1) NOT NULL DEFAULT 0 CHECK (dual_received_hours >= 0),
    solo_hours          NUMERIC(4,1) NOT NULL DEFAULT 0 CHECK (solo_hours >= 0),
    night_hours         NUMERIC(4,1) NOT NULL DEFAULT 0 CHECK (night_hours >= 0),
    cross_country_hours NUMERIC(4,1) NOT NULL DEFAULT 0 CHECK (cross_country_hours >= 0),
    landings_day        INTEGER NOT NULL DEFAULT 0 CHECK (landings_day >= 0),
    landings_night      INTEGER NOT NULL DEFAULT 0 CHECK (landings_night >= 0),
    remarks             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS flights_pilot_date_idx
    ON flights (pilot_id, flight_date DESC);
CREATE INDEX IF NOT EXISTS flights_aircraft_type_idx
    ON flights (aircraft_type);

CREATE TABLE IF NOT EXISTS endorsements (
    id              SERIAL PRIMARY KEY,
    flight_id       INTEGER NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
    -- Constrained set keeps filter predicates explicit and the UI dropdown honest.
    kind            TEXT NOT NULL CHECK (kind IN (
        'solo',
        'cross_country_solo',
        'complex',
        'high_performance',
        'tailwheel',
        'high_altitude',
        '90_day_passenger',
        'flight_review',
        'ipc'
    )),
    instructor_name TEXT NOT NULL,
    instructor_cfi  TEXT NOT NULL,
    signed_at       DATE NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS endorsements_flight_idx ON endorsements (flight_id);
CREATE INDEX IF NOT EXISTS endorsements_kind_idx   ON endorsements (kind);

-- Touch updated_at on every UPDATE so the client knows when a row last changed.
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS flights_touch_updated_at ON flights;
CREATE TRIGGER flights_touch_updated_at
    BEFORE UPDATE ON flights
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
