import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';

export default function App() {
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      console.error('File pick error:', err);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(20);

    setTimeout(() => setProgress(60), 1000);
    setTimeout(() => {
      setProgress(100);
      setUploading(false);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logoText}>SwiftShare Mobile</Text>
          <Text style={styles.tagline}>Share Anything. Instantly.</Text>
        </View>

        <TouchableOpacity style={styles.dropzone} onPress={pickDocument}>
          <Text style={styles.dropzoneTitle}>
            {selectedFile ? selectedFile.name : 'Tap to Select File'}
          </Text>
          <Text style={styles.dropzoneSubtitle}>
            {selectedFile ? `${(selectedFile.size! / (1024 * 1024)).toFixed(2)} MB` : 'Pick photos, 4K videos, documents'}
          </Text>
        </TouchableOpacity>

        {selectedFile && (
          <TouchableOpacity style={styles.button} onPress={handleUpload} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Start Swift Transfer ({progress}%)</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginVertical: 32,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  tagline: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  dropzone: {
    width: '100%',
    padding: 40,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    marginBottom: 24,
  },
  dropzoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  dropzoneSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
