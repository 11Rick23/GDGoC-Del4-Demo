import { cookies } from "next/headers";
import { HomePageClient } from "@/app/home-page-client";
import { listDirectMessageConversations } from "@/features/dm/server/queries";
import { auth } from "@/lib/auth";
import { getChatProgress } from "@/lib/database/ai-chat";
import { getProfileByUserId } from "@/lib/database/profiles";
import { acceptUserPolicyById, findUserById } from "@/lib/database/users";
import { POLICY_CONSENT_KEY } from "@/shared/constants/policy";

export default async function HomePage() {
	const session = await auth();
	const userId = session?.user?.id;

	let recentState = {
		profileStatus: "プロフィールをまだ作成していません",
		discoveryStatus: "探したい友達についてをまだ設定していません",
		dmStatus: "まだDMはありません",
	};

	if (userId) {
		const consentCookie = (await cookies()).get(POLICY_CONSENT_KEY)?.value;
		const [user, profile, targetProfileProgress, conversations] = await Promise.all([
			findUserById(userId),
			getProfileByUserId(userId),
			getChatProgress(userId, "target_profile"),
			listDirectMessageConversations(userId),
		]);

		if (user && !user.acceptedPolicyAt && consentCookie === "accepted") {
			await acceptUserPolicyById(userId);
		}

		const pendingReplyCount = conversations.filter(
			(conversation) =>
				conversation.lastMessage &&
				conversation.lastMessage.senderUserId !== userId,
		).length;

		const hasMyProfile = Boolean(profile?.myProfile?.trim());
		const discoveryStatus =
			targetProfileProgress?.step === "done" || targetProfileProgress?.step === "edit"
				? "さらにぴったりの友達も探せるよ！"
				: targetProfileProgress
					? "探したい友達についてもっと教えてね！"
					: "探したい友達について教えてほしいな！";

		recentState = {
			profileStatus: hasMyProfile
				? "教えてくれてありがとう！"
				: "あなたについて教えてね！",
			discoveryStatus,
			dmStatus:
				pendingReplyCount > 0
					? `${pendingReplyCount}件の未返信DMがあるよ！`
					: "未返信のDMはないよ！",
		};
	}

	return (
		<HomePageClient
			isSignedIn={Boolean(userId)}
			recentState={recentState}
		/>
	);
}
