export interface Account {
  id: string
  name: string
  username: string
  createdAt: string
  basePrompt?: string
}

export class AccountManager {
  private static STORAGE_KEY = 'managed_accounts'
  private static ACTIVE_ACCOUNT_KEY = 'active_account_id'

  static getAccounts(): Account[] {
    if (typeof window === 'undefined') return []

    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) return []

    try {
      return JSON.parse(stored)
    } catch (error) {
      console.error('Failed to parse accounts:', error)
      return []
    }
  }

  static saveAccounts(accounts: Account[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(accounts))
  }

  static addAccount(name: string, username: string): Account {
    const accounts = this.getAccounts()
    const newAccount: Account = {
      id: `account-${Date.now()}`,
      name,
      username,
      createdAt: new Date().toISOString(),
    }

    accounts.push(newAccount)
    this.saveAccounts(accounts)

    // 最初のアカウントの場合は自動的にアクティブに
    if (accounts.length === 1) {
      this.setActiveAccount(newAccount.id)
    }

    return newAccount
  }

  static updateAccount(id: string, updates: Partial<Account>): void {
    const accounts = this.getAccounts()
    const index = accounts.findIndex(a => a.id === id)

    if (index !== -1) {
      accounts[index] = { ...accounts[index], ...updates }
      this.saveAccounts(accounts)
    }
  }

  static deleteAccount(id: string): void {
    const accounts = this.getAccounts()
    const filtered = accounts.filter(a => a.id !== id)
    this.saveAccounts(filtered)

    // アクティブアカウントが削除された場合は次のアカウントを選択
    if (this.getActiveAccountId() === id && filtered.length > 0) {
      this.setActiveAccount(filtered[0].id)
    }
  }

  static getActiveAccountId(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.ACTIVE_ACCOUNT_KEY)
  }

  static setActiveAccount(id: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.ACTIVE_ACCOUNT_KEY, id)
  }

  static getActiveAccount(): Account | null {
    const id = this.getActiveAccountId()
    if (!id) return null

    const accounts = this.getAccounts()
    return accounts.find(a => a.id === id) || null
  }

  // アカウントごとの基本プロンプトを管理
  static getAccountBasePrompt(accountId: string): string {
    const account = this.getAccounts().find(a => a.id === accountId)
    return account?.basePrompt || ''
  }

  static setAccountBasePrompt(accountId: string, prompt: string): void {
    this.updateAccount(accountId, { basePrompt: prompt })
  }
}
