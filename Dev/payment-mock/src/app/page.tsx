import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

// SPEC-050 PG-PUB-001 Event Home相当。お知らせ機能自体は今回のモック対象外のため、
// 開催情報・会場・注意事項・FAQの各Sectionは簡易な固定表示にとどめる。
export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center space-y-3 py-6">
        <p className="text-sm text-muted-foreground">2027年開催</p>
        <h1 className="text-2xl font-bold tracking-tight">off r39&apos;x in 大阪らへん2027</h1>
        <p className="text-sm text-muted-foreground">
          「二次元らへん」コミュニティのオフ会をベースに、一般参加者も歓迎するイベントです。
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">開催日時</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">2027年（開催日未定・調整中）</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">会場・アクセス</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">会場情報は調整中です。</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">注意事項</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            当日の注意事項は決定次第公開します。
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">入場チケット</CardTitle>
            <CardDescription>会場入場に必要な電子チケットです。</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" nativeButton={false} render={<Link href="/entry">見る</Link>} />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">カラオケ</CardTitle>
            <CardDescription>時間枠を選んで予約・購入できます。</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" nativeButton={false} render={<Link href="/karaoke">見る</Link>} />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">グッズ</CardTitle>
            <CardDescription>会場受け渡しのオリジナルグッズです。</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" nativeButton={false} render={<Link href="/goods">見る</Link>} />
          </CardFooter>
        </Card>
      </section>

      <p className="text-xs text-center text-muted-foreground">
        本ページは決済フロー確認用モックの簡易トップページです（お知らせ・FAQ機能は今回のモック対象外）。
      </p>
    </div>
  );
}
