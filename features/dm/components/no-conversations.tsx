export function NoConversations() {
	return (
		<div className="flex h-full flex-col items-center justify-center rounded-[24px] border border-dashed border-black/15 bg-black/5 px-6 py-8 text-center">
			<p className="text-sm font-medium text-black/60">まだ会話がありません</p>
			<p className="mt-2 text-sm leading-6 text-black/45">
				DM が作成されると、ここに相手ユーザーの一覧が表示されます。
			</p>
		</div>
	);
}
