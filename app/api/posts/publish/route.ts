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

    if (post.status !== 'APPROVED' && post.status !== 'DRAFT' && post.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Post cannot be published' },
        { status: 400 }
      )
    }

    const threadsAPI = new ThreadsAPI(post.account.accessToken)

    try {
      let threadsPostId: string

      if (post.threadPosts) {
        // Publish as thread
        const threadPosts = JSON.parse(post.threadPosts) as string[]
        const allPosts = [post.content, ...threadPosts]
        const postIds = await threadsAPI.createThreadPosts(allPosts)
        threadsPostId = postIds[0] // Store the first post ID
      } else {
        // Publish single post
        threadsPostId = await threadsAPI.createPost(post.content)
      }

      // Update post status
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          threadsPostId,
        },
      })

      return NextResponse.json({ post: updatedPost })
    } catch (publishError) {
      // Mark as failed
      await prisma.post.update({
        where: { id: postId },
        data: { status: 'FAILED' },
      })

      throw publishError
    }
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json(
      { error: 'Failed to publish post' },
      { status: 500 }
    )
  }
}
