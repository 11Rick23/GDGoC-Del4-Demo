/**
 * DB初期化スクリプト
 * - del4db データベース作成
 * - pgvector 拡張有効化
 *
 * 使い方: npm run db:setup
 */

import "dotenv/config";
import { Client } from "pg";

const BASE_URL =
	process.env.DATABASE_URL?.replace(/\/[^/]+$/, "/postgres") ||
	"postgresql://postgres:postgres@localhost:54322/postgres";

const DB_NAME =
	process.env.DATABASE_URL?.match(/\/([^/?]+)(\?|$)/)?.[1] || "del4db";

async function main() {
	const client = new Client({ connectionString: BASE_URL });
	await client.connect();

	// データベース作成（既存なら無視）
	const exists = await client.query(
		"SELECT 1 FROM pg_database WHERE datname = $1",
		[DB_NAME],
	);
	if (exists.rowCount === 0) {
		await client.query(`CREATE DATABASE "${DB_NAME}"`);
		console.log(`✅ Created database: ${DB_NAME}`);
	} else {
		console.log(`ℹ️  Database already exists: ${DB_NAME}`);
	}
	await client.end();

	// pgvector 有効化
	const dbUrl =
		process.env.DATABASE_URL ||
		`postgresql://postgres:postgres@localhost:54322/${DB_NAME}`;
	const dbClient = new Client({ connectionString: dbUrl });
	await dbClient.connect();
	await dbClient.query("CREATE EXTENSION IF NOT EXISTS vector");
	console.log("✅ pgvector extension enabled");
	await dbClient.end();

	console.log("✅ DB setup complete. Run: npm run db:push");
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
