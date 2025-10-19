import { NextRequest, NextResponse } from 'next/server'
import { ThreadsAPI } from '@/lib/threads'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { account: true },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (!post.threadsPostId) {
      return NextResponse.json(
        { error: 'Post not published yet' },
        { status: 400 }
      )
    }

    const threadsAPI = new ThreadsAPI(post.account.accessToken)
    const insights = await threadsAPI.getPostInsights(post.threadsPostId)

    // Store or update analytics
    const analytics = await prisma.postAnalytics.upsert({
      where: { postId: post.id },
      update: {
        likes: insights.likes,
        replies: insights.replies,
        reposts: insights.reposts,
        quotes: insights.quotes,
        views: insights.views,
        fetchedAt: new Date(),
      },
      create: {
        postId: post.id,
        accountId: post.accountId,
        likes: insights.likes,
        replies: insights.replies,
        reposts: insights.reposts,
        quotes: insights.quotes,
        views: insights.views,
      },
    })

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const accountId = searchParams.get('accountId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    const where: any = { accountId }

    if (startDate && endDate) {
      where.fetchedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const analytics = await prisma.postAnalytics.findMany({
      where,
      include: {
        post: true,
      },
      orderBy: {
        fetchedAt: 'desc',
      },
    })

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Analytics get error:', error)
    return NextResponse.json(
      { error: 'Failed to get analytics' },
      { status: 500 }
    )
  }
}
