"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
	className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
	return (
		<button
			type="button"
			onClick={() => signOut({ callbackUrl: "/" })}
			className={cn(
				"inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-black transition hover:cursor-pointer hover:bg-black/10",
				className,
			)}
		>
			<LogOut className="h-4 w-4" />
			ログアウト
		</button>
	);
}
