---
title: "SPEC-070への変更要求 一覧"
status: "change-request（正式仕様ではない。SPEC-070への反映は別途実施）"
target_spec: "070-order-payment-specification.md (SPEC-070)"
purpose: "payment-spec-decision-items.mdのレビューでSPEC-070との矛盾が判明した決定について、既存決定を維持する方針としたものをSPEC-070側への変更要求としてまとめる。管理ファイル数削減のため単一ファイルに集約。"
generated: "2026-09-07"
updated: "2026-09-07"
requests:
  - id: CR-070-001
    title: 複数Domain混在Orderの許容
    origin: payment-spec-decision-items.md DEC-B-04
    status: open
  - id: CR-070-002
    title: Order取消は運営操作のみに限定
    origin: payment-spec-decision-items.md DEC-B-03
    status: open
  - id: CR-070-003
    title: コンビニ払い(Konbini)対応の追加
    origin: payment-spec-decision-items.md DEC-D-01 / DEC-C-04 / DEC-D-01b / DEC-D-07
    status: open
---

# SPEC-070への変更要求 一覧

`payment-spec-decision-items.md`のレビュー（SPEC-070との突き合わせ）で判明した矛盾のうち、既存決定（Decision Log）を維持し、SPEC-070側の変更を求める方針となったものをここに集約する。

各要求のステータス（`open` / `reflected`）は先頭のfrontmatterおよび各章冒頭に記載する。SPEC-070へ実際に反映された時点で`reflected`に更新すること。

---

## CR-070-001: 複数Domain混在Orderの許容

**ステータス:** open
**対象:** `070-order-payment-specification.md` `PAY-ORD-004` ほか関連箇所
**起点:** `payment-spec-decision-items.md` `DEC-B-04`

### 背景・問題提起

`PAY-ORD-004`は、Order Purposeを作成時に`ENTRY_TICKET_PURCHASE`/`KARAOKE_PURCHASE`/`GOODS_PURCHASE`のいずれか1つに確定し、以後変更しないと定めている（1 Order = 1 Purpose、単一Domain前提）。

一方`DEC-B-04`では、UX上の理由（SYS-081「共有注文基盤」に基づく単一カート・単一決済フロー）から、1つのOrderに入場チケット・カラオケ・グッズを混在させるカート機能を許可することを決定していた。**単一Domain強制は、利用者が複数種別の商品を購入する際に複数回の購入操作（複数回のCheckout、複数回のカード情報入力）を強いることになりUXを著しく損なうため、SPEC-070側を複数Domain混在Orderを許容する方向へ変更することを求める。**

### 要求内容

Order Purposeを「Order単位の単一値」から「Order Item単位の値の集合」へ再定義し、1つのOrderが複数のPurpose（Domain）のOrder Itemを同時に含むことを許容する。

### 影響を受けるSPEC-070の箇所と変更方向（提案）

| 箇所                                     | 現状                                                             | 変更方向（提案）                                                                                                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PAY-ORD-004`（§7）                      | Order Purposeは作成時に1つに確定                                 | 「Order Item PurposeはOrder Item作成時に…のいずれか1つとして確定し、以後変更しない。1つのOrderは複数のOrder Item Purposeを含んでよい」に改める                                 |
| §2 適用範囲                              | Order Purpose 3種として記述                                      | 「Order Item Purpose」という粒度に用語を統一し、1 Orderが複数Purposeの組み合わせを含み得る旨を明記                                                                             |
| §9 共通Purchase start sequence 手順5     | 「必要なEntry/Goods AllocationまたはKaraoke Holdを排他的に成立」 | 全Order ItemのHold取得が単一DBトランザクション内でAll-or-Nothingであることを明文化する新Rule（例: `PAY-CHK-014`）を追加                                                        |
| §22〜24 Entry/Karaoke/Goods confirmation | Order単位でPurpose別の確定条件を記述                             | Order Item単位で確定条件を評価する形に再構成。すべてのDomain効果が同一Transaction境界で一貫して成立することを要求し、部分確定を禁止（`PAY-CFM-004`の原則を複数Domain間へ拡張） |
| §35 Refund scope                         | `CONFIRMED` Orderに対するfull refundのみ                         | 複数Domain混在時の返金単位を明確化（暫定案: 引き続きOrder全体に対するfull refundのみ。item-level refundの要否は別途検討）                                                      |
| §51 Traceability表                       | 単一Purpose前提                                                  | Order Item Purpose粒度への変更に合わせて更新                                                                                                                                   |

### 保持すべきInvariant・既存決定との整合

- `INV-PRJ-011`（No Double Sale）は複数Domain間でも一貫して保証する。Checkout Session作成時の全Order ItemのHold取得を単一DBトランザクション内でAll-or-Nothingとする（`DEC-F-04`踏襲）。いずれか1つのDomainでもHold取得に失敗した場合は、取得済みの全Holdをロールバックし、Checkout Session作成自体を失敗させる。
- `INV-PRJ-010`（Financial Traceability）、`INV-PRJ-013`（Server-side Authorization）等の既存Invariantを弱化しない。

### 未決定事項（別途検討）

- 複数Domain混在Orderにおける返金単位（Order全体 vs Domain単位のitem-level refund）
- 一部Domainのみ`REVIEW_REQUIRED`となった場合のConsistency Review Caseの扱い
- SPEC-040/SPEC-050側で複数Domain混在カートのUI/UXフローが定義されているかの確認

---

## CR-070-002: Order取消は運営操作のみに限定

**ステータス:** open
**対象:** `070-order-payment-specification.md` §27 支払前の明示cancel ほか関連箇所
**起点:** `payment-spec-decision-items.md` `DEC-B-03`

### 背景・問題提起

SPEC-070 §27「支払前の明示cancel」は、Owner authorizationを通過した利用者自身が、支払い前（`PREPARED`/`AWAITING_PAYMENT`）のOrderに限りセルフキャンセルできると規定している。

一方`DEC-B-03`では、不正・誤操作対応のフローを単純化する判断から、支払い前・支払い完了後を問わずOrder取消は運営操作のみとし、利用者自身による取消は一切許可しないと決定していた。**本要求ではDEC-B-03の判断（運営のみによる取消）を維持し、SPEC-070側を元の方針に戻すことを求める。**

### 要求内容

§27「支払前の明示cancel」を削除、または「Order取消は運営操作のみとし、利用者自身による取消（支払い前を含む）は提供しない」という内容に置き換える。

### 影響を受けるSPEC-070の箇所と変更方向（提案）

| 箇所                               | 現状                                                                   | 変更方向（提案）                                                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| §27 支払前の明示cancel（本文全体） | 利用者自身による明示cancelの手順を規定                                 | 章ごと削除し、「Order取消（支払い前・支払い後を問わず）は運営操作のみとし、利用者自身による取消は提供しない」という一文に置き換える |
| §25 Failure分類の表                | 「Customerが支払前に明示cancel」の行を`CANCELED`への通常結果として記載 | 利用者起点cancelの行を削除し、`CANCELED`への遷移経路を運営操作のみに一本化                                                          |
| §36 Refund authorization           | 運営操作としての返金認可条件（変更なし）                               | 変更不要。本要求は支払い前のcancelのみが対象                                                                                        |
| §51 Traceability表                 | 利用者起点cancelを含む可能性                                           | 削除に合わせてTrace記述を更新                                                                                                       |

### 保持すべきInvariant・既存決定との整合

- `INV-PRJ-013`（Server-side Authorization）: 取消操作自体は引き続きサーバー側で認可・保護される。運営操作限定という制約自体はこのInvariantと矛盾しない。
- Payment Deadline経過による自動`EXPIRED`遷移（§28）は本要求の対象外であり変更しない。利用者はCheckoutから離脱すればPayment Deadline経過により自動的に`EXPIRED`となる。

### 未決定事項（別途検討）

- 利用者がセルフキャンセルできないことによるUX上の影響（Payment Deadlineまで待たせることになる点）。必要なら運用側からの取消依頼導線（問い合わせ等）を別途用意するか。
- SPEC-040/SPEC-050側にセルフキャンセルのUI/UXフローが既に定義されているかの確認。

---

## CR-070-003: コンビニ払い(Konbini)対応の追加

**ステータス:** open
**対象:** `070-order-payment-specification.md` §2, §8, §11, §15, §19, §37 ほか関連箇所
**起点:** `payment-spec-decision-items.md` `DEC-D-01` / `DEC-C-04` / `DEC-D-01b` / `DEC-D-07`
**参考:** `stripe-technical-reference.md` 4.3節（コンビニ払いの返金）

### 背景・問題提起

SPEC-070 §2は「本仕様のStripe Checkoutはcard paymentのみをCanonicalとする」と定め、Payment Method追加を「Payment failure/pending/refund semanticsへの影響を確認する仕様変更」として明示的に別扱いにしている。

一方`DEC-D-01`ではクレジットカードに加えコンビニ払いへの対応を、一般参加者への配慮を理由に決定していた。（本オフ会への参加者の年齢層からカード払いのみの場合決済手段がない可能性があるため）  
`DEC-C-04`/`DEC-D-01b`ではコンビニ払い選択時のCheckout Session長期有効化とHold長期化リスクの受容、`DEC-D-07`ではカテゴリ単位の無効化トグルという緩和策まで設計していた。**本要求ではコンビニ払い対応を維持し、SPEC-070が要求する「影響確認を伴う正式な仕様変更」として必要な変更点を整理する。**

### コンビニ払い固有の技術的特性（前提）

- オーソリを持たず、Checkout Session自体は利用者が選択した時点で「complete」扱いになり得るが、実際の入金（`payment_status`が`paid`）は数時間〜数日遅延する。
- Stripeはこの遅延支払いを`checkout.session.async_payment_succeeded` / `checkout.session.async_payment_failed`という専用イベントで通知する。`checkout.session.completed`単体では支払い成立を判定できない。
- 返金は同期的に完了せず、顧客の銀行口座情報を非同期に収集する必要がある。Stripe側の状態は`requires_action`→`pending`→`succeeded`/`failed`という多段階の非同期state machineをたどる。
- 金額上限（¥120〜¥300,000程度、要公式確認）、chargebackが存在しない等の制約がある。

### 要求内容

SPEC-070のCanonical Payment Methodにコンビニ払いを追加し、上記の非同期特性をCheckout/Webhook/Refund関連の各Ruleに反映する。

### 影響を受けるSPEC-070の箇所と変更方向（提案）

| 箇所                                        | 現状                                                          | 変更方向（提案）                                                                                                                                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| §2 適用範囲                                 | 「card paymentのみをCanonicalとする」                         | 「card payment / コンビニ払い（Konbini）をCanonicalとする」に変更し、両者で異なるsemanticsを持つ旨を明記                                                                                                                 |
| §8 Stripe Payment構成                       | 「Payment Methodはcardのみ」                                  | 「Payment Methodはcard / konbini」に変更                                                                                                                                                                                 |
| §11 Checkout Session lifetime               | 「作成成功時点から30分」（一律）                              | 決済手段別に分岐: card=30分、konbini=Stripeのバウチャー有効期限（デフォルト数日間）に合わせて長時間有効。Payment Deadlineも決済手段別に算出                                                                              |
| §15 Canonical Stripe Event set              | 5種（`checkout.session.completed`/`expired`/`refund.*`）      | `checkout.session.async_payment_succeeded` / `checkout.session.async_payment_failed`を追加。konbini選択時はこの2イベントを正式なBusiness Confirmationのトリガーとして扱うRuleを追加                                      |
| §19 Checkout success correlation/validation | `payment_status`が`paid`であることを検証条件に含む            | konbini経由の場合、`checkout.session.completed`受信時点で`payment_status`が`unpaid`であることを正常系として許容し、`checkout.session.async_payment_succeeded`受信をもって最終Business Confirmationへ進める分岐Ruleを追加 |
| §20 `checkout.session.expired`              | 変更なし                                                      | konbini選択時のPayment Deadlineが数日間に及ぶことを踏まえ、expiry判定が決済手段別Payment Deadlineに従う旨を明記                                                                                                          |
| §37 Refund Record state                     | `REQUESTED`→`PENDING`→`SUCCEEDED`/`FAILED`、`REVIEW_REQUIRED` | 構造は概ね吸収可能。`REQUESTED`→`PENDING`が顧客の銀行口座情報収集という追加の非同期ステップを経る旨、カード返金より`PENDING`滞留期間が大幅に長くなり得る旨を注記追加                                                     |
| §38 Refund precondition                     | 変更なし                                                      | konbini決済の金額上限を超えるOrderの扱いを別途確認（現状Order側の金額上限は未規定）                                                                                                                                      |
| Part VIII 全般（Refund）                    | —                                                             | konbini返金の長期`PENDING`推移を前提とした監視・Alert設計が必要（`SPEC-150`/`SPEC-160`への入力として記録）                                                                                                               |

### 保持すべき既存の緩和策

- カラオケ枠等の排他的・数量限定商品でkonbini選択時にHoldが長期化するリスクは、`PRJ-190`に対する正当な逸脱として受け入れ、SPEC-070改訂にもその旨を明記する（`DEC-C-04`/`DEC-D-01b`踏襲）。
- 商品カテゴリ単位でkonbini提供可否を切り替えられる無効化トグルを運用上の緩和策として維持する（`DEC-D-07`踏襲）。初期値は全カテゴリでkonbini許容。

### 未決定事項（別途検討）

- konbini決済の金額上限とOrder金額の整合チェックをどこで行うか。
- `SPEC-150`/`SPEC-160`側でkonbini返金の長期`PENDING`状態に対する監視・Alert閾値をどう設計するか。
- `stripe-technical-reference.md` 7章で未確認事項として残していたコンビニ払いの返金手数料の正式確認。

---

## 次のアクション（提案、全要求共通）

1. CR-070-001〜003の内容についてSPEC-070の記述を正式に更新する（編集主体を確認）。
2. 更新後、`payment-spec-decision-items.md`側の該当DECの追記を「SPEC-070へ反映済み」のステータスに更新し、本ファイルの各要求のステータスも`reflected`に更新する。
3. 各要求の「未決定事項」は、対応する下流仕様（SPEC-040/050/150/160）またはStripe公式ドキュメントの追加調査で解消する。


---

## payment-*.md側をSPEC-070に合わせて修正した項目（参考記録）

CR-070-001〜003（既存決定を維持しSPEC-070へ変更を求めるもの）とは逆に、以下は`payment-*.md`側をSPEC-070の内容に合わせて修正した項目。矛盾ではなく設計の精緻化にあたるため「変更要求」ではないが、SPEC-070との突き合わせ経緯を一元管理するため本ファイルに記録する。詳細は`payment-spec-decision-items.md`の該当DECおよび`payment-technical-requirements-memo.md`のOpen Issuesを参照。

| 項目 | 修正内容 | 対応するSPEC-070箇所 | 記載箇所 |
|---|---|---|---|
| 購読Webhookイベント | `DEC-D-02`を5種（`checkout.session.completed`/`expired`/`refund.created`/`updated`/`failed`）に修正。`payment_intent.payment_failed`は非採用 | §15 Canonical Stripe Event set | `payment-spec-decision-items.md` DEC-D-02、`payment-technical-requirements-memo.md` OPEN-PAY-003 |
| Order/Payment状態モデル | `DEC-B-01`をOrder State 7状態（`PREPARED`〜`REVIEW_REQUIRED`）に修正。`DEC-C-01`をPayment単体の状態モデルを持たずRefund Stateのみで管理する方針に修正 | §6 Order State、§37 Refund Record state | `payment-spec-decision-items.md` DEC-B-01, DEC-C-01、`payment-technical-requirements-memo.md` OPEN-PAY-004 |
| 返金の各Domain連動 | `DEC-H-03`（全自動連動）に対し、SPEC-070は金融的Refund成功とDomain側取消を別Operationとして扱いConsistency Review Caseへ送る設計であることを注記 | §35〜41 Refund | `payment-technical-requirements-memo.md` OPEN-PAY-009（`DEC-H-03`自体は未修正、注記のみ） |
| 1 Order:N Payment物理モデル | `DEC-C-02`に、SPEC-070が"Checkout Attempt"という論理単位を採用しており物理テーブル設計はSPEC-100着手時に確定する旨を注記 | §12, §30 Idempotency表 | `payment-spec-decision-items.md` DEC-C-02 |

## チーム内議論待ちの項目（参考記録）

SPEC-070との突き合わせの過程で、SPEC-070側の矛盾ではないが即断できないと判断し、チーム内議論に回した項目。対応する`payment-spec-decision-items.md`側の記載箇所: 末尾「OPEN-PAY-020 詳細検討」、`DEC-E-02`。

### OPEN-PAY-020: Stripe Idempotency-Keyの発行単位

**論点:** Checkout Session作成等のStripe API呼び出しに使うIdempotency-Keyを、(A) Order作成時に発行したKeyをすべてのCheckout Attemptで使い回すか、(B) Checkout Attemptごとに新規Keyを発行するか。

**前提となるStripeの挙動:**

- 同じKey＋同じRequestパラメータで再送 → Stripeはキャッシュされた元のレスポンスをそのまま返す。
- 同じKey＋異なるRequestパラメータで送信 → Stripeはエラーを返す（同じKeyが異なるパラメータで再利用されたと判定）。

#### 案A: Order作成時のKeyをすべてのCheckout Attemptで使い回す（DEC-E-02の当初案）

**メリット**

- 実装がシンプル。Order作成時に1つKeyを発行すれば、以降すべてのCheckout Session作成呼び出しで同じ値を渡すだけで済み、Attempt単位のKey管理機構が不要。
- 同一Attemptに対するTimeout・Network Loss等による再送（SPEC-070 `PAY-CHK-008`が想定するケース）には正しく機能する。Stripeが同じレスポンスを返すため、二重Session作成を防げる。
- NFR-401（冪等性品質）が要求する「クライアント生成Idempotency Key」という単純な1本の線をOrder〜Payment全体で保てる。

**デメリット**

- SPEC-070 `PAY-CHK-010`のケース（最初のAttempt結果が「作成されていない/再利用不能」と確定し、同一Orderへ新しいCheckout Attemptを作成してよい場合）で問題が起きる。新しいAttemptでも同じKeyを使い回すと、Stripeは「これは前回と同じRequestだ」と判断し、新しいSessionを作らずキャッシュされた古いSession（既に無効/再利用不能と判断したもの）を返してしまう可能性がある。これはPAY-CHK-010が意図する「新しいSessionを正規に作る」という挙動を壊す。
- 新しいAttemptのRequestパラメータが（例えばsuccess_urlのトークン部分等で）前回と微妙に異なる場合、Stripeは「同じKeyが異なるパラメータで使われた」としてエラーを返す可能性があり、正規のリトライ処理自体がAPIエラーで止まるリスクがある。
- Attempt単位でのKeyがないため、監査・デバッグ時に「どのAttemptがどのStripe呼び出しに対応するか」をKeyから追跡しづらい。

#### 案B: Checkout Attemptごとに新規Keyを発行する

**メリット**

- SPEC-070のBusiness Cause粒度（`(Order, Checkout Attempt)`）と1対1で対応する設計になり、`PAY-CHK-008`（同一Attemptの再送は同じKeyで回復）と`PAY-CHK-010`（新しいAttemptは新しいKeyで正規に新規Session作成）の両方を自然に満たせる。
- 新しいAttemptのRequestパラメータが前回と異なっても、Keyも新しいためStripe側のパラメータ不一致エラーが発生しない。
- Attempt単位でKeyを保存すれば、監査・障害調査時にAttempt→Stripe呼び出しの対応関係が明確になる（Financial Traceabilityの観点でも有利）。

**デメリット**

- 「これは同一Attemptの再送（既存Keyを使う）か、新しいAttempt（新しいKeyを発行する）か」を正しく判定するロジックが別途必要になり、実装がやや複雑になる。
- この判定ロジック自体にバグがあると、本来同一Attemptの再送であるべき呼び出しに誤って新しいKeyを割り当ててしまい、NFR-501/502が要求する「Timeout/Retry時の二重作成防止」が効かなくなるリスクがある（重複防止のための機構が、その境界判定ミスで逆に無効化される）。
- Attempt単位でKeyを保存するテーブル設計（SPEC-100側）が必要になり、案Aより設計・実装コストがわずかに高い。

#### 参考所見（決定するものではない）

SPEC-070自体が「Checkout Attempt」を独立したBusiness Causeとして扱う設計であること、また`PAY-CHK-010`が明示的に「新しいCheckout Attemptを同一Orderへ作成してよい」ケースを想定していることを踏まえると、案Bの方がSPEC-070の設計思想と整合しやすい。ただし、案Aでも「同一Attemptの再送」しか実際には発生しない（`PAY-CHK-010`のケースが実運用上ほぼ起きない）という前提であれば、実装のシンプルさを優先して案Aを採用する余地もある。

**次のアクション:** チーム内で議論の上、案A/案Bいずれかを決定し、`DEC-E-02`を正式に確定させる。決定後、SPEC-100（Data Model）のCheckout Attemptテーブル設計への入力とする。
