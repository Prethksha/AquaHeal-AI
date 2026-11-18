"""Digital twin: a simplified graph model (proof of concept).

It checks supply connectivity and estimates recovery. It is NOT a validated hydraulic
model. Replace `simulate` with an EPANET/WNTR-backed implementation for real studies.
"""
from . import network as net

DISCLAIMER = "Proof-of-concept graph simulation, not a validated hydraulic model."
ACTIONS = ("isolate", "reduce_pressure")


def unserved_nodes(pipes, closed_id=None):
    reached = {"R"}
    changed = True
    while changed:
        changed = False
        for p in pipes.values():
            if p.valve == "open" and p.id != closed_id and p.a in reached and p.b not in reached:
                reached.add(p.b)
                changed = True
    return sorted(n for n in net.NODES if n not in reached)


def simulate(pipes, incident, action):
    p = pipes[incident["pipe_id"]]
    loss = max(0.0, p.flow - p.base_flow) if p.fault in ("leak", "burst") else 0.0
    open_p = [q for q in pipes.values() if q.valve == "open"]
    avg_before = sum(q.pressure for q in open_p) / len(open_p)
    if action == "isolate":
        un = unserved_nodes(pipes, p.id)
        rest = [q for q in open_p if q.id != p.id]
        after = {"loss_lps": 0.0, "pipe_pressure": 0.0, "avg_pressure": sum(q.base_pressure for q in rest) / len(rest), "unserved": len(un)}
    else:
        un = []
        after = {"loss_lps": loss * 0.65, "pipe_pressure": p.pressure + 0.25, "avg_pressure": avg_before + 0.1, "unserved": 0}
    notes = []
    if incident["confidence"] < 0.75:
        notes.append("Detection confidence below 75%.")
    if un:
        notes.append("Action would leave nodes without supply: " + ", ".join(un))
    return {
        "incident_id": incident["id"], "pipe_id": p.id, "action": action,
        "before": {"loss_lps": loss, "pipe_pressure": p.pressure, "avg_pressure": avg_before, "unserved": 0},
        "after": after, "unserved_nodes": un,
        "safety_ok": not notes, "safety_notes": notes, "disclaimer": DISCLAIMER,
    }
