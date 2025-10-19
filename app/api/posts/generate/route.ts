import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService, PostAnalysis } from '@/lib/openai'
import { GeminiService } from '@/lib/gemini'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { accountId, topic, isThread, analysisId, useCompetitorAnalysis, aiModel, customPrompt } = await request.json()

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    // 開発モード: モックデータで投稿を生成
    if (accountId && accountId.startsWith('account-')) {
      const topicText = topic || 'Instagram運用について'

      let mockPost
      if (isThread) {
        mockPost = {
          content: useCompetitorAnalysis
            ? `${topicText}について、バズる投稿を作成しました！\n\n競合分析の結果を活用して、エンゲージメントが高まる内容になっています。\n\n#Instagram #SNS運用 #マーケティング`
            : `${topicText}に関するスレッド投稿です。\n\n1つ目の投稿: 基本的な内容を説明します。\n\n#Instagram #運用Tips`,
          threadPosts: [
            '2つ目の投稿: より詳しい情報をお届けします。実践的なテクニックを紹介！',
            '3つ目の投稿: 成功事例を共有します。これらの方法で大きな成果が出ています。',
            '最後の投稿: まとめと次のステップ。あなたも今日から実践してみてください！'
          ]
        }
      } else {
        mockPost = {
          content: useCompetitorAnalysis
            ? `🔥 ${topicText}の最新トレンド\n\n競合分析から分かった、今最も効果的な戦略をシェアします！\n\n✨ ポイント:\n• 感情を揺さぶる表現\n• 具体的な数字を使用\n• 行動を促す呼びかけ\n\nあなたもこの方法で結果を出しませんか？\n\n#バズる投稿 #${topicText.replace(/について|に関して/g, '')} #SNSマーケティング`
            : `${topicText}についての投稿です。\n\nこのトピックに関する有益な情報をお届けします。\n\n#Instagram #SNS運用`
        }
      }

      return NextResponse.json({ post: mockPost })
    }

    // AIモデルを選択（デフォルトはOpenAI）
    const useGemini = aiModel === 'gemini'
    const aiService = useGemini
      ? new GeminiService(process.env.GEMINI_API_KEY!)
      : new OpenAIService(process.env.OPENAI_API_KEY!)

    let analysis: PostAnalysis | (PostAnalysis & { viralElements: string[] })

    if (analysisId) {
      const analyzedPost = await prisma.analyzedPost.findUnique({
        where: { id: analysisId },
      })

      if (!analyzedPost) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404 }
        )
      }

      analysis = JSON.parse(analyzedPost.elements)
    } else {
      // Get latest analysis for this account
      const latestAnalysis = await prisma.analyzedPost.findFirst({
        where: { accountId },
        orderBy: { createdAt: 'desc' },
      })

      if (!latestAnalysis) {
        return NextResponse.json(
          { error: 'No analysis found. Please analyze posts first.' },
          { status: 400 }
        )
      }

      analysis = JSON.parse(latestAnalysis.elements)
    }

    // 競合分析を使用する場合はバズる投稿を生成
    const generatedPost = useCompetitorAnalysis && 'viralElements' in analysis
      ? await aiService.generateViralPost(analysis, topic, isThread, customPrompt)
      : await aiService.generatePost(analysis, topic, isThread, customPrompt)

    // Create draft post(s)
    const post = await prisma.post.create({
      data: {
        content: generatedPost.content,
        threadPosts: generatedPost.threadPosts
          ? JSON.stringify(generatedPost.threadPosts)
          : null,
        status: 'DRAFT',
        accountId,
      },
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate post' },
      { status: 500 }
    )
  }
}
