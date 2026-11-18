import os
os.environ["SEED_DEMO_FAULT"] = "true"
from fastapi.testclient import TestClient
from app.engine import Engine, EngineError
from app.main import app
import pytest


def fresh():
    e = Engine(seed_fault=False)
    return e


def test_leak_is_detected_and_classified():
    e = fresh()
    e.inject("P6", "leak")
    for _ in range(3):
        e.tick()
    inc = [a for a in e.alerts if a["kind"] == "incident"]
    assert inc and inc[0]["title"] == "Leakage" and inc[0]["pipe_id"] == "P6"


def test_healthy_network_raises_no_incidents():
    e = fresh()
    for _ in range(50):
        e.tick()
    assert not [a for a in e.alerts if a["kind"] == "incident"]


def test_apply_requires_simulation_and_confirmation():
    e = fresh()
    e.inject("P6", "leak"); e.tick(); e.tick()
    iid = next(a["id"] for a in e.alerts if a["kind"] == "incident")
    with pytest.raises(EngineError):
        e.apply(iid, "isolate", "Op", False)
    with pytest.raises(EngineError):
        e.valve_op("P6", "close", "Op", False)
    res = e.simulate(iid, "isolate")
    assert res["unserved_nodes"] == []  # loop P8 keeps J6 supplied
    e.apply(iid, "isolate", "Op", False)
    assert e.pipes["P6"].status == "isolated"
    assert e.kpis()["resolved_incidents"] == 1


def test_isolating_trunk_main_fails_safety_check():
    e = fresh()
    e.inject("P1", "burst"); e.tick(); e.tick()
    iid = next(a["id"] for a in e.alerts if a["kind"] == "incident")
    res = e.simulate(iid, "isolate")
    assert not res["safety_ok"]
    with pytest.raises(EngineError) as ex:
        e.apply(iid, "isolate", "Op", False)
    assert ex.value.status == 403


def test_api_endpoints():
    with TestClient(app) as c:
        assert c.get("/api/health").json()["status"] == "ok"
        snap = c.get("/api/snapshot").json()
        assert len(snap["pipes"]) == 8 and snap["simulated"] is True
        assert c.post("/api/valves/P3/operate", json={"op": "close", "confirm": False}).status_code == 400
        assert c.get("/api/maintenance").json()[0]["risk"] >= 0
        assert c.get("/api/reports/log.csv").status_code == 200
