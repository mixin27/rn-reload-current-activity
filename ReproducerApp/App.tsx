/**
 * Reproducer: on Android (bridgeless), destroying the Activity while a JS reload is running leaves
 * ReactContext.getCurrentActivity() null after the app is reopened, until it is backgrounded.
 *
 * PermissionsAndroid.request() reads getCurrentActivity() natively. Any resolved value means the
 * context has an Activity; a rejection with E_INVALID_ACTIVITY ("Tried to use permissions API
 * while not attached to an Activity.") means it has none. CAMERA is deliberately not declared in
 * the manifest, so the normal case resolves at once without a permission dialog.
 *
 * @format
 */

import { useState } from 'react';
import {
  Button,
  PermissionsAndroid,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const STEPS = [
  '1. Tap the button: it resolves (Activity attached).',
  '2. Reload and press Back while the reload is running (metro.config.js delays the bundle by 1.5 s on purpose):\n   adb shell "input keyevent 46 46; sleep 0.3; input keyevent 4"',
  '3. Reopen the app from the launcher icon (not a deep link).',
  '4. Tap the button: it rejects with E_INVALID_ACTIVITY (bug).',
  '5. Press Home, reopen the app, tap again: it resolves again.',
];

function App() {
  const [results, setResults] = useState<string[]>([]);

  const probe = async () => {
    const at = new Date().toLocaleTimeString();
    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      setResults(r => [`${at}  resolved: ${result}  (Activity attached)`, ...r]);
    } catch (e) {
      const err = e as { code?: string; message?: string };
      setResults(r => [
        `${at}  REJECTED: ${err.code ?? ''} ${err.message ?? String(e)}`,
        ...r,
      ]);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>getCurrentActivity() after reload + Back</Text>
        {STEPS.map(step => (
          <Text key={step} style={styles.step}>
            {step}
          </Text>
        ))}
        <View style={styles.button}>
          <Button title="Call PermissionsAndroid.request()" onPress={probe} />
        </View>
        <ScrollView>
          {results.map(line => (
            <Text
              key={line}
              style={line.includes('REJECTED') ? styles.bad : styles.good}>
              {line}
            </Text>
          ))}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  step: { fontSize: 13, marginBottom: 6 },
  button: { marginVertical: 16 },
  good: { color: '#1b5e20', marginBottom: 4 },
  bad: { color: '#b71c1c', marginBottom: 4, fontWeight: '600' },
});

export default App;
