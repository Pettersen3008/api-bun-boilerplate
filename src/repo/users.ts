import { appDb } from "../provider/db";

export type UserRecord = {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
};

export interface IUsersRepo {
  listByOffset(query: UsersListQuery): Promise<UserRecord[]>;
  listByCursor(query: UsersListQuery, cursor?: { createdAt: string; id: string }): Promise<UserRecord[]>;
  getById(id: string): Promise<UserRecord | null>;
  create(input: { email: string; fullName: string }): Promise<UserRecord>;
}

export type UsersListQuery = {
  limit: number;
  offset?: number;
};

export class UsersRepo implements IUsersRepo {
  async listByOffset(query: UsersListQuery): Promise<UserRecord[]> {
    const params: Array<string | number | boolean | null> = [];
    const offset = query.offset ?? 0;

    params.push(query.limit, offset);

    return appDb.query<UserRecord>(
      "SELECT id, email, full_name, created_at, updated_at FROM users ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?",
      params,
    );
  }

  async listByCursor(query: UsersListQuery, cursor?: { createdAt: string; id: string }): Promise<UserRecord[]> {
    const params: Array<string | number | boolean | null> = [];

    if (!cursor) {
      params.push(query.limit);
      return appDb.query<UserRecord>(
        "SELECT id, email, full_name, created_at, updated_at FROM users ORDER BY created_at DESC, id DESC LIMIT ?",
        params,
      );
    }

    params.push(cursor.createdAt, cursor.createdAt, cursor.id, query.limit);

    return appDb.query<UserRecord>(
      "SELECT id, email, full_name, created_at, updated_at FROM users WHERE (created_at < ? OR (created_at = ? AND id < ?)) ORDER BY created_at DESC, id DESC LIMIT ?",
      params,
    );
  }

  async getById(id: string): Promise<UserRecord | null> {
    const rows = await appDb.query<UserRecord>(
      "SELECT id, email, full_name, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
      [id],
    );

    return rows[0] ?? null;
  }

  async create(input: { email: string; fullName: string }): Promise<UserRecord> {
    const rows = await appDb.query<UserRecord>(
      "INSERT INTO users (email, full_name) VALUES (?, ?) RETURNING id, email, full_name, created_at, updated_at",
      [input.email, input.fullName],
    );

    if (rows.length === 0) {
      throw new Error("Failed to create user");
    }

    return rows[0] as UserRecord;
  }
}

export const usersRepo: IUsersRepo = new UsersRepo();
