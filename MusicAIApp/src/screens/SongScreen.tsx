import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Renk Geçişi
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme';

const DEMO_SONGS = [
    { id: '1', title: 'Enter Sandman', artist: 'Metallica', difficulty: 'Hard', color: '#ef4444' }, // Kırmızı
    { id: '2', title: 'Wonderwall', artist: 'Oasis', difficulty: 'Easy', color: '#22c55e' },       // Yeşil
    { id: '3', title: 'Hotel California', artist: 'Eagles', difficulty: 'Medium', color: '#eab308' }, // Sarı
    { id: '4', title: 'Smoke on the Water', artist: 'Deep Purple', difficulty: 'Easy', color: '#22c55e' },
    { id: '5', title: 'Bohemian Rhapsody', artist: 'Queen', difficulty: 'Hard', color: '#ef4444' },
];

export default function SongScreen() {
    return (
        <View style={styles.container}>
            {/* Arka Plan Gradient */}
            <LinearGradient
                colors={[COLORS.background, '#1a103c']} // Siyah -> koyu mor geçiş
                style={StyleSheet.absoluteFill}
            />

            <Text style={styles.header}>Repertuvar 🎵</Text>

            <FlatList
                data={DEMO_SONGS}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 100 }} // Tab barın altında kalmasın diye boşluk
                renderItem={({ item }) => (
                    <TouchableOpacity activeOpacity={0.8}>
                        <LinearGradient
                            colors={[COLORS.cardBg, '#27272a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.card}
                        >
                            {/* Sol Çizgi (Zorluk Rengi) */}
                            <View style={[styles.indicator, { backgroundColor: item.color }]} />

                            <View style={{ flex: 1 }}>
                                <Text style={styles.songTitle}>{item.title}</Text>
                                <Text style={styles.artist}>{item.artist}</Text>
                            </View>

                            <View style={styles.rightContent}>
                                <Text style={[styles.difficulty, { color: item.color }]}>{item.difficulty}</Text>
                                <Ionicons name="play-circle" size={32} color={COLORS.primary} style={{ marginTop: 4 }} />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60, paddingHorizontal: SPACING.m },
    header: { color: COLORS.text, fontSize: 32, fontWeight: 'bold', marginBottom: SPACING.l },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        borderRadius: 16,
        marginBottom: SPACING.m,
        // Hafif gölge
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        overflow: 'hidden' // Indicator taşmasın diye
    },
    indicator: {
        width: 4,
        height: '200%', // Kartın boyunu aşsın
        position: 'absolute',
        left: 0,
    },
    songTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginLeft: SPACING.s },
    artist: { color: COLORS.textDim, fontSize: 14, marginTop: 4, marginLeft: SPACING.s },
    rightContent: { alignItems: 'flex-end' },
    difficulty: { fontSize: 12, fontWeight: 'bold' }
});