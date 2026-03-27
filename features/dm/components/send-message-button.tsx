"use client";

import { useFormStatus } from "react-dom";

type SendMessageButtonProps = {
	disabled?: boolean;
};

export function SendMessageButton({ disabled = false }: SendMessageButtonProps) {
	const { pending } = useFormStatus();
	const isDisabled = disabled || pending;

	return (
		<button
			type="submit"
			disabled={isDisabled}
			className="rounded-full border border-black/10 bg-transparent px-4 py-2 text-sm font-medium text-black/70 transition-colors hover:bg-black/5 hover:text-black disabled:cursor-not-allowed disabled:border-black/5 disabled:text-black/35"
		>
			{pending ? "Sending..." : "Send"}
		</button>
	);
}
