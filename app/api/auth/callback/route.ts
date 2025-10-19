import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken } from '@/lib/threads'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.redirect(new URL('/dashboard?error=no_code', request.url))
    }

    const { access_token, user_id } = await exchangeCodeForToken(code)

    // Store account in database
    const account = await prisma.account.upsert({
      where: { userId: user_id },
      update: {
        accessToken: access_token,
      },
      create: {
        username: user_id, // Will be updated with actual username
        userId: user_id,
        accessToken: access_token,
      },
    })

    // Redirect to dashboard with account ID
    return NextResponse.redirect(
      new URL(`/dashboard?account_id=${account.id}`, request.url)
    )
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(
      new URL('/dashboard?error=auth_failed', request.url)
    )
  }
}
