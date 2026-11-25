export const SCHEMA = `
CREATE TABLE IF NOT EXISTS participants (
  pid          text PRIMARY KEY,
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
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS condition text;

-- Sisa desain v1 (dropdown vs typing) yang tidak lagi bermakna.
ALTER TABLE participants  DROP COLUMN IF EXISTS widget_first;
ALTER TABLE interactions  DROP COLUMN IF EXISTS widget;
ALTER TABLE sus_responses DROP COLUMN IF EXISTS widget;

-- ID unik dari browser: request yang dicoba ulang tidak membuat baris ganda.
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS client_id text;
CREATE UNIQUE INDEX IF NOT EXISTS interactions_client_id_key ON interactions (client_id);

-- Klik pada kelas yang sudah tampil nonaktif (dipisah dari penolakan server fail_full/fail_conflict).
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS click_full int;
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS click_conflict int;

-- Pembatalan: interaksi milik matkul yang kelasnya dihapus dari KRS ditandai, tidak dihapus.
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS cancelled boolean NOT NULL DEFAULT false;

-- Riwayat reservasi: kapan dan kenapa berakhir ('cancel' = dihapus peserta, 'reset' = reset kuota admin).
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ended_at timestamptz;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ended_by text;
`;
