export function NoActiveConversation() {
	return (
		<div className="flex h-full min-h-80 flex-col items-center justify-center rounded-[28px] border border-dashed border-black/15 bg-black/5 px-6 text-center">
			<p className="text-base font-medium text-black/60">相手を選択してください。</p>
			<p className="mt-3 max-w-md text-sm leading-6 text-black/45">
				左のパネルからユーザーを選択すると、このエリアにメッセージ履歴が表示されます。
			</p>
		</div>
	);
}
