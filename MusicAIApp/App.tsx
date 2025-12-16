import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; // Buzlu cam efekti

import TheoryScreen from './src/screens/TheoryScreen';
import TrafficScreen from './src/screens/TrafficScreen';
import PracticalScreen from './src/screens/PracticalScreen';
import SongScreen from './src/screens/SongScreen';
import { COLORS } from './src/theme';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textDim,
          // TAB BAR STİLİ (Burası Sihirli Kısım ✨)
          tabBarStyle: {
            position: 'absolute', // İçerik barın arkasına taşsın
            borderTopWidth: 0,
            elevation: 0,
            height: 85,
            backgroundColor: 'transparent', // Şeffaf yapıyoruz ki Blur görünsün
          },
          // Arka Plana Blur Ekliyoruz
          tabBarBackground: () => (
            <BlurView tint="dark" intensity={80} style={StyleSheet.absoluteFill} />
          ),
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'musical-notes';

            if (route.name === 'Teori') iconName = focused ? 'book' : 'book-outline';
            else if (route.name === 'Pratik') iconName = focused ? 'mic' : 'mic-outline';
            else if (route.name === 'Trafik') iconName = focused ? 'pulse' : 'pulse-outline';
            else if (route.name === 'Şarkı') iconName = focused ? 'musical-notes' : 'musical-notes-outline';

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Teori" component={TheoryScreen} />
        <Tab.Screen name="Pratik" component={PracticalScreen} />
        <Tab.Screen name="Trafik" component={TrafficScreen} />
        <Tab.Screen name="Şarkı" component={SongScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}