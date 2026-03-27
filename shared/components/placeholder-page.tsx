type PlaceholderPageProps = {
	title: string;
	description: string;
};

export function PlaceholderPage({
	title,
	description,
}: PlaceholderPageProps) {
	return (
		<main className="flex flex-1 items-center justify-center px-6 py-12 text-black/80">
			<div className="w-full max-w-2xl rounded-3xl border border-black/10 bg-white/40 p-8 backdrop-blur-sm sm:p-10">
				<p className="text-sm uppercase tracking-[0.28em] text-black/40">
					Coming Soon
				</p>
				<h1 className="mt-4 text-3xl font-medium tracking-[-0.03em] sm:text-5xl">
					{title}
				</h1>
				<p className="mt-4 text-base leading-7 text-black/60 sm:text-lg">
					{description}
				</p>
			</div>
		</main>
	);
}
