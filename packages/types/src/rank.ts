// ============================================================================
// Fractional ranking (LexoRank-lite) for drag/drop ordering.
//
// We store a string `rank` per issue. To move an item between two neighbours
// we compute a string that sorts strictly between them — no renumbering of the
// rest of the column. Ranks are treated as base-62 fractions (an implied
// leading "0."), and we emit the shortest midpoint.
// ============================================================================

const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE = DIGITS.length; // 62

function digit(c: string): number {
  const i = DIGITS.indexOf(c);
  return i < 0 ? 0 : i;
}

/**
 * Return a rank string strictly between `a` and `b`.
 * Pass `null` for an open bound (start or end of the list).
 *
 * Treats each string as the fractional part of a base-62 number: missing
 * digits on `a` read as 0 (its smallest extension); a null/exhausted `b`
 * reads as BASE (its largest extension).
 */
export function rankBetween(a: string | null, b: string | null): string {
  if (a !== null && b !== null && a >= b) {
    throw new Error(`rankBetween: lower "${a}" must sort before upper "${b}"`);
  }

  let result = '';
  let i = 0;
  let upperOpen = b === null; // once true, b imposes no further ceiling

  for (;;) {
    const da = a !== null && i < a.length ? digit(a[i]) : 0;
    const db = !upperOpen && b !== null && i < b.length ? digit(b[i]) : BASE;

    const mid = (da + db) >> 1;
    if (mid > da) {
      return result + DIGITS[mid];
    }

    // No gap at this position. Keep `a`'s digit and descend. If `b` was strictly
    // greater here, every deeper position of `a` is already below `b`, so the
    // ceiling opens up.
    if (db > da) upperOpen = true;
    result += DIGITS[da];
    i++;
  }
}

/** Initial rank for the first item in an empty column. */
export function firstRank(): string {
  return DIGITS[Math.floor(BASE / 2)]; // a comfortable middle, "V"
}
