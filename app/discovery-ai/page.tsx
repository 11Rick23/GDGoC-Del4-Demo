import { redirect } from "next/navigation";
import { DiscoveryAiPageClient } from "@/app/discovery-ai/discovery-ai-page-client";
import { auth } from "@/lib/auth";

export default async function DiscoveryAiPage() {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/");
	}

	return <DiscoveryAiPageClient />;
}
