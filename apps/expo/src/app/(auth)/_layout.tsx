import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="sign-in" options={{ title: 'Sign In' }} />
      <Tabs.Screen name="sign-up" options={{ title: 'Sign Up' }} />
    </Tabs>
  );
}
