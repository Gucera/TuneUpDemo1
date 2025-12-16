from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# --- KULLANICI MODELİ (Roadmap Gün 10 - Users) ---
class UserProfile(BaseModel):
    email: str
    instrument: str  # 'guitar', 'piano', 'drums'
    level: int = 1   # Varsayılan başlangıç seviyesi
    xp: int = 0      # Varsayılan puan

# --- TRAFİK VERİ MODELİ (Roadmap Gün 7 - TrafficData) ---
# Bunu da buraya ekliyoruz ki yapımız hazır olsun.
class TrafficMarker(BaseModel):
    time: float
    label: str

class TrafficData(BaseModel):
    filename: str
    bpm: float
    duration: float
    sample_rate: int
    key: Optional[str] = None
    created_at: Optional[datetime] = None
    markers: List[TrafficMarker] = []