"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
	{ href: "/", label: "Home" },
	{ href: "/profile-ai", label: "Profile" },
	{ href: "/discovery-ai", label: "Discover" },
	{ href: "/dm", label: "DM" },
	{ href: "/settings", label: "Settings" },
];

export function NavBar() {
	const pathname = usePathname();

	return (
		<header className="sticky top-0 z-20 h-16">
			<nav className="mx-auto flex h-full w-full max-w-6xl items-center justify-end gap-2 overflow-x-auto px-4 sm:px-6">
				{navItems.map((item) => {
					const isActive = pathname === item.href;

					return (
						<Link
							key={item.href}
							href={item.href}
							className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
								isActive
									? "bg-[linear-gradient(135deg,#0062FF_0%,#8AFFAD_100%)] text-white"
									: "text-black/80 hover:text-black"
							}`}
						>
							{item.label}
						</Link>
					);
				})}
			</nav>
		</header>
	);
}
