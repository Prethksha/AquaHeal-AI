import asyncio
import csv
import io
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from . import config
from .engine import Engine, EngineError
from .schemas import ActorIn, ApplyIn, FaultIn, SimIn, ValveIn

engine = Engine(seed_fault=config.SEED_DEMO_FAULT)


class Hub:
    def __init__(self):
        self.clients: set[WebSocket] = set()

    async def broadcast(self, data: dict):
        for ws in list(self.clients):
            try:
                await ws.send_json(data)
            except Exception:
                self.clients.discard(ws)


hub = Hub()


async def loop():
    while True:
        await asyncio.sleep(config.TICK_SECONDS)
        engine.tick(config.TICK_SECONDS)
        await hub.broadcast(engine.snapshot())


@asynccontextmanager
async def lifespan(_: FastAPI):
    task = asyncio.create_task(loop())
    yield
    task.cancel()


app = FastAPI(title="AquaHeal AI API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=config.CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"])


@app.exception_handler(EngineError)
async def engine_error(_, exc: EngineError):
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=exc.status, content={"detail": exc.message})


@app.get("/api/health")
async def health():
    return {"status": "ok", "mode": "simulation", "tick": engine.tick_n}


@app.get("/api/snapshot")
async def snapshot():
    return engine.snapshot()


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    hub.clients.add(ws)
    try:
        await ws.send_json(engine.snapshot())
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        hub.clients.discard(ws)


@app.post("/api/faults")
async def inject(body: FaultIn):
    engine.inject(body.pipe_id, body.type)
    return {"ok": True}


@app.post("/api/pipes/{pipe_id}/repair")
async def repair(pipe_id: str, body: ActorIn):
    engine.repair(pipe_id, body.operator)
    return {"ok": True}


@app.post("/api/valves/{pipe_id}/preview")
async def preview(pipe_id: str):
    return engine.preview_valve(pipe_id)


@app.post("/api/valves/{pipe_id}/operate")
async def operate(pipe_id: str, body: ValveIn):
    engine.valve_op(pipe_id, body.op, body.operator, body.confirm)
    return {"ok": True}


@app.post("/api/twin/simulate")
async def simulate(body: SimIn):
    return engine.simulate(body.incident_id, body.action)


@app.post("/api/twin/apply")
async def apply(body: ApplyIn):
    engine.apply(body.incident_id, body.action, body.approved_by, body.supervisor_override)
    return {"ok": True}


@app.post("/api/alerts/{alert_id}/ack")
async def ack(alert_id: int, body: ActorIn):
    engine.ack(alert_id, body.operator)
    return {"ok": True}


@app.post("/api/alerts/{alert_id}/resolve")
async def resolve(alert_id: int, body: ActorIn):
    engine.resolve(alert_id, body.operator)
    return {"ok": True}


@app.get("/api/maintenance")
async def maintenance():
    return engine.maintenance()


@app.get("/api/reports/log")
async def report(type: str | None = Query(None), start: str | None = None, end: str | None = None):
    return engine.report(type, start, end)


@app.get("/api/reports/log.csv")
async def report_csv(type: str | None = Query(None), start: str | None = None, end: str | None = None):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["time", "type", "actor", "message"])
    for r in engine.report(type, start, end):
        w.writerow([r["time"], r["type"], r["actor"], r["message"]])
    buf.seek(0)
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=aquaheal_audit_log.csv"})
