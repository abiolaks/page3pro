export interface PersonScope {
  readonly personId: string;
}

export interface PersonProfile {
  id: string;
  name: string;
  phone: string;
  photo_key: string | null;
  bank_account: string | null;
  next_of_kin: string | null;
  guarantor: string | null;
  created_at: string;
}

export interface ScopedDataAccess {
  getPersonProfile(): Promise<PersonProfile | null>;
}

export function createScopedDataAccess(
  database: D1Database,
  scope: PersonScope,
): ScopedDataAccess {
  return {
    getPersonProfile(): Promise<PersonProfile | null> {
      return database
        .prepare(
          `SELECT id, name, phone, photo_key, bank_account, next_of_kin, guarantor, created_at
           FROM person
           WHERE id = ?`,
        )
        .bind(scope.personId)
        .first<PersonProfile>();
    },
  };
}
