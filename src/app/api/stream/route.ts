import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import mime from "mime-types";

const VIDEO_DIR = process.env.VIDEO_DIR || "/tmp/videos";

function safeJoin(videoDir: string, fileName: string): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "");
  if (sanitized !== fileName) {
    throw new Error("Nome de arquivo inválido");
  }

  const full = path.join(videoDir, sanitized);
  const normalized = path.normalize(full);
  const normalizedDir = path.normalize(videoDir + path.sep);

  if (!normalized.startsWith(normalizedDir)) {
    throw new Error("Caminho inválido - tentativa de path traversal");
  }

  return normalized;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const file = searchParams.get("file");

  if (!file) {
    return new NextResponse("Arquivo não informado", { status: 400 });
  }

  try {
    const filePath = safeJoin(VIDEO_DIR, file);

    if (!fs.existsSync(filePath)) {
      console.log(
        `Arquivo não encontrado: ${file} (IP: ${
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown"
        })`
      );
      return new NextResponse("Arquivo não encontrado", { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const mimeType = mime.lookup(filePath) || "application/octet-stream";

    if (!mimeType.includes("mp4") && !filePath.toLowerCase().endsWith(".mp4")) {
      return new NextResponse("Tipo de arquivo não permitido", { status: 403 });
    }

    const clientIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    console.log(`Acesso: ${file} - IP: ${clientIp}`);

    const range = request.headers.get("range");

    if (range) {
      const match = range.match(/bytes=(\d+)-(\d*)/);
      if (!match) {
        return new NextResponse("Range inválido", { status: 416 });
      }

      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : stat.size - 1;
      const chunkSize = end - start + 1;

      if (start >= stat.size || end >= stat.size || start > end) {
        return new NextResponse("Range inválido", { status: 416 });
      }

      const nodeStream = fs.createReadStream(filePath, { start, end });
      const readableStream = Readable.toWeb(
        nodeStream as unknown as NodeJS.ReadableStream
      );

      return new NextResponse(readableStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=31536000",
        },
      });
    } else {
      const nodeStream = fs.createReadStream(filePath);
      const readableStream = Readable.toWeb(
        nodeStream as unknown as NodeJS.ReadableStream
      );

      return new NextResponse(readableStream, {
        headers: {
          "Content-Length": String(stat.size),
          "Content-Type": mimeType,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000",
        },
      });
    }
  } catch (error: any) {
    console.error("Erro ao servir arquivo:", error);
    if (
      error.message.includes("path traversal") ||
      error.message.includes("inválido")
    ) {
      return new NextResponse("Caminho inválido", { status: 403 });
    }
    return new NextResponse("Erro ao servir arquivo", { status: 500 });
  }
}
