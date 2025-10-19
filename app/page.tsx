import Link from 'next/link'
import { ArrowRight, BarChart3, Calendar, MessageSquare, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <nav className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Threads Auto Poster</h1>
          <Link
            href="/dashboard"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            ダッシュボード
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-5xl font-bold mb-6 text-foreground">
            Threadsの投稿を
            <span className="text-blue-600 dark:text-blue-400">自動化</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            AIを活用したポスト分析・生成からスケジュール投稿、分析まで。
            Threadsマーケティングの全てを一つのツールで。
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:opacity-90 transition"
          >
            今すぐ始める
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Sparkles className="w-8 h-8" />}
            title="AI分析・生成"
            description="指定アカウントの投稿を分析し、AIが自動でポストを生成します"
          />
          <FeatureCard
            icon={<MessageSquare className="w-8 h-8" />}
            title="ツリー投稿"
            description="複数の投稿を繋げたスレッド形式での投稿に対応"
          />
          <FeatureCard
            icon={<Calendar className="w-8 h-8" />}
            title="スケジュール投稿"
            description="好きな時間に投稿を予約。承認してから公開できます"
          />
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="詳細な分析"
            description="いいね、リプライ、表示回数など詳細な数値を追跡"
          />
        </div>
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition border border-border">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
