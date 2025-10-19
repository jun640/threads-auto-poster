'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2, TestTube } from 'lucide-react'

export default function GeminiTestPage() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testGeminiConnection = async () => {
    setTesting(true)
    setResult(null)

    try {
      const res = await fetch('/api/test/gemini')
      const data = await res.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to connect to test endpoint',
        details: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <TestTube className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Gemini API 接続テスト
            </h1>
          </div>

          <div className="mb-6">
            <p className="text-muted-foreground mb-4">
              Google Gemini APIとの接続をテストします。
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                テスト前の確認事項：
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-600"
                  >
                    Google AI Studio
                  </a>
                  でAPIキーを取得
                </li>
                <li>プロジェクトルートの <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">.env</code> ファイルに <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">GEMINI_API_KEY</code> を設定</li>
                <li>開発サーバーを再起動（環境変数の読み込みのため）</li>
              </ol>
            </div>
          </div>

          <button
            onClick={testGeminiConnection}
            disabled={testing}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
          >
            {testing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                テスト中...
              </>
            ) : (
              <>
                <TestTube className="w-5 h-5" />
                Gemini API をテスト
              </>
            )}
          </button>

          {result && (
            <div className="mt-6">
              <div
                className={`rounded-lg p-4 border ${
                  result.success
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <h3
                      className={`font-semibold mb-2 ${
                        result.success
                          ? 'text-green-900 dark:text-green-100'
                          : 'text-red-900 dark:text-red-100'
                      }`}
                    >
                      {result.success ? '✓ 接続成功！' : '✗ 接続失敗'}
                    </h3>
                    <p
                      className={`text-sm mb-3 ${
                        result.success
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-red-800 dark:text-red-200'
                      }`}
                    >
                      {result.message || result.error}
                    </p>

                    {result.success && (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-1">
                            APIキー設定:
                          </p>
                          <code className="text-xs bg-green-100 dark:bg-green-800 px-2 py-1 rounded">
                            {result.apiKeyMasked}
                          </code>
                        </div>

                        {result.testResponse && (
                          <div>
                            <p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-1">
                              テスト応答:
                            </p>
                            <div className="bg-white dark:bg-gray-800 rounded p-3 border border-green-200 dark:border-green-700">
                              <pre className="text-xs text-foreground whitespace-pre-wrap">
                                {JSON.stringify(result.testResponse, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-green-700 dark:text-green-300 italic">
                          タイムスタンプ: {new Date(result.timestamp).toLocaleString('ja-JP')}
                        </p>
                      </div>
                    )}

                    {!result.success && result.details && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-red-900 dark:text-red-100 mb-1">
                          エラー詳細:
                        </p>
                        <div className="bg-red-100 dark:bg-red-900/40 rounded p-2">
                          <pre className="text-xs text-red-800 dark:text-red-200 whitespace-pre-wrap">
                            {result.details}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-foreground mb-3">トラブルシューティング:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• APIキーが設定されていない場合は、.envファイルに追加してください</li>
              <li>• 環境変数を追加した後は、開発サーバーを再起動してください</li>
              <li>• APIキーが無効な場合は、Google AI Studioで新しいキーを作成してください</li>
              <li>• ネットワークエラーの場合は、インターネット接続を確認してください</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/dashboard?dev=true"
            className="text-primary hover:underline text-sm"
          >
            ← ダッシュボードに戻る
          </a>
        </div>
      </div>
    </div>
  )
}
