export const SCHEMA = `
CREATE TABLE IF NOT EXISTS participants (
  pid          text PRIMARY KEY,
  widget_first text NOT NULL,
  stage        text NOT NULL DEFAULT 'round1',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS class_slots (
  class_key   text PRIMARY KEY,
  catalog     int  NOT NULL,
  course_code text NOT NULL,
  class_code  text NOT NULL,
  quota       int  NOT NULL,
  taken       int  NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
  id          serial PRIMARY KEY,
  pid         text NOT NULL REFERENCES participants(pid) ON DELETE CASCADE,
  catalog     int  NOT NULL,
  course_code text NOT NULL,
  class_key   text NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interactions (
  id                   serial PRIMARY KEY,
  pid                  text NOT NULL REFERENCES participants(pid) ON DELETE CASCADE,
  round                int  NOT NULL,
  widget               text NOT NULL,
  course_code          text NOT NULL,
  class_code           text NOT NULL,
  order_pos            int,
  reserved_before      int,
  a_full_at_pick       boolean,
  got_a                boolean,
  attempts             int,
  fail_full            int,
  fail_conflict        int,
  seq                  int  NOT NULL,
  dwell_hover_ms       int,
  mouse_trace_len      int,
  selections           int,
  options_display_ms   int,
  first_key_latency_ms int,
  keystrokes           int,
  misclicks            int,
  total_ms             int,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sus_responses (
  id         serial PRIMARY KEY,
  pid        text NOT NULL REFERENCES participants(pid) ON DELETE CASCADE,
  round      int  NOT NULL,
  widget     text NOT NULL,
  answers    int[] NOT NULL,
  score      numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pid, round)
);

CREATE TABLE IF NOT EXISTS feedback (
  pid        text PRIMARY KEY REFERENCES participants(pid) ON DELETE CASCADE,
  preferred  text,
  open_text  text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Kolom tambahan (UI SIAKAD: dua widget per mata kuliah). Aman dijalankan berulang.
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS widget_type text;
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS wrong_pick int;
ALTER TABLE interactions ALTER COLUMN class_code DROP NOT NULL;
`;
