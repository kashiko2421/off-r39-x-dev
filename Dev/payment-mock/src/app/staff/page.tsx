import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function StaffHomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">スタッフ向け受付（デモ）</h1>

      <Alert>
        <AlertTitle>この画面は権限チェックを行っていません</AlertTitle>
        <AlertDescription>
          実仕様ではスタッフRoleに応じたアクセス制御・会場の通信環境を前提とした設計が必要です（SYS-112, PRJ-194）。
        </AlertDescription>
      </Alert>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">入場受付</CardTitle>
            <CardDescription>入場チケットのQRを照会し、受付・使用済み化します。</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" nativeButton={false} render={<Link href="/staff/check-in">開く</Link>} />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">カラオケ受付</CardTitle>
            <CardDescription>カラオケ予約のQRを照会し、予約情報を確認して受付します。</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" nativeButton={false} render={<Link href="/staff/karaoke">開く</Link>} />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
