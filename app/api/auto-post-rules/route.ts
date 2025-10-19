import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 自動投稿ルール一覧取得
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

    const rules = await prisma.autoPostRule.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Get auto post rules error:', error)
    return NextResponse.json(
      { error: 'Failed to get auto post rules' },
      { status: 500 }
    )
  }
}

// 自動投稿ルール作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      accountId,
      name,
      description,
      enabled = true,
      frequency,
      customSchedule,
      autoGenerate = true,
      topic,
      customPrompt,
      isThread = false,
      aiModel = 'gpt-4',
      scheduledTimes,
      timezone = 'Asia/Tokyo',
      maxRuns,
    } = body

    // 必須フィールドの検証
    if (!accountId || !name || !frequency || !scheduledTimes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 開発モード: アカウントが存在しない場合は作成
    if (accountId && accountId.startsWith('account-')) {
      await prisma.account.upsert({
        where: { id: accountId },
        update: {},
        create: {
          id: accountId,
          userId: 'dev-user',
          username: 'デモアカウント',
          accessToken: 'dev-token',
        },
      })
    }

    // scheduledTimesをJSON文字列に変換
    const scheduledTimesJson = JSON.stringify(scheduledTimes)

    // 次回実行時刻を計算
    const nextRunAt = calculateNextRunTime(
      scheduledTimes,
      frequency,
      timezone
    )

    const rule = await prisma.autoPostRule.create({
      data: {
        accountId,
        name,
        description,
        enabled,
        frequency,
        customSchedule: customSchedule ? JSON.stringify(customSchedule) : null,
        autoGenerate,
        topic,
        customPrompt,
        isThread,
        aiModel,
        scheduledTimes: scheduledTimesJson,
        timezone,
        nextRunAt,
        maxRuns,
      },
    })

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Create auto post rule error:', error)
    return NextResponse.json(
      { error: 'Failed to create auto post rule' },
      { status: 500 }
    )
  }
}

/**
 * 次回実行時刻を計算
 */
function calculateNextRunTime(
  scheduledTimes: string[],
  frequency: string,
  timezone: string
): Date {
  const now = new Date()

  // 今日の予定時刻をチェック
  for (const time of scheduledTimes) {
    const [hours, minutes] = time.split(':').map(Number)
    const scheduledDate = new Date()
    scheduledDate.setHours(hours, minutes, 0, 0)

    if (scheduledDate > now) {
      return scheduledDate
    }
  }

  // 今日の予定時刻がすべて過ぎている場合、次の日を計算
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [hours, minutes] = scheduledTimes[0].split(':').map(Number)
  tomorrow.setHours(hours, minutes, 0, 0)

  return tomorrow
}
