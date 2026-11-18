"""Static topology of the demonstration network (coordinates are for the UI diagram)."""

NODES = {
    "R": (60, 190), "J1": (200, 190), "J2": (340, 100), "J3": (340, 280),
    "J4": (500, 45), "J5": (500, 150), "J6": (500, 250), "J7": (500, 345),
}
NODE_LABELS = {"R": "Treatment plant"}

# id, from, to, material, age (years), length (km), past failures, baseline pressure (bar), baseline flow (L/s)
PIPES = [
    ("P1", "R", "J1", "DI", 34, 2.1, 2, 4.6, 42),
    ("P2", "J1", "J2", "CI", 41, 1.8, 5, 4.3, 22),
    ("P3", "J1", "J3", "PVC", 18, 1.6, 1, 4.2, 18),
    ("P4", "J2", "J4", "AC", 47, 1.4, 7, 3.9, 10),
    ("P5", "J2", "J5", "DI", 22, 1.2, 1, 3.9, 12),
    ("P6", "J3", "J6", "CI", 38, 1.5, 4, 3.8, 9),
    ("P7", "J3", "J7", "HDPE", 9, 1.1, 0, 3.7, 9),
    ("P8", "J5", "J6", "PVC", 15, 0.9, 1, 3.6, 3),  # secondary loop connection
]
MATERIAL_FACTOR = {"DI": 0.8, "CI": 1.2, "PVC": 0.6, "AC": 1.3, "HDPE": 0.5}
FAULT_TYPES = ("leak", "burst", "blockage", "contamination", "pressure")
SENSORS_PER_PIPE = 4  # pressure, flow, acoustic, water quality
