import "dotenv/config";
import { spawnSync } from "node:child_process";

const database =
  process.env.TEST_DATABASE_URL ||
  "postgresql://leadflow:leadflow@127.0.0.1:5432/leadflow_test";
if (!new URL(database).pathname.endsWith("_test"))
  throw new Error(
    "Test preparation requires a dedicated database whose name ends in _test.",
  );
// Override both URLs so a development/production DIRECT_URL cannot redirect test migrations.
const env = { ...process.env, DATABASE_URL: database, DIRECT_URL: database };
for (const args of [
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  ["node_modules/tsx/dist/cli.mjs", "prisma/seed.ts"],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
