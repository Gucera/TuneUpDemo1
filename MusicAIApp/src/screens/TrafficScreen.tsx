import React, { useEffect } from 'react'; // Tek satırda topladık
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { Canvas, Path, Skia, Paint } from "@shopify/react-native-skia";
import { useSharedValue, useDerivedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function TrafficScreen() {
    const clock = useSharedValue(0);

    useEffect(() => {
        clock.value = withRepeat(withTiming(10, { duration: 3000, easing: Easing.linear }), -1, false);
    }, [clock]);

    const path = useDerivedValue(() => {
        const p = Skia.Path.Make();
        if (!p) {
            return Skia.Path.Make()!;
        }
        p.moveTo(0, height / 2);
        for (let x = 0; x <= width; x += 5) {
            const y = Math.sin((x * 0.01) + (clock.value * 5)) * 50 + (height / 2);
            p.lineTo(x, y);
        }
        return p;
    }, [clock]);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Mavi Dalga Testi 🌊</Text>
            <Canvas style={styles.canvas}>
                <Path path={path} color="#00d2ff" style="stroke" strokeWidth={4}>
                    <Paint color="#00d2ff" style="stroke" strokeWidth={4} opacity={0.8} />
                </Path>
            </Canvas>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
    text: { color: 'white', fontSize: 24, position: 'absolute', top: 50, zIndex: 10 },
    canvas: { flex: 1, width: width, height: height }
});