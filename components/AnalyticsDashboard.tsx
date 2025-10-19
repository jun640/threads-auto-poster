'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Calendar, TrendingUp, Eye, Heart, MessageCircle, Repeat2 } from 'lucide-react'
import { format, subDays } from 'date-fns'

interface Analytics {
  id: string
  likes: number
  replies: number
  reposts: number
  quotes: number
  views: number
  fetchedAt: string
  post: {
    content: string
    publishedAt: string
  }
}

interface AnalyticsDashboardProps {
  accountId: string
}

// モックデータ
const mockAnalytics: Analytics[] = [
  {
    id: 'mock-analytics-1',
    likes: 245,
    replies: 18,
    reposts: 32,
    quotes: 5,
    views: 3420,
    fetchedAt: new Date().toISOString(),
    post: {
      content: 'これは下書きの投稿です。予約投稿機能をテストしています。',
      publishedAt: subDays(new Date(), 1).toISOString(),
    },
  },
  {
    id: 'mock-analytics-2',
    likes: 189,
    replies: 12,
    reposts: 24,
    quotes: 3,
    views: 2580,
    fetchedAt: new Date().toISOString(),
    post: {
      content: 'これはツリー投稿のサンプルです。複数の投稿を連続して投稿できます。',
      publishedAt: subDays(new Date(), 2).toISOString(),
    },
  },
  {
    id: 'mock-analytics-3',
    likes: 432,
    replies: 35,
    reposts: 67,
    quotes: 12,
    views: 5890,
    fetchedAt: new Date().toISOString(),
    post: {
      content: '人気の投稿です。多くのエンゲージメントを獲得しています。',
      publishedAt: subDays(new Date(), 3).toISOString(),
    },
  },
  {
    id: 'mock-analytics-4',
    likes: 98,
    replies: 7,
    reposts: 15,
    quotes: 2,
    views: 1230,
    fetchedAt: new Date().toISOString(),
    post: {
      content: '通常の投稿です。',
      publishedAt: subDays(new Date(), 5).toISOString(),
    },
  },
]

export default function AnalyticsDashboard({ accountId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<Analytics[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(7)
  const [isCustomRange, setIsCustomRange] = useState(false)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  useEffect(() => {
    fetchAnalytics()
  }, [accountId, dateRange, customStartDate, customEndDate])

  const fetchAnalytics = async () => {
    setLoading(true)

    // 開発モードの場合はモックデータを使用
    if (accountId === 'dev-account-id') {
      setTimeout(() => {
        // カスタム期間が設定されている場合はフィルタリング
        if (isCustomRange && customStartDate && customEndDate) {
          const start = new Date(customStartDate)
          const end = new Date(customEndDate)
          const filtered = mockAnalytics.filter(item => {
            const postDate = new Date(item.post.publishedAt)
            return postDate >= start && postDate <= end
          })
          setAnalytics(filtered)
        } else {
          setAnalytics(mockAnalytics)
        }
        setLoading(false)
      }, 500)
      return
    }

    try {
      let startDate: Date
      let endDate: Date

      // カスタム期間を使用する場合
      if (isCustomRange && customStartDate && customEndDate) {
        startDate = new Date(customStartDate)
        endDate = new Date(customEndDate)
      } else {
        endDate = new Date()
        startDate = subDays(endDate, dateRange)
      }

      const res = await fetch(
        `/api/analytics/fetch?accountId=${accountId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )

      if (res.ok) {
        const data = await res.json()
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalStats = analytics.reduce(
    (acc, item) => ({
      likes: acc.likes + item.likes,
      replies: acc.replies + item.replies,
      reposts: acc.reposts + item.reposts,
      views: acc.views + item.views,
    }),
    { likes: 0, replies: 0, reposts: 0, views: 0 }
  )

  const chartData = analytics.map((item) => ({
    date: format(new Date(item.post.publishedAt), 'MM/dd'),
    likes: item.likes,
    replies: item.replies,
    reposts: item.reposts,
    views: item.views,
  })).reverse()

  const handlePresetDateRange = (days: number) => {
    setIsCustomRange(false)
    setDateRange(days)
    setCustomStartDate('')
    setCustomEndDate('')
  }

  const handleCustomRangeToggle = () => {
    setIsCustomRange(!isCustomRange)
    if (!isCustomRange) {
      // カスタム期間を有効にした場合、デフォルトで過去7日間を設定
      const end = new Date()
      const start = subDays(end, 7)
      setCustomEndDate(format(end, 'yyyy-MM-dd'))
      setCustomStartDate(format(start, 'yyyy-MM-dd'))
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">投稿分析</h2>
          <div className="flex gap-2">
            <button
              onClick={() => handlePresetDateRange(7)}
              className={`px-4 py-2 rounded-lg transition ${
                !isCustomRange && dateRange === 7
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              7日間
            </button>
            <button
              onClick={() => handlePresetDateRange(30)}
              className={`px-4 py-2 rounded-lg transition ${
                !isCustomRange && dateRange === 30
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              30日間
            </button>
            <button
              onClick={() => handlePresetDateRange(90)}
              className={`px-4 py-2 rounded-lg transition ${
                !isCustomRange && dateRange === 90
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              90日間
            </button>
            <button
              onClick={handleCustomRangeToggle}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                isCustomRange
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              <Calendar className="w-4 h-4" />
              カスタム期間
            </button>
          </div>
        </div>

        {isCustomRange && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2 text-foreground">
                  開始日
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2 text-foreground">
                  終了日
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
            </div>
            {customStartDate && customEndDate && new Date(customStartDate) > new Date(customEndDate) && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                開始日は終了日より前の日付を選択してください
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Eye className="w-6 h-6" />}
          title="総表示回数"
          value={totalStats.views.toLocaleString()}
          color="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={<Heart className="w-6 h-6" />}
          title="総いいね数"
          value={totalStats.likes.toLocaleString()}
          color="text-red-600 dark:text-red-400"
        />
        <StatCard
          icon={<MessageCircle className="w-6 h-6" />}
          title="総リプライ数"
          value={totalStats.replies.toLocaleString()}
          color="text-green-600 dark:text-green-400"
        />
        <StatCard
          icon={<Repeat2 className="w-6 h-6" />}
          title="総リポスト数"
          value={totalStats.reposts.toLocaleString()}
          color="text-purple-600 dark:text-purple-400"
        />
      </div>

      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-border mb-8">
          <h3 className="text-lg font-semibold mb-4 text-foreground">エンゲージメント推移</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="likes" stroke="#dc2626" name="いいね" />
              <Line type="monotone" dataKey="replies" stroke="#16a34a" name="リプライ" />
              <Line type="monotone" dataKey="reposts" stroke="#9333ea" name="リポスト" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-border">
          <h3 className="text-lg font-semibold mb-4 text-foreground">表示回数推移</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="views" fill="#2563eb" name="表示回数" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {analytics.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">選択期間に分析データがありません</p>
        </div>
      )}

      {analytics.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 text-foreground">投稿ごとの詳細</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {analytics.map((item) => (
              <PostAnalyticsCard key={item.id} analytics={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, title, value, color }: {
  icon: React.ReactNode
  title: string
  value: string
  color: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-border">
      <div className={`${color} mb-2`}>{icon}</div>
      <h3 className="text-sm text-muted-foreground mb-1">{title}</h3>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function PostAnalyticsCard({ analytics }: { analytics: Analytics }) {
  const engagementRate = analytics.views > 0
    ? (((analytics.likes + analytics.replies + analytics.reposts) / analytics.views) * 100).toFixed(2)
    : '0.00'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-border">
      <div className="mb-3">
        <p className="text-sm text-foreground line-clamp-2 mb-2">
          {analytics.post.content}
        </p>
        <p className="text-xs text-muted-foreground">
          投稿日時: {format(new Date(analytics.post.publishedAt), 'yyyy/MM/dd HH:mm')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-xs text-muted-foreground">表示</p>
            <p className="text-sm font-semibold text-foreground">
              {analytics.views.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-xs text-muted-foreground">いいね</p>
            <p className="text-sm font-semibold text-foreground">
              {analytics.likes.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          <div>
            <p className="text-xs text-muted-foreground">リプライ</p>
            <p className="text-sm font-semibold text-foreground">
              {analytics.replies.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Repeat2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <div>
            <p className="text-xs text-muted-foreground">リポスト</p>
            <p className="text-sm font-semibold text-foreground">
              {analytics.reposts.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">エンゲージメント率</span>
          <span className="text-sm font-bold text-primary">{engagementRate}%</span>
        </div>
      </div>
    </div>
  )
}
