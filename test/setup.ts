import { beforeEach } from "bun:test";
import { resetTestDb } from "../src/provider/db";

beforeEach(async () => {
  await resetTestDb();
});
