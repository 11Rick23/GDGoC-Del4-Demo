import { redirect } from "next/navigation";
import { Save } from "lucide-react";
import { updateSettingsAction } from "@/app/settings/actions";
import { SettingsForm } from "@/app/settings/settings-form";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { auth } from "@/lib/auth";
import { findUserById } from "@/lib/database/users";
import { PolicyContent } from "@/shared/components/policy-content";

export default async function SettingsPage() {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/");
	}

	const user = await findUserById(session.user.id);

	if (!user) {
		redirect("/");
	}

	return (
		<main className="flex flex-1 justify-center px-6 py-12 text-black/80">
			<div className="grid w-full max-w-6xl gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
				<section className="flex flex-col rounded-3xl border border-black/10 bg-white/40 p-8 backdrop-blur-sm sm:p-10">
					<p className="text-sm uppercase tracking-[0.28em] text-black/40">Settings</p>
					<h1 className="mt-4 text-3xl font-medium tracking-[-0.03em] sm:text-5xl">
						Account
					</h1>
					<p className="mt-4 text-base leading-7 text-black/60 sm:text-lg">
						メールアドレスの確認、ニックネームとアイコンの変更、ログアウトができます。
					</p>

					<div className="mt-10 grid gap-8 md:grid-cols-[220px_minmax(0,1fr)]">
						<div className="flex h-full flex-col items-center justify-between p-2">
							<div className="flex flex-col items-center">
							<div className="relative h-32 w-32 overflow-hidden rounded-full border border-black/10 bg-[#bce2e8]">
								{user.image ? (
									<img
										src={user.image}
										alt={user.name ?? user.email}
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-black/50">
										{(user.name ?? user.email).slice(0, 1).toUpperCase()}
									</div>
								)}
							</div>
							<p className="mt-4 text-center text-sm font-semibold text-black">Current Icon</p>
							</div>
							<div className="mt-8 flex w-full flex-col items-center gap-3">
								<button
									type="submit"
									form="settings-form"
									className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-[#bce2e8] px-6 py-3 text-sm font-medium text-black transition hover:bg-[#acd6dd]"
								>
									<Save className="h-4 w-4" />
									保存する
								</button>
								<LogoutButton />
							</div>
						</div>

						<SettingsForm
							email={user.email}
							name={user.name}
							image={user.image}
							updateAction={updateSettingsAction}
						/>
					</div>
				</section>

				<section className="flex flex-col rounded-3xl border border-black/10 bg-white/40 p-8 backdrop-blur-sm sm:p-10">
					<p className="text-sm uppercase tracking-[0.28em] text-black/40">Policy</p>
					<h2 className="mt-4 text-3xl font-medium tracking-[-0.03em] sm:text-4xl">
						Service Policy
					</h2>
					<p className="mt-4 text-base leading-7 text-black/60">
						利用時の基本的な考え方と、安心して交流するためのルールです。<br/>サービスを利用した時点でこの規約に同意したとみなしますので、ご注意ください。
					</p>
					<div className="mt-8 max-h-[420px] overflow-y-auto rounded-3xl border border-black/10 bg-white/60 p-6">
						<div className="text-black/75">
							<PolicyContent />
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}
