"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { updateUserProfileById } from "@/lib/database/users";

export async function updateSettingsAction(formData: FormData) {
	const session = await auth();
	const userId = session?.user?.id;

	if (!userId) {
		throw new Error("Unauthorized");
	}

	const rawName = formData.get("name");
	const currentImage = formData.get("currentImage");
	const rawFile = formData.get("image");

	const name =
		typeof rawName === "string" && rawName.trim().length > 0
			? rawName.trim()
			: null;

	let image =
		typeof currentImage === "string" && currentImage.trim().length > 0
			? currentImage.trim()
			: null;

	if (rawFile instanceof File && rawFile.size > 0) {
		const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
		await mkdir(uploadDir, { recursive: true });

		const ext = path.extname(rawFile.name) || ".png";
		const fileName = `${randomUUID()}${ext}`;
		const filePath = path.join(uploadDir, fileName);
		const buffer = Buffer.from(await rawFile.arrayBuffer());

		await writeFile(filePath, buffer);
		image = `/uploads/avatars/${fileName}`;
	}

	await updateUserProfileById(userId, { name, image });
	revalidatePath("/settings");
}
