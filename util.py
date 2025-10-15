SUFFIXES = [
    "",
    "K",
    "M",
    "B",
    "T",
    "Qa",
    "Qi",
    "Sx",
    "Sp",
    "Oc",
    "No",
    "Dc",
    "Ud",
    "Dd",
    "Td",
    "Qd",
    "Qn",
    "Sxd",
    "Spd",
    "Ocd",
    "Nod",
]


def fmt(value: float) -> str:
    n = float(value)
    if n == 0:
        return "0"
    sign = "-" if n < 0 else ""
    n = abs(n)
    magnitude = 0
    while n >= 1000.0 and magnitude < len(SUFFIXES) - 1:
        n /= 1000.0
        magnitude += 1
    if magnitude == 0:
        return f"{sign}{int(n)}"
    return f"{sign}{n:.2f}{SUFFIXES[magnitude]}"
