import axios from 'axios'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

export interface PostAnalysis {
  tone: string[]
  topics: string[]
  hashtags: string[]
  avgLength: number
  structure: string
  keyPatterns: string[]
}

export interface GeneratedPost {
  content: string
  threadPosts?: string[]
}

export class OpenAIService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async analyzePosts(posts: string[]): Promise<PostAnalysis> {
    const prompt = `以下のThreadsの投稿を分析して、以下の要素を抽出してください:
1. トーン(フォーマル、カジュアル、ユーモラス等)
2. よく扱われるトピック
3. 使用されるハッシュタグのパターン
4. 平均的な投稿の長さ
5. 投稿の構造(質問形式、リスト形式、ストーリー形式等)
6. その他の特徴的なパターン

投稿:
${posts.map((p, i) => `${i + 1}. ${p}`).join('\n')}

JSON形式で以下の構造で返してください:
{
  "tone": ["トーン1", "トーン2"],
  "topics": ["トピック1", "トピック2"],
  "hashtags": ["#タグ1", "#タグ2"],
  "avgLength": 数値,
  "structure": "構造の説明",
  "keyPatterns": ["パターン1", "パターン2"]
}`

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'あなたはSNS投稿の分析の専門家です。投稿の特徴を正確に抽出し、JSON形式で返してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return JSON.parse(response.data.choices[0].message.content)
  }

  async generatePost(
    analysis: PostAnalysis,
    topic?: string,
    isThread = false,
    customPrompt?: string
  ): Promise<GeneratedPost> {
    const threadInstruction = isThread
      ? 'スレッド形式で3-5個の投稿を生成してください。各投稿は独立していても読めるが、全体で一つのストーリーや情報を伝える構成にしてください。'
      : '単一の投稿を生成してください。'

    const topicInstruction = topic
      ? `トピック: ${topic}`
      : '分析結果に基づいて適切なトピックを選んでください。'

    const customInstructions = customPrompt
      ? `\n\n【追加の指示】\n${customPrompt}\n`
      : ''

    const prompt = `以下の分析結果に基づいて、Threadsの投稿を生成してください:

トーン: ${analysis.tone.join(', ')}
よく扱うトピック: ${analysis.topics.join(', ')}
ハッシュタグパターン: ${analysis.hashtags.join(', ')}
平均文字数: ${analysis.avgLength}文字程度
投稿構造: ${analysis.structure}
特徴的パターン: ${analysis.keyPatterns.join(', ')}

${topicInstruction}
${threadInstruction}

${isThread ? `
JSON形式で以下の構造で返してください:
{
  "content": "最初の投稿の内容",
  "threadPosts": ["2つ目の投稿", "3つ目の投稿", "..."]
}
` : `
JSON形式で以下の構造で返してください:
{
  "content": "投稿の内容"
}
`}

注意:
- 自然で魅力的な投稿にしてください
- 分析されたスタイルを忠実に再現してください
- 適切なハッシュタグを含めてください
- エンゲージメントを高める要素を含めてください${customInstructions}`

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'あなたはSNS投稿の作成の専門家です。与えられた分析結果に基づいて、魅力的な投稿を生成してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return JSON.parse(response.data.choices[0].message.content)
  }

  async analyzeAndGeneratePost(
    existingPosts: string[],
    topic?: string,
    isThread = false
  ): Promise<GeneratedPost> {
    const analysis = await this.analyzePosts(existingPosts)
    return await this.generatePost(analysis, topic, isThread)
  }

  async analyzeCompetitorPosts(posts: any[]): Promise<PostAnalysis & { viralElements: string[] }> {
    const prompt = `以下は競合アカウントの人気投稿です。これらの投稿を分析して、バズる要素を抽出してください:

投稿データ:
${posts.map((p, i) => `
${i + 1}. 投稿: ${p.text || p.content}
   いいね: ${p.like_count || 0}
   リプライ: ${p.reply_count || 0}
   リポスト: ${p.repost_count || 0}
`).join('\n')}

以下の要素を分析してください:
1. トーン（親しみやすさ、権威性、ユーモア等）
2. よく扱われるトピック
3. 使用されるハッシュタグのパターン
4. 平均的な投稿の長さ
5. 投稿の構造（ストーリーテリング、リスト形式、質問形式等）
6. バズっている投稿の共通パターン
7. エンゲージメントを高める特徴的な要素

JSON形式で以下の構造で返してください:
{
  "tone": ["トーン1", "トーン2"],
  "topics": ["トピック1", "トピック2"],
  "hashtags": ["#タグ1", "#タグ2"],
  "avgLength": 数値,
  "structure": "構造の説明",
  "keyPatterns": ["パターン1", "パターン2"],
  "viralElements": ["バズる要素1", "バズる要素2", "バズる要素3"]
}`

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'あなたはSNSマーケティングとバイラルコンテンツの専門家です。投稿の特徴とバズる要素を分析し、JSON形式で返してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return JSON.parse(response.data.choices[0].message.content)
  }

  async generateViralPost(
    analysis: PostAnalysis & { viralElements: string[] },
    topic?: string,
    isThread = false,
    customPrompt?: string
  ): Promise<GeneratedPost> {
    const threadInstruction = isThread
      ? 'スレッド形式で3-5個の投稿を生成してください。各投稿は独立していても読めるが、全体で一つのストーリーや情報を伝える構成にしてください。'
      : '単一の投稿を生成してください。'

    const topicInstruction = topic
      ? `トピック: ${topic}`
      : '分析結果に基づいて、今トレンドになりそうな魅力的なトピックを選んでください。'

    const customInstructions = customPrompt
      ? `\n\n【追加の指示】\n${customPrompt}\n`
      : ''

    const prompt = `競合アカウントの分析結果に基づいて、バズる可能性が高いThreadsの投稿を生成してください:

【分析結果】
トーン: ${analysis.tone.join(', ')}
人気トピック: ${analysis.topics.join(', ')}
ハッシュタグ: ${analysis.hashtags.join(', ')}
平均文字数: ${analysis.avgLength}文字程度
投稿構造: ${analysis.structure}
特徴的パターン: ${analysis.keyPatterns.join(', ')}

【バズる要素】
${analysis.viralElements.map((e, i) => `${i + 1}. ${e}`).join('\n')}

${topicInstruction}
${threadInstruction}

${isThread ? `
JSON形式で以下の構造で返してください:
{
  "content": "最初の投稿の内容",
  "threadPosts": ["2つ目の投稿", "3つ目の投稿", "..."]
}
` : `
JSON形式で以下の構造で返してください:
{
  "content": "投稿の内容"
}
`}

重要な指示:
- バズる要素を最大限に活用してください
- 感情を揺さぶる表現を使ってください
- 具体的で価値のある情報を提供してください
- 読者が共感・シェアしたくなる内容にしてください
- 適切なハッシュタグを戦略的に配置してください
- 行動を促す呼びかけを含めてください（リプライ、リポスト等）
- 文章は読みやすく、インパクトのある書き出しにしてください${customInstructions}`

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'あなたはバイラルコンテンツの作成に特化したSNSマーケティングの専門家です。分析結果を基に、最大限のエンゲージメントを獲得できる投稿を生成してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return JSON.parse(response.data.choices[0].message.content)
  }
}

// Helper function for API route
export async function analyzeCompetitorPosts(posts: any[]) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured')
  }

  const service = new OpenAIService(apiKey)
  return await service.analyzeCompetitorPosts(posts)
}
