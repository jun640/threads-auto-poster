import axios from 'axios'

const THREADS_API_BASE = 'https://graph.threads.net'

export interface ThreadsPost {
  id: string
  text: string
  timestamp: string
  media_type?: string
  media_url?: string
  permalink?: string
}

export interface ThreadsInsights {
  likes: number
  replies: number
  reposts: number
  quotes: number
  views: number
}

export class ThreadsAPI {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async getUserId(): Promise<string> {
    const response = await axios.get(`${THREADS_API_BASE}/v1.0/me`, {
      params: {
        fields: 'id,username',
        access_token: this.accessToken,
      },
    })
    return response.data.id
  }

  async getUserPosts(userId: string, limit = 25): Promise<ThreadsPost[]> {
    const response = await axios.get(`${THREADS_API_BASE}/v1.0/${userId}/threads`, {
      params: {
        fields: 'id,text,timestamp,media_type,media_url,permalink',
        limit,
        access_token: this.accessToken,
      },
    })
    return response.data.data
  }

  async createPost(text: string, replyToId?: string): Promise<string> {
    const userId = await this.getUserId()

    // Step 1: Create media container
    const containerResponse = await axios.post(
      `${THREADS_API_BASE}/v1.0/${userId}/threads`,
      null,
      {
        params: {
          media_type: 'TEXT',
          text,
          ...(replyToId && { reply_to_id: replyToId }),
          access_token: this.accessToken,
        },
      }
    )

    const containerId = containerResponse.data.id

    // Step 2: Publish the container
    const publishResponse = await axios.post(
      `${THREADS_API_BASE}/v1.0/${userId}/threads_publish`,
      null,
      {
        params: {
          creation_id: containerId,
          access_token: this.accessToken,
        },
      }
    )

    return publishResponse.data.id
  }

  async createThreadPosts(posts: string[]): Promise<string[]> {
    const postIds: string[] = []
    let previousPostId: string | undefined

    for (const text of posts) {
      const postId = await this.createPost(text, previousPostId)
      postIds.push(postId)
      previousPostId = postId

      // Rate limiting: wait 1 second between posts
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return postIds
  }

  async getPostInsights(postId: string): Promise<ThreadsInsights> {
    const response = await axios.get(`${THREADS_API_BASE}/v1.0/${postId}/insights`, {
      params: {
        metric: 'likes,replies,reposts,quotes,views',
        access_token: this.accessToken,
      },
    })

    const insights: ThreadsInsights = {
      likes: 0,
      replies: 0,
      reposts: 0,
      quotes: 0,
      views: 0,
    }

    response.data.data.forEach((metric: any) => {
      insights[metric.name as keyof ThreadsInsights] = metric.values[0].value
    })

    return insights
  }

  async getPost(postId: string): Promise<ThreadsPost> {
    const response = await axios.get(`${THREADS_API_BASE}/v1.0/${postId}`, {
      params: {
        fields: 'id,text,timestamp,media_type,media_url,permalink',
        access_token: this.accessToken,
      },
    })
    return response.data
  }
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string
  user_id: string
}> {
  const response = await axios.post(`${THREADS_API_BASE}/oauth/access_token`, {
    client_id: process.env.THREADS_APP_ID,
    client_secret: process.env.THREADS_APP_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: process.env.THREADS_REDIRECT_URI,
    code,
  })

  return response.data
}

export function getAuthorizationUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.THREADS_APP_ID!,
    redirect_uri: process.env.THREADS_REDIRECT_URI!,
    scope: 'threads_basic,threads_content_publish,threads_manage_insights,threads_manage_replies',
    response_type: 'code',
  })

  return `https://threads.net/oauth/authorize?${params.toString()}`
}
