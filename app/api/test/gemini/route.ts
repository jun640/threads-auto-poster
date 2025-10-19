import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/lib/gemini'

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'GEMINI_API_KEY is not configured in .env file',
          message: 'Please add GEMINI_API_KEY to your .env file'
        },
        { status: 400 }
      )
    }

    // APIキーの最初の数文字を表示（セキュリティのため）
    const maskedKey = `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`

    // Gemini サービスのインスタンスを作成
    const geminiService = new GeminiService(apiKey)

    // 簡単なテストプロンプトを実行
    const testPrompt = '日本語で「こんにちは」と挨拶してください。1文だけで返答してください。'

    const result = await geminiService.generatePost(
      {
        tone: ['カジュアル', '親しみやすい'],
        topics: ['挨拶'],
        hashtags: [],
        avgLength: 50,
        structure: '単文',
        keyPatterns: ['シンプル']
      },
      undefined,
      false
    )

    return NextResponse.json({
      success: true,
      message: 'Gemini API connection successful!',
      apiKeyConfigured: true,
      apiKeyMasked: maskedKey,
      testResponse: result,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Gemini API test error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to connect to Gemini API',
        details: error.toString(),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
