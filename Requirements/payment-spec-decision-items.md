---
title: "決済システム仕様策定 検討事項リスト"
purpose: "正式なORD/PAY仕様（Requirements内 000〜030 の後続）を作成するにあたり、事前に決定・確認が必要な論点を抽出したもの"
status: "draft-checklist（決定事項ではない）"
based_on:
  - payment-technical-requirements-memo.md
  - 000-project-constitution.md (PRJ)
  - 010-system-overview.md (SYS)
  - 020-glossary-domain-language.md (GLO)
  - 030-non-functional-requirements.md (NFR)
generated: "2026-09-06"
---

# 決済システム仕様策定 検討事項リスト

`payment-technical-requirements-memo.md` のOpen Issues（OPEN-PAY-001〜012）を土台に、正式な `ORD`（注文）・`PAY`（決済/返金）仕様を書き起こす際に決めておくべき論点を、カテゴリ別に洗い出したもの。

各項目には以下を付す。

- **論点**: 決めるべきこと
- **なぜ必要か**: 関連する既存仕様（PRJ/SYS/GLO/NFR）上の根拠・制約
- **優先度**: `高`=状態モデルやDB設計の前提になり後回しにすると手戻りが大きいもの／`中`=実装前には要るが他の決定を待てるもの／`低`=運用開始までに決めれば良いもの
- **影響仕様**: 主にどのAuthority仕様に反映されるか

決定した内容は `Decision Log`（`DEC-ORD-xxx` / `DEC-PAY-xxx`）として、正式仕様側に記録することを想定。

---

## A. 仕様の切り分け・Authority境界

| ID | 論点 | なぜ必要か | 優先度 | 影響仕様 |
|---|---|---|---|---|
| A-01 | `ORD`（注文）と`PAY`（決済/返金）を別ファイルとして作成するか、1本にまとめるか | PRJ-011「1 Chat = 1 Spec File」の原則、PRJ-021「概念ごとに1つのAuthority」に従うため、着手前に切り分けを決める必要がある | 高 | ORD, PAY |
| A-02 | Order ItemとProduct（商品）／各Domain Resource（Event Ticket, Karaoke Slot, Goods）との対応関係をどこまで`ORD`で確定するか | GLO-402「ProductとDomain Resourceを自動同一視しない」。responsibility境界を明確にしないと各Domain仕様と重複定義するリスクがある | 高 | ORD, Product/Catalog, TKT, KAR, GDS |
| A-03 | 「Hold（一時保護）」の管理主体をOrder側に置くか、Karaoke/Goods等の各Domain側に置くか | GLO-801でReservationとHoldは別概念と定義済みだが、Hold自体の管理責任（Authority）は未確定 | 高 | ORD, KAR, GDS |

---

## B. Order状態モデル

| ID | 論点 | なぜ必要か | 優先度 | 影響仕様 |
|---|---|---|---|---|
| B-01 | Orderの状態一覧（例: 作成済み/決済待ち/決済完了/キャンセル済み/期限切れ 等）とその名称 | PRJ-073「許可された状態遷移を明示」、GLO-023「状態名と概念名を分離」に従い、具体Enumを確定する必要がある | 高 | ORD |
| B-02 | Order作成から Checkout Session発行までに許容する経過時間（Orderが「未着手のまま放置」された場合の扱い） | INV-PRJ-001（購入情報を失わない）と両立しつつ、不要なOrderが在庫Holdを占有し続けないようにする必要がある | 中 | ORD, KAR, GDS |
| B-03 | Order Cancellation（注文取消）の主体・条件（利用者自身が取消可能か、運営のみか、Payment未確定時のみか） | GLO-500「Order Cancellation」を別効果として定義する必要がある | 中 | ORD |
| B-04 | 1つのOrderに複数種別の商品（入場チケット＋カラオケ＋グッズ）を同時に含めることを許容するか（カート機能の要否） | SYS-081「共有注文基盤」でOrder Item構造は`ORD`委譲とされている。UXにも影響する重要な意思決定 | 高 | ORD, Product/Catalog |
| B-05 | Order作成時点でのUser認証要件（未認証でOrderを仮作成できるか、必ず認証済みである必要があるか） | PRJ-091, SYS-091を踏まえ、購入開始のUXとIdentity要件をすり合わせる必要がある | 中 | ORD, IDN |

---

## C. Payment状態モデル

| ID | 論点 | なぜ必要か | 優先度 | 影響仕様 |
|---|---|---|---|---|
| C-01 | Paymentの状態一覧（例: 未処理/処理中/成功/失敗/一部返金/全額返金 等） | GLO-601「決済済みは具体的Payment Statusの意味として使用」に基づき確定が必要 | 高 | PAY |
| C-02 | 1つのOrderに対して複数回のPayment試行（失敗後の再決済等）を許容するか、その場合の内部モデル（同一Payment更新か、新規Payment作成か） | GLO-501 Order/Payment分離の原則を踏まえ、再試行時のデータモデルへ直結する | 高 | PAY, ORD |
| C-03 | 部分決済・分割払いを許容するか（当面はしないとしても明示的な決定が必要） | PRJ-034が定義しない事項に該当し、価格・決済条件の一部だが、システム設計（Payment-Order比率）に影響 | 中 | PAY |
| C-04 | Checkout Sessionの有効期限（Stripeデフォルトか、独自設定か）と期限切れ時のOrder/Hold処理 | INV-PRJ-002（二重販売防止）と両立するため、期限切れ時にHoldを確実に解放する設計が必要 | 高 | PAY, ORD, KAR, GDS |

---

## D. Stripe連携方式

| ID | 論点 | なぜ必要か | 優先度 | 影響仕様 |
|---|---|---|---|---|
| D-01 | Stripe Checkout（Hosted）を利用する前提だが、対応する決済手段（クレジットカードのみか、コンビニ払い・銀行振込等も含むか） | PRJ-060でStripe Checkoutが標準と定義されているが、具体的な決済手段の範囲は未定義 | 高 | PAY |
| D-02 | 購読する具体的なWebhookイベント種別一覧（`checkout.session.completed`, `payment_intent.succeeded`, `charge.refunded`, `checkout.session.expired` 等） | SYS-131, NFR-506でWebhook耐性は要求されているが、対象イベントは未確定（OPEN-PAY-003） | 高 | PAY |
| D-03 | Webhookが届かない場合の補完手段（定期的なStripe API Polling/Retrieveを併用するか） | NFR-505 Reconciliationの具体実装方針に関わる | 中 | PAY |
| D-04 | 消費税・価格表示方式（内税/外税、Stripe側の税計算機能利用の要否） | PRJ-154（通貨JPY）はあるが、税表示・会計処理は法務文書とも関連するため要確認 | 中 | PAY, 法務 |
| D-05 | Stripeの決済手数料の扱い（利用者負担か運営負担か。システム上金額計算への影響有無） | GLO-500 Order/Order Item金額モデルに影響 | 低 | PAY, ORD |
| D-06 | 領収書（Receipt）をStripe提供のものに一本化するか、独自領収書機能を持つか | GLO-600 Receiptは「独自領収書の法的要件や形式は別Authority」とされ未確定 | 低 | PAY, 法務 |

---

## E. 冪等性（Idempotency）設計

| ID | 論点 | なぜ必要か | 優先度 | 影響仕様 |
|---|---|---|---|---|
| E-01 | Order作成APIのIdempotency Keyをクライアント生成にするか、サーバー採番にするか | PRJ-072, NFR-401（冪等性品質）を満たす具体実装が必要（OPEN-PAY-002） | 高 | PAY, API |
| E-02 | StripeへのAPI呼び出し（Checkout Session作成等）にStripeのIdempotency-Keyヘッダーを使用するか、内部Idempotency Keyと紐付けるか | Stripe側の重複リクエスト対策とも連動させる必要がある | 高 | PAY |
| E-03 | Webhook処理の冪等性を保証する具体的な仕組み（受信済みEvent IDの記録・突合） | NFR-506「重複受信で重大副作用を重複成立させない」の実装方式 | 高 | PAY, DATA |

---

## F. Hold（一時保護）とOrder/Paymentの連携

| ID | 論点 | なぜ必要か | 優先度 | 影響仕様 |
|---|---|---|---|---|
| F-01 | Hold取得のタイミング（Order作成時か、Checkout Session作成時か） | INV-PRJ-002（二重販売防止）の実装タイミングに直結 | 高 | ORD, PAY, KAR, GDS |
| F-02 | Hold保持期間とタイムアウト時の自動解放ロジック | GLO-801「Hold中の枠を予約済みと表現してはならない」を踏まえた運用設計が必要 | 高 | KAR, GDS |
| F-03 | Payment失敗・タイムアウト時のHold解放と、Order状態遷移のタイミング整合 | 二重販売防止と利用者体験（再試行可能性）の両立が必要 | 高 | ORD, PAY |

---

## G. 決済失敗・異常系

| ID | 論点 | なぜ必要か | 優先度 | 影響仕様 |
|---|---|---|---|---|
| G-01 | Payment失敗時、同一Orderでの再試行を許可するか、新規Orderを要求するか | C-02と連動。利用者体験とデータモデル双方に影響 | 高 | PAY, ORD |
| G-02 | Stripe側でのCheckout Session離脱（利用者が戻るボタン等で中断）の検知・扱い | INV-PRJ-004（ブラウザ遷移を確定根拠にしない）の裏返しとして、未完了状態の扱いを明示する必要がある | 中 | PAY, ORD |
| G-03 | 決済失敗時の利用者向け通知の要否・内容 | PRJ-080の「副作用分離」原則の対象に失敗時通知も含めるか | 低 | PAY, Notification |
| G-04 | Webhook検証失敗（不正イベント疑い）時の対応（アラート、Blocking、記録） | NFR-1405 Security Event Observability対象 | 中 | PAY, SEC |

---

## H. Refund（返金）

| ID | 論点 | なぜ必要か | 優先度 | 影響仕様 |
|---|---|---|---|---|
| H-01 | 返金の起点（利用者からの申請を受け付けるか、運営操作のみか） | GLO-602「RefundはCancellationではない」。業務フロー全体の設計に関わる | 高 | PAY |
| H-02 | 返金条件・上限（全額のみか、部分返金を許容するか、期限はあるか） | PRJ-034が定義しない具体値。ただし返金APIの設計自体には必須 | 高 | PAY |
| H-03 | 返金とTicket無効化／Karaoke予約取消／Goods在庫復元の連動ルール（自動連動か、個別操作か） | GLO-1405「取消・返金・無効化・削除は独立した概念」。連動有無を明示する必要がある | 高 | PAY, TKT, KAR, GDS |
| H-04 | 返金操作の認可（誰が実行できるか、承認フローの要否） | INV-PRJ-013（サーバー側認可）、PRJ-103（強制操作の監査） | 中 | PAY, SEC |
| H-05 | 返金の監査要件（理由記録の必須化、実行者記録） | PRJ-120（監査対象に返金明記済み） | 中 | PAY, Audit |

---

## I. 決済確定後の副作用連携

| ID | 論点 | なぜ必要か | 優先度 | 影響仕様 |
|---|---|---|---|---|
| I-01 | Payment確定から各Domain（Ticket発行/Karaoke Entitlement確定/Goods Fulfillment開始）への連携方式（同期呼び出しか、イベント駆動か） | PRJ-092（再試行可能処理の分離）、SYS-081（共有注文基盤）を踏まえた設計判断 | 高 | PAY, ORD, TKT, KAR, GDS |
| I-02 | Payment確定通知メールの内容・タイミング（Domain権利発行前か後か） | PRJ-080の原則を踏まえた具体シーケンス確定 | 中 | PAY, Notification |

---

## J. セキュリティ・認可

| ID | 論点 | なぜ必要か | 優先度 | 影響仕様 |
|---|---|---|---|---|
| J-01 | Purchase Start / Webhookエンドポイントに対するRate Limit・Concurrency Limitの具体的閾値 | NFR-1404で保護要求はあるが数値未確定（OPEN-PAY-007） | 中 | PAY, SEC, API |
| J-02 | Order/Payment参照・返金操作等に必要なRole/Capabilityの一覧 | SEC仕様の前提として、PAY側でどの操作単位が必要かを洗い出す必要がある | 高 | PAY, SEC |
| J-03 | Webhookエンドポイント自体への追加アクセス制御（IP制限の要否、Stripeの署名検証のみで十分か） | NFR-1401, NFR-1400と整合させた設計判断 | 低 | PAY |

---

## K. 監査・Observability

| ID | 論点 | なぜ必要か | 優先度 | 影響仕様 |
|---|---|---|---|---|
| K-01 | 決済関連監査ログの具体的記録項目（実行者、日時、対象Order/Payment ID、変更前後状態、理由） | PRJ-032「重要な強制操作の監査可能化」の具体化 | 高 | PAY, DATA |
| K-02 | 決済関連Alertの具体閾値（Webhook Backlog Age、Payment失敗率等） | NFR-1301に一般原則はあるがPayment固有の閾値は未確定 | 中 | PAY, Operations |
| K-03 | Dashboard上でのSales/Payment表示項目の詳細（NFR-1106のView定義の具体化） | 運用時にPayment状況を可視化するための設計 | 低 | PAY, Operations |

---

## L. データモデルへの示唆（`DATA`仕様への入力）

| ID | 論点 | なぜ必要か | 優先度 | 影響仕様 |
|---|---|---|---|---|
| L-01 | 二重課金防止のためのDB排他方式（Unique制約／Advisory Lock／Serializable Transaction等） | PRJ-070（DBを最終防衛線とする）の具体化（OPEN-PAY-008） | 高 | DATA |
| L-02 | Idempotency Key・Webhook Event IDの保存テーブル設計（保持期間含む） | E-01〜E-03の実装基盤 | 高 | DATA |
| L-03 | Order/OrderItem/Payment/Refundのテーブル関係（正規化方針、外部キー） | GLO-500, GLO-600の概念をどう物理テーブルへ落とすか | 高 | DATA |

---

## M. API設計への示唆（`API`仕様への入力）

| ID | 論点 | なぜ必要か | 優先度 | 影響仕様 |
|---|---|---|---|---|
| M-01 | Purchase Start / Payment確認 / 返金操作の各エンドポイント設計（Hono RPCでの型共有含む） | PRJ-060標準技術（Hono RPC）を踏まえた具体化 | 中 | API |
| M-02 | Webhookエンドポイントのroute設計・認証除外（Stripeからの署名検証のみで受理する設計） | SYS-121の具体化 | 中 | API |
| M-03 | Error Contract（業務拒否 vs 技術Failureの区別をどうHTTP Status/Bodyで表現するか） | NFR-1105, GLO-1502を踏まえた設計 | 低 | API |

---

## N. テスト戦略

| ID | 論点 | なぜ必要か | 優先度 | 影響仕様 |
|---|---|---|---|---|
| N-01 | Webhook重複・順序変更・署名検証失敗の具体的テストケース設計 | NFR-1802 Failure Injectionの対象を具体化する必要 | 中 | TEST |
| N-02 | 負荷試験用のStripe側スタブ／モックの方針（実Stripe Test Modeを使うか、内部スタブを使うか） | NFR-1801「External dependency stub / real dependencyの区別」明示要求 | 低 | TEST |

---

## O. 運用（Reconciliation・障害対応）

| ID | 論点 | なぜ必要か | 優先度 | 影響仕様 |
|---|---|---|---|---|
| O-01 | Reconciliationバッチの実行頻度・実施者（自動バッチか、手動確認か） | NFR-505, SYS-152の運用具体化（OPEN-PAY-006） | 中 | PAY, Operations |
| O-02 | Critical Period（販売開始直後・イベント当日）中のPayment監視体制・エスカレーション先 | NFR-022 Critical Period要件、NFR-1301 Alert Routingの具体化 | 中 | Operations |
| O-03 | Stripe障害時のDegraded Mode運用手順（利用者への告知方法含む） | NFR-504の運用面の具体化 | 低 | Operations |

---

## P. 法務・会計（PAY実装に影響する範囲のみ）

| ID | 論点 | なぜ必要か | 優先度 | 影響仕様 |
|---|---|---|---|---|
| P-01 | 特定商取引法に基づく表示との整合（返金・キャンセルポリシー表示） | PRJ-140, PRJ-141により法務文書は別Authorityだが、システム要件として反映が必要な場合がある | 中 | 法務, PAY |
| P-02 | インボイス制度対応（適格請求書発行事業者登録の有無、領収書記載事項） | D-04, D-06と関連し、税務要件がPayment実装に影響し得る | 低 | 法務, PAY |

---

## 優先度サマリー

**優先度「高」（状態モデル・DB設計・二重防止に直結するため最優先で決めるべき）:**
A-01, A-02, A-03, B-01, B-04, C-01, C-02, C-04, D-01, D-02, E-01, E-02, E-03, F-01, F-02, F-03, G-01, H-01, H-02, H-03, I-01, J-02, K-01, L-01, L-02, L-03

**優先度「中」（実装着手前には必要だが高優先度の決定を待てる）:**
B-02, B-03, B-05, D-03, D-04, D-05, G-02, G-04, H-04, H-05, I-02, J-01, K-02, M-01, M-02, N-01, O-01, O-02, P-01

**優先度「低」（運用開始までに決めれば良い）:**
D-06, G-03, J-03, K-03, M-03, N-02, O-03, P-02

---

## 進め方の提案

論点が多いため、以下の順で確認していくことを提案する（あくまで提案であり、順序は変更可能）。

1. **A（Authority境界）** → まず`ORD`/`PAY`を分けるか一体化するかを決める（後続すべての前提）
2. **B・C（状態モデル）** → Order/Paymentの状態一覧を確定
3. **F（Hold連携）・E（冪等性）・L（データモデル示唆）** → 二重販売・二重課金防止の骨格を確定
4. **D（Stripe連携方式）** → 決済手段・Webhookイベント一覧を確定
5. **G・H（異常系・返金）** → 例外フローを確定
6. **I〜P（副作用連携・セキュリティ・監査・運用・法務）** → 実装詳細を詰める


---

## 決定ログ（進行中） — A〜H・E/F/L 確定事項

優先度「高」の項目（A〜H、およびE/F/L）について、ユーザー確認の上で以下の通り確定した。各決定は将来の正式`ORD`/`PAY`仕様のDecision Logへそのまま転記できる形式にしている。

### 仕様構成・Order Item・Hold（A）

**DEC-A-01 ORDとPAYの分離**
決定: `ORD`（注文）と`PAY`（決済/返金）を別Authority仕様として分離する。今回のPAY検討ではOrderは必要最小限（状態・Order Itemの対応関係）のみ扱う。
理由: PRJ-011, PRJ-021, GLO-501。
却下: 1本化案。

**DEC-A-02 Order Item構造**
決定: Order Itemは商品参照＋数量＋金額のみを持つ疎結合構造とする。チケット種別・カラオケ枠時間・グッズSKU等のDomain固有情報は各Domain側のテーブルで管理し、Order ItemはそのDomain Resourceへの参照（ID）のみを持つ。
理由: GLO-402。
却下: Order Item内にDomain固有詳細を内包する案。
影響: ORD, TKT, KAR, GDS。

**DEC-A-03 Hold管理主体**
決定: 排他制御用のHoldは各Domain（KAR, GDS）が管理主体となり、Orderは「どのHoldに紐づいているか」を参照するのみとする。
理由: GLO-801（Reservation/Hold分離の徹底）。
却下: Order/Payment側での一元管理案。
影響: ORD, KAR, GDS。

### Order状態モデル（B）

**DEC-B-01 Order状態一覧 — 【2026-09-07 SPEC-070 §6に準拠して修正】**
決定: Orderの状態は`PREPARED`(作成中)／`AWAITING_PAYMENT`(支払い待ち)／`CONFIRMED`(確定)／`PAYMENT_FAILED`(決済不成立確定)／`CANCELED`(取消)／`EXPIRED`(期限切れ)／`REVIEW_REQUIRED`(外部決済結果と内部状態が自動確定できない場合の確認待ち)の7状態とする。返金はOrder状態に含めず、Refund State（`DEC-C-01`参照）側の状態として扱う。
理由: `070-order-payment-specification.md` §6 Order State。
却下: 旧5状態モデル（作成中／支払い待ち／確定／取消／期限切れ、日本語名、`REVIEW_REQUIRED`相当の状態を持たない、2026-09-06時点の当初案）、返金をOrder状態に含める案、3状態への簡略化案。
影響: ORD, PAY, DATA。

**DEC-B-02 未着手Orderの自動期限切れ**
決定: 一定時間操作がない未着手Orderは自動的に「期限切れ」へ遷移させる仕組みを設ける。具体的なタイムアウト分数は `OPEN-PAY-013` として別途決定する。
理由: INV-PRJ-002（二重販売防止）、Hold長期占有の回避。
却下: 仕組みを持たない案、明示的取消のみに依存する案。

**DEC-B-03 Order取消の主体**
決定: Order取消（Cancellation）は運営操作のみとし、利用者自身による取消は許可しない。
理由: ユーザー判断（不正・誤操作対応の単純化を優先）。
却下: 支払い待ち中の利用者自身取消を許可する案、決済完了後も利用者取消を許可する案。
影響: ORD, Administration, SEC。

**【2026-09-07 追記】** SPEC-070 §27「支払前の明示cancel」（Owner確認済みの利用者自身による支払い前セルフキャンセルを許可）と矛盾することが判明。不正・誤操作対応の単純化を優先する本方針（運営のみ）を維持し、SPEC-070側への正式な変更要求を`change-requests-spec070.md`（CR-070-002）として起票した。

**DEC-B-04 カート機能（複数Domain商品の同時購入）**
決定: 1つのOrderに複数Domain（入場チケット＋カラオケ＋グッズ）のOrder Itemを混在させることを許可する。
理由: SYS-081（共有注文基盤）、利用者体験。
却下: Domainごとに別Orderとする案、一部組み合わせのみ許可する案。
影響: ORD, Product/Catalog, TKT, KAR, GDS。

**【2026-09-07 追記】** SPEC-070 `PAY-ORD-004`（Order Purposeは作成時に単一値へ確定）と矛盾することが判明。単一Domain強制は複数回の購入操作を利用者に強いりUXを損なうため不採用とし、本決定（複数Domain混在カートの許可）を維持する。SPEC-070側への正式な変更要求を`change-requests-spec070.md`（CR-070-001）として起票した。

**DEC-B-05 Order作成の認証要件**
決定: Order作成には認証済みユーザーであることを必須とする。未認証訪問者は先にログイン/登録が必要。ゲスト購入は許可しない。
理由: SYS-091。
却下: 仮Order（未認証）を許容する案、完全ゲスト購入を許容する案。
影響: ORD, IDN。

### Payment状態モデル（C）

**DEC-C-01 Payment状態一覧 — 【2026-09-07 SPEC-070に準拠して修正】**
決定: Payment単体の状態モデルは持たない。決済確定の成否はOrder State（`DEC-B-01`）で表現し、返金はRefund State（`REQUESTED`／`PENDING`／`SUCCEEDED`／`FAILED`／`REVIEW_REQUIRED`）という別ライフサイクルのみで管理する。
理由: `070-order-payment-specification.md` §37 Refund Record state。SPEC-070はPayment/Payment Bindingを状態を持つEntityとしてではなく、Checkout AttemptとOrder Stateの組み合わせで表現している。
却下: 旧4状態モデル（未処理／処理中／成功／失敗、Payment自体を独立した状態Entityとする案、2026-09-06時点の当初案）、成功/失敗のみのシンプル2値+別テーブルで返金管理する案、Stripe状態をそのまま内部採用する案、「一部返金／全額返金」を状態に含める案。
影響: PAY, DATA。

**DEC-C-02 決済失敗時の再試行モデル**
決定: 1 Order : N Payment試行とし、決済失敗のたびに新規の試行履歴を作成する。Orderは1つのまま、試行履歴がすべて残る。
理由: INV-PRJ-010（Financial Traceability）、NFR-401（冪等性品質）。
却下: 1 Order:1 Payment固定（新規Order/レコード更新の両方）案。
影響: PAY, DATA。

**【2026-09-07 追記】** SPEC-070は同種の目的を"Checkout Attempt"という論理単位（Business Cause = `(Order, Checkout Attempt)`）で扱っており、本決定の「失敗毎に新規Paymentレコードを作成する」という具体的な物理モデルとは表現が異なる。目的（全試行履歴の保持によるFinancial Traceability）自体はSPEC-070と矛盾しないため決定は維持するが、実際の物理テーブル設計（Payment行を都度作るか、Checkout Attempt行を都度作り成功時のみ確定Paymentを1件生成するか）はSPEC-100（Data Model）着手時に確定することとし、本決定はその際の入力として扱う。

**DEC-C-03 分割払い**
決定: 部分決済・分割払いは許容しない。1 Payment = Order全額の一括決済のみとする。
理由: モデルの単純化、現時点で要件なし。
却下: 複数Payment合算対応の設計余地を残す案、Stripeの後払い/分割オプションを初期から有効化する案。

**DEC-C-04 / DEC-D-01b Checkout Session有効期限とHold解放（決済手段別）**
決定: Checkout Sessionの有効期限は決済手段によって分ける。カード決済は業務要件として短い期限（具体分数は`OPEN-PAY-013`と合わせて決定）を設定し、期限切れイベント（`checkout.session.expired`）でHoldを解放する。**コンビニ払い（Konbini）を選択した場合は、Stripeの仕組み上バウチャー有効期限（デフォルト数日間）に合わせてSession自体を長時間有効にする必要があるため、Konbini選択時のHoldは数日間保持されることを許容する。**
理由: D-01でKonbiniを追加した結果、支払い手段ごとに技術的制約が異なるため。
**受け入れたリスク:** カラオケ枠等の排他的・数量限定商品についてKonbiniを選択する利用者がいた場合、その枠は数日間他の利用者が購入できなくなる可能性がある（INV-PRJ-002自体は破らないが、可用性・機会損失のトレードオフが生じる）。運用開始後、Konbini経由のHold長期化が実際の販売機会に与える影響をモニタリングし、必要なら決済手段の商品カテゴリ別制限（対応不可時のフォールバック案）を追加検討することを推奨する。→ `OPEN-PAY-014` として記録。
却下: Konbini自体を排他商品では禁止する案、全商品で一律Konbini禁止（カードのみ）に戻す案。
影響: PAY, KAR, GDS, NFR（Karaoke Availability関連指標への影響モニタリングが必要）。

### Stripe連携方式（D）

**DEC-D-01 対応決済手段**
決定: クレジットカード＋コンビニ払い（Konbini）に対応する。
理由: 一般参加者への配慮。
却下: カードのみ案、Stripeが提供する主要決済手段を広く有効化する案。
影響: PAY（DEC-C-04/D-01bとセットで運用）。

**【2026-09-07 追記】** SPEC-070 §2（本仕様のStripe Checkoutはcard paymentのみをCanonicalとする）と矛盾することが判明。一般参加者への配慮を優先し、本決定（カード＋コンビニ払い対応）を維持する。コンビニ払いはカード決済と異なる非同期の支払い・返金semantics（`stripe-technical-reference.md` 4.3節参照）を持つため、SPEC-070側への正式な変更要求を`change-requests-spec070.md`（CR-070-003）として起票した。

**DEC-D-02 購読Webhookイベント — 【2026-09-07 SPEC-070 §15に準拠して修正】**
決定: `checkout.session.completed` / `checkout.session.expired` / `refund.created` / `refund.updated` / `refund.failed` の5種を最小購読セットとして採用する。個別カード試行失敗（`payment_intent.payment_failed`）は購読対象に含めない（同一Session内での再試行を許容するため、個別失敗だけでOrderを終局的な失敗と判定しない）。返金の検知には`charge.refunded`ではなく`refund.*`系イベントを使用する。なお、コンビニ払い対応（`change-requests-spec070.md`のKonbini対応要求を参照）を採用する場合、`checkout.session.async_payment_succeeded`/`checkout.session.async_payment_failed`の2種を追加購読する必要がある。Webhookハンドラーはイベント種別ごとにディスパッチする拡張可能な構造（未対応イベントは安全に無視・記録するデフォルトハンドラを含む）として設計する。
理由: `070-order-payment-specification.md` §15 Canonical Event set。
却下: 旧4種セット（`payment_intent.payment_failed`, `charge.refunded`を含む案、2026-09-06時点の当初案）、completedとexpiredのみに絞る案、Payment関連イベントを広く購読する案。

**DEC-D-03 Reconciliation Polling併用**
決定: Webhookに加えて、定期的な照合バッチ（Stripe APIへの能動的な問い合わせ）を併用する。具体的な実行頻度は `OPEN-PAY-006` の一部として別途決定する。
理由: NFR-505（Reconciliation要件）。
却下: Webhookのみに依存する案、Pollingを主方式とする案。

**DEC-D-04 税・価格表示**
決定: 総額（税込）価格を商品ごとに管理する。Stripe Taxは使用しない。
理由: 日本の総額表示義務、PRJ-170（業務値の管理方針）との整合。
却下: Stripe Tax有効化案、税抜価格管理+別途加算表示案。

**DEC-D-05 決済手数料負担**
決定: Stripeの決済手数料は運営負担とし、価格に含め利用者へ別途表示しない。
理由: 実装・UIの単純化。
却下: 利用者負担案、決済手段別に使い分ける案。

**DEC-D-06 領収書**
決定: Stripe提供の標準Receiptへの導線のみとし、独自領収書発行機能は当面持たない。
理由: GLO-600のReceipt定義に沿う。実装コスト抑制。
却下: 独自PDF領収書発行機能を実装する案、個別リクエスト時のみ手動発行する案。

### 冪等性・Hold連携（E・F）

**DEC-E-01 Order作成Idempotency Key**
決定: Idempotency Keyはクライアントが生成し、Request Headerで送信する。
理由: NFR-401（冪等性品質）を満たす一般的な実装パターン。
却下: サーバー側決定論的導出案、明示的Keyを導入しない案。

**DEC-E-02 Stripe API呼び出しのIdempotency-Key — 【2026-09-07 チーム決定待ちに変更】**
決定（暫定・要チーム決定）: 内部で発行したIdempotency Key（DEC-E-01のOrder作成用Key）を、そのままStripe呼び出し（Checkout Session作成等）のIdempotency-Keyヘッダーとしても使用する。
理由: NFR-501/502（Timeout/Retry時の二重作成防止）。
却下: Stripe側では使用しない案。
**【2026-09-07 追記】** SPEC-070 `PAY-CHK-008`の確認により、Order作成Keyの使い回しとCheckout Attemptごとの新規Key発行のどちらが適切かはこの場で即断できないと判断し、`OPEN-PAY-020`としてチーム内議論に回す。詳細な比較（メリット/デメリット）は本ファイル末尾の「OPEN-PAY-020 詳細検討」を参照。決定次第、本DECおよびSPEC-100（Data Model）への入力を更新する。

**DEC-E-03 Webhook処理の冪等性**
決定: 受信したStripe Event ID（`evt_xxx`）をテーブルに記録し、処理済みEvent IDの再受信時は処理をスキップする。
理由: NFR-506（重複受信耐性）。
却下: 状態ベースチェックのみに依存する案、二重防御（Event ID+状態チェック）案。
影響: PAY, DATA（Event ID記録テーブルが必要、L-02参照）。

**DEC-F-01 Hold取得タイミング**
決定: 排他制御用のHoldは、Checkout Session作成時に取得する（Order作成時点ではHoldを取らない）。
理由: Hold保持時間の最小化、他利用者への影響抑制。
却下: Order作成時（カート確定時点）取得案、2段階Hold案。
影響: ORD, PAY, KAR, GDS。

**DEC-F-03 決済失敗時のHold/Order挙動**
決定: カード拒否等の決済失敗ではCheckout Session自体を失効させず、同一Session内での再試行を許容する。Hold/Orderは「支払い待ち」を維持し、Session有効期限切れ・利用者離脱のみをHold解放のトリガーとする（DEC-C-04と一貫）。
理由: 利用者体験（別カードでの即時再試行を可能にする）。
却下: 即座にHold解放・Order失敗確定する案、エラー種別による分岐案。

### 異常系（G）

**DEC-G-02 Checkout画面離脱の検知**
決定: 明示的な離脱検知は行わず、Session/Orderのタイムアウト（DEC-C-04, DEC-B-02）のみに委ねる。
理由: 実装の単純化、Stripeが離脱イベントを提供しないため。
却下: クライアント側beforeunload検知による早期解放案。

**DEC-G-03 決済失敗時の自動通知**
決定: 決済失敗時の利用者向け自動通知（メール等）は行わない。Checkout画面上のエラー表示のみとする。
理由: PRJ-080（副作用分離、通知コストの回避）。
却下: 一定回数以上の失敗時のみ通知する案、毎回通知する案。

**DEC-G-04 Webhook署名検証失敗時の対応**
決定: 検証失敗イベントは即座に拒否し、Security Event Observability対象として記録・アラートする。
理由: NFR-1405。
却下: ログのみで静かに処理する案、頻発時にWebhookエンドポイントを自動無効化する案。
影響: PAY, SEC。

### 返金（H）

**DEC-H-01 返金の起点**
決定: 返金は運営の判断・実行のみとし、利用者自身の返金申請フローは持たない。
理由: B-03（Order取消も運営のみ）との一貫性。
却下: 利用者からの返金申請を受け付ける案。

**DEC-H-02 返金範囲**
決定: 返金は全額返金のみとし、部分返金はサポートしない。
理由: C-03（分割払い非対応）とのモデル対称性、シンプルさ優先。
却下: 全額・部分返金両対応案、商品種別ごとの個別ルール案。

**DEC-H-03 返金の各Domain連動**
決定: 返金確定時、Event Ticket無効化・Karaoke予約取消・Goods在庫復元をすべて自動連動させる。
理由: 手作業による連動漏れ防止。
却下: 完全手動対応案、Ticketのみ自動化する案。
影響: PAY, TKT, KAR, GDS。

**DEC-H-04 返金操作の認可**
決定: 返金操作は運営管理者Roleのみが実行できる。スタッフには許可しない。具体的なRole/Capability定義は`SEC`へ委譲。
理由: PRJ-102（最小権限）。
却下: 一部スタッフRoleにも許可する案、複数人承認フロー案。
影響: PAY, SEC。

**DEC-H-05 返金の監査要件**
決定: 返金操作は実行者・日時・対象Order/Payment・理由・金額を必須記録する。理由入力は必須項目とする。
理由: PRJ-103, PRJ-120。
却下: 理由入力を任意とする案、通常ログのみとする案。
影響: PAY, DATA（Audit Log項目）。

### データモデルへの示唆（L）

**DEC-L-01 二重課金・二重販売防止のDB排他方式**
決定: Row-level Lock（`SELECT ... FOR UPDATE`）+ Unique制約を採用する。
理由: PRJ-070、PostgreSQL標準機能のみで完結する実績の多いパターン。
却下: Advisory Lock案、Serializable Isolation Level統一案。
影響: DATA。

**DEC-L-02 Idempotency Key・Webhook Event IDの保存期間**
決定: Audit Log準拠（365日以上）で保持する。
理由: NFR-1203、不正検知・紛争対応時の長期参照可能性。
却下: Operational Log準拠（30日程度）案、無期限保持案。
影響: DATA, NFR。

---

## Open Issues 更新（一部解決・新規追加）

| ID | 状態 | 内容 |
|---|---|---|
| OPEN-PAY-002 | **解決**（DEC-E-01） | Idempotency Keyはクライアント生成・Header送信 |
| OPEN-PAY-003 | **解決**（DEC-D-02） | 購読Webhookイベントは4種（拡張可能な設計） |
| OPEN-PAY-008 | **解決**（DEC-L-01） | DB排他方式はRow-level Lock+Unique制約 |
| OPEN-PAY-009 | **大部分解決**（DEC-H-01〜H-05） | 返金の起点・範囲・連動・認可・監査は確定。金額計算の細部（税込返金額の端数処理等）は残課題 |
| OPEN-PAY-011 | **方針決定**（DEC-H-04） | 返金操作は運営管理者Roleのみ。具体Capability名はSEC仕様で定義 |
| OPEN-PAY-013 | 新規（未解決） | 未着手Order自動期限切れの具体分数、Checkout Session有効期限（カード決済）の具体分数 |
| OPEN-PAY-014 | 一部解決（DEC-D-07） | 緩和策としてカテゴリ単位のKonbini無効化トグルを用意することを決定（未発動）。実運用でのモニタリング方針・発動基準は運用開始後に確定する残課題。 |
| OPEN-PAY-006 | 一部解決（DEC-D-03で方針決定） | 具体的なReconciliationバッチの実行頻度・実施者は未確定 |
| OPEN-PAY-004 | **解決**（DEC-B-01, DEC-C-01） | Order/Payment State Machineの状態一覧は確定。遷移条件の詳細（許可される遷移マトリクス）は次段階で定義 |
| OPEN-PAY-007 | 未解決 | Rate Limit/Concurrency Limitの具体的閾値（J-01） |
| OPEN-PAY-012 | **解決**（DEC-A-02） | Order Item構造は疎結合（商品参照+数量+金額） |

## 未着手カテゴリ（I〜P）

以下はまだ検討していない（優先度: 中〜低が中心）。

- I. 決済確定後の副作用連携（Domainへの反映方式、通知タイミング）
- J. セキュリティ・認可の詳細（Rate Limit閾値、返金以外のRole設計、Webhookアクセス制御）
- K. 監査・Observabilityの具体項目・Alert閾値
- M. データモデル／API設計へのさらなる示唆
- N. テスト戦略の具体化
- O. 運用（Reconciliation実施体制、Critical Period監視体制）
- P. 法務・会計（特商法表示、インボイス対応）


### 副作用連携・権限・監査（I・J・K の高優先度分）

**DEC-I-01 決済確定から各Domainへの連携方式**
決定: 非同期・イベント駆動（Outbox等）方式を採用する。Payment確定のTransaction内では「確定した事実」と各Domainへの伝達用イベントレコードのみを書き込み、Ticket発行・Karaoke Entitlement確定・Goods Fulfillment開始等の実際のDomain側処理は、別プロセスが非同期に実行する。
理由: PRJ-092、Domain数増加時のTransaction肥大化・失敗連鎖の回避。
却下: 同一Transaction内で同期更新する案、プロセス間API同期呼び出し案。
影響: PAY, ORD, TKT, KAR, GDS, DATA（Outboxテーブルが必要）。

**DEC-J-02 Order/Payment関連Capabilityの洗い出し方針**
決定: PAY仕様側で少なくとも以下6つの操作単位（Capability候補）を明示する。自分のOrder/Payment参照（利用者本人）／全Order/Payment参照（運営）／Order強制取消（運営、DEC-B-03）／返金実行（運営管理者のみ、DEC-H-04）／監査ログ参照（限定運営）／Webhook受信エンドポイントの実行（システム内部、Stripeからのみ）。最終的な具体Role名・粒度定義は`SEC`仕様へ委譲する。
理由: PRJ-021（Authority重複定義の禁止）とのバランス。PAY側で必要な操作単位を明示しないと、SEC側で抜け漏れが生じるリスクがある。
却下: 完全にSEC仕様へ委譲する案、PAY側でRole名まで確定する案。
影響: PAY, SEC。

**DEC-K-01 決済関連監査ログの記録対象イベント**
決定: `payment_audit_logs`（業務監査ログ、PRJ-120/PRJ-121）の記録対象イベントは「Order確定／Payment成功／Payment失敗／返金実行（DEC-H-05）／運営によるOrder強制取消（DEC-B-03）」の5種とする。Webhook署名検証失敗（DEC-G-04）はPRJ-120が定める業務監査ログの対象カテゴリに該当しないため対象から除外し、`security_events`テーブル（DEC-K-04）で別管理する（REVIEW-03対応）。監査ログの記録機構は、対象イベント種別をレジストリ的に追加できる拡張可能な設計とし、将来的な監査対象イベントの追加（例: Rate Limit発動、Reconciliation不一致検知等）を構造変更なしに取り込めるようにする。
理由: PRJ-120の監査対象を満たしつつ、GLO-1101/NFR-1102の業務Audit Log/Operational Logの区別を厳密化する。K-01の当初提案（6種）をベースに将来の拡張要求（ユーザー要望）に対応する。
却下: 金銭が動く操作のみに限定する案、すべての状態遷移を対象とする案、Webhook署名検証失敗を`payment_audit_logs`に含める案（GLO-1101の業務監査ログ定義と厳密には一致しないため、REVIEW-03（2026-09-06整合性再確認）で撤回）。
影響: PAY, DATA, Audit/Operations。

**DEC-B-02b / DEC-C-04b タイムアウト具体値**
決定: 未着手Order（作成後、支払いに進まないOrder）の自動期限切れは15分。カード決済のCheckout Session有効期限は30分（DEC-C-04のカード側の具体値として確定）。
理由: 一般的なオンライン購入体験とのバランス、Hold占有時間の抑制。
却下: より短い値（10分/20分）案、より長い値（30分/60分）案。
影響: ORD, PAY, KAR, GDS, NFR（該当する場合はCapacity試験のシナリオにも反映）。
補足: これにより `OPEN-PAY-013` は解決。Konbini選択時の期限は別途DEC-C-04/DEC-D-01bの通り、バウチャー有効期限に合わせる。

### データモデルへの示唆（L-03、決定事項からの導出）

**DEC-L-03 Order/OrderItem/Payment/Refundのテーブル関係（導出）**
これまでの決定（DEC-A-02, DEC-C-02, DEC-E-01, DEC-E-03, DEC-H-02, DEC-I-01）から、`DATA`仕様への入力として以下のテーブル関係を提案する。

- `orders`（1）─（N）`order_items`：`order_items`はDomain Resourceへの参照（種別+ID）のみを持つ（DEC-A-02）。
- `orders`（1）─（N）`payments`：決済失敗のたびに新規レコードを作成する（DEC-C-02）。`payments`には対応するStripe Payment Intent ID等の外部識別子を保持。
- `payments`（1）─（0または1）`refunds`：H-02で全額返金のみと決定したため、実質1 Payment : 0/1 Refundとなる。返金状態はこの`refunds`テーブルのみを真実の情報源（Single Source of Truth）とし、`payments.status`には反映しない（DEC-C-01、REVIEW-01対応）。監査・拡張性のため独立テーブルとして分離する。
- `order_items` ─ 各Domain側のHoldレコード（KAR/GDS管理、DEC-A-03）への参照（FK的な関連、所有権はDomain側）。
- `idempotency_keys`（Order作成等API向け、DEC-E-01）と `stripe_webhook_events`（Webhook Event ID記録、DEC-E-03）は独立テーブルとし、共にAudit Log準拠で365日以上保持（DEC-L-02）。
- `payment_audit_logs`（DEC-K-01）は`payments`/`orders`とは独立した監査専用テーブルとし、通常のOperational Logとは別に管理・保護する（PRJ-121）。
- `security_events`（DEC-K-04）はWebhook署名検証失敗等のセキュリティイベント専用テーブルとし、`payment_audit_logs`とは別に管理する。GLO-1101の業務監査ログには該当しないが、365日以上の保持・改ざん耐性はAudit Log同等に適用する。
- Domain間連携用の`outbox_events`（DEC-I-01）テーブルを持ち、Payment確定Transaction内で書き込み、非同期ワーカーが読み取って各Domainへ反映する。

この関係は提案であり、最終的な列定義・Index・Constraintは`DATA`仕様で確定する。


### 副作用連携・セキュリティ・監査・データ/API・テスト・運用・法務（I〜P の中・低優先度分）

**DEC-I-02 Payment確定通知メールのタイミング**
決定: Domain権利発行完了後（DEC-I-01のOutbox処理完了後）に送信する。
理由: 利用者混乱の回避（未発行の権利へのリンクを含むメールを送らない）。
却下: Payment確定と同時送信案、通知メールを持たない案。
影響: PAY, Notification, TKT/KAR/GDS。

**DEC-J-01 Rate Limit方針**
決定: 購入開始APIはアカウント/IP単位で緩やかな上限を設定する。具体的な数値（回数/時間窓）は運用中に調整可能な設定値として管理し、初期値は `OPEN-PAY-015` として別途決定する。Webhookは署名検証を主防御とし、Rate Limitは補助的に適用する。
理由: NFR-1404。
却下: Rate Limit非導入案、極端に厳しい上限案。
影響: PAY, SEC, API。

**DEC-K-02 Alert閾値**
決定: NFR-1301の一般原則に加え、Payment失敗率の追加閾値をSev2候補として設ける。具体的な%・時間窓は `OPEN-PAY-016` として別途決定する。
理由: NFR-1301。
却下: 追加閾値なし案、独自閾値を多数定義する案。
影響: PAY, Operations。

**DEC-M-01 APIエンドポイント骨子**
決定: 「Order作成」「Checkout Session発行」「Webhook受信」「運営によるOrder強制取消」「運営による返金実行」「自分のOrder参照」の6操作を`API`仕様への入力として明示する。最終的なURL・命名規則は`API`仕様が確定する。
理由: 抜け漏れ防止（PRJ-021とのバランス）。
却下: 完全に`API`仕様へ委譲する案。
影響: PAY, API。

**DEC-M-02 Webhook認証除外**
決定: Webhookエンドポイントは通常の認証ミドルウェアの対象外とし、Stripe署名検証のみで受理する専用route（例: `/webhooks/stripe`）とする。
理由: SYS-121（外部入力境界としての性質、Stripeは通常の認証手段を持たない）。
却下: 通常認証+署名検証の二重チェック案、Webhook専用の別サービス分離案。
影響: PAY, API, SEC。

**DEC-N-01 Webhookテスト自動化範囲**
決定: 重複受信／順序変更／署名検証失敗／外部Timeout・5xxの4観点をCI上の自動統合テスト対象とする。
理由: PRJ-230, NFR-1802。
却下: 重複受信のみ自動化する案、完全手動テスト案。
影響: PAY, TEST。

**DEC-O-01 Reconciliation運用**
決定: 自動定期実行（例:15分毎、具体値は`OPEN-PAY-006`の一部として別途最終確定）とし、不一致検知時のみ運営へアラート通知する。平常時の手動確認は発生させない。
理由: NFR-505、運用負荷抑制。
却下: 完全手動案、リアルタイム（数十秒間隔）常時監視案。
影響: PAY, Operations。

**DEC-O-02 Critical Period監視体制**
決定: Critical Period中はNFR-1301のSev1条件（Payment/Webhook Backlog等）を監視対象に含め、即時対応可能なオンコール担当へ直接通知する。具体的な当番表・連絡手段は`Operations`仕様へ委譲。
理由: NFR-022, NFR-1301。
却下: 通常時と同じ監視体制のまま特別対応をしない案、決済関連変更を完全凍結し監視も最小限にする案。
影響: Operations。

**DEC-P-01 特商法表示との整合**
決定: 確定済みの返金方針（DEC-H-01〜H-05：全額返金のみ・運営判断・利用者申請不可）を、特定商取引法に基づく表示（返金・キャンセルポリシー）の申し送り事項として法務担当へ共有する。表示文言はハードコードせず、後から更新可能な形で管理する。
理由: PRJ-140, PRJ-141（法務文書は別Authority）。
却下: 申し送りせず法務判断に委ねる案（システム決定と表示内容の齟齬リスクを受容しない）。
影響: PAY, 法務, Web/Administration（表示文言管理機構）。

**DEC-J-03 Webhook IPアクセス制御**
決定: Stripeが公表するWebhook送信元IPレンジをallowlist化し、署名検証に加えた多層防御とする。
理由: ユーザー選択（追加の防御層を優先）。
却下: IP制限を導入せず署名検証のみに依存する案。
影響: PAY, Operations。Stripe側のIPレンジ変更に追随する運用更新手順が必要（`OPEN-PAY-017`）。

**DEC-K-03 Dashboard表示項目**
決定: Order作成数／Payment成功・失敗数／Webhook Backlog／Reconciliation不一致件数／返金件数・金額を、Sales/Payment Dashboardの最低限の表示項目とする。
理由: NFR-1106。
却下: 運用開始後に改めて検討する案。
影響: PAY, Operations。

**DEC-M-03 Error Contract区別方針**
決定: 業務拒否は4xx、技術的失敗は5xxで区別し、レスポンスに機械可読なエラーコードを付与する。
理由: NFR-1105。
却下: 統一的なエラー形式でHTTPステータスによる区別をしない案。
影響: PAY, API。

**DEC-N-02 負荷試験用Stripeスタブ方針**
決定: 通常のCIテストはStripe Test Modeを使用し、大規模負荷試験（Capacity Envelope検証）では内部スタブ（Stripe API呼び出しのシミュレーション）を使用する。
理由: NFR-1801（External dependency stub/real dependencyの区別明示要求）。
却下: すべて実環境Test Modeで実施する案、すべて内部スタブのみで実施する案。
影響: PAY, TEST。

**DEC-O-03 Stripe障害時のDegraded Mode運用**
決定: Stripe障害検知時は購入導線に障害通知（バナー等）を表示しつつ、Public Site/Event Ticket表示/Check-in等の非Payment機能は維持する。復旧後はDEC-O-01のReconciliationバッチで未確定分を自動照合する。
理由: NFR-504。
却下: 手順を定めず都度判断する案。
影響: PAY, Operations, Web。

**DEC-P-02 インボイス制度対応**
決定: 現時点では対応方針を`OPEN-PAY-018`として保留し、Stripe標準Receipt（DEC-D-06）でどこまで適格請求書要件をカバーできるかを法務確認待ちとする。
理由: DEC-D-06（独自領収書機能を持たない）との整合。
却下: 独自にインボイス対応した領収書機能を実装する案。
影響: PAY, 法務。

---

## レビュー対応 確定事項（REVIEW-01〜05、2026-09-06確定）

`000〜030の既存仕様との整合性再確認`で指摘されたREVIEW-01〜05への対応を確定した。REVIEW-01（DEC-C-01簡素化）・REVIEW-02（DEC-H-03用語修正）・REVIEW-03（DEC-K-01縮小＋DEC-K-04新設）は上記の該当DECを直接修正済み。REVIEW-04・REVIEW-05は以下の新規DECで対応する。

**DEC-K-04 Webhook署名検証失敗専用のセキュリティイベントログ（REVIEW-03対応）**
決定: Webhook署名検証失敗（DEC-G-04）は`payment_audit_logs`ではなく、新設する`security_events`テーブルに記録する。`security_events`はGLO-1101の業務監査ログではないためPRJ-121の監査ログ保護規定の直接適用対象ではないが、運用上のベストプラクティスとして365日以上の保持・改ざん耐性をAudit Log同等に適用する。
理由: GLO-1101/NFR-1102が定めるAudit Log（業務監査）とOperational Log/セキュリティイベントの区別を厳密に保つため。DEC-G-04（NFR-1405 Security Event Observability）との整合。
却下: `payment_audit_logs`に統合する案（GLO-1101の定義と厳密には一致しない）、両方に記録する案（冗長）。
影響: PAY, DATA, SEC。

**DEC-F-04 複数Domain同時Hold取得の原子性（REVIEW-04対応）**
決定: DEC-B-04（複数Domain商品混在Order）とDEC-F-01（Domain個別管理のHold）の組み合わせにおいて、Checkout Session作成時の全Order ItemのHold取得は単一DBトランザクション内でAll-or-Nothingとする。いずれか1つのDomainでもHold取得に失敗した場合（例: 在庫切れ・満枠）は取得済みの全Holdをロールバックし、Checkout Session作成自体を失敗させる。失敗要因となった商品をエラーレスポンスで利用者に提示し、カート内容の見直しを促す。
理由: 全Domainが単一のSupabase PostgreSQLインスタンス上にあり単一トランザクションが技術的に実現可能（PRJ-060）。INV-PRJ-002（二重販売防止）を複数Domain間でも一貫して保証できる。
却下: 取得できた分だけ確保し失敗Domainのみ利用者に再選択を促す部分成立案（利用者体験・実装が複雑化）、Sagaパターンによる補償トランザクション案（実装・テストコストが高く初期スコープでは過剰）。
影響: PAY, ORD, KAR, GDS, DATA。→ `OPEN-PAY-019` はこのDEC-F-04により解決。

**DEC-D-07 Konbini提供カテゴリの無効化トグル（REVIEW-05対応）**
決定: `DEC-C-04`/`DEC-D-01b`で受け入れたKonbini Hold長期化リスク（`OPEN-PAY-014`）への運用上の緩和策として、商品カテゴリ単位でKonbini決済の提供可否を切り替えられる設定トグルを、コード変更を伴わないデータとして管理する（PRJ-170準拠）。初期値は全カテゴリでKonbini許容のまま変更しないが、カラオケ等の排他的・数量限定枠で実際に機会損失が顕在化した場合、運用側がトグルでKonbini提供を停止できるようにする。あわせて、この措置は「PRJ-190（原則）に対する正当な逸脱」であることを正式`PAY`仕様のDecision Log・受け入れ条件に明記する。
理由: OPEN-PAY-014で識別したリスクへの実運用上の対応手段を用意しつつ、D-01/D-01bで確定した「全商品でKonbini許容」の方針自体は変更しない。
却下: 対象カテゴリを最初から限定する案（既存のD-01方針の修正になるため見送り）、明文化のみで運用トグルは用意しない案（リスク顕在化時の即応手段がなくなる）。
影響: PAY, KAR, GDS, DATA, Ops。

## Open Issues 最終更新

| ID | 内容 |
|---|---|
| OPEN-PAY-006 | Reconciliationバッチの正確な実行間隔（方針=自動定期実行、DEC-O-01で確定。分数は未確定） |
| OPEN-PAY-007 | （J-01に統合、下記OPEN-PAY-015参照） |
| OPEN-PAY-015 | 購入開始APIのRate Limit具体数値（アカウント/IP単位の回数・時間窓） |
| OPEN-PAY-016 | Payment失敗率Alertの具体閾値（%・時間窓） |
| OPEN-PAY-017 | Stripe公表Webhook送信元IPレンジのallowlist運用更新手順 |
| OPEN-PAY-018 | インボイス制度（適格請求書）対応方針（法務確認待ち） |
| OPEN-PAY-020 | Stripe Idempotency-Keyの発行単位（Order作成Keyの使い回し vs Checkout Attemptごとの新規発行）。詳細は本ファイル末尾「OPEN-PAY-020 詳細検討」参照。DEC-E-02に対応 |

以上でA〜Pの全検討項目（計約49項目）の一次検討が完了した。次のアクションは、本ファイルの決定ログを正式な`ORD`・`PAY`仕様（状態遷移表、Invariant、受け入れ条件、Handoff等の定型フォーマット）へ落とし込むこと。


---

## レビュー結果（000〜030との整合性再確認）

`payment-spec-decision-items.md` の全DEC-xxxを、`000-project-constitution.md`（PRJ）・`010-system-overview.md`（SYS）・`020-glossary-domain-language.md`（GLO）・`030-non-functional-requirements.md`（NFR）と突き合わせて再確認した結果。

**結論:** `INV-PRJ-xxx` / `INV-SYS-xxx` / `INV-NFR-xxx` の必須Invariantへの違反は検出されなかった。

### 内部矛盾（要修正）→ すべて解決済み（2026-09-06）

**REVIEW-01 Payment状態「一部返金」と返金方針の不整合 → 解決**
`DEC-C-01`はPayment状態に「一部返金」を含んでいたが、`DEC-H-02`は「全額返金のみ、部分返金非対応」と決定しており、「一部返金」が到達不能な状態になっていた（PRJ-073と齟齬）。`DEC-L-03`の`refunds`独立テーブル設計との二重管理の疑いもあった。
→ Payment状態を「未処理／処理中／成功／失敗」の4状態に簡素化し、返金情報は`refunds`テーブルのみで管理する方針に確定（`DEC-C-01`・`DEC-L-03`を修正済み）。

**REVIEW-02 用語の不整合（GLO-1300違反） → 解決**
`DEC-H-03`の「Ticket無効化」はGLO-1300が禁止する「チケット」の単独使用に該当していた。
→ 「Event Ticket無効化」に修正済み（`DEC-H-03`）。

### 要注意点（矛盾ではないが正式仕様化前に整理推奨）→ すべて解決済み（2026-09-06）

**REVIEW-03 Webhook署名検証失敗の記録先の重複 → 解決**
`DEC-K-01`はAudit Log対象、`DEC-G-04`はSecurity Event Observability（NFR-1405）対象としており、最終的にどちらのログストア（またはその両方）に記録するかが未整理だった。
→ `payment_audit_logs`（業務監査ログ）からWebhook署名検証失敗を除外し、専用の`security_events`テーブルで別管理する方針に確定（`DEC-K-01`修正・`DEC-K-04`新設）。

**REVIEW-04 複数Domain同時Hold取得の原子性未決定 → 解決**
`DEC-B-04`（カート機能で複数Domain商品混在可）と`DEC-F-01`（Holdは各Domain個別管理）の組み合わせで、一部DomainのみHold失敗した場合の挙動が未決定だった。
→ 単一DBトランザクションによるAll-or-Nothing方式に確定（`DEC-F-04`新設）。`OPEN-PAY-019`は解決。

**REVIEW-05 Konbini Hold長期化とPRJ-190の関係の明示 → 解決**
`DEC-C-04`/`DEC-D-01b`は`OPEN-PAY-014`で追跡済みで矛盾ではなかったが、正式`PAY`仕様での明示方法と運用上の緩和策が未整理だった。
→ 正式`PAY`仕様のDecision Log・受け入れ条件で「PRJ-190（原則）に対する正当な逸脱」と明記する方針、およびカテゴリ単位のKonbini無効化トグル（運用上の緩和策）を用意する方針に確定（`DEC-D-07`新設）。`OPEN-PAY-014`は一部解決（監視方針の細部は運用開始後の残課題）。

### 解決済みOpen Issue

| ID | 内容 | 状態 |
|---|---|---|
| OPEN-PAY-019 | 複数Domain商品混在Orderにおける、一部Domainのみ Hold失敗時の挙動（ロールバック方式・部分成立の可否） | **解決**（`DEC-F-04`） |



---

## OPEN-PAY-020 詳細検討: Stripe Idempotency-Keyの発行単位

**論点:** Checkout Session作成等のStripe API呼び出しに使うIdempotency-Keyを、(A) Order作成時に発行したKeyをすべてのCheckout Attemptで使い回すか、(B) Checkout Attemptごとに新規Keyを発行するか。

**前提となるStripeの挙動:**

- 同じKey＋同じRequestパラメータで再送 → Stripeはキャッシュされた元のレスポンスをそのまま返す。
- 同じKey＋異なるRequestパラメータで送信 → Stripeはエラーを返す（同じKeyが異なるパラメータで再利用されたと判定）。

### 案A: Order作成時のKeyをすべてのCheckout Attemptで使い回す（DEC-E-02の当初案）

**メリット**

- 実装がシンプル。Order作成時に1つKeyを発行すれば、以降すべてのCheckout Session作成呼び出しで同じ値を渡すだけで済み、Attempt単位のKey管理機構が不要。
- 同一Attemptに対するTimeout・Network Loss等による再送（SPEC-070 `PAY-CHK-008`が想定するケース）には正しく機能する。Stripeが同じレスポンスを返すため、二重Session作成を防げる。
- NFR-401（冪等性品質）が要求する「クライアント生成Idempotency Key」という単純な1本の線をOrder〜Payment全体で保てる。

**デメリット**

- SPEC-070 `PAY-CHK-010`のケース（最初のAttempt結果が「作成されていない/再利用不能」と確定し、同一Orderへ新しいCheckout Attemptを作成してよい場合）で問題が起きる。新しいAttemptでも同じKeyを使い回すと、Stripeは「これは前回と同じRequestだ」と判断し、新しいSessionを作らずキャッシュされた古いSession（既に無効/再利用不能と判断したもの）を返してしまう可能性がある。これはPAY-CHK-010が意図する「新しいSessionを正規に作る」という挙動を壊す。
- 新しいAttemptのRequestパラメータが（例えばsuccess_urlのトークン部分等で）前回と微妙に異なる場合、Stripeは「同じKeyが異なるパラメータで使われた」としてエラーを返す可能性があり、正規のリトライ処理自体がAPIエラーで止まるリスクがある。
- Attempt単位でのKeyがないため、監査・デバッグ時に「どのAttemptがどのStripe呼び出しに対応するか」をKeyから追跡しづらい。

### 案B: Checkout Attemptごとに新規Keyを発行する

**メリット**

- SPEC-070のBusiness Cause粒度（`(Order, Checkout Attempt)`）と1対1で対応する設計になり、`PAY-CHK-008`（同一Attemptの再送は同じKeyで回復）と`PAY-CHK-010`（新しいAttemptは新しいKeyで正規に新規Session作成）の両方を自然に満たせる。
- 新しいAttemptのRequestパラメータが前回と異なっても、Keyも新しいためStripe側のパラメータ不一致エラーが発生しない。
- Attempt単位でKeyを保存すれば、監査・障害調査時にAttempt→Stripe呼び出しの対応関係が明確になる（Financial Traceabilityの観点でも有利）。

**デメリット**

- 「これは同一Attemptの再送（既存Keyを使う）か、新しいAttempt（新しいKeyを発行する）か」を正しく判定するロジックが別途必要になり、実装がやや複雑になる。
- この判定ロジック自体にバグがあると、本来同一Attemptの再送であるべき呼び出しに誤って新しいKeyを割り当ててしまい、NFR-501/502が要求する「Timeout/Retry時の二重作成防止」が効かなくなるリスクがある（重複防止のための機構が、その境界判定ミスで逆に無効化される）。
- Attempt単位でKeyを保存するテーブル設計（SPEC-100側）が必要になり、案Aより設計・実装コストがわずかに高い。

### 参考所見（決定するものではない）

SPEC-070自体が「Checkout Attempt」を独立したBusiness Causeとして扱う設計であること、また`PAY-CHK-010`が明示的に「新しいCheckout Attemptを同一Orderへ作成してよい」ケースを想定していることを踏まえると、案Bの方がSPEC-070の設計思想と整合しやすい。ただし、案Aでも「同一Attemptの再送」しか実際には発生しない（`PAY-CHK-010`のケースが実運用上ほぼ起きない）という前提であれば、実装のシンプルさを優先して案Aを採用する余地もある。

**次のアクション:** チーム内で議論の上、案A/案Bいずれかを決定し、`DEC-E-02`を正式に確定させる。決定後、SPEC-100（Data Model）のCheckout Attemptテーブル設計への入力とする。
