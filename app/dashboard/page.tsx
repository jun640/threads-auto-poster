'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import PostGenerator from '@/components/PostGenerator'
import PostsList from '@/components/PostsList'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import AutoPostRules from '@/components/AutoPostRules'
import Settings from '@/components/Settings'
import ThemeToggle from '@/components/ThemeToggle'
import AccountSwitcher from '@/components/AccountSwitcher'
import { AccountManager } from '@/lib/account-manager'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'generate' | 'posts' | 'analytics' | 'auto-rules' | 'settings'>('posts')
  const [accountId, setAccountId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [devMode, setDevMode] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('account_id')
    const dev = params.get('dev')

    // 開発モード: ?dev=true をURLに追加すると認証をスキップ
    if (dev === 'true') {
      setDevMode(true)
      setIsAuthenticated(true)
      localStorage.setItem('dev_mode', 'true')

      // 開発モードではアカウント管理システムを使用
      const activeAccount = AccountManager.getActiveAccount()
      if (activeAccount) {
        setAccountId(activeAccount.id)
      } else {
        // デフォルトアカウントを作成
        const defaultAccount = AccountManager.addAccount('デモアカウント', 'demo_user')
        setAccountId(defaultAccount.id)
      }
      return
    }

    // 開発モードがlocalStorageに保存されている場合
    const storedDevMode = localStorage.getItem('dev_mode')
    if (storedDevMode === 'true') {
      setDevMode(true)
      setIsAuthenticated(true)

      const activeAccount = AccountManager.getActiveAccount()
      if (activeAccount) {
        setAccountId(activeAccount.id)
      } else {
        const defaultAccount = AccountManager.addAccount('デモアカウント', 'demo_user')
        setAccountId(defaultAccount.id)
      }
      return
    }

    if (id) {
      setAccountId(id)
      setIsAuthenticated(true)
      localStorage.setItem('account_id', id)
    } else {
      const stored = localStorage.getItem('account_id')
      if (stored) {
        setAccountId(stored)
        setIsAuthenticated(true)
      }
    }

    const error = params.get('error')
    if (error) {
      toast.error('認証に失敗しました')
    }
  }, [])

  const handleAccountChange = (newAccountId: string) => {
    setAccountId(newAccountId)
    toast.success('アカウントを切り替えました')
  }

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/login')
      const { url } = await res.json()
      window.location.href = url
    } catch (error) {
      toast.error('ログインに失敗しました')
    }
  }

  if (!mounted) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4 text-foreground">Threads Auto Poster</h1>
          <p className="text-muted-foreground mb-8">
            Threadsアカウントを連携してください
          </p>
          <div className="space-y-4">
            <button
              onClick={handleLogin}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-semibold"
            >
              Threadsと連携する
            </button>
            <div className="text-sm text-muted-foreground">
              または
            </div>
            <a
              href="/dashboard?dev=true"
              className="block w-full px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary/10 transition font-semibold"
            >
              開発モードで試す
            </a>
            <a
              href="/setup"
              className="block text-sm text-primary hover:underline mt-4"
            >
              → Threads API セットアップガイド
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Threads Auto Poster</h1>
              {devMode && (
                <span className="px-2 py-1 text-xs bg-yellow-500 text-white rounded-full">
                  開発モード
                </span>
              )}
            </div>
            <ThemeToggle />
          </div>

          <div className="flex gap-4 mt-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
                activeTab === 'generate'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              }`}
            >
              投稿を生成
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
                activeTab === 'posts'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              }`}
            >
              投稿一覧
            </button>
            <button
              onClick={() => setActiveTab('auto-rules')}
              className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
                activeTab === 'auto-rules'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              }`}
            >
              自動投稿ルール
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              }`}
            >
              分析
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              }`}
            >
              設定
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {devMode && (
          <div className="mb-6">
            <AccountSwitcher onAccountChange={handleAccountChange} />
          </div>
        )}

        {activeTab === 'generate' && accountId && (
          <PostGenerator accountId={accountId} />
        )}
        {activeTab === 'posts' && accountId && (
          <PostsList accountId={accountId} />
        )}
        {activeTab === 'auto-rules' && accountId && (
          <AutoPostRules accountId={accountId} />
        )}
        {activeTab === 'analytics' && accountId && (
          <AnalyticsDashboard accountId={accountId} />
        )}
        {activeTab === 'settings' && accountId && (
          <Settings accountId={accountId} />
        )}
      </main>
    </div>
  )
}
