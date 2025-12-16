import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

// Şarkı Modeli
export class Song extends Model {
    static table = 'songs'

    // Sonuna '!' koyarak "Boş olmayacak, söz veriyorum" diyoruz.
    // Yanına ': string' koyarak türünü belirtiyoruz.
    @field('title') title!: string
    @field('artist') artist!: string
    @field('duration') duration!: number
    @field('is_analyzed') isAnalyzed!: boolean
    @date('created_at') createdAt!: Date
}

// İlerleme Modeli
export class Progress extends Model {
    static table = 'progress'

    @field('xp') xp!: number
    @field('level') level!: number
    @field('streak_days') streakDays!: number
}