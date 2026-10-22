"""Generate the first 100,000 decimal digits of pi using Chudnovsky binary splitting.

Run: python3 scripts/generate_pi.py
Only Python's standard library is required.
"""
import sys
from decimal import Decimal, localcontext
from pathlib import Path

sys.set_int_max_str_digits(0)
DIGITS = 100_000
C = 640320**3 // 24


def binary_split(a, b):
    if b - a == 1:
        if a == 0:
            return 1, 1, 13591409
        p = (6 * a - 5) * (2 * a - 1) * (6 * a - 1)
        q = a**3 * C
        t = p * (13591409 + 545140134 * a)
        return p, q, -t if a % 2 else t
    mid = (a + b) // 2
    p1, q1, t1 = binary_split(a, mid)
    p2, q2, t2 = binary_split(mid, b)
    return p1 * p2, q1 * q2, t1 * q2 + p1 * t2


_, q, t = binary_split(0, DIGITS // 14 + 2)
with localcontext() as context:
    context.prec = DIGITS + 25
    result = str(Decimal(426880) * Decimal(10005).sqrt() * Decimal(q) / Decimal(t))
text = result.replace('.', '')[:DIGITS + 1]
assert len(text) == DIGITS + 1
assert text.startswith('314159265358979323846264338327950288419716939937510')
destination = Path(__file__).resolve().parents[1] / 'data' / 'pi-100000.txt'
destination.write_text(text + '\n')
print(f'Wrote {DIGITS:,} decimal digits to {destination}')
