const connectionsByUserId =
	globalThis.__dmConnectionsByUserId ?? new Map();

if (!globalThis.__dmConnectionsByUserId) {
	globalThis.__dmConnectionsByUserId = connectionsByUserId;
}

export function registerDmConnection(userId, socket) {
	const existingConnections = connectionsByUserId.get(userId);

	if (existingConnections) {
		existingConnections.add(socket);
	} else {
		connectionsByUserId.set(userId, new Set([socket]));
	}

	const cleanup = () => {
		const userConnections = connectionsByUserId.get(userId);
		if (!userConnections) {
			return;
		}

		userConnections.delete(socket);
		if (userConnections.size === 0) {
			connectionsByUserId.delete(userId);
		}
	};

	socket.on("close", cleanup);
	socket.on("error", cleanup);

	try {
		socket.send(JSON.stringify({ type: "ready" }));
	} catch {}
}

export function publishDmWebSocketEvent(userIds, event) {
	for (const userId of new Set(userIds)) {
		const connections = connectionsByUserId.get(userId);
		if (!connections) {
			continue;
		}

		for (const socket of connections) {
			if (socket.readyState !== 1) {
				continue;
			}

			try {
				socket.send(JSON.stringify(event));
			} catch {}
		}
	}
}
