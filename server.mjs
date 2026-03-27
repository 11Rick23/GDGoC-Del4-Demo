import "dotenv/config";
import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import pg from "pg";
import { WebSocketServer } from "ws";
import { registerDmConnection } from "./features/dm/server/realtime.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = Number(process.env.PORT ?? 3000);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const { Pool } = pg;

const sessionCookieNames = [
	"next-auth.session-token",
	"__Secure-next-auth.session-token",
	"authjs.session-token",
	"__Secure-authjs.session-token",
];

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("DATABASE_URL is not set. Please define it in your environment.");
}

const pool = new Pool({
	connectionString: databaseUrl,
});

function getCookieValue(cookieHeader, name) {
	if (!cookieHeader) {
		return null;
	}

	const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
	for (const cookie of cookies) {
		const prefix = `${name}=`;
		if (cookie.startsWith(prefix)) {
			return decodeURIComponent(cookie.slice(prefix.length));
		}
	}

	return null;
}

async function getUserIdFromUpgradeRequest(request) {
	const cookieHeader = request.headers.cookie;
	const sessionToken = sessionCookieNames
		.map((name) => getCookieValue(cookieHeader, name))
		.find(Boolean);

	if (!sessionToken) {
		return null;
	}

	const result = await pool.query(
		`
			select user_id
			from sessions
			where session_token = $1
			and expires > now()
			limit 1
		`,
		[sessionToken],
	);

	return result.rows[0]?.user_id ?? null;
}

await app.prepare();
const handleUpgrade = app.getUpgradeHandler();

const server = createServer((request, response) => {
	const parsedUrl = parse(request.url ?? "/", true);
	handle(request, response, parsedUrl);
});

const websocketServer = new WebSocketServer({ noServer: true });

server.on("upgrade", async (request, socket, head) => {
	const { pathname } = parse(request.url ?? "/", true);

	if (pathname !== "/dm-ws") {
		await handleUpgrade(request, socket, head);
		return;
	}

	try {
		const userId = await getUserIdFromUpgradeRequest(request);
		if (!userId) {
			socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
			socket.destroy();
			return;
		}

		websocketServer.handleUpgrade(request, socket, head, (websocket) => {
			registerDmConnection(userId, websocket);
		});
	} catch (error) {
		console.error("WebSocket upgrade failed:", error);
		socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
		socket.destroy();
	}
});

server.listen(port, hostname, () => {
	console.log(`> Ready on http://${hostname}:${port}`);
});
