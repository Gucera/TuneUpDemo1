import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { Canvas, Path, Skia, Group, Circle, Paint } from "@shopify/react-native-skia";
import { useSharedValue, useDerivedValue, withTiming, withSequence, withSpring } from 'react-native-reanimated';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { autoCorrelate, decodeAudioData } from '../utils/pitchDetection';
import { TUNINGS, getClosestString, InstrumentType } from '../utils/tuningData';

const { width } = Dimensions.get('window');
const CX = width / 2;
const CY = 250;
const RADIUS = 120;

export default function PracticalScreen() {
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const [isListening, setIsListening] = useState(false);

    const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('Guitar');
    const [targetNote, setTargetNote] = useState("--");
    const [statusText, setStatusText] = useState("Hazır");

    const recordingRef = useRef<Audio.Recording | null>(null);
    const isLooping = useRef(false);

    // Animasyon Değerleri
    const pitchValue = useSharedValue(0); // Gitar İbresi için
    const drumHitValue = useSharedValue(0); // Bateri Vuruşu için (Büyüklük)

    useEffect(() => {
        (async () => {
            if (permissionResponse?.status !== 'granted') await requestPermission();
        })();
        return () => { stopListening(); };
    }, []);

    const RECORDING_OPTIONS: any = {
        android: { extension: '.wav', outputFormat: Audio.AndroidOutputFormat.MPEG_4, audioEncoder: Audio.AndroidAudioEncoder.AAC, sampleRate: 44100, numberOfChannels: 1, bitRate: 128000 },
        ios: { extension: '.wav', audioQuality: Audio.IOSAudioQuality.HIGH, sampleRate: 44100, numberOfChannels: 1, bitRate: 128000, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
        web: { mimeType: 'audio/wav', bitsPerSecond: 128000 },
    };

    const startListening = async () => {
        if (isLooping.current) return;
        try { await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true, staysActiveInBackground: false, shouldDuckAndroid: true, playThroughEarpieceAndroid: false }); } catch (e) { }
        isLooping.current = true;
        setIsListening(true);
        tick();
    };

    const stopListening = async () => {
        isLooping.current = false;
        setIsListening(false);
        if (recordingRef.current) { try { await recordingRef.current.stopAndUnloadAsync(); } catch (e) { } recordingRef.current = null; }
        pitchValue.value = withTiming(0, { duration: 500 });
        drumHitValue.value = withTiming(0);
        setTargetNote("--");
        setStatusText("Hazır");
    };

    const tick = async () => {
        if (!isLooping.current) return;
        try {
            const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
            recordingRef.current = recording;
            await new Promise(resolve => setTimeout(resolve, 100)); // Biraz daha hızlandırdım (100ms)
            if (!isLooping.current) { try { await recording.stopAndUnloadAsync(); } catch (e) { } return; }
            await recording.stopAndUnloadAsync();

            const uri = recording.getURI();
            if (uri) {
                const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
                let float32Data = decodeAudioData(base64);
                if (float32Data.length > 4000) float32Data = float32Data.slice(0, 4000);

                // --- ENSTRÜMANA GÖRE MANTIK ---
                if (selectedInstrument === 'Drums') {
                    // BATERİ MODU: RMS (Ses Şiddeti) Hesabı
                    let sum = 0;
                    for (let i = 0; i < float32Data.length; i++) sum += float32Data[i] * float32Data[i];
                    const rms = Math.sqrt(sum / float32Data.length);

                    // Eşik değer (Threshold): 0.05 (Hassasiyeti buradan ayarla)
                    if (rms > 0.05) {
                        setStatusText("VURUŞ! 🥁");
                        // Efekt: Aniden büyü ve yavaşça küçül
                        drumHitValue.value = withSequence(withTiming(1.5, { duration: 50 }), withTiming(0, { duration: 300 }));
                    } else {
                        setStatusText("Bekleniyor...");
                    }

                } else {
                    // GİTAR/BASS MODU: Pitch Detection
                    const detectedFreq = autoCorrelate(float32Data, 44100);

                    if (detectedFreq > 30 && detectedFreq < 600) {
                        const result = getClosestString(detectedFreq, selectedInstrument);
                        setTargetNote(result.stringName);

                        if (result.isPerfect) {
                            setStatusText("MÜKEMMEL! 🔥");
                            pitchValue.value = withTiming(0, { duration: 150 });
                        } else {
                            setStatusText(result.diff > 0 ? "Çok Tiz" : "Çok Pes");
                            const needlePos = Math.max(-50, Math.min(50, result.diff * 2));
                            pitchValue.value = withTiming(needlePos, { duration: 150 });
                        }
                    }
                }
            }
        } catch (error) { } finally { if (isLooping.current) setTimeout(tick, 50); }
    };

    // --- SKIA ÇİZİMİ (Gitar için İbre) ---
    const arcPath = Skia.Path.Make();
    arcPath.addArc({ x: CX - RADIUS, y: CY - RADIUS, width: RADIUS * 2, height: RADIUS * 2 }, 180, 180);

    const needlePath = useDerivedValue(() => {
        const path = Skia.Path.Make();
        const angle = (Math.max(-50, Math.min(50, pitchValue.value)) / 50) * 90;
        const radian = (angle * Math.PI) / 180;
        const tipX = CX + RADIUS * Math.cos(radian - Math.PI / 2);
        const tipY = CY + RADIUS * Math.sin(radian - Math.PI / 2);
        path.moveTo(CX, CY); path.lineTo(tipX, tipY); return path;
    }, [pitchValue]);

    const needleColor = useDerivedValue(() => Math.abs(pitchValue.value) < 5 ? "#00FF00" : "#FF5555", [pitchValue]);

    // --- SKIA ÇİZİMİ (Bateri için Daire) ---
    const drumRadius = useDerivedValue(() => 50 + (drumHitValue.value * 50), [drumHitValue]);
    const drumOpacity = useDerivedValue(() => 0.5 + (drumHitValue.value * 0.5), [drumHitValue]);

    return (
        <View style={styles.container}>
            {/* ENSTRÜMAN SEÇİCİ */}
            <View style={styles.selectorContainer}>
                {(['Guitar', 'Bass', 'Drums'] as InstrumentType[]).map((inst) => (
                    <TouchableOpacity
                        key={inst}
                        style={[styles.selectorBtn, selectedInstrument === inst && styles.selectorBtnActive]}
                        onPress={() => {
                            stopListening(); // Mod değiştirince durdur
                            setSelectedInstrument(inst);
                        }}
                    >
                        <Text style={[styles.selectorText, selectedInstrument === inst && styles.selectorTextActive]}>{inst}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.title}>{selectedInstrument === 'Drums' ? 'Ritim Dedektörü' : `${selectedInstrument} Tuner`}</Text>

            <Canvas style={{ width: width, height: 300 }}>
                {selectedInstrument === 'Drums' ? (
                    // BATERİ GÖRSELİ
                    <Group>
                        <Circle cx={CX} cy={CY} r={drumRadius} color="#00d2ff">
                            <Paint opacity={drumOpacity} />
                        </Circle>
                        <Circle cx={CX} cy={CY} r={40} color="white" style="stroke" strokeWidth={4} />
                    </Group>
                ) : (
                    // GİTAR İBRESİ
                    <Group>
                        <Path path={arcPath} color="#333" style="stroke" strokeWidth={15} strokeCap="round" />
                        <Path path={needlePath} color={needleColor} style="stroke" strokeWidth={6} strokeCap="round" />
                        <Circle cx={CX} cy={CY} r={10} color="white" />
                    </Group>
                )}
            </Canvas>

            <Text style={styles.note}>{selectedInstrument === 'Drums' ? (drumHitValue.value > 0.1 ? "🥁" : "--") : targetNote}</Text>
            <Text style={[styles.status, { color: statusText.includes("MÜKEMMEL") || statusText.includes("VURUŞ") ? '#00ff9d' : 'gray' }]}>
                {statusText}
            </Text>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: isListening ? '#ef4444' : '#00d2ff' }]}
                onPress={isListening ? stopListening : startListening}
            >
                <Text style={styles.buttonText}>{isListening ? "⏹️ Durdur" : "🎤 Başlat"}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', alignItems: 'center', paddingTop: 60 },
    title: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    selectorContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#222', borderRadius: 10, padding: 5 },
    selectorBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
    selectorBtnActive: { backgroundColor: '#333' },
    selectorText: { color: 'gray', fontWeight: 'bold' },
    selectorTextActive: { color: '#00d2ff' },
    note: { color: 'white', fontSize: 64, fontWeight: 'bold', marginTop: -40 },
    status: { color: 'gray', fontSize: 20, marginTop: 5, fontWeight: 'bold', marginBottom: 30 },
    button: { paddingVertical: 12, paddingHorizontal: 40, borderRadius: 25 },
    buttonText: { fontSize: 18, fontWeight: 'bold', color: 'black' }
});