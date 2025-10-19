'use client'

import { useState, useEffect } from 'react'
import { Send, X, Clock, Loader2, Plus, Edit } from 'lucide-react'
import toast from 'react-hot-toast'

interface Post {
  id: string
  content: string
  threadPosts: string | null
  status: string
  scheduledFor: string | null
  publishedAt: string | null
  createdAt: string
}

interface PostsListProps {
  accountId: string
}

// モックデータ
const mockPosts: Post[] = [
  {
    id: 'mock-1',
    content: 'これは下書きの投稿です。予約投稿機能をテストしています。',
    threadPosts: null,
    status: 'DRAFT',
    scheduledFor: null,
    publishedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    content: 'これはスケジュール済みの投稿です。2024年12月25日に自動投稿される予定です。',
    threadPosts: null,
    status: 'SCHEDULED',
    scheduledFor: '2024-12-25T09:00:00.000Z',
    publishedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-3',
    content: 'これはツリー投稿のサンプルです。複数の投稿を連続して投稿できます。',
    threadPosts: JSON.stringify([
      '2つ目の投稿内容です。',
      '3つ目の投稿内容です。',
      '最後の投稿内容です。'
    ]),
    status: 'DRAFT',
    scheduledFor: null,
    publishedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-4',
    content: 'これは既に投稿済みのコンテンツです。',
    threadPosts: null,
    status: 'PUBLISHED',
    scheduledFor: null,
    publishedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

export default function PostsList({ accountId }: PostsListProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [scheduledTime, setScheduledTime] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [newPostContent, setNewPostContent] = useState('')
  const [editPostContent, setEditPostContent] = useState('')
  const [isThreadPost, setIsThreadPost] = useState(false)
  const [threadPosts, setThreadPosts] = useState<string[]>(['', '', ''])
  const [editThreadPosts, setEditThreadPosts] = useState<string[]>([])
  const [showPublished, setShowPublished] = useState(false)

  useEffect(() => {
    // 開発モード: アカウントごとの投稿データを読み込む
    if (accountId && accountId.startsWith('account-')) {
      const savedPosts = localStorage.getItem(`generatedPosts_${accountId}`)
      const generatedPosts = savedPosts ? JSON.parse(savedPosts) : []
      setPosts([...generatedPosts, ...mockPosts])
      setLoading(false)
      return
    }
    fetchPosts()
  }, [accountId])

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/posts?accountId=${accountId}`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleSchedule = async (postId: string) => {
    if (!scheduledTime) {
      toast.error('投稿日時を選択してください')
      return
    }

    // 開発モード: モックデータを更新
    if (accountId === 'dev-account-id') {
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, status: 'SCHEDULED', scheduledFor: new Date(scheduledTime).toISOString() }
          : p
      ))
      toast.success('投稿をスケジュールしました')
      setSelectedPost(null)
      setScheduledTime('')
      return
    }

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'SCHEDULED',
          scheduledFor: new Date(scheduledTime).toISOString(),
        }),
      })

      if (!res.ok) throw new Error('スケジュール設定に失敗しました')

      toast.success('投稿をスケジュールしました')
      setSelectedPost(null)
      setScheduledTime('')
      fetchPosts()
    } catch (error) {
      toast.error('スケジュール設定に失敗しました')
    }
  }

  const handlePublish = async (postId: string) => {
    // 開発モード: モックデータを更新
    if (accountId === 'dev-account-id') {
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, status: 'PUBLISHED', publishedAt: new Date().toISOString() }
          : p
      ))
      toast.success('投稿しました')
      return
    }

    try {
      const res = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })

      if (!res.ok) throw new Error('投稿に失敗しました')

      toast.success('投稿しました')
      fetchPosts()
    } catch (error) {
      toast.error('投稿に失敗しました')
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('この投稿を削除しますか?')) return

    // 開発モード: アカウントごとの投稿を削除
    if (accountId && accountId.startsWith('account-')) {
      // localStorageから削除
      if (postId.startsWith('generated-')) {
        const storageKey = `generatedPosts_${accountId}`
        const savedPosts = localStorage.getItem(storageKey)
        if (savedPosts) {
          const generatedPosts = JSON.parse(savedPosts)
          const updatedPosts = generatedPosts.filter((p: Post) => p.id !== postId)
          localStorage.setItem(storageKey, JSON.stringify(updatedPosts))
        }
      }
      setPosts(posts.filter(p => p.id !== postId))
      toast.success('投稿を削除しました')
      return
    }

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('削除に失敗しました')

      toast.success('投稿を削除しました')
      fetchPosts()
    } catch (error) {
      toast.error('削除に失敗しました')
    }
  }

  const handleCreatePost = () => {
    if (!newPostContent.trim()) {
      toast.error('投稿内容を入力してください')
      return
    }

    if (isThreadPost) {
      const validThreadPosts = threadPosts.filter(p => p.trim())
      if (validThreadPosts.length === 0) {
        toast.error('ツリー投稿を少なくとも1つ入力してください')
        return
      }
    }

    if (posts.length >= 10) {
      toast.error('投稿は最大10件までです')
      return
    }

    // 開発モード: モックデータに追加
    if (accountId === 'dev-account-id') {
      const validThreadPosts = threadPosts.filter(p => p.trim())
      const newPost: Post = {
        id: `mock-new-${Date.now()}`,
        content: newPostContent,
        threadPosts: isThreadPost && validThreadPosts.length > 0
          ? JSON.stringify(validThreadPosts)
          : null,
        status: 'DRAFT',
        scheduledFor: null,
        publishedAt: null,
        createdAt: new Date().toISOString(),
      }
      setPosts([newPost, ...posts])
      toast.success('投稿を作成しました')
      setShowCreateModal(false)
      setNewPostContent('')
      setIsThreadPost(false)
      setThreadPosts(['', '', ''])
      return
    }

    toast.error('本番環境では未実装です')
  }

  const handleEditPost = () => {
    if (!editPostContent.trim()) {
      toast.error('投稿内容を入力してください')
      return
    }

    if (!editingPost) return

    // 開発モード: モックデータを更新
    if (accountId === 'dev-account-id') {
      const validEditThreadPosts = editThreadPosts.filter(p => p.trim())
      setPosts(posts.map(p =>
        p.id === editingPost.id
          ? {
              ...p,
              content: editPostContent,
              threadPosts: editingPost.threadPosts && validEditThreadPosts.length > 0
                ? JSON.stringify(validEditThreadPosts)
                : editingPost.threadPosts
            }
          : p
      ))
      toast.success('投稿を更新しました')
      setShowEditModal(false)
      setEditingPost(null)
      setEditPostContent('')
      setEditThreadPosts([])
      return
    }

    toast.error('本番環境では未実装です')
  }

  const openEditModal = (post: Post) => {
    setEditingPost(post)
    setEditPostContent(post.content)
    if (post.threadPosts) {
      try {
        setEditThreadPosts(JSON.parse(post.threadPosts))
      } catch (e) {
        console.error('Failed to parse threadPosts for editing:', e, post.threadPosts)
        setEditThreadPosts([])
      }
    } else {
      setEditThreadPosts([])
    }
    setShowEditModal(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // 投稿済みを除外したリスト
  const filteredPosts = showPublished
    ? posts
    : posts.filter(p => p.status !== 'PUBLISHED')

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-foreground">投稿一覧</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPublished}
              onChange={(e) => setShowPublished(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-foreground">投稿済みを表示</span>
          </label>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={posts.length >= 10}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新規投稿 ({posts.length}/10)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-border flex flex-col"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 mr-2">
                <p className="text-sm text-foreground whitespace-pre-wrap mb-2">{post.content}</p>
                {post.threadPosts && (() => {
                  try {
                    const threads = JSON.parse(post.threadPosts)
                    return (
                      <div className="mt-2 pl-3 border-l-2 border-primary space-y-1">
                        {threads.map((text: string, i: number) => (
                          <p key={i} className="text-muted-foreground text-xs">
                            {i + 2}. {text}
                          </p>
                        ))}
                      </div>
                    )
                  } catch (e) {
                    console.error('Failed to parse threadPosts:', e, post.threadPosts)
                    return null
                  }
                })()}
              </div>
              <div className="flex-shrink-0">
                <StatusBadge status={post.status} />
              </div>
            </div>

            {post.scheduledFor && (
              <p className="text-xs text-muted-foreground mb-3">
                📅 予定: {new Date(post.scheduledFor).toLocaleString('ja-JP')}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              {(post.status === 'DRAFT' || post.status === 'APPROVED') && (
                <>
                  <button
                    onClick={() => openEditModal(post)}
                    className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-1 text-sm"
                  >
                    <Edit className="w-3 h-3" />
                    編集
                  </button>
                  <button
                    onClick={() => handlePublish(post.id)}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition flex items-center justify-center gap-1 text-sm"
                  >
                    <Send className="w-3 h-3" />
                    今すぐ投稿
                  </button>
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1 text-sm"
                  >
                    <Clock className="w-3 h-3" />
                    予約投稿
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-1 text-sm"
                  >
                    <X className="w-3 h-3" />
                    削除
                  </button>
                </>
              )}

              {post.status === 'SCHEDULED' && (
                <>
                  <button
                    onClick={() => openEditModal(post)}
                    className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-1 text-sm"
                  >
                    <Edit className="w-3 h-3" />
                    編集
                  </button>
                  <button
                    onClick={() => handlePublish(post.id)}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition flex items-center justify-center gap-1 text-sm"
                  >
                    <Send className="w-3 h-3" />
                    今すぐ投稿
                  </button>
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1 text-sm"
                  >
                    <Clock className="w-3 h-3" />
                    予約変更
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-1 text-sm"
                  >
                    <X className="w-3 h-3" />
                    削除
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {filteredPosts.length === 0 && (
          <p className="text-center text-muted-foreground py-12 col-span-2">
            {showPublished ? '投稿がまだありません' : '下書き・予約中の投稿がありません'}
          </p>
        )}
      </div>

      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-foreground">予約投稿の設定</h3>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground mb-4"
              min={new Date().toISOString().slice(0, 16)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleSchedule(selectedPost.id)}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
              >
                予約設定
              </button>
              <button
                onClick={() => {
                  setSelectedPost(null)
                  setScheduledTime('')
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition text-foreground"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full my-8">
            <h3 className="text-xl font-bold mb-4 text-foreground">新規投稿を作成</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">
                1つ目の投稿
              </label>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="投稿内容を入力してください..."
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground min-h-[100px] resize-y"
                maxLength={500}
              />
              <div className="text-sm text-muted-foreground mt-1 text-right">
                {newPostContent.length}/500文字
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isThreadPost}
                  onChange={(e) => setIsThreadPost(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-foreground">
                  ツリー形式で投稿する（複数の連続投稿）
                </span>
              </label>
            </div>

            {isThreadPost && (
              <div className="space-y-3 mb-4">
                {threadPosts.map((post, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      {index + 2}つ目の投稿
                    </label>
                    <textarea
                      value={post}
                      onChange={(e) => {
                        const newThreadPosts = [...threadPosts]
                        newThreadPosts[index] = e.target.value
                        setThreadPosts(newThreadPosts)
                      }}
                      placeholder={`${index + 2}つ目の投稿内容...`}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground min-h-[80px] resize-y"
                      maxLength={500}
                    />
                    <div className="text-sm text-muted-foreground mt-1 text-right">
                      {post.length}/500文字
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setThreadPosts([...threadPosts, ''])}
                  className="px-3 py-1.5 text-sm bg-secondary text-foreground rounded-lg hover:opacity-90 transition"
                >
                  + 投稿を追加
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCreatePost}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
              >
                作成
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewPostContent('')
                  setIsThreadPost(false)
                  setThreadPosts(['', '', ''])
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition text-foreground"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full my-8">
            <h3 className="text-xl font-bold mb-4 text-foreground">投稿を編集</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">
                1つ目の投稿
              </label>
              <textarea
                value={editPostContent}
                onChange={(e) => setEditPostContent(e.target.value)}
                placeholder="投稿内容を入力してください..."
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground min-h-[100px] resize-y"
                maxLength={500}
              />
              <div className="text-sm text-muted-foreground mt-1 text-right">
                {editPostContent.length}/500文字
              </div>
            </div>

            {editingPost.threadPosts && (
              <div className="space-y-3 mb-4">
                <p className="text-sm font-medium text-foreground">ツリー投稿</p>
                {editThreadPosts.map((post, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      {index + 2}つ目の投稿
                    </label>
                    <textarea
                      value={post}
                      onChange={(e) => {
                        const newEditThreadPosts = [...editThreadPosts]
                        newEditThreadPosts[index] = e.target.value
                        setEditThreadPosts(newEditThreadPosts)
                      }}
                      placeholder={`${index + 2}つ目の投稿内容...`}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground min-h-[80px] resize-y"
                      maxLength={500}
                    />
                    <div className="text-sm text-muted-foreground mt-1 text-right">
                      {post.length}/500文字
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setEditThreadPosts([...editThreadPosts, ''])}
                  className="px-3 py-1.5 text-sm bg-secondary text-foreground rounded-lg hover:opacity-90 transition"
                >
                  + 投稿を追加
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleEditPost}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
              >
                更新
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingPost(null)
                  setEditPostContent('')
                  setEditThreadPosts([])
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition text-foreground"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    PUBLISHED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

  const labels = {
    DRAFT: '下書き',
    APPROVED: '承認済',
    SCHEDULED: '予約中',
    PUBLISHED: '投稿済',
    FAILED: '失敗',
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${colors[status as keyof typeof colors]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  )
}
