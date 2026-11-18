from typing import Literal
from pydantic import BaseModel, Field

FaultType = Literal["leak", "burst", "blockage", "contamination", "pressure"]
Action = Literal["isolate", "reduce_pressure"]


class FaultIn(BaseModel):
    pipe_id: str
    type: FaultType


class ActorIn(BaseModel):
    operator: str = Field(default="Operator", min_length=1, max_length=60)


class ValveIn(ActorIn):
    op: Literal["open", "close", "isolate"]
    confirm: bool = False


class SimIn(BaseModel):
    incident_id: int
    action: Action


class ApplyIn(SimIn):
    approved_by: str = Field(min_length=1, max_length=60)
    supervisor_override: bool = False
