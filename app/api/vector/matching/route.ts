/**
 * Vector API - Matching Endpoint
 * ユーザー間のベクトル類似度マッチング
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const VECTOR_API_URL =
	process.env.VECTOR_API_URL || "http://localhost:8000/api/v1";

export async function POST(request: NextRequest) {
	try {
		// 認証チェック
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
		const { userId } = body;

		// ユーザーIDの検証（管理者以外は自分のIDのみ許可）
		if (!userId || userId !== session.user.id) {
			return NextResponse.json(
				{
					error: "Forbidden",
					message: "指定されたユーザーIDにアクセスできません",
				},
				{ status: 403 },
			);
		}

		// Call Python FastAPI service
		const response = await fetch(`${VECTOR_API_URL}/matching`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ userId }),
		});

		if (!response.ok) {
			const errorData = await response.json();
			return NextResponse.json(
				{
					error: "Matching failed",
					message: errorData.detail?.message || "マッチング処理に失敗しました",
					details: errorData.detail,
				},
				{ status: response.status },
			);
		}

		const data = await response.json();

		return NextResponse.json({
			success: true,
			requestUserId: data.requestUserId,
			matchCount: data.matchCount,
			matches: data.matches,
		});
	} catch (error) {
		console.error("Matching API error:", error);
		return NextResponse.json(
			{
				error: "Internal server error",
				message: "マッチング処理中にエラーが発生しました",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
