import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
const directory = resolve(".local-postgres");
const postgres = new EmbeddedPostgres({ databaseDir: directory, user: "leadflow", password: "leadflow", port: 5432, persistent: true, postgresFlags: ["-h", "127.0.0.1"], onLog: () => {}, onError: message => console.error(String(message)) });
if (!existsSync(resolve(directory, "PG_VERSION"))) await postgres.initialise();
await postgres.start();
const client = postgres.getPgClient();
await client.connect();
for (const name of ["leadflow", "leadflow_test"]) {
  const { rows } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
  if (!rows.length) await client.query(`CREATE DATABASE "${name}"`);
}
await client.end();
console.log("Local PostgreSQL ready on 127.0.0.1:5432 (leadflow and leadflow_test). Keep this process running. Ctrl+C to stop.");
let stopping = false;
async function stop() { if (stopping) return; stopping = true; await postgres.stop(); process.exit(0); }
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 60000);
