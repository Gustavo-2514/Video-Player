import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const VIDEO_DIR = process.env.VIDEO_DIR || '/tmp/videos';

export async function GET() {
  try {
    if (!fs.existsSync(VIDEO_DIR)) {
      return NextResponse.json(
        { error: 'Diretório de vídeos não encontrado' },
        { status: 500 }
      );
    }
    const files = fs.readdirSync(VIDEO_DIR);
    
    const mp4Files = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ext === '.mp4' && fs.statSync(path.join(VIDEO_DIR, file)).isFile();
    });

    const videos = mp4Files.map(file => ({
      name: file,
      url: `/api/stream?file=${encodeURIComponent(file)}`,
    }));

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Erro ao listar vídeos:', error);
    return NextResponse.json(
      { error: 'Erro ao listar vídeos' },
      { status: 500 }
    );
  }
}

