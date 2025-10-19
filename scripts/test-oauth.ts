#!/usr/bin/env tsx

/**
 * Threads OAuth テストツール
 *
 * このツールは以下の機能を提供します:
 * 1. 環境変数の検証
 * 2. OAuth認証URLの生成
 * 3. トークン交換のテスト
 * 4. アクセストークンの検証
 * 5. リフレッシュトークンのテスト
 */

import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

// カラー出力用の定数
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// ログ用ヘルパー関数
const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset}  ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset}  ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
  header: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  divider: () => console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}`),
};

interface OAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

class ThreadsOAuthTester {
  private config: OAuthConfig;
  private rl: readline.Interface;

  constructor() {
    this.config = {
      appId: process.env.THREADS_APP_ID || '',
      appSecret: process.env.THREADS_APP_SECRET || '',
      redirectUri: process.env.THREADS_REDIRECT_URI || '',
    };

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * 環境変数の検証
   */
  async validateEnvironment(): Promise<boolean> {
    log.header('📋 環境変数の検証');
    log.divider();

    let isValid = true;

    // THREADS_APP_ID
    if (!this.config.appId) {
      log.error('THREADS_APP_ID が設定されていません');
      isValid = false;
    } else if (!/^\d+$/.test(this.config.appId)) {
      log.error('THREADS_APP_ID の形式が正しくありません（数字のみ）');
      isValid = false;
    } else {
      log.success(`THREADS_APP_ID: ${this.config.appId}`);
    }

    // THREADS_APP_SECRET
    if (!this.config.appSecret) {
      log.error('THREADS_APP_SECRET が設定されていません');
      isValid = false;
    } else if (this.config.appSecret.length < 32) {
      log.warning('THREADS_APP_SECRET の長さが短すぎる可能性があります');
      log.info(`現在の長さ: ${this.config.appSecret.length} 文字`);
    } else {
      log.success(`THREADS_APP_SECRET: ${this.config.appSecret.substring(0, 8)}...`);
    }

    // THREADS_REDIRECT_URI
    if (!this.config.redirectUri) {
      log.error('THREADS_REDIRECT_URI が設定されていません');
      isValid = false;
    } else {
      try {
        const url = new URL(this.config.redirectUri);
        if (!url.pathname.includes('/callback')) {
          log.warning('リダイレクトURIに "/callback" が含まれていません');
        }
        log.success(`THREADS_REDIRECT_URI: ${this.config.redirectUri}`);
      } catch (e) {
        log.error('THREADS_REDIRECT_URI の形式が正しくありません');
        isValid = false;
      }
    }

    // OpenAI API Key (オプション)
    if (process.env.OPENAI_API_KEY) {
      if (process.env.OPENAI_API_KEY.startsWith('sk-')) {
        log.success('OPENAI_API_KEY: 設定済み');
      } else {
        log.warning('OPENAI_API_KEY の形式が正しくない可能性があります');
      }
    } else {
      log.info('OPENAI_API_KEY: 未設定（AI機能は使用できません）');
    }

    // Gemini API Key (オプション)
    if (process.env.GEMINI_API_KEY) {
      log.success('GEMINI_API_KEY: 設定済み');
    } else {
      log.info('GEMINI_API_KEY: 未設定（Gemini AI機能は使用できません）');
    }

    console.log();
    return isValid;
  }

  /**
   * OAuth認証URLの生成
   */
  generateAuthUrl(): string {
    log.header('🔗 OAuth認証URL生成');
    log.divider();

    const scopes = [
      'threads_basic',
      'threads_content_publish',
      'threads_manage_insights',
      'threads_manage_replies',
    ];

    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      scope: scopes.join(','),
      response_type: 'code',
      state: this.generateState(),
    });

    const authUrl = `https://threads.net/oauth/authorize?${params.toString()}`;

    log.success('認証URLを生成しました');
    console.log();
    log.info('URL詳細:');
    console.log(`  ${colors.dim}Base URL:${colors.reset}     https://threads.net/oauth/authorize`);
    console.log(`  ${colors.dim}Client ID:${colors.reset}    ${this.config.appId}`);
    console.log(`  ${colors.dim}Redirect URI:${colors.reset} ${this.config.redirectUri}`);
    console.log(`  ${colors.dim}Scopes:${colors.reset}       ${scopes.join(', ')}`);
    console.log();
    console.log(`${colors.bright}認証URL:${colors.reset}`);
    console.log(`${colors.cyan}${authUrl}${colors.reset}`);
    console.log();

    return authUrl;
  }

  /**
   * トークン交換のテスト
   */
  async testTokenExchange(code: string): Promise<TokenResponse | null> {
    log.header('🔄 トークン交換テスト');
    log.divider();

    const tokenUrl = 'https://graph.threads.net/oauth/access_token';
    const params = new URLSearchParams({
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirectUri,
      code: code,
    });

    try {
      log.info('トークン交換リクエストを送信中...');
      console.log();
      console.log(`${colors.dim}URL:${colors.reset} ${tokenUrl}`);
      console.log(`${colors.dim}Parameters:${colors.reset}`);
      console.log(`  client_id: ${this.config.appId}`);
      console.log(`  client_secret: ${this.config.appSecret.substring(0, 8)}...`);
      console.log(`  grant_type: authorization_code`);
      console.log(`  redirect_uri: ${this.config.redirectUri}`);
      console.log(`  code: ${code.substring(0, 20)}...`);
      console.log();

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        log.error('トークン交換に失敗しました');
        console.log();
        console.log(`${colors.red}エラー詳細:${colors.reset}`);
        console.log(JSON.stringify(data, null, 2));
        return null;
      }

      log.success('トークン交換に成功しました');
      console.log();
      console.log(`${colors.green}トークン情報:${colors.reset}`);
      console.log(`  Access Token: ${data.access_token.substring(0, 20)}...`);
      console.log(`  Token Type: ${data.token_type}`);
      if (data.expires_in) {
        console.log(`  Expires In: ${data.expires_in}秒 (${Math.floor(data.expires_in / 3600)}時間)`);
      }
      console.log();

      return data;
    } catch (error) {
      log.error('トークン交換中にエラーが発生しました');
      console.error(error);
      return null;
    }
  }

  /**
   * アクセストークンの検証
   */
  async validateAccessToken(accessToken: string): Promise<boolean> {
    log.header('🔐 アクセストークン検証');
    log.divider();

    try {
      log.info('ユーザー情報を取得中...');

      const response = await fetch(
        `https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url&access_token=${accessToken}`
      );

      const data = await response.json();

      if (!response.ok) {
        log.error('アクセストークンが無効です');
        console.log();
        console.log(`${colors.red}エラー詳細:${colors.reset}`);
        console.log(JSON.stringify(data, null, 2));
        return false;
      }

      log.success('アクセストークンは有効です');
      console.log();
      console.log(`${colors.green}ユーザー情報:${colors.reset}`);
      console.log(`  User ID: ${data.id}`);
      console.log(`  Username: @${data.username}`);
      console.log(`  Name: ${data.name}`);
      if (data.threads_profile_picture_url) {
        console.log(`  Profile Picture: ${data.threads_profile_picture_url.substring(0, 50)}...`);
      }
      console.log();

      return true;
    } catch (error) {
      log.error('アクセストークン検証中にエラーが発生しました');
      console.error(error);
      return false;
    }
  }

  /**
   * 長期トークンへの変換
   */
  async exchangeLongLivedToken(shortLivedToken: string): Promise<TokenResponse | null> {
    log.header('🔄 長期トークンへの変換');
    log.divider();

    const tokenUrl = 'https://graph.threads.net/access_token';
    const params = new URLSearchParams({
      grant_type: 'th_exchange_token',
      client_secret: this.config.appSecret,
      access_token: shortLivedToken,
    });

    try {
      log.info('長期トークンへの変換リクエストを送信中...');

      const response = await fetch(`${tokenUrl}?${params.toString()}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        log.error('長期トークンへの変換に失敗しました');
        console.log();
        console.log(`${colors.red}エラー詳細:${colors.reset}`);
        console.log(JSON.stringify(data, null, 2));
        return null;
      }

      log.success('長期トークンへの変換に成功しました');
      console.log();
      console.log(`${colors.green}長期トークン情報:${colors.reset}`);
      console.log(`  Access Token: ${data.access_token.substring(0, 20)}...`);
      console.log(`  Token Type: ${data.token_type}`);
      if (data.expires_in) {
        console.log(`  Expires In: ${data.expires_in}秒 (約${Math.floor(data.expires_in / 86400)}日)`);
      }
      console.log();

      return data;
    } catch (error) {
      log.error('長期トークン変換中にエラーが発生しました');
      console.error(error);
      return null;
    }
  }

  /**
   * ランダムなstateパラメータを生成
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * ユーザー入力を取得
   */
  private async askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(`${question} `, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * メインメニュー
   */
  async showMenu(): Promise<void> {
    console.clear();
    log.header('🧪 Threads OAuth テストツール');
    log.divider();
    console.log();
    console.log('以下のテストを選択してください:');
    console.log();
    console.log(`  ${colors.cyan}1${colors.reset}) 環境変数の検証`);
    console.log(`  ${colors.cyan}2${colors.reset}) OAuth認証URLの生成`);
    console.log(`  ${colors.cyan}3${colors.reset}) トークン交換のテスト`);
    console.log(`  ${colors.cyan}4${colors.reset}) アクセストークンの検証`);
    console.log(`  ${colors.cyan}5${colors.reset}) 長期トークンへの変換`);
    console.log(`  ${colors.cyan}6${colors.reset}) すべてのテストを実行（フルフロー）`);
    console.log(`  ${colors.cyan}0${colors.reset}) 終了`);
    console.log();

    const choice = await this.askQuestion('選択 (0-6):');

    switch (choice) {
      case '1':
        await this.validateEnvironment();
        await this.askQuestion('\nEnterキーを押して続行...');
        await this.showMenu();
        break;

      case '2':
        const authUrl = this.generateAuthUrl();
        const shouldOpen = await this.askQuestion('ブラウザで開きますか? (y/n):');
        if (shouldOpen.toLowerCase() === 'y') {
          const { exec } = await import('child_process');
          exec(`open "${authUrl}"`);
          log.success('ブラウザで開きました');
        }
        await this.askQuestion('\nEnterキーを押して続行...');
        await this.showMenu();
        break;

      case '3':
        const code = await this.askQuestion('\n認証コードを入力してください:');
        if (code) {
          const tokenData = await this.testTokenExchange(code);
          if (tokenData) {
            const shouldConvert = await this.askQuestion('\n長期トークンに変換しますか? (y/n):');
            if (shouldConvert.toLowerCase() === 'y') {
              await this.exchangeLongLivedToken(tokenData.access_token);
            }
          }
        }
        await this.askQuestion('\nEnterキーを押して続行...');
        await this.showMenu();
        break;

      case '4':
        const token = await this.askQuestion('\nアクセストークンを入力してください:');
        if (token) {
          await this.validateAccessToken(token);
        }
        await this.askQuestion('\nEnterキーを押して続行...');
        await this.showMenu();
        break;

      case '5':
        const shortToken = await this.askQuestion('\n短期アクセストークンを入力してください:');
        if (shortToken) {
          await this.exchangeLongLivedToken(shortToken);
        }
        await this.askQuestion('\nEnterキーを押して続行...');
        await this.showMenu();
        break;

      case '6':
        await this.runFullFlow();
        await this.askQuestion('\nEnterキーを押して続行...');
        await this.showMenu();
        break;

      case '0':
        console.log();
        log.success('テストツールを終了します');
        console.log();
        this.rl.close();
        process.exit(0);
        break;

      default:
        log.error('無効な選択です');
        await this.askQuestion('\nEnterキーを押して続行...');
        await this.showMenu();
        break;
    }
  }

  /**
   * フルフローテスト
   */
  async runFullFlow(): Promise<void> {
    console.clear();
    log.header('🚀 フルフローテスト');
    log.divider();

    // 1. 環境変数の検証
    const isValid = await this.validateEnvironment();
    if (!isValid) {
      log.error('環境変数が正しく設定されていません');
      return;
    }

    // 2. OAuth認証URLの生成
    const authUrl = this.generateAuthUrl();

    log.info('次の手順を実行してください:');
    console.log();
    console.log(`  1. Meta Developer Dashboardで以下のリダイレクトURIを設定:`);
    console.log(`     ${colors.cyan}${this.config.redirectUri}${colors.reset}`);
    console.log();
    console.log(`  2. 以下の認証URLをブラウザで開く:`);
    console.log(`     ${colors.cyan}${authUrl}${colors.reset}`);
    console.log();
    console.log(`  3. Threadsアカウントでログインして承認`);
    console.log();

    const shouldOpen = await this.askQuestion('認証URLをブラウザで開きますか? (y/n):');
    if (shouldOpen.toLowerCase() === 'y') {
      const { exec } = await import('child_process');
      exec(`open "${authUrl}"`);
      log.success('ブラウザで開きました');
    }

    console.log();
    const code = await this.askQuestion('認証後、リダイレクトURLから認証コードを入力してください:');

    if (!code) {
      log.warning('認証コードが入力されませんでした');
      return;
    }

    // 3. トークン交換
    const tokenData = await this.testTokenExchange(code);
    if (!tokenData) {
      return;
    }

    // 4. アクセストークンの検証
    const isTokenValid = await this.validateAccessToken(tokenData.access_token);
    if (!isTokenValid) {
      return;
    }

    // 5. 長期トークンへの変換
    const longLivedToken = await this.exchangeLongLivedToken(tokenData.access_token);
    if (!longLivedToken) {
      return;
    }

    // 完了
    log.header('✨ フルフローテスト完了');
    log.divider();
    console.log();
    log.success('すべてのテストが正常に完了しました！');
    console.log();
    console.log(`${colors.bright}長期アクセストークン:${colors.reset}`);
    console.log(`${colors.green}${longLivedToken.access_token}${colors.reset}`);
    console.log();
    log.info('このトークンを .env ファイルに保存してください');
    console.log();
  }

  /**
   * ツールを起動
   */
  async run(): Promise<void> {
    await this.showMenu();
  }
}

// メイン処理
async function main() {
  const tester = new ThreadsOAuthTester();
  await tester.run();
}

main().catch((error) => {
  console.error('予期しないエラーが発生しました:', error);
  process.exit(1);
});
