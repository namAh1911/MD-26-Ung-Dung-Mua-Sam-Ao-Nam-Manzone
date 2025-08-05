import React from 'react';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';

export default function MomoWebviewScreen() {
    const { url } = useLocalSearchParams<{ url: string }>();

    return <WebView source={{ uri: url }} />;
}
