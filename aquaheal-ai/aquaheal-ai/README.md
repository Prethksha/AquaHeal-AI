# AquaHeal AI

Autonomous Self-Healing Smart Water Distribution Network using AI, IoT & Digital Twin.
Group SY320 · Dept. of Computer Science & Engineering, MIT School of Computing, MIT-ADT University · Mentor: Prof. Karan Mashal
Team: P K Prethksha, Pinapatruni Srihita, Pranav Thorat, Manish Kushwaha

Workflow: **Sense → Detect → Simulate → Act → Notify**

> **Honest scope.** This is a software-only prototype. Sensor data comes from a built-in simulator (clearly labeled in the UI),
> detection is a threshold-rule baseline, the digital twin is a proof-of-concept graph model (not EPANET/WNTR), and all valve
> actions are simulated. No physical hardware is controlled.

## Run locally (VS Code)

Requirements: Python 3.10+, Node.js 18+.

**Terminal 1 — backend**
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # optional
uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

**Terminal 2 — frontend**
```bash
cd frontend
npm install
cp .env.example .env            # optional; sets VITE_API_URL
npm run dev
```
Open http://localhost:5173

**Tests:** `cd backend && pytest`

## Try the full loop
1. Dashboard shows a seeded demo leak on P6 (set `SEED_DEMO_FAULT=false` to disable).
2. **Live network** → inject a fault of any of the 5 types on any pipe.
3. **Anomaly detection** lists the classified incident with confidence and sensor readings.
4. **Digital twin** → pick the incident → *Simulate action* → review before/after → *Approve and apply*.
5. **Valves / Alerts / Reports** show the resulting valve state, incident status and audit trail (CSV export).

## Architecture
```
backend/app
  network.py    topology, pipe data (age, material, failures)
  engine.py     telemetry simulation, incidents, valves, audit log, maintenance scoring
  detector.py   BaseDetector + RuleBasedDetector  <- plug in trained models here
  twin.py       graph-based simulation          <- replace with EPANET/WNTR here
  main.py       FastAPI REST + WebSocket (/ws)
frontend/src
  LiveContext   WebSocket stream with polling fallback, loading/error states
  pages/        Landing, Dashboard, Network, Anomalies, Twin, Valves, Maintenance, Alerts, Reports, About
  components/   UI kit (toasts, confirm dialogs, skeletons), charts, network map
```

## Safety rules enforced by the backend (not just the UI)
- Valve operations require `confirm: true` and an operator name; every action is written to the audit log.
- A twin action cannot be applied unless it was simulated first.
- If the safety check fails (confidence < 75% or supply loss), applying requires an explicit supervisor override.

## Integrating your real models
- **Detection:** subclass `BaseDetector` (`detect(pipe) -> Detection | None`) with Random Forest / Isolation Forest / LSTM and pass it to `Engine(detector=...)` in `main.py`.
- **Real sensors:** replace the simulation block in `Engine.tick` with MQTT / database ingestion; the API and UI are unchanged.
- **Hydraulics:** implement `twin.simulate` with WNTR and keep the returned dictionary shape.
- Security: this prototype has no authentication. Add auth (e.g. OAuth2/JWT) before any real deployment.
