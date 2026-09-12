"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { safeContinuationPath } from "@/lib/continuation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

function LoginForm() {
  const { login } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    login(email);
    // AR-CONT-001/003: Continuation Intentは内部Routeのallowlistで検証し、外部URLへは遷移しない
    router.push(safeContinuationPath(searchParams.get("redirect")));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス</Label>
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
        ログイン
      </Button>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <Link href="/account/register" className="underline underline-offset-2 hover:text-foreground">
          新規登録はこちら
        </Link>
        <Link href="/account/password-reset" className="underline underline-offset-2 hover:text-foreground">
          パスワードを忘れた方
        </Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
          <CardDescription>
            画面確認用の簡易ログインです。実際の認証・パスワード検証は行いません。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              メールアドレスを入力するだけでログイン状態になります（モック）。
            </AlertDescription>
          </Alert>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
