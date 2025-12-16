// Enstrümanların Standart Frekansları (Hz)

// 👇 'Drums' buraya eklendi
export type InstrumentType = 'Guitar' | 'Bass' | 'Ukulele' | 'Drums';

interface StringData {
    name: string;
    freq: number;
}

export const TUNINGS: Record<Exclude<InstrumentType, 'Drums'>, StringData[]> = {
    Guitar: [
        { name: 'E2', freq: 82.41 },
        { name: 'A2', freq: 110.00 },
        { name: 'D3', freq: 146.83 },
        { name: 'G3', freq: 196.00 },
        { name: 'B3', freq: 246.94 },
        { name: 'E4', freq: 329.63 },
    ],
    Bass: [
        { name: 'E1', freq: 41.20 },
        { name: 'A1', freq: 55.00 },
        { name: 'D2', freq: 73.42 },
        { name: 'G2', freq: 98.00 },
    ],
    Ukulele: [
        { name: 'G4', freq: 392.00 },
        { name: 'C4', freq: 261.63 },
        { name: 'E4', freq: 329.63 },
        { name: 'A4', freq: 440.00 },
    ]
};

// Duyulan frekansa en yakın teli bulan fonksiyon
export function getClosestString(freq: number, instrument: InstrumentType) {
    // Bateri modunda tel aranmaz
    if (instrument === 'Drums') return { stringName: '--', targetFreq: 0, diff: 0, isPerfect: false };

    // @ts-ignore (Drums hariç diğerlerine bak)
    const strings = TUNINGS[instrument];
    let closestString = strings[0];
    let minDiff = Math.abs(freq - strings[0].freq);

    for (let i = 1; i < strings.length; i++) {
        const diff = Math.abs(freq - strings[i].freq);
        if (diff < minDiff) {
            minDiff = diff;
            closestString = strings[i];
        }
    }

    return {
        stringName: closestString.name,
        targetFreq: closestString.freq,
        diff: freq - closestString.freq,
        isPerfect: minDiff < 3
    };
}