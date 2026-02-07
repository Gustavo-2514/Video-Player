import { NextRequest, NextResponse } from 'next/server';

const APP_PIN = process.env.APP_PIN;

export async function POST(request: NextRequest) {
  if (!APP_PIN) {
    return NextResponse.json({ success: true });
  }

  try {
    const { pin } = await request.json();

    if (pin === APP_PIN) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'PIN incorreto' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao validar PIN' },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ enabled: !!APP_PIN });
}

