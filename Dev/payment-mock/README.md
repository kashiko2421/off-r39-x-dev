# off r39'x 決済システム モック

「off r39'x in 大阪らへん2027」の**画面遷移を確認するためのモック**です。商品選択（入場チケット／カラオケ予約／グッズ）からカート、決済、マイページでの確認、簡易な運営管理画面・スタッフ受付画面までの一連の流れを、実際にクリックして確認できます。

**実際の決済処理・課金は一切行いません。** Stripe等の外部サービスにも接続しません。すべての状態（ログイン・カート・注文・決済結果）はブラウザの `localStorage` にのみ保存され、サーバー側には何も送信されません。

---

## 1. 動作環境

- Node.js 18 以降（動作確認は v24 で実施）
- pnpm 9 以降（動作確認は v12.3.4 で実施）

pnpm が入っていない場合は次のいずれかでインストールできます。

```bash
corepack enable pnpm
# または
npm install -g pnpm
```

## 2. セットアップ

このフォルダ（`payment-mock`）に移動して依存関係をインストールし、開発サーバーを起動します。

```bash
pnpm install
pnpm dev
```

起動後、ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 3. ページ構成

正式仕様書 [`050-page-screen-specification.md`](../../Requirements/main_req/050-page-screen-specification.md) のURL namespace（`/`, `/entry`, `/karaoke`, `/goods`, `/account`, `/purchase`, `/mypage`）に準拠しています。

| URL                                                                                                  | 内容                                                                   |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `/`                                                                                                  | 公開トップページ（開催日時・会場アクセス・注意事項）                   |
| `/entry`                                                                                             | 入場チケット一覧                                                       |
| `/karaoke`                                                                                           | カラオケ予約 Sales Guide（日程一覧）                                   |
| `/karaoke/schedule/[date]`                                                                           | 日別スケジュール（1時間単位の空き状況）                                |
| `/karaoke/slots/[slotId]`                                                                            | 枠詳細・カート追加（Hold取得はカート追加時ではなく注文作成時）         |
| `/goods`                                                                                             | グッズ一覧                                                             |
| `/goods/[goodsId]`                                                                                   | グッズ詳細・数量選択・カート追加                                       |
| `/account/login`, `/account/register`, `/account/password-reset`, `/account/password-reset/complete` | ログイン・新規登録・パスワード再設定（すべてモック）                   |
| `/cart`                                                                                              | カート確認                                                             |
| `/checkout/[orderId]/payment-method` 以降                                                            | 決済手段選択 → カード／コンビニ決済 → 完了・失敗                       |
| `/purchase/orders/[orderId]`                                                                         | 購入状態（Purchase Status。Order全7状態に応じた表示）                  |
| `/mypage`                                                                                            | マイページ（入場／カラオケ／グッズ／購入履歴／プロフィールへのハブ）   |
| `/mypage/entry-tickets`, `/mypage/entry-tickets/[ticketId]`, `.../qr`                                | 入場チケット一覧・詳細・QR表示                                         |
| `/mypage/karaoke`, `/mypage/karaoke/[reservationId]`, `.../qr`                                       | カラオケ予約一覧・詳細・QR表示                                         |
| `/mypage/goods`, `/mypage/goods/[goodsItemId]`                                                       | グッズ引換一覧・詳細（QRなし）                                         |
| `/mypage/orders`, `/mypage/orders/[orderId]`                                                         | 購入履歴・注文詳細                                                     |
| `/mypage/profile`                                                                                    | プロフィール（表示名変更）                                             |
| `/staff`, `/staff/check-in`, `/staff/karaoke`                                                        | スタッフ向け当日受付（デモ・権限チェックなし・フッターからリンクあり） |
| `/admin`, `/admin/orders`, `/admin/orders/[orderId]`                                                 | 運営者向け簡易管理画面（参照とFull Refundのみ・権限チェックなし）      |
| `/admin/karaoke`, `/admin/karaoke/new`, `/admin/karaoke/[slotId]`                                    | カラオケ予約枠の一覧・一括生成・編集（価格変更／販売停止・再開／削除） |

## 4. 状態モデル

正式仕様書に合わせて、以下の状態モデルを実装しています。

- **Order（070準拠、7状態）**: `PREPARED`（作成中）→`AWAITING_PAYMENT`（支払い待ち）→`CONFIRMED`（確定）／`PAYMENT_FAILED`（決済不成立確定）／`CANCELED`（取消）／`EXPIRED`（期限切れ）／`REVIEW_REQUIRED`（確認待ち）
- **Entitlement（080準拠、4状態）**: `VALID`／`USED`／`CANCELED`／`EXPIRED`（入場チケット・カラオケ予約・グッズ引換に共通）
- **Karaoke Slot（090準拠、4状態）**: `AVAILABLE`／`HELD`（仮押さえ中）／`SOLD`（売り切れ、再販売は行わない）／`SALES_STOPPED`（運営による販売停止）
- **Refund Record（070準拠）**: `REQUESTED`／`PENDING`／`SUCCEEDED`／`FAILED`／`REVIEW_REQUIRED`（Order状態には含めない独立したライフサイクル）

### カラオケHold機構（090準拠、簡略化して模擬）

- 注文作成（PREPARED）時に対象Slotを`AVAILABLE`→`HELD`にAll-or-Nothingで変更（複数枠が同時にカートにある場合、1つでも確保できなければ注文自体を作成しない）
- Hold有効期限は**45分**（`hold_acquired_at + 45分`）。期限を過ぎると自動的に`AVAILABLE`へ解放される
- 決済手続き開始（カード／コンビニ選択）時点から**30分**を支払期限（Payment Deadline）とし、Hold期限までの5分をSafety Bufferとして確保する
- 期限切れの自動解放・Order失効は5秒間隔のポーリングで模擬（Exclusive Scopeの明示的なモデル化は行っていません）

## 5. 動作確認手順

以下の順に操作すると、購入フローの主要パターンを一通り確認できます。

### 5-1. ログイン・新規登録（モック）

1. ヘッダー右の「ログイン」（`/account/login`）を開き、任意のメールアドレスとパスワード（12〜128文字、SEC-AUTH-016）を入力して「ログイン」
   - 実際の認証は行いません。バリデーションを満たせばログイン状態になります。
2. 「新規登録はこちら」（`/account/register`）からは、表示名・メール・パスワードを入力 →「確認メールを送信しました」画面 →「（デモ）メール内のリンクをクリックした想定にする」でログイン、という一連の流れも確認できます。
3. 「パスワードを忘れた方」（`/account/password-reset`）では、再設定メール送信画面 →完了画面（モック）を確認できます。

### 5-2. 商品選択 → カート → 注文作成（Hold取得）

1. ヘッダーの「入場」「カラオケ」「グッズ」からそれぞれの一覧を開く
2. **入場チケット・グッズ**: 一覧から詳細へ進み「カートに追加」を押す（グッズは数量選択可、在庫0の商品は「在庫切れ」表示になります）
3. **カラオケ**: Sales Guide（`/karaoke`）で日付を選ぶ → Day Schedule（`/karaoke/schedule/[date]`）で1時間単位の空き状況（◎○△×）からいずれかをクリック → Slot Detail（`/karaoke/slots/[slotId]`）で具体的な15分枠を選んで「この枠をカートに追加」
4. ヘッダーの「カート」を開き、数量変更・削除ができることを確認（カラオケ枠は1枠固定）
5. 「購入手続きへ進む」を押すと**注文が作成され、この時点でカラオケ枠のHoldが取得されます**（状態は`PREPARED`）。管理画面（`/admin/karaoke`）で対象枠が「確保中」になっていることを確認できます

### 5-3. カード決済（成功パターン）

1. 決済手段選択画面で「クレジットカード」を選び「次へ進む」
2. カード番号はデフォルトの `4242 4242 4242 4242` のまま「支払う」を押す
3. 「決済結果を確認しています…」のあと、Purchase Status画面（`CONFIRMED`）に遷移し、発行された権利（電子チケット等のダミーコード）が表示されることを確認

### 5-4. カード決済（失敗 → 同一注文内で再試行パターン）

1. 別の商品でもう一度購入手続きに進み、「クレジットカード」を選択
2. カード番号を `4000 0000 0000 0002` に書き換えて「支払う」
3. 失敗画面に遷移することを確認（070 PAY-FLR-006: 個別のカード拒否ではOrderを失敗確定にせず、`AWAITING_PAYMENT`のまま維持）
4. 「お支払い方法を選び直す」から、同一注文のまま再度支払いに進めることを確認

### 5-5. コンビニ払い

1. 決済手段選択画面で「コンビニ払い」を選択（カラオケ枠がある場合はHold期限に関する注意文が表示されます）
2. 「支払い番号を発行する」を押すと、支払い番号と支払期限が表示される（この時点では決済は未確定＝処理中）
3. 「入金完了を受信した想定にする」を押すと決済が確定しPurchase Status画面（`CONFIRMED`）に遷移することを確認
   - 「期限切れ・未入金として扱う」を押すと、Order状態が`PAYMENT_FAILED`ではなく`EXPIRED`になり、Holdが解放されることを確認できます

### 5-6. 注文の取消は運営操作のみ（070 PAY-ORD-001準拠）

1. `/mypage/orders/[orderId]` を開くと、利用者向けの取消ボタンは表示されず「この注文は運営操作のみで取消可能です」と案内されることを確認できます
2. `CONFIRMED`済みの注文を取り消したい場合は、運営管理画面（`/admin/orders/[orderId]`）からの返金（Refund）操作のみが手段になります（5-9参照）

### 5-7. マイページでの確認

1. ヘッダーの「マイページ」を開くと、入場／カラオケ／グッズ／購入履歴／プロフィールへのハブ画面が表示される
2. 「入場チケット」「カラオケ予約」はそれぞれ別画面（`/mypage/entry-tickets`, `/mypage/karaoke`）に分かれており、QRコード（モック表示）も入場用・カラオケ用で別ページとして区別されます
3. 「購入履歴」から、注文ごとの状態・決済の試行履歴（Checkout Attempt、失敗も含め1注文に複数件記録されること）を確認できる
4. 「プロフィール」から表示名を変更できる

### 5-8. スタッフ向け当日受付

1. フッターの「スタッフ向け受付（デモ）」から `/staff` を開く（権限チェックは行っていません）
2. 「入場受付」を開くと、保有チケットのコードを選択して照会・受付できる
   - 使用済みチケットの再照会は「使用済みです」と表示され、二重利用が防止されることを確認できる
   - カラオケ予約のコードを入場受付に照会すると「入場チケットではありません」と拒否されることを確認できる（Purpose不一致）
3. 「カラオケ受付」を開くと、予約者・利用日・利用時間が表示され受付できる。**Check-in windowは`[利用開始10分前, 利用終了時刻)`の半開区間**で、時間外は受付自体が完全にブロックされます（090 KRK-CHK-003/004準拠。以前の「警告のみ」から変更）

### 5-9. 運営者向け簡易管理画面

1. フッターの「運営者向け管理画面（デモ）」から `/admin` を開く（権限チェックは行っていません）
2. 「注文管理」を開くと、この端末で作成した注文の一覧・検索、Checkout Attempt履歴、発行済みの権利が確認できる
3. 各注文の詳細から、状態に応じて次のいずれかの操作ができます（130 ADM-ORD-001: Order Stateを直接変更するgeneric state editorは提供しません）
   - `PREPARED`／`AWAITING_PAYMENT`／`REVIEW_REQUIRED`: 「強制取消」で`CANCELED`にできる
   - `CONFIRMED`: 理由を入力して「返金」（Full Refund）を実行できる。返金するとEntitlementはすべて`CANCELED`になりますが、**カラオケ枠は再販売されず`SOLD`のまま維持されます**（090 §16準拠）。すでに使用済み（`USED`）のEntitlementが1件でもある場合は返金できません

### 5-10. カラオケ枠管理

1. `/admin` の「カラオケ枠管理」から `/admin/karaoke` を開くと、日付ごとに全枠が一覧表示される
2. 「予約枠を一括生成」から、日付・開始/終了時刻・利用時間・整備時間・価格を入力して「プレビュー」を押すと、生成される枠の一覧（Window終了時刻を超える不完全なサイクルは生成されません）が表示され、「この内容で作成する」で確定できる
   - 生成した新しい日付は `/karaoke` の日付タブに自動的に反映されることを確認できる
3. 一覧から枠を選ぶと詳細・編集画面（`/admin/karaoke/[slotId]`）が開き、価格変更・販売停止/再開・削除ができる
   - `HELD`（確保中）／`SOLD`（売り切れ）の枠は編集・削除ができません（090 §19 KRK-EDT-004/006準拠）
   - 「販売停止」にした枠は購入ページで購入できなくなることを確認できる

---

## 6. 参照した仕様書

このモックのページ構成・状態モデル・注意書き文言は、リポジトリ内の [`Requirements/main_req`](../../Requirements/main_req) にある正式要求仕様書一式と、[`Requirements`](../../Requirements) 直下の決済領域の検討メモに基づいています。

| ファイル                                                                                                   | 内容                                                                                       |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [`010-system-overview.md`](../../Requirements/main_req/010-system-overview.md)                             | システム概要仕様。技術スタック(Next.js / Hono / Supabase 等)、Domain構成の根拠             |
| [`040-user-flows.md`](../../Requirements/main_req/040-user-flows.md)                                       | ユーザーフロー仕様。購入・受付等の一連の操作フローの根拠                                   |
| [`050-page-screen-specification.md`](../../Requirements/main_req/050-page-screen-specification.md)         | 画面仕様。URL namespace、Order State別UI(PG-XFN-001)の根拠                                 |
| [`060-authentication-authorization.md`](../../Requirements/main_req/060-authentication-authorization.md)   | 認証認可仕様。パスワード桁数(SEC-AUTH-016)、Continuation Intent(AR-CONT-001/003)の根拠     |
| [`070-order-payment-specification.md`](../../Requirements/main_req/070-order-payment-specification.md)     | Order/Payment仕様。Order 7状態、Checkout Attempt、Refund Recordの根拠                      |
| [`080-ticket-qr-checkin-specification.md`](../../Requirements/main_req/080-ticket-qr-checkin-specification.md) | チケット/QR/Check-in仕様。Entitlement 4状態、Check-in outcome分類の根拠                |
| [`090-karaoke-reservation-specification.md`](../../Requirements/main_req/090-karaoke-reservation-specification.md) | カラオケ予約仕様。Karaoke Slot 4状態、Hold機構、Check-in windowの根拠              |
| [`130-admin-staff-specification.md`](../../Requirements/main_req/130-admin-staff-specification.md)         | 管理者/スタッフ仕様。Order操作カタログ(参照とFull Refundのみ)の根拠                        |
| [`payment-spec-decision-items.md`](../../Requirements/payment-spec-decision-items.md)                      | 決済領域の検討事項・決定事項一覧(DEC-A〜DEC-P)                                             |
| [`change-requests-spec070.md`](../../Requirements/change-requests-spec070.md)                              | 070への変更要求一覧。CR-070-001〜003(status: open)は本モックでも既存決定を優先             |

画面上の「PAY-040」「DEC-B-01」「KRK-HLD-001」等の表記は、上記仕様書内の該当項目を指しています。

### 正式仕様と異なる（既存決定を優先した）項目

`payment-spec-decision-items.md` / `change-requests-spec070.md` に記載のとおり、以下3件は正式仕様（070）ではなく既存決定を優先しています（CR-070-001〜003、いずれもstatus: open）。

- **複数Domain商品の同一カート購入を許可**（DEC-B-04維持。070 PAY-ORD-004「Order Purposeは単一値」には従わない）
- **注文の取消は運営操作のみ**（DEC-B-03維持。070 §27の利用者自身によるセルフキャンセルには従わない）
- **コンビニ払いに対応**（DEC-D-01系維持。070はカード決済のみをCanonicalとしている）

## 7. 実装範囲・含まれないもの

このモックは**フロントエンドの画面遷移の確認**を目的としており、以下は含みません。

- 実際の決済処理（Stripe連携）、実際の課金
- サーバーAPI（Hono）、データベース（Supabase PostgreSQL）
- 実際の認証（Supabase Auth）、実際のメール送信（Resend）
- 管理画面・スタッフ画面の権限チェック（Role / Capability）、ロール割当管理画面
- 実際のカメラによるQR読み取り（コード入力・一覧選択で代替）。QR Payload形式（`r39x1.<purpose>.<token>`）も簡略化した独自コードのまま
- Karaoke Slotの Exclusive Scope の明示的なモデル化（同一時間帯の重複押さえ禁止ロジック自体は保持）
- お知らせ機能（`/announcements`）、Not Found/Access Denied専用ページ
- 部分返金、Sales Configuration（価格を枠から分離する仕組み）等、管理画面のさらなる拡充

状態はすべてブラウザの `localStorage` に保存されるクライアントサイドのみの実装です。別のブラウザ・別の端末とは状態を共有しません。ブラウザのサイトデータを削除するか、シークレットウィンドウを使うと、まっさらな状態からやり直せます。

## 8. 困ったときは

- 状態がおかしくなった場合は、ブラウザの開発者ツールで `localStorage` の `off-r39x-payment-mock:v4` キーを削除するか、サイトデータを消去してリロードしてください。
- ポート3000が使用中の場合は `pnpm dev -- -p 3001` のように別ポートを指定してください。
