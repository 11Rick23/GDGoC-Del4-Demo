export function formatDisplayName(
	name?: string | null,
	email?: string | null,
) {
	if (name?.trim()) {
		return name.trim();
	}

	if (email?.trim()) {
		return email.trim();
	}

	return "Unknown User";
}
