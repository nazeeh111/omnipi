# π digit provenance

OmniPi ships the first 1,000,000 digits **after** the decimal point in `data/pi-1000000.txt`.

- Source: [TidyTuesday, 2026-03-24, `pi_digits.csv`](https://github.com/rfordatascience/tidytuesday/blob/826bfb0590ff746ccb152e143b26ed98456c2f27/data/2026/2026-03-24/pi_digits.csv), accessed October 22, 2026.
- Source SHA-256: `e342f5eff69ed458287fa06c52f9b881a27785c3f9fd209d1735ecf4010f0f12`.
- Transformation: verified each row's sequential `digit_position` and single decimal `digit`; removed the initial `3` from the searchable decimal sequence; wrote `3` followed by exactly 1,000,000 decimal digits and a newline.
- Output SHA-256: `146e73fb1076ed23827cd8c6dedb70a7d5de8126aa29c643f5e59d489aa4f4fa`.
- Cross-check: the first 100,000 decimal digits match `data/pi-100000.txt`, independently calculated with `scripts/generate_pi.py` using Chudnovsky binary splitting.

These checks establish the file structure and a substantial prefix match. They do not independently prove every remaining digit against a second million-digit calculation.
