import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const ALLOWED_MODELS: Record<string, string> = {
  q7n2x4: "milfy_yokoyure.glb",
  p3v8k1: "milfy_unazuku.glb",
  m9r5t2: "milfy_speak.glb",
  b6w1c8: "milfy_otefuri.glb",
  z4h7y3: "milfy_nayamu.glb",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const fileName = ALLOWED_MODELS[name];

  if (!fileName) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), "assets/models", fileName);
    const file = await readFile(filePath);

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
