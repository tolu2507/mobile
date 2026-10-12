import { cssInterop } from 'nativewind';
import Animated from 'react-native-reanimated';

// NativeWind only maps `className` → `style` for React Native's own components.
// Register Reanimated's so `<Animated.View className="…">` gets its classes too.
cssInterop(Animated.View, { className: 'style' });
cssInterop(Animated.Text, { className: 'style' });
cssInterop(Animated.ScrollView, { className: 'style', contentContainerClassName: 'contentContainerStyle' });
