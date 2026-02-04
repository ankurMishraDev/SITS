import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryProvider } from '../src/lib/queryClient';
import { GoogleDriveProvider } from '../src/contexts';
import { Colors } from '../src/constants/theme';

export default function RootLayout() {
  return (
    <QueryProvider>
      <GoogleDriveProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: Colors.surface,
            },
            headerTintColor: Colors.text,
            headerTitleStyle: {
              fontWeight: '600',
            },
            contentStyle: {
              backgroundColor: Colors.background,
            },
          }}
        />
      </GoogleDriveProvider>
    </QueryProvider>
  );
}
