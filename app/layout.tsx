import type { Metadata } from "next";
import { Geist_Mono, Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";
import { AppIcon } from "@/components/ui/icon";
import { NavBar } from "@/shared/components/nav-bar";
import { AppProviders } from "@/shared/providers/app-providers";

const zenMaruGothic = Zen_Maru_Gothic({
	variable: "--font-zen-maru-gothic",
	subsets: ["latin"],
	weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Hello Mate",
	description: "Experimental Google sign-in flow for localhost",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${zenMaruGothic.variable} ${geistMono.variable} antialiased`}
			>
				<AppProviders>
					<div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-t from-[#94d1c4] to-[#f0f8ff]">
						<div className="pointer-events-none fixed inset-0 z-0 starfield-base" />
						<div className="pointer-events-none fixed inset-0 z-0 starfield-near" />
						<div className="pointer-events-none fixed inset-0 z-0 starfield-far" />
						<div className="pointer-events-none fixed inset-0 z-0 starfield-sparkle" />
						<div className="pointer-events-none fixed left-4 top-4 z-30">
							<AppIcon className="h-24 w-24" />
						</div>
						<NavBar />
						<div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
					</div>
				</AppProviders>
			</body>
		</html>
	);
}
