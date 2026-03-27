"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

type AppProvidersProps = {
	children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
	return <SessionProvider>{children}</SessionProvider>;
}
