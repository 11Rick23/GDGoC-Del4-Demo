export function getHandleInitials(value: string) {
	return value
		.split(/[\s._-]+/)
		.map((part) => part.charAt(0))
		.join("")
		.slice(0, 2)
		.toUpperCase();
}
