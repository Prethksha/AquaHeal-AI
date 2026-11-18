"""Core simulation engine: telemetry, detection, incidents, valves, audit log."""
import itertools
import math
import random
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Optional

from . import network as net, twin
from .detector import BaseDetector, RuleBasedDetector


class EngineError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status, self.message = status, message


def now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class Pipe:
    id: str
    a: str
    b: str
    material: str
    age: int
    length_km: float
    past_failures: int
    base_pressure: float
    base_flow: float
    valve: str = "open"
    status: str = "normal"  # normal | warning | leak | isolated | resolved
    fault: Optional[str] = None
    mitigated: bool = False
    pressure: float = 0.0
    flow: float = 0.0
    acoustic: float = 12.0
    turbidity: float = 0.6
    chlorine: float = 0.5


class Engine:
    def __init__(self, detector: Optional[BaseDetector] = None, seed_fault: bool = True):
        self.pipes = {t[0]: Pipe(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8]) for t in net.PIPES}
        self.detector = detector or RuleBasedDetector()
        self.alerts: list[dict] = []
        self.log: list[dict] = []
        self.history = {"flow": [], "pressure": [], "loss_lpm": []}
        self.sims: dict[tuple, dict] = {}
        self.cum_loss_m3 = 0.0
        self.tick_n = 0
        self._ids = itertools.count(1)
        self.record("system", "Engine started in simulation mode. No physical hardware connected.")
        self.tick(0)
        if seed_fault:
            self.inject("P6", "leak", "system")

    # ---------- helpers ----------
    def record(self, kind: str, message: str, actor: str = "system"):
        self.log.insert(0, {"time": now().isoformat(), "type": kind, "message": message, "actor": actor})
        del self.log[500:]

    def _pipe(self, pipe_id: str) -> Pipe:
        if pipe_id not in self.pipes:
            raise EngineError(404, f"Unknown pipeline {pipe_id}")
        return self.pipes[pipe_id]

    def _alert(self, pipe_id: str, kind: str, severity: str, title: str, **extra) -> dict:
        a = {"id": next(self._ids), "time": now().isoformat(), "kind": kind, "severity": severity,
             "title": title, "pipe_id": pipe_id, "status": "open", "recommendation": "No action required.",
             "action_taken": None, **extra}
        self.alerts.insert(0, a)
        return a

    def _open_incident(self, pipe_id: str) -> Optional[dict]:
        return next((a for a in self.alerts if a["kind"] == "incident" and a["pipe_id"] == pipe_id and a["status"] != "resolved"), None)

    def _incident(self, incident_id: int) -> dict:
        a = next((a for a in self.alerts if a["id"] == incident_id and a["kind"] == "incident"), None)
        if not a:
            raise EngineError(404, f"Incident {incident_id} not found")
        return a

    # ---------- telemetry ----------
    def tick(self, dt: float = 2.0):
        self.tick_n += 1
        loss_lps, pressures = 0.0, []
        for p in self.pipes.values():
            if p.valve == "closed":
                p.pressure = p.flow = p.acoustic = 0.0
                continue
            u = random.uniform
            p.pressure = p.base_pressure + u(-0.1, 0.1)
            p.flow = p.base_flow * (1 + u(-0.03, 0.03))
            p.turbidity, p.chlorine, p.acoustic = 0.6 + u(-0.1, 0.1), 0.5 + u(-0.03, 0.03), 12 + u(0, 3)
            if p.fault == "leak":
                p.pressure -= 0.9; p.flow *= 1.2; p.acoustic += 22
            elif p.fault == "burst":
                p.pressure -= 2.3; p.flow *= 1.7; p.acoustic += 45
            elif p.fault == "blockage":
                p.pressure += 0.6; p.flow *= 0.5
            elif p.fault == "contamination":
                p.turbidity, p.chlorine = 4.5 + u(-0.5, 0.5), 0.1
            elif p.fault == "pressure":
                p.pressure += math.sin(self.tick_n) * 1.4 + u(-0.5, 0.5)
            if p.mitigated and p.fault in ("leak", "burst"):
                p.flow = p.base_flow + (p.flow - p.base_flow) * 0.65
                p.pressure += 0.25
            if p.fault in ("leak", "burst"):
                loss_lps += p.flow - p.base_flow
            pressures.append(p.pressure)
            det = self.detector.detect(p)
            if det and not self._open_incident(p.id):
                self._raise(p, det)
        self.cum_loss_m3 += loss_lps * dt / 1000
        h = self.history
        h["flow"].append(round(self.pipes["P1"].flow, 2))
        h["pressure"].append(round(sum(pressures) / max(1, len(pressures)), 3))
        h["loss_lpm"].append(round(loss_lps * 60, 1))
        for k in h:
            del h[k][:-60]
        if self.tick_n % 8 == 0:
            self.record("sensor", f"Sensor batch received: {net.SENSORS_PER_PIPE * len(self.pipes)} sensors reporting (simulated)")

    def _raise(self, p: Pipe, det):
        p.status = "leak" if det.cls in ("Leakage", "Pipeline burst") else "warning"
        rec = {
            "Leakage": "Simulate isolation in the Digital Twin, then dispatch a crew.",
            "Pipeline burst": "Validate isolation in the Digital Twin immediately, then dispatch a crew.",
            "Blockage": "Schedule inspection; check upstream valve and flushing options.",
            "Water contamination": "Notify the quality team, verify with a manual sample, consider isolating.",
            "Abnormal pressure variation": "Inspect nearby pumps and valves for unstable operation.",
        }[det.cls]
        self._alert(p.id, "incident", det.severity, det.cls, confidence=round(det.confidence, 3), recommendation=rec,
                    readings={"pressure": round(p.pressure, 2), "flow": round(p.flow, 2),
                              "acoustic": round(p.acoustic, 1), "turbidity": round(p.turbidity, 2)})
        self.record("detect", f"{det.cls} detected on {p.id} (confidence {round(det.confidence * 100)}%)")

    # ---------- demo faults and repairs ----------
    def inject(self, pipe_id: str, fault: str, actor: str = "operator"):
        if fault not in net.FAULT_TYPES:
            raise EngineError(422, f"Unknown fault type {fault}")
        p = self._pipe(pipe_id)
        if p.valve == "closed":
            raise EngineError(409, f"{pipe_id} is isolated; open its valve first.")
        p.fault, p.mitigated = fault, False
        self.record("system", f"Demo fault injected: {fault} on {pipe_id}", actor)

    def repair(self, pipe_id: str, actor: str):
        p = self._pipe(pipe_id)
        if not p.fault:
            raise EngineError(409, f"{pipe_id} has no active fault.")
        p.fault, p.mitigated, p.valve, p.status = None, False, "open", "resolved"
        self.record("maintenance", f"Repair completed on {pipe_id} (simulated)", actor)

    # ---------- valves ----------
    def preview_valve(self, pipe_id: str) -> dict:
        p = self._pipe(pipe_id)
        un = twin.unserved_nodes(self.pipes, p.id) if p.valve == "open" else []
        return {"pipe_id": p.id, "unserved_nodes": un,
                "message": f"Closing V{p.id[1:]} would leave {len(un)} node(s) without supply ({', '.join(un)})." if un
                else f"Closing V{p.id[1:]} leaves all nodes supplied (simulated)."}

    def valve_op(self, pipe_id: str, op: str, actor: str, confirm: bool):
        if not confirm:
            raise EngineError(400, "Operator confirmation is required for valve operations.")
        p = self._pipe(pipe_id)
        label = f"V{p.id[1:]}"
        if op == "open":
            p.valve = "open"
            p.status = ("leak" if p.fault in ("leak", "burst") else "warning") if p.fault else ("normal" if p.status == "isolated" else p.status)
        else:
            p.valve, p.status = "closed", "isolated"
            if op == "isolate":
                for a in self.alerts:
                    if a["kind"] == "incident" and a["pipe_id"] == pipe_id and a["status"] != "resolved":
                        a["status"], a["action_taken"] = "resolved", f"Isolated via {label} by {actor}"
        self.record("valve", f"Valve {label} {'opened' if op == 'open' else 'closed'} ({op}, simulated, approved by {actor})", actor)
        self._alert(pipe_id, "note", "info", f"Valve {label} {'opened' if op == 'open' else 'closed'} (simulated)")

    # ---------- digital twin ----------
    def simulate(self, incident_id: int, action: str) -> dict:
        if action not in twin.ACTIONS:
            raise EngineError(422, f"Unknown action {action}")
        inc = self._incident(incident_id)
        if inc["status"] == "resolved":
            raise EngineError(409, "Incident is already resolved.")
        res = twin.simulate(self.pipes, inc, action)
        self.sims[(incident_id, action)] = res
        self.record("simulate", f"Digital twin simulated '{action}' for incident #{incident_id} (safety {'OK' if res['safety_ok'] else 'review needed'})")
        return res

    def apply(self, incident_id: int, action: str, approved_by: str, supervisor_override: bool):
        sim = self.sims.get((incident_id, action))
        if not sim:
            raise EngineError(409, "Run a digital twin simulation before applying an action.")
        if not sim["safety_ok"] and not supervisor_override:
            raise EngineError(403, "Safety check failed: supervisor override required. " + " ".join(sim["safety_notes"]))
        inc = self._incident(incident_id)
        if action == "isolate":
            self.valve_op(inc["pipe_id"], "isolate", approved_by, True)
        else:
            self._pipe(inc["pipe_id"]).mitigated = True
            inc["status"], inc["action_taken"] = "ack", f"Pressure reduction by {approved_by}"
            self.record("action", f"Pressure reduction applied near {inc['pipe_id']} (simulated, approved by {approved_by})", approved_by)
        del self.sims[(incident_id, action)]

    # ---------- alerts ----------
    def ack(self, alert_id: int, actor: str):
        a = self._get_alert(alert_id)
        a["status"] = "ack"
        self.record("system", f"Alert #{alert_id} acknowledged", actor)

    def resolve(self, alert_id: int, actor: str):
        a = self._get_alert(alert_id)
        p = self.pipes[a["pipe_id"]]
        if a["kind"] == "incident" and p.fault and p.valve == "open":
            raise EngineError(409, f"Fault still active on {p.id}. Simulate and apply a fix in the Digital Twin first.")
        a["status"] = "resolved"
        self.record("system", f"Alert #{alert_id} resolved", actor)

    def _get_alert(self, alert_id: int) -> dict:
        a = next((x for x in self.alerts if x["id"] == alert_id), None)
        if not a:
            raise EngineError(404, f"Alert {alert_id} not found")
        return a

    # ---------- views ----------
    def kpis(self) -> dict:
        inc = [a for a in self.alerts if a["kind"] == "incident"]
        pen = {"normal": 0, "resolved": 0, "isolated": 6, "warning": 8, "leak": 18}
        live = [p for p in self.pipes.values() if p.valve == "open"] or list(self.pipes.values())
        return {
            "total_length_km": round(sum(p.length_km for p in self.pipes.values()), 1),
            "sensors_total": net.SENSORS_PER_PIPE * len(self.pipes),
            "sensors_online": net.SENSORS_PER_PIPE * len(self.pipes),
            "health_pct": max(0, round(100 - sum(pen[p.status] for p in self.pipes.values()))),
            "active_incidents": sum(1 for a in inc if a["status"] != "resolved"),
            "resolved_incidents": sum(1 for a in inc if a["status"] == "resolved"),
            "loss_lpm": self.history["loss_lpm"][-1] if self.history["loss_lpm"] else 0,
            "cumulative_loss_m3": round(self.cum_loss_m3, 3),
            "avg_turbidity": round(sum(p.turbidity for p in live) / len(live), 2),
            "avg_chlorine": round(sum(p.chlorine for p in live) / len(live), 2),
        }

    def snapshot(self) -> dict:
        return {"tick": self.tick_n, "time": now().isoformat(), "simulated": True,
                "nodes": [{"id": k, "x": v[0], "y": v[1], "label": net.NODE_LABELS.get(k, k)} for k, v in net.NODES.items()],
                "pipes": [asdict(p) for p in self.pipes.values()], "kpis": self.kpis(),
                "history": self.history, "alerts": self.alerts, "log": self.log[:200]}

    def maintenance(self) -> list[dict]:
        rows = []
        for p in self.pipes.values():
            risk = min(99, round(p.age * 0.9 * net.MATERIAL_FACTOR[p.material] + p.past_failures * 5 + (15 if p.fault else 0)))
            rows.append({"pipe_id": p.id, "material": p.material, "age": p.age, "past_failures": p.past_failures, "risk": risk,
                         "priority": "High" if risk >= 70 else "Medium" if risk >= 45 else "Low",
                         "inspect_within": "30 days" if risk >= 70 else "90 days" if risk >= 45 else "12 months"})
        return sorted(rows, key=lambda r: -r["risk"])

    def report(self, kind: Optional[str] = None, start: Optional[str] = None, end: Optional[str] = None) -> list[dict]:
        return [l for l in self.log if (not kind or l["type"] == kind) and (not start or l["time"][:10] >= start) and (not end or l["time"][:10] <= end)]
