import os
import shutil
import numpy as np
import librosa
import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# Modelleri diğer dosyadan çekiyoruz
from models import UserProfile, TrafficData 

# --- FIREBASE BAĞLANTISI ---
# serviceAccountKey.json dosyasının bu dosya ile aynı yerde olduğundan emin ol.
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# --- UYGULAMA AYARLARI ---
app = FastAPI(
    title="Music AI Backend",
    description="MP3 analiz ve Firebase entegrasyonu.",
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "temp_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- ENDPOINTLER ---

@app.get("/")
async def read_root():
    return {"status": "active", "message": "Backend Hazır!"}

@app.post("/test-firebase")
async def test_firebase_connection():
    try:
        doc_ref = db.collection("test_logs").document("connection_check")
        doc_ref.set({
            "status": "connected",
            "timestamp": datetime.now()
        })
        return {"status": "success", "detail": "Firebase bağlantısı başarılı!"}
    except Exception as e:
        return HTTPException(status_code=500, detail=f"Firebase Hatası: {str(e)}")

@app.post("/analyze-song")
async def analyze_song(file: UploadFile = File(...)):
    """
    Roadmap Gün 25-30: Profesyonel Key Tespiti.
    Tuning (Akort) düzeltmesi ve Chroma CENS kullanarak hatayı minimize eder.
    """
    safe_filename = file.filename.replace(" ", "_")
    temp_file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    try:
        # 1. Dosyayı Kaydet
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 2. Yükle (Librosa)
        y, sr = librosa.load(temp_file_path, sr=None)
        
        # --- BPM & SÜRE ---
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
        duration = librosa.get_duration(y=y, sr=sr)
        
        if isinstance(tempo, np.ndarray):
            tempo = tempo[0]

        # --- PROFESYONEL KEY TESPİTİ ---
        
        # A) Harmonik Sesi Ayır (Davulları çöpe at)
        y_harmonic, _ = librosa.effects.hpss(y)
        
        # B) Tuning (Akort) Sapmasını Hesapla
        # Şarkı standarttan ne kadar sapmış? (Örn: +0.2 ton)
        tuning_offset = librosa.estimate_tuning(y=y_harmonic, sr=sr)
        
        # C) Chroma CENS (Chroma Energy Normalized Statistics)
        # Bu yöntem gürültüye karşı çok daha dayanıklıdır ve tuning bilgisini kullanır.
        chroma_cens = librosa.feature.chroma_cens(y=y_harmonic, sr=sr, tuning=tuning_offset)
        
        # D) Tüm şarkı boyunca notaların ortalamasını al
        chroma_vals = np.mean(chroma_cens, axis=1)
        
        # E) Krumhansl-Schmuckler Profilleri (Standart)
        major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
        minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
        
        pitches = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        key_correlations = []
        
        # F) Korelasyon Döngüsü
        for i in range(12):
            rotated_major = np.roll(major_profile, i)
            rotated_minor = np.roll(minor_profile, i)
            
            # Korelasyon hesabı
            corr_major = np.corrcoef(chroma_vals, rotated_major)[0, 1]
            corr_minor = np.corrcoef(chroma_vals, rotated_minor)[0, 1]
            
            key_correlations.append((pitches[i] + " Major", corr_major))
            key_correlations.append((pitches[i] + " Minor", corr_minor))
            
        # En iyi eşleşmeyi seç
        best_key, best_score = max(key_correlations, key=lambda item: item[1])

        # 3. Veriyi Hazırla
        song_data = {
            "filename": file.filename,
            "bpm": round(float(tempo), 2),
            "duration": round(float(duration), 2),
            "sample_rate": sr,
            "key": best_key, 
            "created_at": datetime.now(), 
            "markers": [] 
        }

        # 4. Veritabanına Yaz
        update_time, doc_ref = db.collection("traffic_data").add(song_data)

        return {
            "status": "success",
            "db_id": doc_ref.id,
            "data": song_data
        }

    except Exception as e:
        return HTTPException(status_code=500, detail=f"Analiz Hatası: {str(e)}")
    
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


@app.post("/signup-simulation")
async def signup_simulation(user: UserProfile):
    """
    Roadmap Gün 10: Kullanıcı Kayıt Simülasyonu.
    Girdi olarak UserProfile (models.py) bekler.
    """
    try:
        user_data = user.dict()
        user_data["created_at"] = datetime.now()
        
        # Firestore 'users' koleksiyonuna ekle
        update_time, doc_ref = db.collection("users").add(user_data)
        
        return {
            "status": "success",
            "user_id": doc_ref.id,
            "message": f"{user.email} kullanıcısı oluşturuldu."
        }

    except Exception as e:
        return HTTPException(status_code=500, detail=f"Kayıt Hatası: {str(e)}")


@app.post("/experiment-drum-detection")
async def detect_drums(file: UploadFile = File(...)):
    """
    Roadmap 3. Hafta (DSP): Basit RMS (Ses Şiddeti) tabanlı vuruş algılama.
    Bateri gibi ani yükselen sesleri yakalamaya çalışır.
    """
    safe_filename = "drum_test_" + file.filename.replace(" ", "_")
    temp_file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    try:
        # 1. Dosyayı Kaydet
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 2. Yükle
        y, sr = librosa.load(temp_file_path, sr=None)
        
        # 3. RMS (Root Mean Square) - Sesin enerjisini hesapla
        # hop_length: Analiz penceresi boyutu (daha küçük = daha hassas zamanlama)
        hop_length = 512
        rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=hop_length)[0]
        
        # 4. Basit Algoritma: Ortalama sesin 2 katına çıkan yerleri "Vuruş" say
        threshold = np.mean(rms) * 1.5  # Eşik değeri (Hassasiyet ayarı)
        
        # RMS dizisinde eşiği geçen noktaları bul
        # librosa.frames_to_time: Çerçeve numarasını saniyeye çevirir
        peaks = librosa.util.peak_pick(rms, pre_max=5, post_max=5, pre_avg=5, post_avg=5, delta=0.02, wait=10)
        peak_times = librosa.frames_to_time(peaks, sr=sr, hop_length=hop_length)
        
        # Saniyeleri listeye çevir (JSON uyumu için)
        beats = [round(float(t), 2) for t in peak_times]

        return {
            "status": "success",
            "algorithm": "RMS-Energy",
            "total_beats_detected": len(beats),
            "beat_times_seconds": beats[:50] # Çok uzun olmasın diye ilk 50 vuruşu gösterelim
        }

    except Exception as e:
        return HTTPException(status_code=500, detail=f"DSP Hatası: {str(e)}")
    
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)