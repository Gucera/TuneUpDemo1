import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
    version: 1, // Veritabanı versiyonu (Değişiklik yapınca artıracağız)
    tables: [
        // 1. Şarkılar Tablosu
        tableSchema({
            name: 'songs',
            columns: [
                { name: 'title', type: 'string' },
                { name: 'artist', type: 'string' },
                { name: 'duration', type: 'number' },
                { name: 'is_analyzed', type: 'boolean' },
                { name: 'created_at', type: 'number' }, // Tarihleri sayı (timestamp) olarak tutarız
            ],
        }),
        // 2. Kullanıcı İlerleme Tablosu
        tableSchema({
            name: 'progress',
            columns: [
                { name: 'xp', type: 'number' },
                { name: 'level', type: 'number' },
                { name: 'streak_days', type: 'number' },
            ],
        }),
    ],
})