---
spec_id: NFR
title: "off r39'x 非機能要件仕様"
status: review
version: "1.0.0-rc.1"
language: ja-JP
authority_for:
  - non_functional_requirements
  - performance
  - capacity
  - availability
  - reliability
  - data_durability
  - accessibility
  - mobile_first
  - observability
  - operational_logging
  - monitoring_alerting
  - backup_recovery
  - external_system_resilience
  - deployability_operability
depends_on:
  - PRJ
  - SYS
  - GLO
related_specs:
  - IDN
  - ORD
  - PAY
  - TKT
  - KAR
  - GDS
  - QR
  - SEC
  - DATA
  - API
  - TEST
last_updated: "2026-09-06"
---

# off r39'x 非機能要件仕様

## 1. 文書の目的

### NFR-001 本書の目的

本書は、Project Constitution（`PRJ`）で原則として定義された性能、可用性、復旧、Mobile First、Accessibility、Observability、Backup、運用可能性その他の非機能要求を、実装・テスト・リリース・運用で検証可能なシステム横断要件へ具体化する。

本書はSystem Overview（`SYS`）のSystem Boundary、Actor、主要Domain、External System、高レベルジャーニーに従い、Glossary / Domain Language（`GLO`）の正式用語を使用する。

### NFR-002 Authority

本書は、システム横断の品質特性およびそれらの測定・検証基準に対するAuthorityを持つ。

本書は、個別DomainのState Machine、Role / Capability、DB物理構造、API Contract、具体的な業務値を再定義しない。

### NFR-003 優先順位

本書は `PRJ` を最上位Authorityとして従う。`SYS` または `GLO` と本書の間で責任境界または用語上の矛盾が生じた場合は、黙示的に読み替えずSpec Conflictとして扱う。

本書の作成時点で、`PRJ`、`SYS`、`GLO` の間に本書の策定を阻害するSpec Conflictは確認されていない。

---

## 2. 適用範囲

### NFR-010 適用対象

本書の要件は、該当する範囲で以下へ適用する。

- Public Site
- Authentication後のMy Page
- Product / Catalogおよび販売情報取得
- Order作成等の購入開始
- Payment連携開始およびPayment結果反映
- Event Ticket / Electronic Ticket表示
- Karaoke Availability、購入・予約、Karaoke Reception
- Goods購入、Inventoryに関係する購入処理、Venue Pickup / Handover支援
- Entry Check-in
- Administration
- Staff UI
- Hono API
- Supabase PostgreSQL上の業務データ
- Supabase Auth、Stripe、Resendとの連携境界
- Vercel、Railway、Supabaseを利用するHosting / Data基盤
- 非同期処理、Webhook受信、通知処理
- Audit / Operationsに必要なObservability

### NFR-011 完成形の品質基準

本書は完成形および長期運用時の品質基準を定義する。実装順序、リリース順序、短期的な機能範囲によって本書の要求を縮小してはならない。

### NFR-012 本書の責任外

本書は以下を確定しない。

- Order / Payment / Ticket / Karaokeの具体State Machine
- Refund条件
- 購入上限、価格、販売期間、Hold期限
- Inventory allocation algorithm
- Role / Capability一覧
- QR Token形式
- DB Table / Column / Index / Lockの具体定義
- API endpoint / request / response
- UIの具体Layout
- メール本文
- 法務文面または法的保存期間
- オフラインCheck-inの具体的業務仕様

これらは各Authority仕様へ委譲する。

---

## 3. 非機能要件の原則

### NFR-020 測定可能性

規範的な非機能要件は、可能な限り以下を一意に定義しなければならない。

- 測定対象
- 測定地点
- 集計方法
- 負荷条件
- 成功条件
- 除外条件
- 検証方法

### NFR-021 外部システムと内部責任の分離

Stripe Checkout画面、Supabase Auth内部処理、Resend配送網等、External System内部の応答性能や可用性を本システム自身のSLOとして保証してはならない。

一方、External Systemの障害・遅延によって本システム利用者が影響を受ける場合、その影響の検知、Timeout、Failure Isolation、Degraded Mode、Recovery、Reconciliationは本システムの非機能責任として扱う。

### NFR-022 Critical Period

`PRJ-190` に従い、以下の時間帯はCritical Periodとして特別に扱う。

- 販売開始直後を含む販売集中時間帯
- イベント開催前および入場開始前後
- Karaoke利用開始前後
- 会場でのGoods Handover集中時間帯

具体的なイベント日時に対するCritical Periodの開始・終了時刻はOperations Authorityが事前に確定する。本書は、Critical Period中の品質基準として以下を要求する。

- 計画停止を行わない。
- 非緊急のProduction変更を行わない。
- 監視・アラートを強化する。
- Staff UI、Entry Check-in、Event Ticket表示、Payment結果確認等の重要経路を優先して復旧する。

### NFR-023 Critical Business Path

以下をCritical Business Pathとする。

1. Orderを追跡可能な状態にしたうえでPayment連携を開始する経路
2. 信頼できるPayment結果を内部状態へ反映・照合する経路
3. Event Ticket / Electronic Ticketを表示する経路
4. Entry EntitlementをValidationしCheck-inを正常に記録する経路
5. Karaoke Availability確認、Reservation / Karaoke Entitlementに関係する購入・受付経路
6. Goods購入およびHandoverに必要な確認経路
7. 重要なAdministration / Staff操作

Critical Business Pathの品質劣化は、Public Site上の非重要コンテンツ劣化より高い優先度で扱う。

---

## 4. Measurement / SLI / SLO

### NFR-030 SLIの共通定義

| SLI | 定義 |
|---|---|
| Request Success Rate | 対象期間の有効Requestのうち、期待された成功結果または業務上正しい4xxを返した割合。Server Error、Timeout、Dependency Failureに起因する利用不能は失敗として数える |
| Server Latency | APIがRequestを受信してからResponseを返すまでの時間。明記がない限りClient network時間を含まない |
| End-to-End Latency | Browser / Staff端末操作開始から、利用者が次の有効な状態を確認できるまでの時間 |
| Availability | 合成監視または実トラフィックで、対象能力が正しい応答を返す割合 |
| Async Completion Lag | 非同期処理の受付・基準時刻から、内部で必要な処理が完了するまでの時間 |
| Recovery Time | Incidentとしてサービス復旧が必要と判断した時点から、対象能力が受け入れ基準を満たして復旧するまでの時間 |
| Data Recovery Point | 障害発生時点から、復元後に失われ得る最も新しい永続データまでの時間差 |

### NFR-031 Percentile集計

性能SLOは原則として `p50`、`p95`、`p99` のうち必要なPercentileを使用し、平均値だけで合否判定してはならない。

負荷試験ではWarm-upを除外し、少なくとも10分以上のSteady Stateを測定する。短時間Burst要件については別に定義する。

### NFR-032 正常系・失敗系の分離

以下を同一の性能集計へ混在させてはならない。

- 正常な業務成功
- 業務Validationによる期待された4xx
- 認証・認可拒否
- Internal Error
- External Dependency Failure
- ClientによるCancel

Availability / Error Rateでは、利用者が正しく操作してもサービス側理由で完了できないケースを失敗として扱う。

### NFR-033 外部待ち時間の扱い

External System呼び出しを含む経路は、少なくとも以下を別に観測する。

- 本システム内部処理時間
- External System待ち時間
- End-to-End時間

これにより、本システム内部の退行と外部依存の遅延を区別できなければならない。

---

## 5. Performance

### NFR-100 Server-side Performance SLO

以下は、Production相当構成、正常なExternal System状態、NFR-200の標準Peak負荷以内でのServer-side SLOとする。

| ID | 対象 | SLI / Measurement | Target | 除外 / 補足 | Verification |
|---|---|---|---|---|---|
| NFR-101 | Public Siteの動的API / 販売情報Read | Server Latency | p95 ≤ 500 ms、p99 ≤ 1,500 ms | CDN静的配信時間は別測定 | Production telemetry + load test |
| NFR-102 | My Page主要Read | Server Latency | p95 ≤ 1,000 ms、p99 ≤ 2,500 ms | 初回Auth確立そのものは分離 | Production telemetry + load test |
| NFR-103 | Order作成等の購入開始内部処理 | Server Latency | p95 ≤ 1,500 ms、p99 ≤ 3,000 ms | Stripe側Checkout画面は含めない。Stripe API待ちは分離計測 | load test + trace |
| NFR-104 | Payment連携開始 | 本システム内部処理 | p95 ≤ 1,500 ms、p99 ≤ 3,000 ms | External System待ち時間を除いた内部処理 | trace |
| NFR-105 | Payment結果の内部反映 | Async Completion Lag | 本システムが検証可能な決済イベントを受信してから p95 ≤ 10 s、p99 ≤ 60 s | Stripeからイベントが届くまでの時間は保証対象外 | integration test + production metrics |
| NFR-106 | Event Ticket / Electronic Ticket取得 | Server Latency | p95 ≤ 500 ms、p99 ≤ 1,500 ms | QR描画時間はClient側で別測定 | load test + production metrics |
| NFR-107 | Karaoke Availability取得 | Server Latency | p95 ≤ 700 ms、p99 ≤ 2,000 ms | Domain判定は `KAR` に従う | load test |
| NFR-108 | Karaoke購入開始 | Server Latency | p95 ≤ 1,500 ms、p99 ≤ 3,000 ms | External Payment待ちは分離 | load test |
| NFR-109 | Goods購入開始 | Server Latency | p95 ≤ 1,500 ms、p99 ≤ 3,000 ms | External Payment待ちは分離 | load test |
| NFR-110 | Entry Entitlement Validation + Check-in | Server Latency | p95 ≤ 800 ms、p99 ≤ 2,000 ms | QR Scan時間、会場端末回線遅延は別測定 | concurrency test + production metrics |
| NFR-111 | Karaoke Reception / Check-in | Server Latency | p95 ≤ 800 ms、p99 ≤ 2,000 ms | 具体状態遷移は `KAR` / Check-in Authority | concurrency test |
| NFR-112 | Administration主要Read | Server Latency | p95 ≤ 1,500 ms、p99 ≤ 3,000 ms | 大量Export等は別能力として定義可能 | production metrics + load test |
| NFR-113 | Staff UI主要Read / Update | Server Latency | p95 ≤ 1,000 ms、p99 ≤ 2,500 ms | Critical Periodで優先監視 | production metrics + load test |

### NFR-114 Client Performance / Web Vitals

利用者向けWebはMobile Firstの品質指標として、主要Public SiteおよびMy Pageの代表画面で以下を満たさなければならない。

- LCP: p75 ≤ 2.5 s
- INP: p75 ≤ 200 ms
- CLS: p75 ≤ 0.1

測定は実利用データを優先し、十分なサンプルがない期間はProduction相当環境でのモバイルSynthetic測定を補助として使用する。

### NFR-115 Mobile Networkでの主要操作

代表的な4G相当ネットワーク条件下で、Electronic Ticket表示、Entry Check-in結果表示、Karaoke受付結果表示の主要画面は、操作開始から利用者またはStaffが次の判断可能状態を認識できるまで `p95 ≤ 3.0 s` を目標とする。

External System内部画面へ遷移した後の時間はこのSLOから除外する。

### NFR-116 Performance Regression

同一負荷プロファイル・同一代表データセットにおいて、主要Critical Business Pathのp95が基準Releaseより20%以上悪化し、かつ本書のTargetに対する余裕を著しく失う変更は、原因確認なしにReleaseしてはならない。

---

## 6. Capacity / Peak Load

### NFR-200 Capacity Test Envelope

本システムは、少なくとも以下のPeak LoadをProduction相当環境で処理できなければならない。これはイベント規模の予測値ではなく、完成形システムが最低限耐えるべき検証用Capacity Envelopeである。

| ID | Workload | Minimum Capacity | 合格条件 | Verification |
|---|---|---|---|---|
| NFR-201 | Public Site / Catalog Read | 1,000 concurrent sessions、150 req/sを15分 | NFR-101およびNFR-114の対象指標を満たし、5xx < 0.5% | load test |
| NFR-202 | Authenticated Read / My Page | 300 active concurrent users、75 req/sを15分 | NFR-102を満たし、5xx < 0.5% | load test |
| NFR-203 | Purchase Start aggregate | 25 req/sを5分、50 req/sを30秒Burst | No Double Sale / Financial Traceabilityを破らず、5xx < 1% | concurrency + load test |
| NFR-204 | Payment result ingestion | 30 events/sを2分Burst | 重複・順序変更を含め、追跡不能状態を作らず、Backlogが10分以内に解消 | integration + load test |
| NFR-205 | Karaoke Availability | 50 concurrent users、20 req/sを10分 | NFR-107を満たす | load test |
| NFR-206 | Entry Check-in | 10同時Staff端末、2 successful Check-in/sを30分、5/sを1分Burst | NFR-110を満たし、No Double Useを破らない | concurrency test |
| NFR-207 | Karaoke Reception | 5同時Staff端末、1 successful Check-in/sを15分 | NFR-111を満たし、権利用途を混同しない | concurrency test |
| NFR-208 | Goods Handover確認 | 10同時Staff端末、5 update/sを10分 | 正常結果の重複記録・追跡不能を発生させない | load + concurrency test |
| NFR-209 | Aggregate Critical Mix | Public Read、Authenticated Read、Purchase、Check-in、Webhook相当を同時発生 | Critical Business PathのTargetを維持し、DB接続・CPU・Memory等の資源枯渇を起こさない | mixed load test |

### NFR-210 Headroom

Productionの通常Peak観測値が、NFR-200で検証済みCapacityの70%を継続して超える場合、Capacity見直しを必要とする運用シグナルとして扱う。

### NFR-211 無限Scaleを要求しない

本書は無制限な水平Scaleを要求しない。Technical / Infrastructure AuthorityはNFR-200を満たす構成を定義し、限界値とScale方法を運用可能な形で明示する。

---

## 7. Availability

### NFR-300 Availability SLO

Availabilityは、原則として月次で集計し、Synthetic probeと実Requestの双方から評価する。

| ID | 対象能力 | Monthly Target | Measurement |
|---|---|---:|---|
| NFR-301 | Public Site主要閲覧能力 | 99.9% | 主要ページのSynthetic probe + 5xx / timeout |
| NFR-302 | Authenticated My Page主要Read | 99.9% | 認証済みSynthetic + 実Request |
| NFR-303 | Order / Purchase Start API | 99.9% | 有効Requestの成功率 |
| NFR-304 | Event Ticket表示 | 99.95% | Synthetic + 実Request |
| NFR-305 | Entry Check-in | 99.95% | Staff synthetic / production request success |
| NFR-306 | Karaoke Availability / Reception | 99.9% | Synthetic + request success |
| NFR-307 | Administration主要能力 | 99.5% | 管理用Synthetic + request success |

### NFR-308 SLO除外

以下はAvailability SLOの分母から除外してよい。

- 利用者端末固有の障害
- 利用者側回線のみの障害
- 明らかな不正Request、認証失敗、認可拒否、業務Validation拒否
- External Systemの画面内部だけで発生し、本システム能力自体が正常な事象
- 事前告知された非Critical Periodの計画Maintenance。ただし月間除外総量を無制限としてはならない

External System障害が本システムの対象能力を利用不能にした時間は、利用者向けSLOでは原則として失敗に含める。そのうえでDependency Availabilityを別SLIとして切り分ける。

### NFR-309 Critical Period Availability

Critical Periodでは以下を必須とする。

- Planned Downtime = 0
- Entry Check-in、Event Ticket表示、Order / Payment状態確認のSynthetic監視間隔 ≤ 1分
- 対象能力の連続失敗が2分を超えた場合はSev1候補として扱う
- Critical Business Pathに影響する変更は原則としてCritical Periodの2時間前から終了まで凍結する。緊急修正はIncident手順に従う

---

## 8. Reliability / Data Integrity / Data Durability

### INV-NFR-001 成功応答後の追跡可能性

業務APIが利用者またはStaffへ成功を返した重要操作は、その後のApplication restart、Deploy、Retry、External System failureによって追跡不能になってはならない。

### INV-NFR-002 Critical Invariant Preservation

負荷、Retry、Timeout、重複Request、順序変更、Process crash、Deploy、部分障害が発生しても、少なくとも以下を破ってはならない。

- `INV-PRJ-010` Financial Traceability
- `INV-PRJ-011` No Double Sale
- `INV-PRJ-012` No Double Use
- `INV-PRJ-013` Server-side Authorization
- `INV-PRJ-014` Recoverability
- `INV-PRJ-015` Auditability

### NFR-400 Atomicity

一つの業務操作として一貫して成功または失敗すべき永続更新は、途中状態を正常完了として露出してはならない。具体的なTransaction、Constraint、Lockは `DATA` Authorityが定義する。

### NFR-401 Idempotency Quality

重複実行で金銭、Entitlement、Reservation、Inventory、Check-in、Handover、通知等に重大な副作用が生じる処理は、少なくとも「同一論理操作のRetryが重複した正常結果を新規作成しない」ことを自動テストで検証できなければならない。

具体的Idempotency Key、State Machine、外部Event対応は各Domain / API Authorityへ委譲する。

### NFR-402 Async Reliability

再試行可能な非同期処理は、Process restartまたは一時的なExternal System failureによって黙示的に消失してはならない。

少なくとも以下を観測可能にする。

- 未処理件数
- 最古未処理Age
- Retry回数
- Permanent Failure相当の件数
- 対象Domain Object / Correlation情報

### NFR-403 Data Durability after Deploy / Migration

Deploy、Migration、RollbackまたはForward Fixによって、既存の重要業務データが追跡不能・照合不能になってはならない。

破壊的変更を行う場合は `PRJ-241` に従い、データ移行、互換期間、Rollbackまたは安全なForward Fixを事前検証する。

---

## 9. External System Resilience

### NFR-500 外部障害前提

Supabase Auth、Stripe、Resend、Vercel、Railway、Supabase PostgreSQLその他の外部・基盤依存は、失敗・遅延・重複・順序変更・一時Unavailableが発生する前提で設計する。

### NFR-501 Timeout

同期的なExternal System呼び出しには有限Timeoutを必須とし、無期限待機を禁止する。

原則Targetは以下とする。

- Interactive pathの単一External call: 10秒以内にTimeout
- Critical Staff pathで外部依存がある場合: 5秒以内を優先
- 非同期処理: 個別attemptは30秒以内を原則とし、長時間処理が必要な場合はTechnical Authorityで理由を明示

### NFR-502 Retry / Backoff

Retryは、再実行安全性を確認できる操作だけに行う。

- Interactive path: 原則2回以下の追加Retry
- Exponential backoffまたは同等の増加待機を使用する
- Jitter相当を使用し、同時再試行集中を避ける
- Retryによって利用者の待ち時間がNFR-100のTargetを大きく超える場合、同期Retryより明示的な失敗・再試行導線を優先する
- 非同期処理は、追跡可能な形でより長いRetryを許容する

具体的Retry回数・対象Eventは各連携Authorityが定義する。

### NFR-503 Failure Isolation

External SystemのError RateまたはLatency上昇が、無関係なDomainや全Worker / DB接続を連鎖的に枯渇させてはならない。

Technical Authorityは、Concurrency limit、Queue分離、Circuit Breaker相当、Timeout、Bulkhead相当のうち必要な方式を採用する。

### NFR-504 Degraded Mode

外部依存がUnavailableな場合、依存しない能力まで不必要に停止させてはならない。

例:

- Resend障害時も成立済みOrder / Payment / Entitlementを失わない
- Stripe障害時もPublic Site、既存Event Ticket表示、Check-in等の非Payment能力を可能な範囲で維持する
- Supabase Auth障害時は既存Sessionの扱いをIdentity Authorityに従わせ、認証の正当性を推測で補完しない

### NFR-505 Reconciliation

外部障害、Webhook欠落疑い、Timeout、部分失敗後に、内部識別子と外部識別子を用いてReconciliationできなければならない。

Payment Reconciliationの具体手順・対応Eventは `PAY`、その他のDomain照合は各Domain / Operations Authorityへ委譲する。

### NFR-506 Webhook / External Event Resilience

External Event入力境界は、少なくとも以下を検証可能でなければならない。

- 重複受信しても重大副作用を重複成立させない
- 許可される範囲の順序変更で追跡不能にならない
- 検証失敗Eventを業務成功として扱わない
- 処理失敗を観測・Retry・Reconciliation可能にする

---

## 10. Backup

### NFR-600 Backup対象

少なくとも以下をRecovery対象として扱う。

- Productionの業務Database
- Audit Logの永続記録
- 業務運用に必要な構成のうち、Source Controlだけでは復元できないもの
- 外部サービス連携に必要な識別・設定情報のうち、安全にBackupすべきもの

Secret値そのものを通常のDatabase Backupへ混在させてはならない。Secretは承認されたSecret管理方式で復元可能にする。

### NFR-601 Backup頻度 / Recovery Point

Production業務Databaseは、障害時のData Recovery Pointが `15分以内` となる継続的なWAL / Point-in-Time Recovery、増分Backupその他の同等能力を持たなければならない。

加えて、少なくとも1日1回は、Recovery chainの基点として利用できるSnapshot / Base backup相当が正常作成されたことを確認できなければならない。ProviderのPITR方式が論理的に同等以上の復元点と完全性確認を提供する場合は、別個のFull backup file作成を要求しない。

Technical / Infrastructure Authorityは、利用するSupabase構成または代替手段でこの要件を満たす方式を定義する。

### NFR-602 Backup Retention

Recovery目的のProduction Database Backupは、少なくとも直近35日分の復元点を保持する。

これは法的な業務記録保持期間を意味しない。Privacy / Legal / DATA Authorityがより短い削除要件または異なる保持要件を定義する場合は、その整合方法を正式に決定する。

### NFR-603 Backup監視

Backup作成・PITR相当機能の失敗または無効化を24時間以内に検知できなければならない。

連続するRecovery Pointの欠損によってNFR-601を満たせなくなる見込みが生じた場合は、少なくともSev2相当で通知する。

### NFR-604 Restore Test

Production相当データ構造について、隔離された非Production環境へ実際にRestoreするテストを少なくとも四半期ごとに1回実施する。

加えて、イベントCritical Period開始前30日以内に、直近90日以内のRestore Test成功実績が存在しなければならない。

Restore Testは「Backupが存在すること」の確認だけでは不十分で、復元後に代表的なOrder、Payment参照、Event Ticket、Karaoke、Goods、Audit Logの整合性検査を実施する。

---

## 11. Recovery / RPO / RTO

### NFR-700 Recovery Tier

| Tier | 対象 | RPO | RTO | 優先度 |
|---|---|---:|---:|---|
| Tier 0 | Financial Traceability、Order / Payment追跡、Event Ticket、Entry Check-in、Karaoke Receptionに必要な業務DB | ≤ 15分 | Critical Period: ≤ 60分、通常時: ≤ 120分 | 最優先 |
| Tier 1 | Public Site、My Page、Administration、Goods Handover支援、通知処理 | ≤ 15分（DB依存部分） | ≤ 4時間 | Tier 0の次 |
| Tier 2 | 再生成可能なキャッシュ、検索派生物、非重要Analytics等 | Source of Truthから再生成可能 | ≤ 24時間 | 後続 |

### NFR-701 RPO / RTOの意味

RPOは障害時に失われ得るSource of Truthデータの時間幅、RTOは復旧判断後に対象能力が受け入れ可能な状態へ戻るまでの時間とする。

External System自体の復旧時間は本システムのRTO保証対象外だが、External System障害時のDegraded Mode、Reconciliation、復旧後追随は本書の対象とする。

### NFR-702 Recovery優先順位

重大障害では、原則として以下の順序で復旧判断を行う。

1. データの安全性・書込み停止判断
2. Financial Traceabilityの確保
3. No Double Sale / No Double Useを破らない状態の確保
4. Event Ticket / Entry Check-in等の当日Critical能力
5. Order / Payment照合能力
6. Karaoke / Goods現場運用能力
7. Public Site / My Page / Administrationの完全復旧
8. 通知、分析、その他の補助機能

状況によりOperations Authorityが順序を調整できるが、Invariantを犠牲にして表面上のAvailabilityだけを優先してはならない。

### NFR-703 Recovery整合性確認

Restoreまたは重大Recovery後は、サービスを全面再開する前に少なくとも以下を確認する。

- Database Schema / Migration整合性
- Order / Paymentの追跡可能性
- External Payment識別子とのReconciliation可能性
- Entry Entitlement / Check-inの二重利用防止状態
- Karaoke Reservation / Entitlementの整合性
- Goods / Inventory / Handover追跡状態
- Audit Logの継続性

### NFR-704 Manual Recovery

Manual Recoveryは `GLO` の意味に従い、管理された手順で実施する。

Production DBへの直接変更を通常のManual Recoveryとしてはならない。`PRJ-182` に従い、避けられない直接変更は実施者、理由、変更内容、前後検証、事後Reconciliationを記録する。

### NFR-705 Recovery Drill

少なくとも年2回、重大障害を想定したRecovery Drillを行う。そのうち1回はイベントCritical Period前90日以内に実施することを原則とする。

Drillでは、復旧手順の所要時間、権限、連絡経路、Restore、Reconciliation、利用再開判定の実行可能性を確認する。

---

## 12. Event-day Resilience

### NFR-800 Online Authority

`PRJ-194` および `SYS-112` に従い、通常のEntry Check-in / Karaoke Receptionではオンライン状態のサーバーをAuthorityとする。

### NFR-801 Network Failure時の安全性

Staff端末がAuthorityとなるサーバー状態を確認できない場合、UIはCheck-inが正常成立したと誤認させる成功表示をしてはならない。

具体的なOffline Check-in、事前配布データ、後同期方式は本書では定義せず、Check-in / Operations Authorityへ委譲する。

### NFR-802 Venue Network Monitoring

Critical Period中、Staffが利用する会場ネットワークから、少なくともAPI到達性、DNS/TLS、代表的なStaff Read、Check-in経路の疎通を継続監視できる運用を用意する。

監視頻度は1分以下を原則とする。

### NFR-803 Event-day Operational Continuity

Operations Authorityは、通信障害またはHosting / Auth / Database障害が発生した場合の以下を定義しなければならない。

- 障害検知方法
- Staffへの周知
- 受付停止・待機・代替運用の判断条件
- 復旧後のReconciliation
- 二重利用・誤受付リスクの確認

本書は具体的なOffline Check-in業務ルールを先回りして確定しない。

---

## 13. Mobile First / Responsive

### NFR-900 Mobile First

利用者向けUIは `PRJ-160` に従いスマートフォンを第一とする。

少なくとも `320 CSS px` 幅から主要機能を利用でき、代表的なスマートフォン幅 `360–430 CSS px` で購入、Event Ticket表示、Karaoke確認、Goods受取情報確認に不必要な横スクロールを要求してはならない。

### NFR-901 Responsive Range

利用者向けUIは320 CSS pxから1280 CSS px以上まで主要情報と操作を維持する。

データ表等で本質的に横方向が必要なAdministration UIは例外を許容するが、主要操作・Error・確認Actionが画面外に隠れて到達不能になってはならない。

### NFR-902 Touch Operation

主要なPrimary Action、Check-in操作、Electronic Ticket表示操作はTouchで完結できなければならない。

Primary touch targetは原則 `44 × 44 CSS px` 以上とし、少なくともWCAG 2.2 AAのTarget Size要件を下回らない。

### NFR-903 QR提示

Electronic Ticket / Karaoke TicketのQR Code表示は、一般的なスマートフォン画面で読取可能なサイズ・Contrast・余白を確保し、画面回転や通常の表示倍率変更で利用不能になってはならない。

QR Codeだけを唯一の情報提示としてはならず、利用者が対象Event Ticket / Reservationを識別できるテキスト情報を併記する。

### NFR-904 Mobile Performance Budget

Public Siteの主要Landing / 販売導線は、通常初回表示で転送する圧縮済みJavaScriptを原則300 KiB以下、Authenticated主要画面は400 KiB以下をTargetとする。

Target超過は自動的なRelease拒否条件とはしないが、NFR-114を満たせない場合または継続的に増加する場合は性能退行として扱う。

---

## 14. Accessibility

### NFR-0999 Accessibility基準

利用者向けUIはWCAG 2.2 Level AAへの適合を受け入れ基準として採用する。Administration / Staff UIも、主要業務Taskについて同等の原則を適用する。

この基準を採用した理由は `DEC-NFR-001` に記録する。

### NFR-1000 Accessibility Conformance

利用者向けPublic Site、Account、My Page、購入導線、Electronic TicketはWCAG 2.2 Level AAの適用可能なSuccess Criterionを満たさなければならない。

External System内部UIは本システムの直接適合対象外だが、External System選定・設定で回避可能なAccessibility劣化を放置してはならない。

### NFR-1001 Keyboard

すべての主要操作はKeyboardのみで実行可能でなければならない。Focus trap、Keyboardから到達不能なAction、Hoverだけで利用可能な操作を禁止する。

### NFR-1002 Focus

- Visible focus indicatorを提供する。
- Modal / Dialog / Menu等のFocus移動を論理的に管理する。
- Page transitionまたはValidation後にFocus位置が不明になる場合、適切な見出しまたはError summaryへ移動可能にする。

### NFR-1003 Semantic Structure

見出し、Landmark、List、Table、Form control等は、意味に対応するSemantic structureを使用する。見た目だけで構造を表現してはならない。

### NFR-1004 Forms / Errors

- InputにはProgrammaticなLabelを持たせる。
- Errorは色だけで表現しない。
- Error messageは対象FieldまたはError summaryと関連付ける。
- Validation失敗後も入力済み情報を不必要に消失させない。

### NFR-1005 Contrast

Text、重要Icon、Focus indicator、Control境界はWCAG 2.2 AAのContrast基準を満たす。

### NFR-1006 Zoom / Reflow

200% Zoomで主要情報・操作が利用可能であり、320 CSS px相当のViewportで本質的に不要な2次元スクロールを要求しない。

### NFR-1007 Screen Reader

購入、Login / Account recovery、My Page主要情報、Electronic Ticket、Karaoke Reservation確認、主要Errorは、代表的なScreen Reader + Browser組合せで意味と操作順序を理解できなければならない。

### NFR-1008 Motion

OS / Browserの`prefers-reduced-motion`相当を尊重し、必須でないAnimationを低減または無効化できなければならない。点滅・動きだけを重要状態の唯一の表現にしてはならない。

### NFR-1009 Ticket / QR Accessibility

Electronic Ticket / Karaoke Ticketでは、QR Code自体の認識をScreen Readerへ要求してはならない。

少なくとも対象、利用可能性を理解するためのテキスト情報、主要状態、必要な案内をSemantically提供する。QR Token自体を読み上げ用テキストとして露出する必要はない。

### NFR-1010 Accessibility Verification

Release Candidateでは、少なくとも以下を実施する。

- 自動Accessibility scan
- Keyboard-only manual test
- Focus order / focus visible確認
- 200% Zoom / 320 CSS px Reflow確認
- 代表Screen Readerでの主要Journey確認
- Electronic Ticket / Staff UIの現場Task確認

自動Scanだけで適合判定を完了してはならない。

---

## 15. Observability

### NFR-1100 Three Pillars相当

本システムは、Metrics、Operational Log、Trace / Correlation相当の情報を組み合わせ、Critical Business Pathを横断追跡できなければならない。

### NFR-1101 Metrics

少なくとも以下をMetricsとして観測する。

- HTTP Request数、Success / Error、Latency
- 5xx、Timeout、429等の失敗種別
- API / Web RuntimeのCPU、Memory、Restart、Saturation
- Database接続数、Query latency、Error、Pool saturation
- External SystemごとのLatency、Error、Timeout
- Order / Payment連携の処理件数と失敗
- Webhook / External Event受信件数、失敗、Backlog Age
- Async処理のQueue / Pending / Retry / Permanent Failure相当
- Event Ticket表示失敗
- Entry Check-in成功、業務拒否、技術失敗、Latency
- Karaoke Availability / Receptionの失敗
- Goods Handover支援操作の失敗
- Backup / Restore状態

業務状態そのものをMonitoringの都合で別Authorityとして再定義してはならない。

### NFR-1102 Operational Log

Operational Logは障害調査、性能分析、Request追跡のための技術ログであり、`GLO` のAudit Logと区別する。

Operational Logだけで `INV-PRJ-015` Auditabilityを満たしたことにしてはならない。

### NFR-1103 Correlation

重要処理は、秘密情報を含まない範囲で以下のCorrelationを可能にする。

- Request ID
- Trace / Correlation ID
- AccountまたはAuthenticated Principalに対応する内部識別子（必要時のみ）
- Order ID
- Payment内部IDおよび必要な外部決済ID
- Event Ticket / Reservation / Entitlement等の内部ID
- Async job / external event識別子

### NFR-1104 Trace Context

Web → API → Database / Async処理 → External System境界のうち技術的に可能な区間では、同一論理操作のTrace / Correlation contextを継承する。

### NFR-1105 Error Tracking

Unhandled exception、5xx、重大Client errorはError Tracking対象とし、Release version、Environment、Request / Trace ID、影響機能を関連付けられなければならない。

Personal DataやSecretをError payloadへ無制限に添付してはならない。

### NFR-1106 Dashboard

少なくとも以下のDashboard Viewを用意する。

1. System Overview: Availability、Error Rate、Latency、Saturation
2. Sales / Payment: Order開始、Payment連携、External Event、Backlog、Failure
3. Event-day: Event Ticket表示、Entry Check-in、Staff UI、Venue network
4. Async / Notification: Pending、Retry、Permanent Failure相当
5. Backup / Recovery readiness

---

## 16. Logging / Privacy

### NFR-1200 Log Data Minimization

Operational LogにPersonal Dataを記録する場合は、Incident investigationまたは運用に必要な最小限にする。

Email address、氏名、住所、電話番号等をCorrelation目的だけで平文記録してはならず、内部IDを優先する。

### NFR-1201 Secret / Sensitive Data禁止

以下をOperational Log、Trace、Error Tracking、通常Analyticsへ記録してはならない。

- Password
- Refresh Token
- Session Secret / Session Token
- API Secret / Private Key
- Webhook Secret
- Payment card data
- QR Tokenの完全値
- Authorization headerやCookieの完全値
- その他Secret

必要なDebugのためにPayloadを記録する場合も、Field単位のallowlist / redactionを使用する。

### NFR-1202 Operational Log Retention

Production Operational Logは、原則として30日間検索可能に保持する。

長期傾向分析等のためにArchiveする場合でも、原則90日以内とし、より長い保持が必要な場合は目的・対象Data・Access controlを明示したDecisionを必要とする。

### NFR-1203 Audit Log Retention

Audit LogはOperational Logと別に扱い、運用上の監査・事後追跡のため原則365日以上保持する。

これは法的保存期間の断定ではない。Legal / Privacy Authorityが別の要件を定義する場合は、それに従って本書またはAudit Authorityを調整する。

### NFR-1204 Log Access Control

Production Log / Trace / Error TrackingへのAccessは業務上必要な最小権限に限定し、一般開発者が無制限にProduction Personal Dataへアクセスできる運用としてはならない。

### NFR-1205 Audit Log Protection

Audit Logは通常Application操作から任意編集・削除できない構造とし、重要操作の記録欠損をMonitoring可能にする。

具体保存先・SchemaはAudit / DATA / Technical Authorityへ委譲する。

---

## 17. Monitoring / Alerting

### NFR-1300 Alert Severity

| Severity | 定義 | 例 | 目標検知 |
|---|---|---|---|
| Sev1 | Critical Business Pathが停止または重大Invariant破壊の疑いがある | Entry Check-in連続失敗、Payment処理追跡不能疑い、DB unavailable | 条件成立から5分以内 |
| Sev2 | 利用者影響が継続またはSLO違反が拡大中 | 5xx増加、External dependency異常、Backup RPO逸脱見込み | 15分以内 |
| Sev3 | 直ちに重大影響ではないが調査が必要 | Capacity headroom低下、単発Retry増加、性能退行 | 営業・運用時間内に確認可能 |

### NFR-1301 Critical Alert Conditions

少なくとも以下を自動Alert候補とする。

- Entry Check-inの技術失敗率 > 10% が2分継続
- Critical Business Pathの5xx / timeout > 5% が5分継続
- Payment / Webhook相当の未処理Backlog最古Age > 5分
- Database接続不能または主要Query全面失敗
- Backup / PITR相当がNFR-601を満たせない状態
- Audit Log記録経路の重大Failure
- Production Secret / Credential異常の検知

具体Thresholdの追加・Domain別調整はOperations / Technical Authorityで可能だが、本書より緩和して重大障害を見逃す場合はDecisionを必要とする。

### NFR-1302 Alert Routing

Sev1はCritical Period中に即時対応可能な担当へ到達しなければならない。Sev2は運用担当へ通知し、Sev3はNoiseを抑えた非同期Review対象としてよい。

具体的な通知先、連絡手段、当番体制はOperations Authorityへ委譲する。

### NFR-1303 Noise Reduction

同一根本原因による大量Alertを個別通知してはならない。Deduplication、Grouping、Silencing、Dependency-aware inhibition等を利用し、重大SignalがNoiseに埋もれないようにする。

---

## 18. Security-related NFR

### NFR-1400 Boundary Validation

Browser、External API、Webhook、QR、URL parameter、Administration入力等のBoundary inputはSchemaまたは同等の機械検証を通す。

具体SchemaはAPI / Domain Authorityが定義する。

### NFR-1401 Transport Protection

ProductionのBrowser ↔ Web、Web ↔ API、API ↔ External System間の通信は、機密性と完全性を保護するHTTPS / TLSを使用し、平文HTTPを正常運用経路として許可しない。

### NFR-1402 Secret Management

SecretはSource Control、仕様本文、通常Logへ置かず、Environmentごとに分離された承認済みSecret管理手段で管理する。

Production SecretへのAccessは最小権限とし、漏えい疑い時にRotation可能でなければならない。

### NFR-1403 Dependency / Vulnerability Management

Productionで使用する主要DependencyおよびRuntimeについて、既知脆弱性を自動または定期的に検出する。

原則対応目標は以下とする。

- Critical: 72時間以内にMitigationまたは修正版適用方針を決定
- High: 14日以内にMitigationまたは修正版適用

Critical Period直前に重大脆弱性が判明した場合は、Release riskとSecurity riskを評価しOperations / Security手順で判断する。

### NFR-1404 Abuse / Rate Protection

Authentication、Password recovery相当、Purchase start、QR / Check-in、Webhook、Administration等の悪用影響が大きい境界は、Rate limit、Concurrency limit、abuse detection等の保護を持たなければならない。

具体Limit値と例外は `SEC` / `API` Authorityへ委譲する。

### NFR-1405 Security Event Observability

少なくとも以下をSecurity-sensitive eventとして検知・追跡可能にする。

- 認証 / 認可拒否の異常増加
- 管理・Staffの重要操作
- Forced Operation
- Secret / Credential設定変更
- Webhook検証失敗の異常増加
- Rate protectionの継続発動

---

## 19. Privacy / Data Handling

### NFR-1500 Production Data Isolation

`PRJ-133` に従い、Production Personal DataをLocal / Preview / Stagingへそのまま複製してはならない。

非ProductionでProduction由来Dataが必要な場合は、承認された匿名化・最小化手順を使用する。

### NFR-1501 External Data Minimization

Stripe、Resend、Supabaseその他のExternal Systemへ送信するPersonal Dataは、当該連携の目的に必要な最小限とする。

### NFR-1502 Diagnostic Payload

Production incident調査のためのPayload captureは常時全面取得を標準とせず、Field allowlist、Redaction、短期Retention、限定Accessを使用する。

### NFR-1503 Privacy-aware Monitoring

Dashboard / Alert本文には、対応判断に不要なPersonal Dataを含めない。Order ID、内部Account ID、Trace ID等の内部相関子を優先する。

---

## 20. Deployability / Operability

### NFR-1600 Release Health

通常のApplication Deployは、利用者向けCritical Business Pathに計画停止を発生させない方式を原則とする。

### NFR-1601 Readiness / Health

Production Runtimeは、少なくとも以下を区別して判断できなければならない。

- Process自体が稼働しているか
- 新規Trafficを受けられるか
- Database等、Critical dependencyへ必要な到達性があるか

不健康なInstanceへ新規Trafficを送り続けてはならない。

### NFR-1602 Deployment Verification

Production Deploy後、少なくとも以下のSmoke Verificationを自動または半自動で実行する。

- Public Site主要page
- API health / readiness
- Authentication境界の基本確認
- My Page代表Read
- Purchase startの非課金Test pathまたは同等の安全な確認
- Event Ticket表示
- Staff UI代表Read

Productionで実決済・実権利消費を伴う確認を無秩序に実施してはならない。

### NFR-1603 Rollback / Forward Fix

Application Releaseに重大障害があった場合、直前の安全なVersionへのRollbackまたは安全なForward Fixを30分以内に開始できる運用・権限・Artifactを準備する。

Database migrationを伴う場合は、Rollbackだけを前提にせず、互換期間またはForward Fixを含む手順を事前確認する。

### NFR-1604 Migration Safety

Migrationは以下を満たさなければならない。

- 履歴管理されている
- Staging / Production相当Data volumeで事前検証されている
- 長時間LockまたはTable rewrite等の停止影響を評価している
- App versionとの互換性を確認している
- Failure時のRecovery方法がある

### NFR-1605 Configuration Validation

必要なEnvironment variable、External endpoint、Secret参照、Database connection等のConfigurationは、起動時またはDeploy前にValidationし、不完全な構成を正常稼働として公開しない。

### NFR-1606 Feature Flag Safety

Feature Flagを使用する場合、Default値、Environment差異、Emergency disable、Flag削除時の挙動を明示し、古いFlagが永久に業務分岐を残すことを標準運用としてはならない。

### NFR-1607 Production Change Observability

Production Deploy、Migration、重大Configuration変更は、実施Version / 時刻 / 実施主体をIncident investigationで追跡可能にする。

---

## 21. Environment Separation

### NFR-1700 Environment Isolation

Local / Development、Preview / Staging、Productionは論理的に分離し、以下を誤接続させてはならない。

- Database
- Supabase Auth project / tenant相当
- Stripe mode / credential
- Email送信設定
- Webhook endpoint / secret
- Production Secret

### NFR-1701 Non-production Safety

非Productionの操作がProduction利用者へのEmail、Production決済、Production Entitlement、Production Check-in、Production業務DBへ影響してはならない。

### NFR-1702 Representative Test Data

`PRJ-222` に従い、主要Domainの正常・異常・競合ケースを再現できる代表Dataを、Seedまたは再現可能なFixtureで生成できなければならない。

---

## 22. Verification / Testing

### NFR-1800 Verification Matrix

| Quality | Required Verification |
|---|---|
| Performance | Production telemetry、Synthetic、Production相当load test |
| Capacity | Peak / Burst / Mixed workload load test |
| Availability | Synthetic probe + real request SLI |
| Reliability | Retry、duplicate、out-of-order、process restart、concurrency test |
| Backup | Backup status監視 + actual Restore Test |
| Recovery | Recovery Drill + Reconciliation確認 |
| Accessibility | Automated + Keyboard + Zoom/Reflow + Screen Reader manual test |
| Mobile First | representative mobile viewport + mobile network test |
| Observability | fault injectionでMetric / Log / Trace / Alertが得られることを確認 |
| Security NFR | dependency scan、secret scan、boundary validation test、rate protection test |
| Deployability | staging deploy、migration rehearsal、smoke、rollback / forward-fix rehearsal |

### NFR-1801 Performance Test Reproducibility

Load testは、以下をVersion管理または結果記録で再現可能にする。

- Test scenario
- Data volume
- Concurrency / rate
- Duration
- Environment
- Application version
- Database size / representative distribution
- External dependency stub / real dependencyの区別
- Result summary

### NFR-1802 Failure Injection

少なくとも以下のFailureを非Productionで定期的に再現する。

- Stripe / Auth / Email timeout
- External 5xx
- Duplicate external event
- Out-of-order external event
- Database connection interruption
- Worker / API process restart
- Network latency増大

Failure Injectionは本番業務データや実決済へ影響させない。

### NFR-1803 Invariant under Load

Performance / Capacity試験はResponse timeだけで合否判定してはならない。試験後にNo Double Sale、No Double Use、Financial Traceability、Auditabilityに違反する状態がないことを検査する。

### NFR-1804 Release Gate Integration

`PRJ-232` のtypecheck / lint / test / buildに加え、Productionへ影響の大きい変更では以下をRelease Gateへ追加する。

- 対象DomainのE2E / integration test
- Migration validation
- Security scan
- Accessibility regression check
- Critical Business Path smoke

全Releaseで常に全Peak load testを実行することは要求しない。Capacityに影響する変更、重要依存更新、Critical Period前Releaseでは実施する。

---

## 23. Authority委譲

### NFR-1900 Authority境界

| 項目 | 本書のAuthority | 委譲先 |
|---|---|---|
| Performance / Capacity / Availability target | 数値基準・測定方法 | Technical / API / Webが実現方式を定義 |
| Order / Payment / Ticket等の状態 | 非機能品質のみ | `ORD` / `PAY` / `TKT` / `KAR` / `GDS` |
| Check-inの性能・可用性 | SLO / Capacity / Recoverability | Check-in / QRが具体業務仕様とState transitionを定義 |
| Role / Capability | 観測・最小権限等の品質要求 | `SEC` |
| DB durability / recovery quality | RPO / RTO / Backup / integrity requirement | `DATA` / TechnicalがSchema・Constraint・backup mechanismを定義 |
| API quality | latency / timeout / error observability | `API` がendpoint Contractを定義 |
| Audit Log / Operational Log | 横断品質・保持の原則 | Audit / Operations / DATA / Technicalが具体実装を定義 |
| Incident / Manual Recovery | 必要品質・RTO・検証 | OperationsがRunbook、連絡、手順を定義 |
| Offline Check-in | Recovery / safety requirementのみ | Check-in / Operationsが業務ルールを定義 |
| Accessibility | WCAG 2.2 AA、検証基準 | Web / UX / Staff UIがUI詳細を定義 |
| Test strategy | 必須検証の対象 | `TEST` がTest architecture / suite ownershipを定義 |

### NFR-1901 再定義禁止

後続Technical / Domain / Operations仕様は、本書のTargetを実現するための具体方式を定義できるが、本書のSLI/SLO/RPO/RTO/Retention等を黙示的に変更してはならない。

変更が必要な場合はNFR AuthorityのDecisionを伴う正式改訂を行う。

---

## 24. 受け入れ条件

### NFR-2000 Review Acceptance

本書は、少なくとも以下を満たしたときレビュー可能な完成版とみなす。

- [ ] `PRJ` の性能、可用性、Backup、Recovery、Mobile First、Accessibility、Observability、環境分離、Release品質原則を具体化している。
- [ ] `SYS` のSystem Boundary、Actor、External System、Critical Journeyを変更していない。
- [ ] `GLO` のDomain Languageを使用し、Audit LogとOperational Log、Recovery / Manual Recovery / Reconciliationを区別している。
- [ ] Performance要件に測定地点、Percentile、負荷条件、除外条件、検証方法がある。
- [ ] Capacity / Peak Loadの最低検証Envelopeがある。
- [ ] Availability SLOとCritical Period運用基準がある。
- [ ] Financial Traceability、No Double Sale、No Double Use、Server-side Authorization、Recoverability、Auditabilityを負荷・障害時にも守る。
- [ ] External Systemの遅延・重複・順序変更・障害を前提にしている。
- [ ] Backup頻度相当、Retention、Restore Test、RPO、RTO、Recovery優先順位を定義している。
- [ ] Event-day Network Failure時にオンラインAuthorityを維持し、Offline業務仕様を先回りして定義していない。
- [ ] 利用者向けUIにWCAG 2.2 AAの受け入れ基準がある。
- [ ] Mobile FirstのViewport、Touch、QR、Performance要件がある。
- [ ] Metrics、Operational Log、Error tracking、Correlation、Dashboard、Alert severityを定義している。
- [ ] Personal Data、Secret、Payment card data、Token等のLog禁止・最小化を定義している。
- [ ] Security-related NFRを横断品質として定義し、Authorizationそのものを再定義していない。
- [ ] Deployment、Migration、Rollback / Forward Fix、Environment separationの検証基準がある。
- [ ] Verification / Testing方法が要件へ対応している。
- [ ] Domain / DATA / API / SEC / TEST / Operations / TechnicalへのAuthority委譲が明確である。
- [ ] Handoffが後続仕様に必要な前提を提供している。

---

## 25. Decision Log

### DEC-NFR-001 Accessibility基準

**決定:** 利用者向けUIはWCAG 2.2 Level AAを受け入れ基準とし、Administration / Staff UIも主要Taskについて同等原則を適用する。

**理由:** `PRJ-161` を機械的・手動に検証可能な基準へ落とし込むため。

**却下した主要案:** 特定の標準を採用せず抽象的なAccessibility目標だけを置く案。

**影響範囲:** Web / UX、Administration、Staff UI、TEST。

### DEC-NFR-002 Performance Targetの二層化

**決定:** External System待ちを含むEnd-to-End時間と、本システム内部Server Latencyを分離して測定する。

**理由:** Stripe Checkout等のExternal System内部性能を本システムのSLOと誤認せず、内部退行を客観的に検知するため。

**却下した主要案:** 利用者操作全体を単一の「2秒以内」等で評価する案。

**影響範囲:** API、Web、PAY、IDN、Technical、Observability。

### DEC-NFR-003 Capacity Envelope

**決定:** 無限Scaleを要求せず、Public 1,000 concurrent、API 75 req/s級、Purchase 25 req/s、Entry Check-in 2/s sustained等の最低検証Envelopeを固定する。

**理由:** イベント用途として合理的な安全余裕を持ちつつ、過剰なEnterprise構成を要求せず、実装・負荷試験の合否を一意にするため。

**却下した主要案:** Capacityを「必要に応じてScale」のみとし、数値を定義しない案。

**影響範囲:** Technical / Infrastructure、DATA、API、TEST、Operations。

### DEC-NFR-004 Database RPO / RTO

**決定:** 重要業務DatabaseのRPOを15分以内、Tier 0 RTOをCritical Period 60分・通常時120分とする。

**理由:** Payment、Entitlement、Check-in等の追跡性を保ちつつ、本システム規模で現実的に検証可能なRecovery目標とするため。

**却下した主要案:** RPO 24時間の日次Backupのみ、およびRPO 0の同期多重化必須案。

**影響範囲:** Supabase構成、Backup、Operations、DATA、Technical、費用。

### DEC-NFR-005 Operational Log / Audit Log Retention

**決定:** Operational Logは原則30日検索可能、90日以内Archive、Audit Logは原則365日以上保持する。

**理由:** Incident調査・性能分析と、重要操作の事後追跡の責任を分離しつつ、無期限保持を避けるため。

**却下した主要案:** 全Logを同一Retentionで永久保持する案。

**影響範囲:** Observability、Audit / Operations、Privacy、Technical、費用。

### DEC-NFR-006 Critical Period Change Freeze

**決定:** Critical Period中は計画停止を禁止し、原則として開始2時間前から非緊急Production変更を凍結する。

**理由:** 販売開始・入場・受付等の短時間高影響業務で、変更起因Incidentのリスクを低減するため。

**却下した主要案:** 通常時と同じRelease運用をCritical Periodにも適用する案。

**影響範囲:** Release / Operations / Technical。

---

## 26. Open Issues / Spec Conflicts

### 26.1 Open Issues

本書の作成時点で、NFR Authorityとして未確定の `OPEN-NFR-xxx` は存在しない。

以下はOpen Issueではなく、各Authorityへ委譲済みである。

- Offline Check-inの具体方式
- Role / Capability一覧
- Stripe Webhook Event / Payment State Machine
- Order / Ticket / Karaoke / Goods State Machine
- DB Constraint / Index / Lock
- API Contract
- Alert通知先と当番表
- 具体的なHosting plan / region / autoscale設定
- 法的な記録保持期間

### 26.2 Spec Conflicts

`PRJ`、`SYS`、`GLO` の間に、本書で解消を必要とする本質的なSpec Conflictは確認されていない。

---

## 27. Handoff

### 27.1 この仕様書で確定した事項

後続仕様は、少なくとも以下を前提としてよい。

- Critical Business PathのServer-side p95 / p99性能Targetを定義した。
- Public 1,000 concurrent、Purchase 25 req/s、Entry Check-in 2/s sustained等の最低Capacity Envelopeを定義した。
- Public / My Page / Purchase / Event Ticket / Entry Check-in / Karaoke / AdministrationのAvailability SLOを定義した。
- Critical PeriodではPlanned Downtimeを許可せず、開始2時間前から非緊急Production変更を凍結する。
- 重要業務DatabaseはRPO 15分以内とする。
- Tier 0はCritical Period RTO 60分、通常時RTO 120分とする。
- Backupは35日以上のRecovery Pointを保持し、四半期Restore TestとCritical Period前の実績確認を要求する。
- External System待ち時間と本システム内部Latencyを分離する。
- External failureにTimeout、Retry safety、Backoff、Failure Isolation、Degraded Mode、Reconciliationを要求する。
- Event-day通常受付はオンラインのServer Authorityを正とし、到達不能時に成功を誤表示しない。
- 利用者向けUIはWCAG 2.2 AAを受け入れ基準とする。
- Mobile Firstとして320 CSS px以上、主要Touch target原則44 × 44 CSS px、主要Web Vitals targetを定義した。
- Metrics、Operational Log、Trace / Correlation、Error Tracking、Dashboard、Alert severityを必須とした。
- Operational LogとAudit Logを分離し、Operational Logは原則30日検索可能、Audit Logは原則365日以上保持する。
- Production LogにSecret、Password、Token、Payment card data等を出力しない。
- Production / non-productionをDatabase、Auth、Payment、Email、Webhook、Secretまで分離する。
- Migration、Rollback / Forward Fix、Health / Readiness、Smoke verificationの品質基準を定義した。

### 27.2 他仕様が前提としてよいInvariant

- **INV-NFR-001 成功応答後の追跡可能性:** 重要操作が成功として返された後に追跡不能にならない。
- **INV-NFR-002 Critical Invariant Preservation:** 負荷、Retry、Timeout、重複、順序変更、Deploy、部分障害時にも `INV-PRJ-010`〜`INV-PRJ-015` を破らない。
- **NFR-401 Idempotency Quality:** 同一論理操作のRetryが重大副作用を重複成立させない。
- **NFR-704 Manual Recovery:** Manual RecoveryをProduction DB直接変更と同義にしない。
- **NFR-801 Network Failure時の安全性:** Server Authorityへ到達できない状態を正常Check-in成功として表示しない。
- **NFR-1102 Operational Log:** Operational LogをAudit Logの代替にしない。

### 27.3 他仕様への要求

#### Identity Spec (`IDN`)

- Authenticated User、Account、Profile、Authenticated Principalを `GLO` に従って分離すること。
- Auth依存のTimeout / Degraded behavior / Session継続条件をNFR-500系と整合させること。
- Account recovery等のCritical user flowをAccessibility / Mobile First要件へ適合させること。
- Security-sensitive Authentication eventをNFR-1405へ接続すること。

#### Product / Catalog Spec

- Sale Availability取得がNFR-101 / NFR-201を満たせるDomain query境界を持つこと。
- Publication StateとSale Availabilityを混同しないこと。
- Peak販売開始時に表示情報取得がPurchase処理を不必要に圧迫しない設計を可能にすること。

#### Order Spec (`ORD`)

- Order作成前後で `INV-PRJ-001` / Financial Traceabilityを満たすこと。
- Duplicate / Retry / Timeout下でもNFR-401を満たすState transitionを定義すること。
- Purchase startがNFR-103 / NFR-203を満たせるよう、同期必須処理と再試行可能副作用を分離すること。

#### Payment Spec (`PAY`)

- External Payment待ちと内部処理時間を分離して観測可能にすること。
- Payment result ingestionはNFR-105 / NFR-204 / NFR-506を満たすこと。
- Retry、duplicate、out-of-order、Webhook欠落疑いからReconciliation可能にすること。
- Resend等の副作用失敗で確定済みPayment / Orderを失わないこと。

#### Event Ticket Spec (`TKT`)

- Event Ticket / Electronic Ticket取得がNFR-106 / NFR-304を満たせること。
- Ticket / Entry Entitlementの重要状態をRPO / RTO対象Tier 0として扱うこと。
- QR Code表示不能がEntitlementの消失とならないよう `GLO-701` を維持すること。

#### Karaoke Spec (`KAR`)

- Karaoke AvailabilityがNFR-107 / NFR-205を満たせること。
- Hold / Reservation競合がNFR-203負荷下でもNo Double Saleを破らないこと。
- Karaoke ReceptionがNFR-111 / NFR-207 / Event-day resilienceに適合すること。

#### Goods Spec (`GDS`)

- Goods購入がNFR-109 / NFR-203に適合すること。
- Inventory / Handoverの重複・Retry時に追跡不能や二重正常結果を作らないこと。
- Venue Pickup / HandoverのStaff操作をNFR-208で検証可能にすること。

#### Check-in / QR Spec

- Entry Check-inがNFR-110 / NFR-206 / NFR-305を満たすこと。
- QR Scan、Validation、Check-inを `GLO` に従って分離すること。
- Online Server Authorityを通常系とし、Network Failure時に成功を推測しないこと。
- Offline例外運用を採用する場合は、復旧後ReconciliationとNo Double Use対策を明示すること。

#### Security / Authorization Spec (`SEC`)

- すべての保護操作のServer-side Authorizationを維持すること。
- Rate / Abuse protectionの具体LimitとSecurity event監視を定義すること。
- Production Observability / Log accessをLeast Privilegeにすること。
- Secret access / rotation / incident handlingを具体化すること。

#### DATA Spec

- NFR-601のRPO、NFR-700のRTOを満たすBackup / Restore可能性を前提に物理設計すること。
- Financial Traceability、No Double Sale、No Double UseをConcurrency test可能なConstraint / Transaction / Lockへ変換すること。
- MigrationはNFR-1604を満たすこと。
- Backup / Restore後にNFR-703の整合性確認が可能な識別子・関係を保持すること。

#### API Spec

- EndpointごとにNFR-100の対象Performance classを対応付けられること。
- Request ID / Correlation IDを一貫して扱えるContractを設計すること。
- Timeout / retryされる可能性がある操作についてIdempotency semanticsを明確にすること。
- Error contractで業務拒否と技術FailureをMonitoring上区別可能にすること。

#### TEST Spec

- 本書の各NFR IDをTest typeへTraceableに対応付けること。
- Load、Concurrency、Duplicate、Out-of-order、Failure Injection、Restore、Accessibility manual testをTest strategyへ含めること。
- NFR-1803に従い、Performance test後にInvariant検査を行うこと。

#### Operations Spec

- Critical Periodの具体時刻、当番、Sev1 / Sev2 escalation、Change Freeze運用を定義すること。
- Backup監視、Restore Test、Recovery Drill、Reconciliation、Manual Recovery手順をRunbook化すること。
- Event-day venue network monitoringとNetwork Failure時の現場判断を定義すること。
- Production DB直接変更を通常運用としないこと。

#### Technical / Infrastructure Spec

- NFR-200 Capacity EnvelopeとNFR-300 Availability SLOを満たすVercel / Railway / Supabase構成を定義すること。
- Health / Readiness、Timeout、Failure Isolation、autoscale / resource limit、Observability backendを具体化すること。
- RPO 15分、Backup 35日、Restore Test可能性を満たすData基盤構成を定義すること。
- Environment separation、Secret management、Deployment / Rollback / Migration safetyを具体化すること。

### 27.4 未確定事項

NFR Authorityレベルではなし。

後続Domain / Operations / Technical Authorityが具体化すべき事項はOpen Issueとして重複管理しない。

### 27.5 次に作成することを推奨する仕様

**Identity / Account / Profile仕様（Spec Prefix: `IDN`）**

`PRJ`、`SYS`、`GLO`、本書 `NFR` を前提に、Authenticationと業務上のAccount / Profile / Authenticated Principalの境界を先に固定することを推奨する。

理由:

- Order、My Page、Ticket、Karaoke、Goods等が利用者固有状態を関連付ける基点になる。
- `SYS` でSupabase AuthがExternal Systemとされ、内部Identity modelは未確定である。
- `GLO` がUser / Account / Profile / Authenticated Principalを明示的に分離しており、早期にIdentity Authorityへ落とし込む必要がある。
- `NFR` のAuthentication依存、Security event、Mobile / Accessibility、External System resilienceを具体Domainへ接続できる。

`PRJ`、`SYS`、`GLO`、`NFR` からIdentity仕様の正式ファイル名は一意に確定できないため、本書ではファイルパスを新規命名しない。
