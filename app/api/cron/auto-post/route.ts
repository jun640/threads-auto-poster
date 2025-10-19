import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OpenAIService, PostAnalysis } from '@/lib/openai'
import { GeminiService } from '@/lib/gemini'
import { ThreadsAPI } from '@/lib/threads'

export async function GET() {
  try {
    const now = new Date()

    // 実行すべき自動投稿ルールを取得
    const dueRules = await prisma.autoPostRule.findMany({
      where: {
        enabled: true,
        nextRunAt: {
          lte: now,
        },
        OR: [
          { maxRuns: null }, // 無制限
          {
            runCount: {
              lt: prisma.autoPostRule.fields.maxRuns,
            },
          },
        ],
      },
      include: {
        account: true,
      },
    })

    const results = []

    for (const rule of dueRules) {
      try {
        let postContent: { content: string; threadPosts?: string[] }

        if (rule.autoGenerate) {
          // AIで投稿を自動生成
          postContent = await generatePostFromRule(rule)
        } else {
          // 手動設定された内容を使用（今回は自動生成のみ対応）
          results.push({
            ruleId: rule.id,
            status: 'skipped',
            message: 'Manual content not supported yet',
          })
          continue
        }

        // 投稿を作成
        const post = await prisma.post.create({
          data: {
            content: postContent.content,
            threadPosts: postContent.threadPosts
              ? JSON.stringify(postContent.threadPosts)
              : null,
            status: 'APPROVED', // 自動承認
            scheduledFor: now, // すぐに投稿
            accountId: rule.accountId,
          },
        })

        // Threads APIで投稿
        const threadsAPI = new ThreadsAPI(rule.account.accessToken)

        let threadsPostId: string

        if (postContent.threadPosts) {
          // スレッド投稿
          const allPosts = [postContent.content, ...postContent.threadPosts]
          const postIds = await threadsAPI.createThreadPosts(allPosts)
          threadsPostId = postIds[0]
        } else {
          // 単一投稿
          threadsPostId = await threadsAPI.createPost(postContent.content)
        }

        // 投稿ステータスを更新
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: now,
            threadsPostId,
          },
        })

        // ルールの実行情報を更新
        const nextRunAt = calculateNextRunTime(rule)

        await prisma.autoPostRule.update({
          where: { id: rule.id },
          data: {
            lastRunAt: now,
            nextRunAt,
            runCount: rule.runCount + 1,
          },
        })

        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          postId: post.id,
          threadsPostId,
          status: 'success',
        })
      } catch (error) {
        console.error(`Error executing rule ${rule.id}:`, error)

        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('Auto post cron error:', error)
    return NextResponse.json(
      { error: 'Failed to process auto posts' },
      { status: 500 }
    )
  }
}

/**
 * ルールに基づいて投稿を生成
 */
async function generatePostFromRule(rule: any): Promise<{
  content: string
  threadPosts?: string[]
}> {
  // AIサービスを初期化
  const aiService =
    rule.aiModel === 'gemini'
      ? new GeminiService(process.env.GEMINI_API_KEY!)
      : new OpenAIService(process.env.OPENAI_API_KEY!)

  // 最新の分析データを取得
  const latestAnalysis = await prisma.analyzedPost.findFirst({
    where: { accountId: rule.accountId },
    orderBy: { createdAt: 'desc' },
  })

  if (!latestAnalysis) {
    throw new Error('No analysis found for account')
  }

  const analysis: PostAnalysis = JSON.parse(latestAnalysis.elements)

  // 投稿を生成
  const generatedPost = await aiService.generatePost(
    analysis,
    rule.topic,
    rule.isThread,
    rule.customPrompt
  )

  return generatedPost
}

/**
 * 次回実行時刻を計算
 */
function calculateNextRunTime(rule: any): Date {
  const now = new Date()
  const scheduledTimes: string[] = JSON.parse(rule.scheduledTimes)

  switch (rule.frequency) {
    case 'HOURLY':
      // 毎時間実行
      const nextHour = new Date(now)
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
      return nextHour

    case 'DAILY':
      // 今日の残りの予定時刻をチェック
      for (const time of scheduledTimes) {
        const [hours, minutes] = time.split(':').map(Number)
        const scheduledDate = new Date(now)
        scheduledDate.setHours(hours, minutes, 0, 0)

        if (scheduledDate > now) {
          return scheduledDate
        }
      }

      // 今日の予定時刻がすべて過ぎている場合、明日の最初の時刻
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const [hours, minutes] = scheduledTimes[0].split(':').map(Number)
      tomorrow.setHours(hours, minutes, 0, 0)
      return tomorrow

    case 'WEEKLY':
      // 1週間後の同じ時刻
      const nextWeek = new Date(now)
      nextWeek.setDate(nextWeek.getDate() + 7)
      const [weekHours, weekMinutes] = scheduledTimes[0].split(':').map(Number)
      nextWeek.setHours(weekHours, weekMinutes, 0, 0)
      return nextWeek

    case 'MONTHLY':
      // 1ヶ月後の同じ日時
      const nextMonth = new Date(now)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const [monthHours, monthMinutes] = scheduledTimes[0]
        .split(':')
        .map(Number)
      nextMonth.setHours(monthHours, monthMinutes, 0, 0)
      return nextMonth

    case 'CUSTOM':
      // カスタムスケジュールの処理（将来実装）
      const customNextDay = new Date(now)
      customNextDay.setDate(customNextDay.getDate() + 1)
      return customNextDay

    default:
      // デフォルトは1日後
      const defaultNext = new Date(now)
      defaultNext.setDate(defaultNext.getDate() + 1)
      return defaultNext
  }
}
