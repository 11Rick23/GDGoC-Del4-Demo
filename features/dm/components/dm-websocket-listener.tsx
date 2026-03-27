"use client";

import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

export function DmWebSocketListener() {
	const router = useRouter();

	useEffect(() => {
		let socket: WebSocket | undefined;
		let reconnectTimer: number | undefined;
		let isUnmounted = false;

		const connect = () => {
			const protocol = window.location.protocol === "https:" ? "wss" : "ws";
			socket = new WebSocket(`${protocol}://${window.location.host}/dm-ws`);

			socket.addEventListener("message", (event) => {
				let payload: { type?: string } | null = null;

				if (typeof event.data === "string") {
					try {
						payload = JSON.parse(event.data) as { type?: string };
					} catch {
						payload = null;
					}
				}

				if (payload?.type === "ready") {
					return;
				}

				startTransition(() => {
					router.refresh();
				});
			});

			socket.addEventListener("close", () => {
				if (isUnmounted) {
					return;
				}

				reconnectTimer = window.setTimeout(connect, 1000);
			});
		};

		connect();

		return () => {
			isUnmounted = true;
			if (reconnectTimer) {
				window.clearTimeout(reconnectTimer);
			}
			socket?.close();
		};
	}, [router]);

	return null;
}
