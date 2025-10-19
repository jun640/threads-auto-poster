import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ThreadsAPI } from '@/lib/threads'

export async function GET() {
  try {
    // Get all scheduled posts that are due
    const now = new Date()
    const duePosts = await prisma.post.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: {
          lte: now,
        },
      },
      include: {
        account: true,
      },
    })

    const results = []

    for (const post of duePosts) {
      try {
        const threadsAPI = new ThreadsAPI(post.account.accessToken)

        let threadsPostId: string

        if (post.threadPosts) {
          // Publish as thread
          const threadPosts = JSON.parse(post.threadPosts) as string[]
          const allPosts = [post.content, ...threadPosts]
          const postIds = await threadsAPI.createThreadPosts(allPosts)
          threadsPostId = postIds[0]
        } else {
          // Publish single post
          threadsPostId = await threadsAPI.createPost(post.content)
        }

        // Update post status
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
            threadsPostId,
          },
        })

        results.push({
          postId: post.id,
          status: 'success',
        })
      } catch (error) {
        // Mark as failed
        await prisma.post.update({
          where: { id: post.id },
          data: { status: 'FAILED' },
        })

        results.push({
          postId: post.id,
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
    console.error('Cron publish error:', error)
    return NextResponse.json(
      { error: 'Failed to process scheduled posts' },
      { status: 500 }
    )
  }
}
