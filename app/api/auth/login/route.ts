import { NextResponse } from 'next/server'
import { getAuthorizationUrl } from '@/lib/threads'

export async function GET() {
  try {
    const authUrl = getAuthorizationUrl()
    return NextResponse.json({ url: authUrl })
  } catch (error) {
    console.error('Auth URL generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    )
  }
}
