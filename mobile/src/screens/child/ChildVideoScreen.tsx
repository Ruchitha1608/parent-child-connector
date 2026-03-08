import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { videoAPI, mediaAPI } from '../../services/api';
import { connectSocket, getSocket } from '../../services/socket';

export default function ChildVideoScreen() {
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [tab, setTab] = useState<'camera' | 'history'>('camera');
  const [captured, setCaptured] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
    connectSocket().then(socket => {
      socket.on('video:request', () => {
        Alert.alert(
          '📷 Selfie Check-in Requested',
          'Your parent wants a selfie. Go to Camera tab to take one!',
          [{ text: 'OK', onPress: () => setTab('camera') }]
        );
      });
    });
    return () => { getSocket()?.off('video:request'); };
  }, []);

  async function loadHistory() {
    try {
      const { data } = await videoAPI.myHistory();
      setHistory(data);
    } catch {}
  }

  const onRefresh = async () => { setRefreshing(true); await loadHistory(); setRefreshing(false); };

  async function takeSelfie() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Camera permission is required to take a selfie.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      cameraType: ImagePicker.CameraType.front,
    });
    if (!result.canceled && result.assets.length > 0) {
      setCaptured(result.assets[0].uri);
    }
  }

  async function sendSelfie() {
    if (!captured) return;
    setUploading(true);
    try {
      const { data: uploaded } = await mediaAPI.upload(captured, 'image/jpeg', 'selfie.jpg', 'selfie');
      await videoAPI.selfie(uploaded.url);
      Alert.alert('Sent!', 'Your selfie has been sent to your parent.');
      setCaptured(null);
      await loadHistory();
      setTab('history');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to send selfie');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={s.container}>
      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'camera' && s.activeTab]} onPress={() => setTab('camera')}>
          <Text style={[s.tabTxt, tab === 'camera' && s.activeTabTxt]}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'history' && s.activeTab]} onPress={() => setTab('history')}>
          <Text style={[s.tabTxt, tab === 'history' && s.activeTabTxt]}>History</Text>
        </TouchableOpacity>
      </View>

      {tab === 'camera' ? (
        <ScrollView contentContainerStyle={s.cameraContent}>
          <Text style={s.heading}>Selfie Check-in</Text>
          <Text style={s.subheading}>Take a selfie to show your parent you are safe</Text>

          {captured ? (
            <View style={s.previewBox}>
              <Image source={{ uri: captured }} style={s.preview} />
              <View style={s.previewBtns}>
                <TouchableOpacity style={s.retakeBtn} onPress={() => setCaptured(null)}>
                  <Text style={s.retakeBtnTxt}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.sendBtn, uploading && s.sendBtnOff]}
                  onPress={sendSelfie}
                  disabled={uploading}
                >
                  {uploading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.sendBtnTxt}>Send to Parent</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={s.cameraBtn} onPress={takeSelfie}>
              <Text style={s.cameraBtnIcon}>{'📷'}</Text>
              <Text style={s.cameraBtnTxt}>Take Selfie</Text>
              <Text style={s.cameraBtnSub}>Opens your front camera</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={s.historyContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={s.heading}>My Selfie History</Text>
          {history.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTxt}>No selfies sent yet</Text>
            </View>
          ) : (
            history.map(h => (
              <View key={h.id} style={s.histCard}>
                {h.snapshotUrl ? (
                  <Image source={{ uri: h.snapshotUrl }} style={s.histPhoto} />
                ) : (
                  <View style={[s.histPhoto, s.noPhoto]}>
                    <Text style={s.noPhotoTxt}>No photo</Text>
                  </View>
                )}
                <Text style={s.histTime}>{new Date(h.completedAt || h.createdAt).toLocaleString()}</Text>
                <View style={s.sentBadge}>
                  <Text style={s.sentBadgeTxt}>Sent to parent</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#059669' },
  tabTxt: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  activeTabTxt: { color: '#059669' },
  cameraContent: { padding: 24, alignItems: 'center' },
  heading: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 6, textAlign: 'center' },
  subheading: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  cameraBtn: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#059669', shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  cameraBtnIcon: { fontSize: 52, marginBottom: 4 },
  cameraBtnTxt: { fontSize: 18, fontWeight: '800', color: '#fff' },
  cameraBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  previewBox: { width: '100%', alignItems: 'center' },
  preview: { width: 280, height: 280, borderRadius: 16, marginBottom: 20 },
  previewBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  retakeBtn: { flex: 1, borderWidth: 2, borderColor: '#D1D5DB', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  retakeBtnTxt: { fontSize: 15, fontWeight: '700', color: '#374151' },
  sendBtn: { flex: 2, backgroundColor: '#059669', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  sendBtnOff: { opacity: 0.6 },
  sendBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
  historyContent: { padding: 16, paddingBottom: 32 },
  histCard: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 16, elevation: 3 },
  histPhoto: { width: '100%', height: 200, resizeMode: 'cover' },
  noPhoto: { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  noPhotoTxt: { color: '#9CA3AF', fontSize: 14 },
  histTime: { fontSize: 12, color: '#6B7280', padding: 10, paddingBottom: 4 },
  sentBadge: { marginHorizontal: 10, marginBottom: 10, backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  sentBadgeTxt: { color: '#059669', fontSize: 12, fontWeight: '700' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyTxt: { color: '#9CA3AF', fontSize: 15 },
});
