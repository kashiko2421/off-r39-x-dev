"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ProfilePage() {
  const { user, hydrated, updateProfile } = useStore();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/account/login?redirect=/mypage/profile");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ログイン確定後にフォーム初期値を同期する
    setDisplayName(user.displayName);
  }, [hydrated, user, router]);

  if (!hydrated || !user) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateProfile(displayName);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-xl font-semibold">プロフィール</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">アカウント情報</CardTitle>
          <CardDescription>本モックでは表示名のみ変更できます。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>メールアドレス</Label>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">表示名</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            {saved && (
              <Alert>
                <AlertDescription>保存しました。</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full">
              保存する
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
