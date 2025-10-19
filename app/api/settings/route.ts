import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 設定取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    let settings = await prisma.settings.findUnique({
      where: { accountId },
    })

    // 設定が存在しない場合は作成
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          accountId,
        },
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    )
  }
}

// 設定更新
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accountId, basePrompt, theme, defaultSchedule } = body

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    // upsert（存在すれば更新、なければ作成）
    const settings = await prisma.settings.upsert({
      where: { accountId },
      update: {
        basePrompt,
        theme,
        defaultSchedule,
      },
      create: {
        accountId,
        basePrompt,
        theme,
        defaultSchedule,
      },
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
