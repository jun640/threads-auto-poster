import { NextResponse } from 'next/server'

export async function GET() {
  const config = {
    appId: process.env.THREADS_APP_ID,
    appSecret: process.env.THREADS_APP_SECRET,
    redirectUri: process.env.THREADS_REDIRECT_URI,
  }

  const isConfigured = !!(config.appId && config.appSecret && config.redirectUri)

  if (!isConfigured) {
    return NextResponse.json({
      configured: false,
      missing: {
        appId: !config.appId,
        appSecret: !config.appSecret,
        redirectUri: !config.redirectUri,
      },
      message: '環境変数が設定されていません。.envファイルを確認してください。'
    })
  }

  return NextResponse.json({
    configured: true,
    appId: config.appId?.substring(0, 10) + '...',
    appSecret: '***' + config.appSecret?.substring(config.appSecret.length - 4),
    redirectUri: config.redirectUri,
    message: 'Threads API設定が完了しています'
  })
}
