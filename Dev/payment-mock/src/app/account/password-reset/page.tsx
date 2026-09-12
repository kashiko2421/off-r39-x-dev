"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function PasswordResetRequestPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSent(true);
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>パスワード再設定</CardTitle>
          <CardDescription>
            画面確認用のモックです。実際のメール送信・再設定処理は行いません。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <Alert>
                <AlertTitle>再設定メールを送信しました</AlertTitle>
                <AlertDescription>
                  {email} 宛にパスワード再設定用のメールを送信しました（モック）。
                </AlertDescription>
              </Alert>
              <Button
                className="w-full"
                variant="outline"
                nativeButton={false}
                render={<Link href="/account/password-reset/complete">（デモ）メール内のリンクをクリックした想定にする</Link>}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">登録済みのメールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                再設定メールを送信する
              </Button>
            </form>
          )}
          <p className="text-xs text-muted-foreground text-center mt-4">
            <Link href="/account/login" className="underline underline-offset-2">
              ログイン画面に戻る
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
