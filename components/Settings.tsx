'use client'

import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface SettingsProps {
  accountId: string
}

export default function Settings({ accountId }: SettingsProps) {
  const [basePrompt, setBasePrompt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (accountId) {
      fetchSettings()
    }
  }, [accountId])

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/settings?accountId=${accountId}`)
      const data = await response.json()

      if (response.ok && data.settings) {
        setBasePrompt(data.settings.basePrompt || '')
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('設定の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          basePrompt,
        }),
      })

      if (response.ok) {
        toast.success('設定を保存しました')
      } else {
        const data = await response.json()
        toast.error(data.error || '保存に失敗しました')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          設定
        </h2>

        {/* 基本プロンプト */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              基本プロンプト
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              すべての投稿生成時に適用される基本的な指示を設定します。
              カスタムプロンプトはこの基本プロンプトに追加されます。
            </p>
            <textarea
              value={basePrompt}
              onChange={(e) => setBasePrompt(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={8}
              placeholder="例:
- カジュアルでフレンドリーなトーンで書いてください
- 絵文字を適度に使用してください
- 簡潔で読みやすい文章にしてください
- ハッシュタグは2-3個程度に抑えてください"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              💡 ヒント: 投稿のトーン、スタイル、長さ、使用する絵文字の量などを指定できます
            </p>
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? '保存中...' : '設定を保存'}
            </button>
          </div>
        </div>

        {/* 使用例 */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
            基本プロンプトの使用例
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
            <p><strong>ビジネス向け:</strong></p>
            <p className="text-xs pl-4">
              「プロフェッショナルで丁寧な表現を使用し、専門用語は避けて分かりやすく説明してください。絵文字は控えめに使用してください。」
            </p>

            <p><strong>カジュアル向け:</strong></p>
            <p className="text-xs pl-4">
              「親しみやすくフレンドリーなトーンで、絵文字を積極的に使用してください。会話的な表現を心がけてください。」
            </p>

            <p><strong>教育コンテンツ向け:</strong></p>
            <p className="text-xs pl-4">
              「分かりやすく丁寧に説明し、具体例を交えてください。専門用語を使う場合は必ず説明を加えてください。」
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
