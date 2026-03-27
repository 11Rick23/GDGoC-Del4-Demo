"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { LoginButton } from "@/features/auth/components/login-button";

const CharacterViewer = dynamic(() => import("@/components/3D/3DViewer"), {
	ssr: false,
});

type HomePageClientProps = {
	isSignedIn: boolean;
	recentState: {
		profileStatus: string;
		discoveryStatus: string;
		dmStatus: string;
	};
};

export function HomePageClient({
	isSignedIn,
	recentState,
}: HomePageClientProps) {
	const [trigger, setTrigger] = useState<
		"yokoyure" | "unazuku" | "speak" | "otefuri" | "nayamu"
	>("yokoyure");

	const handleClick = useCallback(() => {
		if (trigger === "yokoyure") {
			setTrigger("unazuku");
		}
	}, [trigger]);

	const handleAnimationEnd = useCallback(() => {
		setTrigger("yokoyure");
	}, []);

	return (
		<main className="relative flex flex-1 items-start justify-center overflow-hidden px-4 py-6 text-[#f4f1ea] sm:px-6 sm:py-8 md:py-10">
			<div className="absolute inset-0 z-0" onClick={handleClick}>
				<CharacterViewer
					trigger={trigger}
					onAnimationEnd={handleAnimationEnd}
				/>
			</div>
			<div className="relative z-10 flex w-full max-w-7xl flex-col items-center justify-start gap-8 pt-2 md:flex-row md:items-center md:justify-between md:gap-6 md:pt-0 md:min-h-[70vh]">
				<div className="order-first flex w-full max-w-md flex-col items-center self-start pt-0 md:self-start md:pt-12 md:-ml-20">
					<h1 className="bg-[linear-gradient(135deg,#0062FF_0%,#8AFFAD_100%)] bg-clip-text text-center text-4xl font-medium tracking-[-0.03em] text-transparent sm:text-5xl md:text-6xl">
						✧ Hello Mate ✧
					</h1>
					<p className="mt-4 text-center text-base text-black/80 sm:text-lg">
						ストレスない優しい友達づくり
					</p>
					{!isSignedIn && <div className="mt-8"><LoginButton /></div>}
				</div>

				{isSignedIn && (
					<div className="order-last flex w-full max-w-sm flex-col gap-4 pt-36 sm:gap-6 md:ml-auto md:max-w-xs md:self-center md:pt-20">
						<div className="relative rounded-[28px] border border-black/10 bg-[#bce2e8] p-4">
							<div className="absolute left-[-10px] top-6 h-5 w-5 rotate-45 border-b border-l border-black/10 bg-[#bce2e8] " />
							<p className="text-xs uppercase tracking-[0.2em] text-black/45">
								Profile
							</p>
							<p className="mt-2 text-sm leading-6 text-black/80">
								{recentState.profileStatus}
							</p>
						</div>
						<div className="relative rounded-[28px] border border-black/10 bg-[#bce2e8] p-4">
							<div className="absolute left-[-10px] top-6 h-5 w-5 rotate-45 border-b border-l border-black/10 bg-[#bce2e8]" />
							<p className="text-xs uppercase tracking-[0.2em] text-black/45">
								Discover
							</p>
							<p className="mt-2 text-sm leading-6 text-black/80">
								{recentState.discoveryStatus}
							</p>
						</div>
						<div className="relative rounded-[28px] border border-black/10 bg-[#bce2e8] p-4">
							<div className="absolute left-[-10px] top-6 h-5 w-5 rotate-45 border-b border-l border-black/10 bg-[#bce2e8]" />
							<p className="text-xs uppercase tracking-[0.2em] text-black/45">
								DM
							</p>
							<p className="mt-2 text-sm leading-6 text-black/80">
								{recentState.dmStatus}
							</p>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}
