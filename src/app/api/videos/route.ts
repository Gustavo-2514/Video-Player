import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const VIDEO_DIR = process.env.VIDEO_DIR || "/tmp/videos";

export async function GET() {
  try {
    if (!fs.existsSync(VIDEO_DIR)) {
      return NextResponse.json(
        { error: "Diretório de vídeos não encontrado" },
        { status: 500 },
      );
    }

    const items = fs.readdirSync(VIDEO_DIR, { withFileTypes: true });

    const videos = items
      .filter((item) => item.isDirectory())
      .map((dir) => {
        const extensions = [".jpg", ".jpeg", ".png", ".webp"];
        let hasPoster = false;

        const dirPath = path.join(VIDEO_DIR, dir.name);
        for (const ext of extensions) {
          if (fs.existsSync(path.join(dirPath, `poster${ext}`))) {
            hasPoster = true;
            break;
          }
        }

        if (hasPoster) {
          return {
            name: dir.name,
            poster: `/api/poster?video=${encodeURIComponent(dir.name)}`,
            url: `/video/${encodeURIComponent(dir.name)}`,
          };
        }
        return null;
      })
      .filter(Boolean);

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Erro ao listar vídeos:", error);
    return NextResponse.json(
      { error: "Erro ao listar vídeos" },
      { status: 500 },
    );
  }
}
