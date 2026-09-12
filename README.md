# off r39'x システム

「off r39'x in 大阪らへん2027」向けのイベント管理Webサービス。イベント情報の提供、アカウント管理、入場チケット／カラオケ予約／グッズの販売・決済、電子チケットによる会場受付、運営者向け管理機能を一貫して提供する。

正式な要件定義は [`Requirements/main_req/`](Requirements/main_req/)（000〜200番、全20ファイル）を Single Source of Truth とする。本READMEはその要点をまとめたものであり、内容が矛盾する場合は `main_req` を正とする。

## リポジトリ構成

| パス                                               | 内容                                                                                                                   |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [`Dev/payment-mock/`](Dev/payment-mock/)           | 画面遷移確認用のNext.jsフロントエンドモック。バックエンドAPI・DBは持たず、状態はすべてブラウザ`localStorage`で完結する |
| [`Requirements/main_req/`](Requirements/main_req/) | 正式要件定義書一式（システム概要・各Domain仕様・非機能要件・AI開発規約など）                                           |

## 技術スタック

正式仕様（`010-system-overview.md` / `000-project-constitution.md`）が定める標準構成。

| 領域               | 標準                                          |
| ------------------ | --------------------------------------------- |
| Language           | TypeScript                                    |
| Package / Monorepo | pnpm workspaces                               |
| Web                | Next.js / React / App Router                  |
| UI                 | Tailwind CSS / shadcn/ui                      |
| API                | Hono（Hono RPCで型共有）                      |
| Validation         | Zod                                           |
| Database           | Supabase PostgreSQL（Drizzle ORM / `pg`）     |
| Auth               | Supabase Auth                                 |
| Payment            | Stripe Checkout                               |
| Email              | Resend / React Email                          |
| Test               | Vitest（Unit/Integration）/ Playwright（E2E） |
| Lint / Format      | Biome                                         |
| Hosting            | Vercel（Web）/ Railway（API）                 |

標準技術は原則固定。変更する場合は理由・影響範囲を明示したDecisionを伴う。

## システム構成の主要原則

- **Web/API分離**: Webはページ・UI・SSR・APIクライアントのみを担当し、業務ロジックとDBアクセスはHono APIに集約する。WebからDBへの直接アクセスは禁止。
- **サーバー側Authority**: 保護された業務操作の認可・検証・状態遷移はAPI側で行う。クライアントの入力・UI非表示をセキュリティ境界として信頼しない。
- **決済確定の根拠**: 決済成立はブラウザの成功ページ到達ではなく、Stripeの検証済みサーバーイベントを正とする。
- **二重販売・二重利用の防止**: カラオケ枠等の排他的販売対象や、QR等の一回利用権利について、競合時も許容数・許容回数を超える成立を作らない（DB制約・Transaction・排他制御で保証）。
- **監査可能性**: 金銭・権限・受付・管理者の強制操作は、実行者・日時・対象・理由を含め後から追跡可能にする。
- **最小権限・データ最小化**: 権限はRole/Capabilityで分離し必要最小限を付与、個人情報も明確な目的の範囲でのみ取得・送信する。
- **環境分離**: 本番・非本番、および外部サービス（Stripe/Resendなど）の本番・テスト環境を明確に分離する。

## ブランチ戦略

| ブランチ | 役割 |
| --- | --- |
| `main` | 常に安定した状態を保つ基準ブランチ。直接コミットは行わない |
| `dev` | 通常の開発作業を行うブランチ。開発したファイルは原則ここにコミットする |

開発フロー:

1. `dev` ブランチで作業し、変更をコミットする
2. `dev` ブランチをリモートへpushする
3. `dev` → `main` のPull Requestを作成する
4. **`main` へのマージは必ずユーザーが手動で行う。自動マージは行わない。**

マージ条件（本実装フェーズ以降）: 正式仕様 `170-test-specification.md` §67 の Merge Gate に従い、`main` へのマージには以下8種のテストグループ（G1〜G8）を通過することを必須とする。

```text
G1 unit
G2 db-migration
G3 db-integration
G4 api
G5 security
G6 reliability-recovery
G7 observability
G8 e2e
```

現状の `Dev/payment-mock` はDB/APIを持たないフロントエンドモックのため、上記ゲートは字義通り適用できない。API・DBを含む本実装への移行時に、CI上でのGate運用を有効化する。

## 開発ルール

- **仕様がSingle Source of Truth**: `main_req` に承認済みの仕様を実装の正とする。実装都合での仕様変更・解釈補完は行わず、矛盾や不明点は問題として報告する（仕様変更が必要な場合は正式な改訂として分離する）。
- **変更範囲の最小化**: 依頼目的に必要な範囲を超えるリファクタリングや仕様変更を行わない。
- **Test-first**: 不具合修正は再現テストを先に追加し、修正前にfail・修正後にpassすることを確認する。重要なInvariant・状態遷移・認可・競合制御・決済・受付は自動テスト対象とする。
- **Secret管理**: APIキー・Password・Webhook Secret等をコード・仕様本文・Git管理対象・通常ログに記録しない。
- **品質ゲート**: 本番反映前にtypecheck・lint・test・buildを通過させる。
