-- Seed for local dev. Truncates and re-inserts every run (dev only).
TRUNCATE endorsements, flights, pilots RESTART IDENTITY CASCADE;

INSERT INTO pilots (email, display_name) VALUES
    ('demo@aviationclub.test', 'Alex Rivera');

-- ── 28 flights spanning ~6 months of private-pilot training ──────────────────
-- Progression: dual → solo → solo XC → night dual → checkride prep
WITH p AS (SELECT id FROM pilots WHERE email = 'demo@aviationclub.test')
INSERT INTO flights
    (pilot_id, flight_date, aircraft_type, tail_number, route,
     total_hours, pic_hours, dual_received_hours, solo_hours,
     night_hours, cross_country_hours, landings_day, landings_night, remarks)
SELECT p.id,
       d.flight_date::date,
       d.aircraft_type,
       d.tail_number,
       d.route,
       d.total_hours::numeric(4,1),
       d.pic_hours::numeric(4,1),
       d.dual_received_hours::numeric(4,1),
       d.solo_hours::numeric(4,1),
       d.night_hours::numeric(4,1),
       d.cross_country_hours::numeric(4,1),
       d.landings_day::int,
       d.landings_night::int,
       d.remarks
FROM p, (VALUES
-- Nov 2025: first lessons, all dual
('2025-11-04','C172','N12345','KPAO local',      1.2, 0.0, 1.2, 0.0, 0.0, 0.0,  4, 0, 'Intro flight: straight & level, basic turns'),
('2025-11-08','C172','N12345','KPAO local',      1.1, 0.0, 1.1, 0.0, 0.0, 0.0,  4, 0, 'Four fundamentals, traffic pattern intro'),
('2025-11-12','C172','N12345','KPAO local',      1.3, 0.0, 1.3, 0.0, 0.0, 0.0,  5, 0, 'Pattern work; two go-arounds for traffic'),
('2025-11-18','C172','N12345','KPAO local',      1.0, 0.0, 1.0, 0.0, 0.0, 0.0,  4, 0, 'Slow flight and stalls intro'),
('2025-11-22','C152','N88110','KPAO local',      1.2, 0.0, 1.2, 0.0, 0.0, 0.0,  5, 0, 'C152 checkout: lighter feel on controls'),
-- Dec 2025: building hours, first XC dual
('2025-12-02','C172','N12345','KPAO local',      1.4, 0.0, 1.4, 0.0, 0.0, 0.0,  6, 0, 'Short/soft field T&Ls, power-off 180s'),
('2025-12-07','C172','N12345','KPAO-KHWD-KPAO',  1.8, 0.0, 1.8, 0.0, 0.0, 1.8,  3, 0, 'First dual XC: pilotage + VOR tracking'),
('2025-12-13','C172','N67890','KPAO-KSNS-KPAO',  2.3, 0.0, 2.3, 0.0, 0.0, 2.3,  2, 0, 'Dual XC to Salinas, simulated compass nav'),
('2025-12-18','C172','N12345','KPAO local',      1.1, 0.0, 1.1, 0.0, 0.0, 0.0,  4, 0, 'Emergency procedures: engine-out patterns'),
('2025-12-21','C172','N12345','KPAO local',      1.0, 0.0, 1.0, 0.0, 0.0, 0.0,  3, 0, 'Pre-solo dual review with CFI'),
-- Jan 2026: first solo + solo pattern work
('2026-01-06','C172','N67890','KPAO local',      0.8, 0.8, 0.0, 0.8, 0.0, 0.0,  3, 0, 'FIRST SOLO: 3 laps around the patch!'),
('2026-01-10','C172','N67890','KPAO local',      1.0, 1.0, 0.0, 1.0, 0.0, 0.0,  4, 0, 'Solo pattern: working on touchdown point'),
('2026-01-14','C172','N67890','KPAO local',      1.2, 1.2, 0.0, 1.2, 0.0, 0.0,  5, 0, 'Solo: short field practice, one balked ldg'),
('2026-01-19','C172','N12345','KPAO local',      1.3, 0.0, 1.3, 0.0, 0.0, 0.0,  4, 0, 'Dual: hood work, unusual attitudes'),
('2026-01-25','C172','N67890','KPAO-KHWD',       0.9, 0.9, 0.0, 0.9, 0.0, 0.9,  2, 0, 'First solo XC to Hayward'),
-- Feb 2026: solo XC and night dual
('2026-02-01','C172','N67890','KPAO-KCCR-KPAO',  1.7, 1.7, 0.0, 1.7, 0.0, 1.7,  3, 0, 'Solo XC to Concord and back'),
('2026-02-08','C172','N67890','KPAO-KMRY-KPAO',  2.6, 2.6, 0.0, 2.6, 0.0, 2.6,  2, 0, 'Long solo XC to Monterey: first time over the hills'),
('2026-02-13','C172','N12345','KPAO local',      1.5, 0.0, 1.5, 0.0, 1.5, 0.0,  0, 4, 'Night dual: airport environment, night patterns'),
('2026-02-19','C172','N12345','KPAO-KSJC-KPAO',  2.0, 0.0, 2.0, 0.0, 2.0, 2.0,  1, 2, 'Night dual XC to San Jose, busy Class C'),
('2026-02-24','C172','N67890','KPAO-KCCR-KSNS',  3.1, 3.1, 0.0, 3.1, 0.0, 3.1,  3, 0, 'Long solo XC: 3 stops, wx deviation around fog'),
-- Mar 2026: complex checkout + checkride prep
('2026-03-04','PA28R','N4421Q','KPAO local',     1.4, 0.0, 1.4, 0.0, 0.0, 0.0,  4, 0, 'Complex checkout: Piper Arrow, gear & prop'),
('2026-03-09','PA28R','N4421Q','KPAO local',     1.2, 0.0, 1.2, 0.0, 0.0, 0.0,  4, 0, 'Complex solo: gear-up/down flows, simulated failures'),
('2026-03-15','C172','N12345','KPAO local',      1.6, 0.0, 1.6, 0.0, 0.0, 0.0,  5, 0, 'Stage check with chief CFI: VFR maneuvers'),
('2026-03-21','C172','N67890','KPAO-E16-KWVI',   2.8, 2.8, 0.0, 2.8, 0.0, 2.8,  3, 0, 'Solo XC checkride practice route'),
('2026-03-28','C172','N12345','KPAO local',      1.1, 0.0, 1.1, 0.0, 0.0, 0.0,  4, 0, 'Final dual prep: power-off 180, chandelle, lazy 8'),
-- Apr 2026: checkride + post-certificate flights
('2026-04-05','C172','N12345','KPAO-E16-KWVI',   2.9, 0.0, 2.9, 0.0, 0.0, 2.9,  3, 0, 'PRACTICAL TEST: passed! Private pilot certificate'),
('2026-04-12','C172','N67890','KPAO-KSFO-KOAK',  2.0, 2.0, 0.0, 0.0, 0.0, 2.0,  2, 0, 'First post-cert flight: Bay tour, Class B clearance'),
('2026-04-19','PA28R','N4421Q','KPAO-KMRY-KSBP', 3.4, 3.4, 0.0, 0.0, 0.0, 3.4,  2, 0, 'Coast trip with passenger: smooth VFR all the way')
) AS d(flight_date, aircraft_type, tail_number, route,
       total_hours, pic_hours, dual_received_hours, solo_hours,
       night_hours, cross_country_hours, landings_day, landings_night, remarks);

-- ── Endorsements ─────────────────────────────────────────────────────────────

-- Solo sign-off on the first solo flight (Jan 6)
WITH f AS (SELECT id FROM flights WHERE flight_date = '2026-01-06' LIMIT 1)
INSERT INTO endorsements (flight_id, kind, instructor_name, instructor_cfi, signed_at, notes)
SELECT id, 'solo', 'Jane Roe', '3456789CFI', '2026-01-06',
       '14 CFR 61.87(n): first solo, C172, KPAO'
FROM f;

-- Solo XC endorsement on the Hayward flight (Jan 25)
WITH f AS (SELECT id FROM flights WHERE flight_date = '2026-01-25' LIMIT 1)
INSERT INTO endorsements (flight_id, kind, instructor_name, instructor_cfi, signed_at, notes)
SELECT id, 'cross_country_solo', 'Jane Roe', '3456789CFI', '2026-01-24',
       '14 CFR 61.93(c)(1): solo XC, KPAO-KHWD, >50 nm total'
FROM f;

-- Night endorsement on the night dual XC (Feb 19)
WITH f AS (SELECT id FROM flights WHERE flight_date = '2026-02-19' LIMIT 1)
INSERT INTO endorsements (flight_id, kind, instructor_name, instructor_cfi, signed_at, notes)
SELECT id, 'solo', 'Jane Roe', '3456789CFI', '2026-02-13',
       '14 CFR 61.87(o): night solo endorsement, C172'
FROM f;

-- Complex aircraft endorsement on the Arrow checkout (Mar 4)
WITH f AS (SELECT id FROM flights WHERE flight_date = '2026-03-04' LIMIT 1)
INSERT INTO endorsements (flight_id, kind, instructor_name, instructor_cfi, signed_at, notes)
SELECT id, 'complex', 'Tom Nguyen', '9988776CFI', '2026-03-04',
       '14 CFR 61.31(e): complex aircraft, PA28R Piper Arrow'
FROM f;

-- Flight review / checkride on the practical test day (Apr 5)
WITH f AS (SELECT id FROM flights WHERE flight_date = '2026-04-05' LIMIT 1)
INSERT INTO endorsements (flight_id, kind, instructor_name, instructor_cfi, signed_at, notes)
SELECT id, 'flight_review', 'DPE Sandra Voss', 'DPE-20198', '2026-04-05',
       'Private pilot practical test passed, 14 CFR 61.56'
FROM f;

-- 90-day passenger currency on the post-cert Bay tour (Apr 12)
WITH f AS (SELECT id FROM flights WHERE flight_date = '2026-04-12' LIMIT 1)
INSERT INTO endorsements (flight_id, kind, instructor_name, instructor_cfi, signed_at, notes)
SELECT id, '90_day_passenger', 'Self', 'N/A', '2026-04-12',
       '14 CFR 61.57(a): 3 T&Ls in preceding 90 days, current for pax'
FROM f;
