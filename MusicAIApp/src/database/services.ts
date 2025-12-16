import { database } from './index';
import { Song } from './model';

// --- EKLEME (CREATE) ---
export const addRandomSong = async () => {
    await database.write(async () => {
        await database.get<Song>('songs').create(song => {
            song.title = "Test Şarkısı " + Math.floor(Math.random() * 100);
            song.artist = "Yapay Zeka";
            song.duration = 180;
            song.isAnalyzed = false;
            song.createdAt = new Date();
        });
    });
};

// --- OKUMA (READ) ---
// Observable: Veritabanı değiştiği an ekranı otomatik günceller (Canlı Takip)
export const observeSongs = () => {
    return database.get<Song>('songs').query().observe();
};