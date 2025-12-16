import { Buffer } from 'buffer';

const NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function getNote(frequency: number) {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    const noteIndex = (Math.round(noteNum) + 69) % 12;
    return NOTE_STRINGS[noteIndex];
}

export function autoCorrelate(buffer: Float32Array, sampleRate: number) {
    let SIZE = buffer.length;
    // Çok az veri varsa işlem yapma (Hata önleyici)
    if (SIZE < 100) return -1;

    let rms = 0;
    for (let i = 0; i < SIZE; i++) {
        const val = buffer[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++)
        if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++)
        if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }

    buffer = buffer.slice(r1, r2);
    SIZE = buffer.length;

    let c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++)
        for (let j = 0; j < SIZE - i; j++)
            c[i] = c[i] + buffer[j] * buffer[j + i];

    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
        if (c[i] > maxval) {
            maxval = c[i];
            maxpos = i;
        }
    }
    let T0 = maxpos;

    return sampleRate / T0;
}

export function decodeAudioData(base64String: string): Float32Array {
    // Base64 boşsa boş dizi dön (Çökme önleyici)
    if (!base64String) return new Float32Array(0);

    const buffer = Buffer.from(base64String, 'base64');
    const pcmValues = new Float32Array(buffer.length / 2);

    // DÜZELTME BURADA: "buffer.length - 1" yaptık.
    // Böylece son byte'a gelince durur, taşma yapmaz.
    for (let i = 0; i < buffer.length - 1; i += 2) {
        const val = buffer.readInt16LE(i);
        pcmValues[i / 2] = val / 32768;
    }
    return pcmValues;
}