import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { addRandomSong, observeSongs } from '../database/services';
import { Song } from '../database/model';

export default function TheoryScreen() {
    const [songs, setSongs] = useState<Song[]>([]);

    useEffect(() => {
        // Veritabanını dinle (Canlı Bağlantı)
        const subscription = observeSongs().subscribe((data) => {
            setSongs(data);
        });

        // Sayfadan çıkınca dinlemeyi bırak
        return () => subscription.unsubscribe();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Veritabanı Testi 💾</Text>

            {/* EKLE BUTONU */}
            <TouchableOpacity style={styles.button} onPress={addRandomSong}>
                <Text style={styles.buttonText}>+ Rastgele Şarkı Ekle</Text>
            </TouchableOpacity>

            {/* LİSTE */}
            <FlatList
                data={songs}
                keyExtractor={item => item.id}
                style={styles.list}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.subtitle}>{item.artist} • {item.id}</Text>
                    </View>
                )}
            />

            <Text style={styles.count}>Toplam Kayıt: {songs.length}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 60 },
    header: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    button: { backgroundColor: '#00d2ff', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
    buttonText: { color: 'black', fontWeight: 'bold', fontSize: 16 },
    list: { flex: 1 },
    card: { backgroundColor: '#222', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#00d2ff' },
    title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    subtitle: { color: 'gray', fontSize: 12, marginTop: 4 },
    count: { color: 'gray', textAlign: 'center', marginTop: 10 }
});