"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { POLICY_CONSENT_KEY } from "@/shared/constants/policy";
import { PolicyContent } from "@/shared/components/policy-content";

export function LoginButton() {
	const [open, setOpen] = useState(false);
	const [hasConsent, setHasConsent] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		setHasConsent(window.localStorage.getItem(POLICY_CONSENT_KEY) === "accepted");
	}, []);

	const startGoogleSignIn = () => {
		void signIn("google", { callbackUrl: "/" });
	};

	const handleAgree = () => {
		if (typeof window !== "undefined") {
			window.localStorage.setItem(POLICY_CONSENT_KEY, "accepted");
			document.cookie = `${POLICY_CONSENT_KEY}=accepted; path=/; max-age=${60 * 60 * 24 * 365}`;
		}

		setHasConsent(true);
		startGoogleSignIn();
	};

	return (
		<>
			<button
				type="button"
				onClick={() => {
					if (hasConsent) {
						startGoogleSignIn();
						return;
					}
					setOpen(true);
				}}
				className="rounded-full bg-[#f1f1ef] px-10 py-4 text-lg font-medium text-[#111111] transition hover:bg-white hover:cursor-pointer"
			>
				ログイン
			</button>

			{open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
					<div className="w-full max-w-2xl rounded-3xl border border-black/10 bg-white p-6 text-black shadow-2xl sm:p-8">
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-black/45">
							Policy
						</p>
						<h2 className="mt-3 text-2xl font-medium tracking-[-0.03em] sm:text-3xl">
							Service Policy
						</h2>
						<p className="mt-4 text-sm leading-7 text-black/60 sm:text-base">
							利用前にポリシーをご確認ください。本ポリシーに同意する場合のみ、本サービスの利用を開始できます。
						</p>
						<div className="mt-6 max-h-[45vh] overflow-y-auto rounded-3xl border border-black/10 bg-[#f8fbfa] p-5">
							<div className="text-black/75">
								<PolicyContent />
							</div>
						</div>
						<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
							<button
								type="button"
								onClick={() => setOpen(false)}
								className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-black/10"
							>
								同意しない
							</button>
							<button
								type="button"
								onClick={handleAgree}
								className="inline-flex items-center justify-center rounded-full bg-[#bce2e8] px-6 py-3 text-sm font-medium text-black transition hover:bg-[#acd6dd]"
							>
								同意して進む
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
