CREATE TABLE person (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  photo_key TEXT,
  bank_account TEXT,
  next_of_kin TEXT,
  guarantor TEXT,
  created_at TEXT NOT NULL
);
