import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import mime from "mime-types";

const VIDEO_DIR = process.env.VIDEO_DIR || "/tmp/videos";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoName = searchParams.get("video");

  if (!videoName) {
    return new NextResponse("Nome do vídeo não informado", { status: 400 });
  }

  if (
    videoName.includes("/") ||
    videoName.includes("\\") ||
    videoName.includes("..")
  ) {
    return new NextResponse("Nome de vídeo inválido", { status: 400 });
  }
  const sanitizedVideoName = videoName;

  const posterExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  let posterPath = "";

  for (const ext of posterExtensions) {
    const checkPath = path.join(VIDEO_DIR, sanitizedVideoName, `poster${ext}`);
    if (fs.existsSync(checkPath)) {
      posterPath = checkPath;
      break;
    }
  }

  if (!posterPath) {
    return new NextResponse("Poster não encontrado", { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(posterPath);
    const mimeType = mime.lookup(posterPath) || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Erro ao ler poster:", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}
