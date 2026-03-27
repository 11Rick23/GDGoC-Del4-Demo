"use client";

import { Pencil } from "lucide-react";

type SettingsFormProps = {
	email: string;
	name: string | null;
	image: string | null;
	updateAction: (formData: FormData) => void | Promise<void>;
};

export function SettingsForm({
	email,
	name,
	image,
	updateAction,
}: SettingsFormProps) {
	return (
		<form id="settings-form" action={updateAction} className="space-y-6">
			<input type="hidden" name="currentImage" value={image ?? ""} />

			<div className="rounded-3xl border border-black/10 bg-white/60 p-6">
				<div className="flex items-center justify-between gap-3">
					<p className="text-sm font-semibold uppercase tracking-[0.2em] text-black">Nickname</p>
					<Pencil className="h-4 w-4 text-black/45" />
				</div>
				<input
					id="name"
					name="name"
					type="text"
					defaultValue={name ?? ""}
					placeholder="ニックネームを入力"
					className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-black/80 outline-none"
				/>
			</div>

			<div className="rounded-3xl border border-black/10 bg-white/60 p-6">
				<p className="text-sm font-semibold uppercase tracking-[0.2em] text-black">Email</p>
				<p className="mt-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-black/80">
					{email}
				</p>
			</div>

			<div className="rounded-3xl border border-black/10 bg-white/60 p-6">
				<div className="flex items-center justify-between gap-3">
					<p className="text-sm font-semibold uppercase tracking-[0.2em] text-black">Icon</p>
					<Pencil className="h-4 w-4 text-black/45" />
				</div>
				<label className="mt-3 block text-sm text-black/55" htmlFor="image">
					アイコン画像をアップロード
				</label>
				<input
					id="image"
					name="image"
					type="file"
					accept="image/*"
					className="mt-2 block w-full text-sm text-black/70 file:mr-4 file:rounded-full file:border file:border-black/10 file:bg-white file:px-4 file:py-3 file:text-sm file:font-medium file:text-black hover:file:bg-black/10"
				/>
				<p className="mt-4 text-sm leading-6 text-black/55">
					アップロードした画像がアイコンとして保存されます。
				</p>
			</div>
		</form>
	);
}
