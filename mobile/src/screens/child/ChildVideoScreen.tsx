import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { videoAPI, mediaAPI } from '../../services/api';
import { connectSocket, getSocket } from '../../services/socket';

export default function ChildVideoScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [captured, setCaptured] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('camera');
  const cameraRef = useRef(null);

  useEffect(() => {
    loadHistory();
    connectSocket().then(socket => {
      socket.on('video:request', (data) => {
        Alert.alert('Video Check-in Requested', 'Your parent wants a selfie check-in. Go to Camera tab to take one!');
      });
    });
    return () => { getSocket()?.off('video:request'); };
  }, []);

  async function loadHistory() {
    try { const { data } = await videoAPI.myHistory(); setHistory(data); } catch {}
  }

  async function takePicture() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
      setCaptured(photo.uri);
    } catch (e) { Alert.alert('Error', 'Failed to take photo'); }
  }

  async function sendSelfie() {
    if (!captured) return;
    setUploading(true);
    try {
      const { data: media } = await mediaAPI.upload(captured, 'image/jpeg', 'selfie.jpg', 'verifications');
      await videoAPI.selfie(media.url);
      Alert.alert('Sent!', 'Your selfie has been sent to your parent.');
      setCaptured(null);
      loadHistory();
      setTab('history');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); }
  }

  if (!permission) return <View style={s.container}><ActivityIndicator color='#fff'/></View>;
  if (!permission.granted) {
    return (
      <View style={s.container}>
        <Text style={s.permTitle}>Camera Permission Needed</Text>
        <Text style={s.permSub}>Allow camera access to send selfie check-ins to your parent.</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnTxt}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab==='camera'&&s.activeTab]} onPress={()=>{setCaptured(null);setTab('camera')}}>
          <Text style={[s.tabTxt, tab==='camera'&&s.activeTabTxt]}>📷 Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab==='history'&&s.activeTab]} onPress={()=>setTab('history')}>
          <Text style={[s.tabTxt, tab==='history'&&s.activeTabTxt]}>🕐 History ({history.length})</Text>
        </TouchableOpacity>
      </View>

      {tab === 'camera' ? (
        captured ? (
          <View style={s.preview}>
            <Image source={{uri: captured}} style={s.previewImg}/>
            <View style={s.previewBtns}>
              <TouchableOpacity style={s.retakeBtn} onPress={()=>setCaptured(null)}>
                <Text style={s.retakeTxt}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.sendBtn, uploading&&s.sendBtnOff]} onPress={sendSelfie} disabled={uploading}>
                <Text style={s.sendTxt}>{uploading?'Sending...':'Send to Parent'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={s.cameraContainer}>
            <CameraView ref={cameraRef} style={s.camera} facing='front'/>
            <View style={s.cameraControls}>
              <Text style={s.hint}>Take a selfie to confirm your location</Text>
              <TouchableOpacity style={s.captureBtn} onPress={takePicture}>
                <View style={s.captureInner}/>
              </TouchableOpacity>
            </View>
          </View>
        )
      ) : (
        <ScrollView contentContainerStyle={s.histList}>
          {history.length === 0 && <Text style={s.empty}>No verification history yet</Text>}
          {history.map(h => (
            <View key={h.id} style={s.histCard}>
              {h.snapshotUrl && <Image source={{uri: h.snapshotUrl}} style={s.histImg}/>}
              <Text style={s.histStatus}>{h.sessionStatus}</Text>
              <Text style={s.histTime}>{new Date(h.completedAt || h.requestedAt).toLocaleString()}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#111827'},
  tabs:{flexDirection:'row',backgroundColor:'#1F2937'},
  tab:{flex:1,paddingVertical:12,alignItems:'center'},
  activeTab:{borderBottomWidth:2,borderBottomColor:'#10B981'},
  tabTxt:{color:'#9CA3AF',fontWeight:'600',fontSize:13},
  activeTabTxt:{color:'#10B981'},
  permTitle:{color:'#fff',fontSize:20,fontWeight:'800',textAlign:'center',marginTop:80,marginBottom:12,paddingHorizontal:32},
  permSub:{color:'#9CA3AF',fontSize:14,textAlign:'center',paddingHorizontal:32,lineHeight:22,marginBottom:32},
  permBtn:{backgroundColor:'#10B981',borderRadius:14,paddingVertical:14,paddingHorizontal:32,alignSelf:'center'},
  permBtnTxt:{color:'#fff',fontWeight:'700',fontSize:15},
  cameraContainer:{flex:1},
  camera:{flex:1},
  cameraControls:{position:'absolute',bottom:0,left:0,right:0,alignItems:'center',paddingBottom:40,backgroundColor:'rgba(0,0,0,0.3)'},
  hint:{color:'#fff',fontSize:13,marginBottom:20,textAlign:'center'},
  captureBtn:{width:70,height:70,borderRadius:35,backgroundColor:'rgba(255,255,255,0.3)',justifyContent:'center',alignItems:'center',borderWidth:3,borderColor:'#fff'},
  captureInner:{width:52,height:52,borderRadius:26,backgroundColor:'#fff'},
  preview:{flex:1,backgroundColor:'#000'},
  previewImg:{flex:1,resizeMode:'cover'},
  previewBtns:{flexDirection:'row',gap:12,padding:16,backgroundColor:'#111827'},
  retakeBtn:{flex:1,borderWidth:1.5,borderColor:'#fff',borderRadius:12,paddingVertical:13,alignItems:'center'},
  retakeTxt:{color:'#fff',fontWeight:'600'},
  sendBtn:{flex:1,backgroundColor:'#10B981',borderRadius:12,paddingVertical:13,alignItems:'center'},
  sendBtnOff:{opacity:0.5},
  sendTxt:{color:'#fff',fontWeight:'700'},
  histList:{padding:16,paddingBottom:40},
  empty:{color:'#6B7280',textAlign:'center',marginTop:60,fontSize:15},
  histCard:{backgroundColor:'#1F2937',borderRadius:14,overflow:'hidden',marginBottom:14},
  histImg:{width:'100%',height:200,resizeMode:'cover'},
  histStatus:{color:'#10B981',fontWeight:'700',fontSize:13,paddingHorizontal:14,paddingTop:10,textTransform:'capitalize'},
  histTime:{color:'#6B7280',fontSize:12,paddingHorizontal:14,paddingBottom:12},
});
