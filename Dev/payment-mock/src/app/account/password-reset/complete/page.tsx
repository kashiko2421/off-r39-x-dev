"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

// SPEC-050 PG-AUTH-005: 正規のreset context下でのみパスワード更新を許可する想定の画面。
// 本モックではreset contextの検証自体は行わず、画面遷移のみを再現する。
export default function PasswordResetCompletePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      setError(`パスワードは${PASSWORD_MIN_LENGTH}文字以上${PASSWORD_MAX_LENGTH}文字以下で入力してください（SEC-AUTH-016）。`);
      return;
    }
    if (password !== confirm) {
      setError("確認用パスワードが一致しません。");
      return;
    }
    setError(null);
    router.push("/account/login");
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>新しいパスワードの設定</CardTitle>
          <CardDescription>
            画面確認用のモックです。Password resetは既存の注文・チケット・予約の所有者を変更しません。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">新しいパスワード</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                maxLength={PASSWORD_MAX_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">新しいパスワード（確認）</Label>
              <Input
                id="confirm"
                type="password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                maxLength={PASSWORD_MAX_LENGTH}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full">
              パスワードを更新する
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
