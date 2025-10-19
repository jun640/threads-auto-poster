import { NextRequest, NextResponse } from 'next/server'
import { ThreadsAPI } from '@/lib/threads'
import { OpenAIService } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { accountId, targetUsername } = await request.json()

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    // 開発モード: モック分析結果を返す
    if (accountId && accountId.startsWith('account-')) {
      const mockAnalysis = {
        tone: ['カジュアル', '親しみやすい'],
        topics: ['SNS運用', 'マーケティング', 'ビジネス'],
        hashtags: ['#Instagram', '#SNS運用', '#マーケティング'],
        avgLength: 150,
        structure: 'リスト形式と質問形式の組み合わせ',
        keyPatterns: ['具体例の提示', 'アクションを促す表現']
      }

      return NextResponse.json({ analysis: mockAnalysis })
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    const threadsAPI = new ThreadsAPI(account.accessToken)
    const openAI = new OpenAIService(process.env.OPENAI_API_KEY!)

    // Get target user's posts
    // Note: In production, you'd need the target user's ID
    // For now, we'll use the authenticated user's posts
    const userId = await threadsAPI.getUserId()
    const posts = await threadsAPI.getUserPosts(userId, 25)

    const postTexts = posts.map(p => p.text).filter(Boolean)

    if (postTexts.length === 0) {
      return NextResponse.json(
        { error: 'No posts found to analyze' },
        { status: 400 }
      )
    }

    // Analyze posts
    const analysis = await openAI.analyzePosts(postTexts)

    // Store analysis
    await prisma.analyzedPost.create({
      data: {
        accountId,
        sourceUrl: targetUsername || 'self',
        content: JSON.stringify(postTexts),
        elements: JSON.stringify(analysis),
      },
    })

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze posts' },
      { status: 500 }
    )
  }
}
