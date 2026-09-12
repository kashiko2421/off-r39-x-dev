"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// SEC-AUTH-016: 新規Password設定は12文字以上128文字以下を要求する
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

// handoff 6章: 新規登録 → メール認証 → ログイン、の流れを画面遷移として再現する。
// 実際のメール送信・パスワード検証(Supabase Auth委譲)は行わない。
export default function RegisterPage() {
  const { login } = useStore();
  const router = useRouter();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      setPasswordError(
        `パスワードは${PASSWORD_MIN_LENGTH}文字以上${PASSWORD_MAX_LENGTH}文字以下で入力してください（SEC-AUTH-016）。`,
      );
      return;
    }
    setPasswordError(null);
    setStep("verify");
  }

  function handleVerify() {
    login(email, displayName);
    router.push("/");
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>新規登録</CardTitle>
          <CardDescription>
            画面確認用の簡易登録です。実際のパスワード保存・メール送信は行いません。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "form" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">表示名</Label>
                <Input
                  id="displayName"
                  required
                  placeholder="やまだ たろう"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                  maxLength={PASSWORD_MAX_LENGTH}
                  placeholder={`${PASSWORD_MIN_LENGTH}文字以上${PASSWORD_MAX_LENGTH}文字以下`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(null);
                  }}
                />
                {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
              </div>
              <Button type="submit" className="w-full">
                登録する
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                すでにアカウントをお持ちの方は{" "}
                <Link href="/account/login" className="underline underline-offset-2">
                  ログイン
                </Link>
              </p>
            </form>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertTitle>確認メールを送信しました</AlertTitle>
                <AlertDescription>
                  {email} 宛に確認メールを送信しました（モック）。メール内のリンクをクリックすると登録が完了します。
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={handleVerify}>
                （デモ）メール内のリンクをクリックした想定にする
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
