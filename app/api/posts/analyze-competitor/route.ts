import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ThreadsAPI } from '@/lib/threads'
import { analyzeCompetitorPosts } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { accountId, competitorUsernames } = await request.json()

    if (!accountId || !competitorUsernames || competitorUsernames.length === 0) {
      return NextResponse.json(
        { error: 'Account ID and at least one competitor username are required' },
        { status: 400 }
      )
    }

    // Get account
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

    // Fetch posts from all competitors
    const allCompetitorPosts: any[] = []
    for (const username of competitorUsernames) {
      try {
        // Note: ThreadsAPIにユーザー投稿取得メソッドを追加する必要があります
        const posts = await threadsAPI.getUserPosts(username, 20)
        allCompetitorPosts.push(...posts)
      } catch (error) {
        console.error(`Failed to fetch posts for ${username}:`, error)
        // Continue with other competitors even if one fails
      }
    }

    if (allCompetitorPosts.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch posts from any competitor' },
        { status: 400 }
      )
    }

    // Analyze posts with OpenAI
    const analysis = await analyzeCompetitorPosts(allCompetitorPosts)

    // Save analysis results
    await prisma.analyzedPost.create({
      data: {
        accountId,
        sourceUrl: competitorUsernames.map((u: string) => `@${u}`).join(', '),
        content: JSON.stringify(allCompetitorPosts),
        elements: JSON.stringify(analysis),
      },
    })

    return NextResponse.json({
      analysis,
      message: `Successfully analyzed posts from ${competitorUsernames.length} competitor(s)`,
    })
  } catch (error) {
    console.error('Analyze competitor error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze competitor posts' },
      { status: 500 }
    )
  }
}
