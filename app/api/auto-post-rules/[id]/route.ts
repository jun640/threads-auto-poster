import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 自動投稿ルール取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const rule = await prisma.autoPostRule.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    if (!rule) {
      return NextResponse.json(
        { error: 'Auto post rule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Get auto post rule error:', error)
    return NextResponse.json(
      { error: 'Failed to get auto post rule' },
      { status: 500 }
    )
  }
}

// 自動投稿ルール更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const {
      name,
      description,
      enabled,
      frequency,
      customSchedule,
      autoGenerate,
      topic,
      customPrompt,
      isThread,
      aiModel,
      scheduledTimes,
      timezone,
      maxRuns,
    } = body

    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (enabled !== undefined) updateData.enabled = enabled
    if (frequency !== undefined) updateData.frequency = frequency
    if (customSchedule !== undefined)
      updateData.customSchedule = customSchedule
        ? JSON.stringify(customSchedule)
        : null
    if (autoGenerate !== undefined) updateData.autoGenerate = autoGenerate
    if (topic !== undefined) updateData.topic = topic
    if (customPrompt !== undefined) updateData.customPrompt = customPrompt
    if (isThread !== undefined) updateData.isThread = isThread
    if (aiModel !== undefined) updateData.aiModel = aiModel
    if (timezone !== undefined) updateData.timezone = timezone
    if (maxRuns !== undefined) updateData.maxRuns = maxRuns

    if (scheduledTimes !== undefined) {
      updateData.scheduledTimes = JSON.stringify(scheduledTimes)

      // scheduledTimesが変更された場合、nextRunAtを再計算
      const currentRule = await prisma.autoPostRule.findUnique({
        where: { id },
      })

      if (currentRule) {
        updateData.nextRunAt = calculateNextRunTime(
          scheduledTimes,
          frequency || currentRule.frequency,
          timezone || currentRule.timezone
        )
      }
    }

    const rule = await prisma.autoPostRule.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Update auto post rule error:', error)
    return NextResponse.json(
      { error: 'Failed to update auto post rule' },
      { status: 500 }
    )
  }
}

// 自動投稿ルール削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await prisma.autoPostRule.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete auto post rule error:', error)
    return NextResponse.json(
      { error: 'Failed to delete auto post rule' },
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
