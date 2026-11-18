"""Anomaly detection.

`RuleBasedDetector` is a threshold baseline. To plug in a trained model (Random Forest,
Isolation Forest, LSTM...), subclass `BaseDetector`, implement `detect`, and pass it to
`Engine(detector=...)` in main.py.
"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class Detection:
    cls: str
    severity: str  # critical | warning
    confidence: float


class BaseDetector:
    def detect(self, pipe) -> Optional[Detection]:  # pipe exposes pressure, flow, turbidity, base_*
        raise NotImplementedError


class RuleBasedDetector(BaseDetector):
    def detect(self, pipe) -> Optional[Detection]:
        dp = pipe.base_pressure - pipe.pressure
        df = pipe.flow / pipe.base_flow - 1
        if dp > 1.6 and df > 0.4:
            return Detection("Pipeline burst", "critical", min(0.99, 0.62 + dp / 3 * 0.35))
        if dp > 0.5 and df > 0.08:
            return Detection("Leakage", "critical", min(0.99, 0.62 + dp / 1.5 * 0.35))
        if df < -0.3:
            return Detection("Blockage", "warning", min(0.99, 0.62 - df * 0.35))
        if pipe.turbidity > 2:
            return Detection("Water contamination", "critical", min(0.99, 0.62 + pipe.turbidity / 5 * 0.35))
        if abs(dp) > 1.1:
            return Detection("Abnormal pressure variation", "warning", min(0.99, 0.62 + abs(dp) / 2 * 0.35))
        return None
