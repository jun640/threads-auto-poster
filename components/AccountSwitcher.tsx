'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Settings, Check, Trash2 } from 'lucide-react'
import { AccountManager, Account } from '@/lib/account-manager'
import toast from 'react-hot-toast'

interface AccountSwitcherProps {
  onAccountChange: (accountId: string) => void
}

export default function AccountSwitcher({ onAccountChange }: AccountSwitcherProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountUsername, setNewAccountUsername] = useState('')

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = () => {
    const loadedAccounts = AccountManager.getAccounts()
    setAccounts(loadedAccounts)

    const activeId = AccountManager.getActiveAccountId()
    if (activeId) {
      setActiveAccountId(activeId)
    } else if (loadedAccounts.length > 0) {
      // アクティブアカウントがない場合は最初のアカウントを選択
      AccountManager.setActiveAccount(loadedAccounts[0].id)
      setActiveAccountId(loadedAccounts[0].id)
      onAccountChange(loadedAccounts[0].id)
    }
  }

  const handleSwitchAccount = (accountId: string) => {
    AccountManager.setActiveAccount(accountId)
    setActiveAccountId(accountId)
    onAccountChange(accountId)
    setIsOpen(false)
    toast.success('アカウントを切り替えました')
  }

  const handleAddAccount = () => {
    if (!newAccountName.trim() || !newAccountUsername.trim()) {
      toast.error('名前とユーザー名を入力してください')
      return
    }

    const newAccount = AccountManager.addAccount(newAccountName.trim(), newAccountUsername.trim())
    setAccounts(AccountManager.getAccounts())
    setNewAccountName('')
    setNewAccountUsername('')
    setShowAddForm(false)
    toast.success(`アカウント「${newAccount.name}」を追加しました`)

    // 新しいアカウントに切り替え
    handleSwitchAccount(newAccount.id)
  }

  const handleDeleteAccount = (accountId: string, accountName: string) => {
    if (accounts.length === 1) {
      toast.error('最後のアカウントは削除できません')
      return
    }

    if (!confirm(`アカウント「${accountName}」を削除しますか？\n関連する投稿や設定も削除されます。`)) {
      return
    }

    AccountManager.deleteAccount(accountId)
    setAccounts(AccountManager.getAccounts())

    // アクティブアカウントが削除された場合は次のアカウントを選択
    if (activeAccountId === accountId) {
      const newActiveId = AccountManager.getActiveAccountId()
      if (newActiveId) {
        setActiveAccountId(newActiveId)
        onAccountChange(newActiveId)
      }
    }

    toast.success(`アカウント「${accountName}」を削除しました`)
  }

  const activeAccount = accounts.find(a => a.id === activeAccountId)

  if (accounts.length === 0 && !showAddForm) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-border">
        <div className="text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            アカウントを追加
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            管理するThreadsアカウントを追加してください
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            最初のアカウントを追加
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-border hover:border-primary transition flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground">アクティブアカウント</p>
            <p className="font-semibold text-foreground">
              {activeAccount ? activeAccount.name : '未選択'}
            </p>
            {activeAccount && (
              <p className="text-xs text-muted-foreground">
                @{activeAccount.username}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
            {accounts.length}個のアカウント
          </span>
          <span className="text-muted-foreground">
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-border z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="group flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition"
              >
                <button
                  onClick={() => handleSwitchAccount(account.id)}
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    {account.id === activeAccountId ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Users className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${account.id === activeAccountId ? 'text-primary' : 'text-foreground'}`}>
                      {account.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{account.username}
                    </p>
                  </div>
                </button>
                {accounts.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteAccount(account.id, account.name)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-border p-2">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full px-4 py-3 bg-primary/5 hover:bg-primary/10 text-primary rounded-lg transition flex items-center justify-center gap-2 font-medium"
              >
                <Plus className="w-4 h-4" />
                新しいアカウントを追加
              </button>
            ) : (
              <div className="space-y-3 p-2">
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="アカウント名（例: 個人用）"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddAccount()}
                />
                <input
                  type="text"
                  value={newAccountUsername}
                  onChange={(e) => setNewAccountUsername(e.target.value)}
                  placeholder="ユーザー名（例: john_doe）"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddAccount()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddAccount}
                    className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
                  >
                    追加
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false)
                      setNewAccountName('')
                      setNewAccountUsername('')
                    }}
                    className="px-3 py-2 bg-secondary text-foreground rounded-lg hover:opacity-90 transition text-sm"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
