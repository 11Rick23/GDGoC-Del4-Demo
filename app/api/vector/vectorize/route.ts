/**
 * Vector API - Vectorize Endpoint
 * テキストをE5モデルでベクトル化
 */

import { NextRequest, NextResponse } from "next/server";

const VECTOR_API_URL =
	process.env.VECTOR_API_URL || "http://localhost:8000/api/v1";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Validation
		if (!body.texts || !Array.isArray(body.texts)) {
			return NextResponse.json(
				{
					error: "Invalid request",
					message: "texts配列が必要です",
				},
				{ status: 400 },
			);
		}

		if (body.texts.length === 0) {
			return NextResponse.json(
				{
					error: "Empty array",
					message: "texts配列は少なくとも1つのテキストが必要です",
				},
				{ status: 400 },
			);
		}

		if (body.texts.length > 100) {
			return NextResponse.json(
				{
					error: "Too many texts",
					message: "一度に最大100件までのテキストを処理できます",
				},
				{ status: 400 },
			);
		}

		// Call Python FastAPI service
		const response = await fetch(`${VECTOR_API_URL}/vectorize`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ texts: body.texts }),
		});

		if (!response.ok) {
			const errorData = await response.json();
			return NextResponse.json(
				{
					error: "Vectorization failed",
					message: errorData.detail?.message || "ベクトル化に失敗しました",
					details: errorData.detail,
				},
				{ status: response.status },
			);
		}

		const data = await response.json();

		return NextResponse.json({
			success: true,
			vectors: data.vectors,
			dimension: data.dimension,
			count: data.vectors.length,
		});
	} catch (error) {
		console.error("Vectorize API error:", error);
		return NextResponse.json(
			{
				error: "Internal server error",
				message: "ベクトル化処理中にエラーが発生しました",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
