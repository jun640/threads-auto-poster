export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. はじめに</h2>
            <p>
              Threads Auto Poster（以下「本アプリ」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。
              本プライバシーポリシーは、本アプリがどのように情報を収集、使用、保護するかを説明するものです。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. 収集する情報</h2>
            <p className="mb-2">本アプリは以下の情報を収集します：</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Threadsアカウント情報（ユーザーID、ユーザー名）</li>
              <li>投稿内容およびスケジュール情報</li>
              <li>アプリの使用状況に関する情報</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. 情報の使用目的</h2>
            <p className="mb-2">収集した情報は以下の目的で使用されます：</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Threadsへの自動投稿機能の提供</li>
              <li>投稿スケジュールの管理</li>
              <li>投稿パフォーマンスの分析</li>
              <li>サービスの改善および新機能の開発</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. 情報の共有</h2>
            <p>
              本アプリは、ユーザーの個人情報を第三者と共有することはありません。
              ただし、法律で要求される場合や、ユーザーの同意がある場合を除きます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. データの保存</h2>
            <p>
              ユーザーデータは安全なデータベースに保存され、適切なセキュリティ対策が施されています。
              データは、サービス提供に必要な期間のみ保持されます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Threads API の使用</h2>
            <p>
              本アプリはMeta Platforms, Inc.が提供するThreads APIを使用しています。
              Threads APIの使用に関しては、Metaのプライバシーポリシーおよび利用規約も適用されます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. ユーザーの権利</h2>
            <p className="mb-2">ユーザーは以下の権利を有します：</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>自己の個人情報へのアクセス</li>
              <li>個人情報の訂正または削除の要求</li>
              <li>サービスの利用停止</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Cookie およびトラッキング技術</h2>
            <p>
              本アプリは、ユーザー体験の向上およびサービスの最適化のために、
              Cookieおよび類似のトラッキング技術を使用する場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. プライバシーポリシーの変更</h2>
            <p>
              本プライバシーポリシーは、必要に応じて更新される場合があります。
              重要な変更がある場合は、アプリ内で通知いたします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. お問い合わせ</h2>
            <p>
              本プライバシーポリシーに関するご質問やご不明な点がございましたら、
              アプリ内のサポート機能よりお問い合わせください。
            </p>
          </section>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              最終更新日: {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
