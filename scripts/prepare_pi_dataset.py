"""Convert TidyTuesday's pi_digits.csv into OmniPi's searchable digit file.

Usage: python3 scripts/prepare_pi_dataset.py /path/to/pi_digits.csv /path/to/output.txt
This never fetches data or replaces the shipped file implicitly.
"""
import csv
import hashlib
import sys
from pathlib import Path


def main(source: Path, destination: Path) -> None:
    if destination.exists():
        raise SystemExit(f"Output already exists: {destination}")
    digits = []
    with source.open(newline="") as stream:
        for position, row in enumerate(csv.DictReader(stream), 1):
            digit = row["digit"]
            if row["digit_position"] != str(position) or len(digit) != 1 or digit not in "0123456789":
                raise ValueError(f"Invalid digit row at position {position}")
            digits.append(digit)
    if len(digits) != 1_000_001 or digits[0] != "3":
        raise ValueError("Expected the integer 3 plus one million decimal digits")
    independent = (Path(__file__).resolve().parents[1] / "data/pi-100000.txt").read_text().strip()
    if "".join(digits[:100_001]) != independent:
        raise ValueError("First 100,000 decimal digits differ from independent calculation")
    destination.write_text("".join(digits) + "\n")
    digest = hashlib.sha256(destination.read_bytes()).hexdigest()
    print(f"Wrote {destination} (SHA-256 {digest})")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(Path(sys.argv[1]), Path(sys.argv[2]))
