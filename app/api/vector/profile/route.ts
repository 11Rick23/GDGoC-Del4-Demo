/**
 * Vector API - Profile Endpoint
 * プロフィールの作成・更新とベクトル化
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
	upsertProfile,
	upsertProfileVectors,
	getFullProfileByUserId,
} from "@/lib/database/profiles";

const VECTOR_API_URL =
	process.env.VECTOR_API_URL || "http://localhost:8000/api/v1";

/**
 * GET - プロフィールとベクトルを取得
 */
export async function GET(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json(
				{
					error: "Unauthorized",
					message: "ログインが必要です",
				},
				{ status: 401 },
			);
		}

		const fullProfile = await getFullProfileByUserId(session.user.id);

		if (!fullProfile) {
			return NextResponse.json(
				{
					error: "Not found",
					message: "プロフィールが見つかりません",
				},
				{ status: 404 },
			);
		}

		return NextResponse.json({
			success: true,
			profile: {
				...fullProfile.profile,
			},
			hasVectors: !!fullProfile.vectors,
		});
	} catch (error) {
		console.error("Get profile error:", error);
		return NextResponse.json(
			{
				error: "Internal server error",
				message: "プロフィール取得中にエラーが発生しました",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

/**
 * POST - プロフィールを作成・更新してベクトル化
 */
export async function POST(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json(
				{
					error: "Unauthorized",
					message: "ログインが必要です",
				},
				{ status: 401 },
			);
		}

		const body = await request.json();
		const { myProfile, desiredProfile, undesiredProfile } = body;

		// Validation
		if (!myProfile || !desiredProfile || !undesiredProfile) {
			return NextResponse.json(
				{
					error: "Invalid request",
					message:
						"myProfile, desiredProfile, undesiredProfile が必要です",
				},
				{ status: 400 },
			);
		}

		// 1. プロフィールをDBに保存
		const profile = await upsertProfile({
			userId: session.user.id,
			myProfile,
			desiredProfile,
			undesiredProfile,
		});

		// 2. テキストをベクトル化
		const textsToVectorize = [
			myProfile,
			desiredProfile,
			undesiredProfile,
		];

		const vectorizeResponse = await fetch(`${VECTOR_API_URL}/vectorize`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ texts: textsToVectorize }),
		});

		if (!vectorizeResponse.ok) {
			const errorData = await vectorizeResponse.json();
			return NextResponse.json(
				{
					error: "Vectorization failed",
					message: errorData.detail?.message || "ベクトル化に失敗しました",
					details: errorData.detail,
				},
				{ status: vectorizeResponse.status },
			);
		}

		const vectorData = await vectorizeResponse.json();
		const [myVector, desiredVector, undesiredVector] = vectorData.vectors;

		// 3. ベクトルをDBに保存
		await upsertProfileVectors({
			profileId: profile.id,
			myProfileVector: myVector,
			desiredProfileVector: desiredVector,
			undesiredProfileVector: undesiredVector,
		});

		return NextResponse.json({
			success: true,
			message: "プロフィールとベクトルを保存しました",
			profileId: profile.id,
		});
	} catch (error) {
		console.error("Update profile error:", error);
		return NextResponse.json(
			{
				error: "Internal server error",
				message: "プロフィール更新中にエラーが発生しました",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
