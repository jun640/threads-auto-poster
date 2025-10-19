'use client'

import { useState, useEffect } from 'react'
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Calendar,
  Zap,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AutoPostRule {
  id: string
  name: string
  description?: string
  enabled: boolean
  frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
  scheduledTimes: string[]
  topic?: string
  customPrompt?: string
  isThread: boolean
  aiModel: string
  timezone: string
  lastRunAt?: string
  nextRunAt?: string
  runCount: number
  maxRuns?: number
  createdAt: string
}

interface AutoPostRulesProps {
  accountId: string
}

export default function AutoPostRules({ accountId }: AutoPostRulesProps) {
  const [rules, setRules] = useState<AutoPostRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRule, setEditingRule] = useState<AutoPostRule | null>(null)

  useEffect(() => {
    if (accountId) {
      fetchRules()
    }
  }, [accountId])

  const fetchRules = async () => {
    try {
      const response = await fetch(
        `/api/auto-post-rules?accountId=${accountId}`
      )
      const data = await response.json()

      if (response.ok) {
        // scheduledTimesをパース
        const parsedRules = data.rules.map((rule: any) => ({
          ...rule,
          scheduledTimes: JSON.parse(rule.scheduledTimes),
        }))
        setRules(parsedRules)
      }
    } catch (error) {
      console.error('Failed to fetch rules:', error)
      toast.error('ルールの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const toggleRuleEnabled = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/auto-post-rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      })

      if (response.ok) {
        toast.success(enabled ? 'ルールを無効化しました' : 'ルールを有効化しました')
        fetchRules()
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error)
      toast.error('ルールの切り替えに失敗しました')
    }
  }

  const deleteRule = async (ruleId: string) => {
    if (!confirm('このルールを削除してもよろしいですか?')) {
      return
    }

    try {
      const response = await fetch(`/api/auto-post-rules/${ruleId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('ルールを削除しました')
        fetchRules()
      }
    } catch (error) {
      console.error('Failed to delete rule:', error)
      toast.error('ルールの削除に失敗しました')
    }
  }

  const getFrequencyLabel = (frequency: string): string => {
    const labels: Record<string, string> = {
      HOURLY: '毎時間',
      DAILY: '毎日',
      WEEKLY: '毎週',
      MONTHLY: '毎月',
      CUSTOM: 'カスタム',
    }
    return labels[frequency] || frequency
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            自動投稿ルール
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            定期的に自動で投稿を生成・公開するルールを設定できます
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          新しいルール
        </button>
      </div>

      {/* ルール一覧 */}
      {rules.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            自動投稿ルールがありません
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            定期的に投稿を自動化するルールを作成しましょう
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            最初のルールを作成
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`bg-white dark:bg-gray-800 rounded-lg border ${
                rule.enabled
                  ? 'border-purple-200 dark:border-purple-900'
                  : 'border-gray-200 dark:border-gray-700'
              } p-6`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {rule.name}
                    </h3>
                    {rule.enabled ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        有効
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                        <XCircle className="w-3 h-3 mr-1" />
                        無効
                      </span>
                    )}
                  </div>
                  {rule.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {rule.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleRuleEnabled(rule.id, rule.enabled)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title={rule.enabled ? '無効化' : '有効化'}
                  >
                    {rule.enabled ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setEditingRule(rule)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="編集"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    頻度
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {getFrequencyLabel(rule.frequency)}
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                    <Clock className="w-4 h-4 mr-1" />
                    投稿時刻
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {rule.scheduledTimes.join(', ')}
                  </div>
                </div>

                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">
                    最終実行
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatDate(rule.lastRunAt)}
                  </div>
                </div>

                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">
                    次回実行
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatDate(rule.nextRunAt)}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                  {rule.topic && (
                    <div>
                      <span className="font-medium">トピック:</span> {rule.topic}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">AIモデル:</span>{' '}
                    {rule.aiModel === 'gemini' ? 'Gemini' : 'GPT-4'}
                  </div>
                  {rule.isThread && (
                    <div className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                      スレッド投稿
                    </div>
                  )}
                  <div>
                    <span className="font-medium">実行回数:</span> {rule.runCount}
                    {rule.maxRuns && ` / ${rule.maxRuns}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 作成/編集モーダル */}
      {(showCreateModal || editingRule) && (
        <RuleFormModal
          accountId={accountId}
          rule={editingRule}
          onClose={() => {
            setShowCreateModal(false)
            setEditingRule(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setEditingRule(null)
            fetchRules()
          }}
        />
      )}
    </div>
  )
}

interface RuleFormModalProps {
  accountId: string
  rule?: AutoPostRule | null
  onClose: () => void
  onSuccess: () => void
}

function RuleFormModal({ accountId, rule, onClose, onSuccess }: RuleFormModalProps) {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    frequency: rule?.frequency || 'DAILY',
    scheduledTimes: rule?.scheduledTimes || ['09:00'],
    topic: rule?.topic || '',
    customPrompt: rule?.customPrompt || '',
    isThread: rule?.isThread || false,
    aiModel: rule?.aiModel || 'gpt-4',
    maxRuns: rule?.maxRuns?.toString() || '',
  })

  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = rule
        ? `/api/auto-post-rules/${rule.id}`
        : '/api/auto-post-rules'

      const method = rule ? 'PATCH' : 'POST'

      const body: any = {
        ...formData,
        maxRuns: formData.maxRuns ? parseInt(formData.maxRuns) : null,
      }

      if (!rule) {
        body.accountId = accountId
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(rule ? 'ルールを更新しました' : 'ルールを作成しました')
        onSuccess()
      } else {
        const data = await response.json()
        toast.error(data.error || 'エラーが発生しました')
      }
    } catch (error) {
      console.error('Form submit error:', error)
      toast.error('送信に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const addScheduledTime = () => {
    setFormData({
      ...formData,
      scheduledTimes: [...formData.scheduledTimes, '12:00'],
    })
  }

  const removeScheduledTime = (index: number) => {
    setFormData({
      ...formData,
      scheduledTimes: formData.scheduledTimes.filter((_, i) => i !== index),
    })
  }

  const updateScheduledTime = (index: number, value: string) => {
    const newTimes = [...formData.scheduledTimes]
    newTimes[index] = value
    setFormData({ ...formData, scheduledTimes: newTimes })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {rule ? 'ルールを編集' : '新しいルールを作成'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ルール名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ルール名 *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="例: 毎朝のモチベーション投稿"
            />
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              説明
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={2}
              placeholder="このルールの目的や内容を説明してください"
            />
          </div>

          {/* 頻度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              投稿頻度 *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) =>
                setFormData({ ...formData, frequency: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="HOURLY">毎時間</option>
              <option value="DAILY">毎日</option>
              <option value="WEEKLY">毎週</option>
              <option value="MONTHLY">毎月</option>
            </select>
          </div>

          {/* 投稿時刻 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              投稿時刻 *
            </label>
            <div className="space-y-2">
              {formData.scheduledTimes.map((time, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) =>
                      updateScheduledTime(index, e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {formData.scheduledTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeScheduledTime(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addScheduledTime}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                + 時刻を追加
              </button>
            </div>
          </div>

          {/* トピック */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              投稿トピック
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) =>
                setFormData({ ...formData, topic: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="例: SNSマーケティング、健康管理"
            />
          </div>

          {/* カスタムプロンプト */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              カスタムプロンプト
            </label>
            <textarea
              value={formData.customPrompt}
              onChange={(e) =>
                setFormData({ ...formData, customPrompt: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              placeholder="AIに対する追加の指示を入力してください"
            />
          </div>

          {/* AIモデル */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              AIモデル
            </label>
            <select
              value={formData.aiModel}
              onChange={(e) =>
                setFormData({ ...formData, aiModel: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="gpt-4">GPT-4 (OpenAI)</option>
              <option value="gemini">Gemini 2.5 Flash</option>
            </select>
          </div>

          {/* オプション */}
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isThread}
                onChange={(e) =>
                  setFormData({ ...formData, isThread: e.target.checked })
                }
                className="w-4 h-4 text-purple-600 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                スレッド投稿として生成
              </span>
            </label>
          </div>

          {/* 最大実行回数 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              最大実行回数（空欄で無制限）
            </label>
            <input
              type="number"
              min="1"
              value={formData.maxRuns}
              onChange={(e) =>
                setFormData({ ...formData, maxRuns: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="例: 30"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {submitting
                ? '保存中...'
                : rule
                ? '更新'
                : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
