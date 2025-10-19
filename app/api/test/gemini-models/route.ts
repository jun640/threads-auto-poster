import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 400 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    // Gemini 2.5 Flash モデルを試す
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // 簡単なテストプロンプトで動作確認
    const result = await model.generateContent('Hello')
    const response = await result.response
    const text = response.text()

    return NextResponse.json({
      success: true,
      message: 'Gemini API is working',
      testResponse: text,
      availableModels: [
        { name: 'gemini-2.5-flash', description: 'Fast and efficient model' },
        { name: 'gemini-pro', description: 'Standard model' }
      ]
    })

  } catch (error: any) {
    console.error('Error listing models:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.toString()
      },
      { status: 500 }
    )
  }
}
