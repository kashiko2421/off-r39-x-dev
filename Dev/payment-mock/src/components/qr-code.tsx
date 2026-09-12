// handoff 11章: QRコード仕様のモック表示。
// 実際にスキャン可能なQRエンコードではなく、コード文字列から決定論的に生成した
// QR風の模様（見た目確認用のプレースホルダー）を表示する。
function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}

function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GRID = 21;

function isFinderArea(r: number, c: number): boolean {
  const corners = [
    [0, 0],
    [0, GRID - 7],
    [GRID - 7, 0],
  ];
  return corners.some(([r0, c0]) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7);
}

function finderValue(r: number, c: number, r0: number, c0: number): boolean {
  const dr = r - r0;
  const dc = c - c0;
  const isBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
  const isCore = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
  return isBorder || isCore;
}

export function PseudoQr({ value, size = 168 }: { value: string; size?: number }) {
  const rand = mulberry32(hashSeed(value));
  const cells: boolean[] = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      cells.push(rand() > 0.55);
    }
  }

  const corners: Array<[number, number]> = [
    [0, 0],
    [0, GRID - 7],
    [GRID - 7, 0],
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${GRID} ${GRID}`}
      role="img"
      aria-label="モックQRコード"
      className="rounded-md border bg-white p-0.5"
    >
      <rect width={GRID} height={GRID} fill="white" />
      {Array.from({ length: GRID }).map((_, r) =>
        Array.from({ length: GRID }).map((_, c) => {
          if (isFinderArea(r, c)) return null;
          const filled = cells[r * GRID + c];
          if (!filled) return null;
          return <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="black" />;
        }),
      )}
      {corners.map(([r0, c0]) =>
        Array.from({ length: 7 }).map((_, dr) =>
          Array.from({ length: 7 }).map((_, dc) => {
            if (!finderValue(r0 + dr, c0 + dc, r0, c0)) return null;
            return (
              <rect
                key={`f-${r0}-${c0}-${dr}-${dc}`}
                x={c0 + dc}
                y={r0 + dr}
                width={1}
                height={1}
                fill="black"
              />
            );
          }),
        ),
      )}
    </svg>
  );
}
