'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { AccountManager } from '@/lib/account-manager'

interface PostGeneratorProps {
  accountId: string
}

export default function PostGenerator({ accountId }: PostGeneratorProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [topic, setTopic] = useState('')
  const [isThread, setIsThread] = useState(false)
  const [hasAnalysis, setHasAnalysis] = useState(false)
  const [useCompetitorAnalysis, setUseCompetitorAnalysis] = useState(false)
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([''])
  const [isAnalyzingCompetitor, setIsAnalyzingCompetitor] = useState(false)
  const [aiModel, setAiModel] = useState<'openai' | 'gemini'>('openai')
  const [basePrompt, setBasePrompt] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [showBasePromptSettings, setShowBasePromptSettings] = useState(false)

  // Load saved competitor URLs from localStorage on mount
  useEffect(() => {
    const savedUrls = localStorage.getItem('competitorUrls')
    if (savedUrls) {
      try {
        const parsed = JSON.parse(savedUrls)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCompetitorUrls(parsed)
        }
      } catch (error) {
        console.error('Failed to parse saved competitor URLs:', error)
      }
    }
  }, [])

  // Save competitor URLs to localStorage whenever they change
  useEffect(() => {
    if (competitorUrls.length > 0 && competitorUrls.some(url => url.trim())) {
      localStorage.setItem('competitorUrls', JSON.stringify(competitorUrls))
    }
  }, [competitorUrls])

  // Load base prompt for this account on mount and when accountId changes
  useEffect(() => {
    const accountBasePrompt = AccountManager.getAccountBasePrompt(accountId)
    setBasePrompt(accountBasePrompt)
  }, [accountId])

  // Save base prompt for this account whenever it changes
  useEffect(() => {
    if (accountId) {
      AccountManager.setAccountBasePrompt(accountId, basePrompt)
    }
  }, [basePrompt, accountId])

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/posts/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })

      if (!res.ok) throw new Error('分析に失敗しました')

      const { analysis } = await res.json()
      setHasAnalysis(true)
      toast.success('投稿の分析が完了しました')
    } catch (error) {
      toast.error('分析に失敗しました')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const addCompetitorUrl = () => {
    setCompetitorUrls([...competitorUrls, ''])
  }

  const removeCompetitorUrl = (index: number) => {
    if (competitorUrls.length > 1) {
      setCompetitorUrls(competitorUrls.filter((_, i) => i !== index))
    }
  }

  const updateCompetitorUrl = (index: number, value: string) => {
    const newUrls = [...competitorUrls]
    newUrls[index] = value
    setCompetitorUrls(newUrls)
  }

  const extractUsernameFromUrl = (url: string): string => {
    // ThreadsのURL形式: https://www.threads.net/@username
    const match = url.match(/@([^\/\?]+)/)
    if (match) return match[1]

    // ユーザー名のみの場合
    if (url.startsWith('@')) return url.substring(1)

    return url
  }

  const handleAnalyzeCompetitor = async () => {
    const validUrls = competitorUrls.filter(url => url.trim())

    if (validUrls.length === 0) {
      toast.error('競合アカウントのURLを少なくとも1つ入力してください')
      return
    }

    setIsAnalyzingCompetitor(true)
    try {
      const usernames = validUrls.map(extractUsernameFromUrl)

      // 開発モードの場合はモック
      if (accountId && accountId.startsWith('account-')) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        toast.success(`${usernames.length}件の競合アカウントを分析しました（開発モード）`)
        setHasAnalysis(true)
        setIsAnalyzingCompetitor(false)
        return
      }

      const res = await fetch('/api/posts/analyze-competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          competitorUsernames: usernames
        }),
      })

      if (!res.ok) throw new Error('分析に失敗しました')

      toast.success(`${usernames.length}件の競合アカウントを分析しました`)
      setHasAnalysis(true)
    } catch (error) {
      toast.error('競合アカウントの分析に失敗しました')
    } finally {
      setIsAnalyzingCompetitor(false)
    }
  }

  const handleGenerate = async () => {
    if (!hasAnalysis) {
      toast.error('まず投稿を分析してください')
      return
    }

    setIsGenerating(true)
    try {
      // プロンプトの組み立て: 基本プロンプト + カスタムプロンプト
      let finalPrompt = ''
      if (basePrompt.trim()) {
        finalPrompt = basePrompt.trim()
      }
      if (customPrompt.trim()) {
        if (finalPrompt) {
          finalPrompt += '\n\n【追加の指示】\n' + customPrompt.trim()
        } else {
          finalPrompt = customPrompt.trim()
        }
      }

      const res = await fetch('/api/posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          topic: topic || undefined,
          isThread,
          useCompetitorAnalysis,
          aiModel,
          customPrompt: finalPrompt || undefined,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || '生成に失敗しました')
      }

      const { post } = await res.json()

      // 開発モード: アカウントごとにlocalStorageに生成された投稿を保存
      if (accountId && accountId.startsWith('account-')) {
        const storageKey = `generatedPosts_${accountId}`
        const savedPosts = localStorage.getItem(storageKey)
        const existingPosts = savedPosts ? JSON.parse(savedPosts) : []
        const newPost = {
          id: `generated-${Date.now()}`,
          content: post.content,
          threadPosts: post.threadPosts
            ? (typeof post.threadPosts === 'string' ? post.threadPosts : JSON.stringify(post.threadPosts))
            : null,
          status: 'DRAFT',
          scheduledFor: null,
          publishedAt: null,
          createdAt: new Date().toISOString(),
        }
        existingPosts.unshift(newPost)
        localStorage.setItem(storageKey, JSON.stringify(existingPosts))
      }

      toast.success('投稿を生成しました')
      setTopic('')

      // Refresh page to show new post
      window.location.reload()
    } catch (error) {
      console.error('Generation error:', error)
      toast.error(error instanceof Error ? error.message : '生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-border">
        <h2 className="text-2xl font-bold mb-6 text-foreground">投稿を生成</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">1. 投稿を分析</h3>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={useCompetitorAnalysis}
                  onChange={(e) => setUseCompetitorAnalysis(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-foreground">
                  競合アカウントのポストを分析してバズる投稿を作成
                </span>
              </label>
            </div>

            {useCompetitorAnalysis ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  競合アカウントの人気投稿を分析し、バズる要素を抽出して投稿を生成します
                </p>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    競合アカウントのURL
                  </label>
                  <div className="space-y-2">
                    {competitorUrls.map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => updateCompetitorUrl(index, e.target.value)}
                          placeholder="例: https://www.threads.net/@zuck または @zuck"
                          className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                        />
                        {competitorUrls.length > 1 && (
                          <button
                            onClick={() => removeCompetitorUrl(index)}
                            className="px-3 py-2 border border-border rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition"
                            title="削除"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addCompetitorUrl}
                      className="w-full px-4 py-2 border border-border border-dashed rounded-lg hover:bg-secondary transition text-sm text-muted-foreground"
                    >
                      + URLを追加
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleAnalyzeCompetitor}
                  disabled={isAnalyzingCompetitor}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isAnalyzingCompetitor ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      競合を分析中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      競合アカウントを分析
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  あなたの投稿スタイルを分析します
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      投稿を分析
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {hasAnalysis && (
            <>
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">2. 投稿を生成</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      AIモデル
                    </label>
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value as 'openai' | 'gemini')}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="openai">OpenAI GPT-4 (バランス型)</option>
                      <option value="gemini">Google Gemini 2.5 Flash (高速・高精度)</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {aiModel === 'openai'
                        ? 'GPT-4: 安定した品質で幅広いトピックに対応'
                        : 'Gemini 2.5: 最新モデル、より自然で創造的な文章生成、日本語に強い'}
                    </p>
                  </div>

                  {/* 基本プロンプト設定 */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <button
                      onClick={() => setShowBasePromptSettings(!showBasePromptSettings)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                          基本プロンプト設定
                        </span>
                        {basePrompt && (
                          <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                            設定済み
                          </span>
                        )}
                      </div>
                      <span className="text-blue-600 dark:text-blue-400">
                        {showBasePromptSettings ? '▲' : '▼'}
                      </span>
                    </button>

                    {showBasePromptSettings && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-blue-800 dark:text-blue-200">
                          すべての投稿生成で共通して使用される基本的な指示を設定できます
                        </p>
                        <textarea
                          value={basePrompt}
                          onChange={(e) => setBasePrompt(e.target.value)}
                          placeholder="基本プロンプトを入力してください&#10;&#10;例:&#10;- 必ず絵文字を3個以上使う&#10;- ポジティブで前向きなトーン&#10;- 専門用語は避けて分かりやすく&#10;- 文末に「！」を使って元気に"
                          rows={5}
                          className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 text-foreground resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            💾 自動保存されます
                          </p>
                          {basePrompt && (
                            <button
                              onClick={() => setBasePrompt('')}
                              className="text-xs text-red-600 dark:text-red-400 hover:underline"
                            >
                              クリア
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      トピック (任意)
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="例: 最新のAI技術について"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-foreground">
                        カスタムプロンプト (この投稿のみ)
                      </label>
                      {customPrompt && (
                        <button
                          onClick={() => setCustomPrompt('')}
                          className="text-xs text-muted-foreground hover:text-foreground transition"
                        >
                          クリア
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <textarea
                        value={customPrompt}
                        onChange={(e) => {
                          setCustomPrompt(e.target.value)
                          setUseCustomPrompt(e.target.value.trim().length > 0)
                        }}
                        placeholder="この投稿のみに適用される追加の指示を入力&#10;&#10;例:&#10;- 今回は数字データを多く使う&#10;- ストーリー形式で体験談を語る&#10;- 最後に「リプライで教えて！」と呼びかけ&#10;- 今日のニュースに言及する"
                        rows={5}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground resize-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                      />
                      <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded p-2">
                        <p className="text-xs text-muted-foreground flex items-start gap-1">
                          <span>📋</span>
                          <span>
                            {basePrompt
                              ? '基本プロンプトに加えて、ここに入力した指示が追加されます'
                              : 'この投稿専用の指示を入力できます。空欄の場合は基本プロンプトのみ使用されます'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isThread"
                      checked={isThread}
                      onChange={(e) => setIsThread(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="isThread" className="text-sm font-medium text-foreground">
                      ツリー形式で投稿する (3-5個の連続投稿)
                    </label>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        投稿を生成
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
