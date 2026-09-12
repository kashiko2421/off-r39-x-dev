// SPEC-060 §29 (AR-CONT-001/003): Continuation Intent(認証後の復帰先)は
// 内部Routeのallowlistに一致する場合だけ使用し、外部URL・プロトコル相対URLへは遷移しない。
const SAFE_PREFIXES = ["/cart", "/mypage", "/purchase/orders", "/entry", "/karaoke", "/goods"];

export function safeContinuationPath(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  if (SAFE_PREFIXES.some((prefix) => raw === prefix || raw.startsWith(`${prefix}/`))) {
    return raw;
  }
  return "/";
}
