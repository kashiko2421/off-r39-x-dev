import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminHomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">管理画面（デモ）</h1>

      <Alert>
        <AlertTitle>この画面は権限チェックを行っていません</AlertTitle>
        <AlertDescription>
          本モックでは運営管理者Roleの認可（DEC-J-02）を実装していません。実仕様ではAdmin/Staff等のRoleに応じたアクセス制御が必要です（handoff 23章）。
        </AlertDescription>
      </Alert>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">注文管理</CardTitle>
            <CardDescription>
              注文一覧・決済状態の確認、Order強制取消（DEC-B-03）ができます。
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" nativeButton={false} render={<Link href="/admin/orders">開く</Link>} />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">カラオケ枠管理</CardTitle>
            <CardDescription>枠の一括生成・編集・販売停止（handoff 16章）。</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" nativeButton={false} render={<Link href="/admin/karaoke">開く</Link>} />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
