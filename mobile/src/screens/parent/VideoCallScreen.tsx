import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image, RefreshControl } from 'react-native';
import { videoAPI } from '../../services/api';
import { useStore } from '../../store/useStore';
import { connectSocket, getSocket } from '../../services/socket';

export default function VideoCallScreen() {
  const { pairedChild } = useStore();
  const [requesting, setRequesting] = useState(false);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
    connectSocket().then(socket => {
      socket.on('video:selfie', (data) => {
        Alert.alert('New Selfie!', (data.childName || 'Your child') + ' just sent a selfie check-in!');
        loadHistory();
      });
      socket.on('video:response', (data) => {
        Alert.alert(data.accepted ? 'Accepted' : 'Declined', 'Child has ' + (data.accepted ? 'accepted' : 'declined') + ' the video request.');
      });
    });
    return () => {
      getSocket()?.off('video:selfie');
      getSocket()?.off('video:response');
    };
  }, []);

  async function loadHistory() {
    try { const { data } = await videoAPI.history(); setHistory(data); } catch {}
  }

  async function requestVideoCall() {
    if (!pairedChild) return Alert.alert('No child paired');
    setRequesting(true);
    try {
      await videoAPI.request();
      Alert.alert('Requested', 'Check-in request sent to ' + pairedChild.name + '. They will take a selfie and send it to you.');
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); } finally { setRequesting(false); }
  }

  const onRefresh = async () => { setRefreshing(true); await loadHistory(); setRefreshing(false); };

  const completed = history.filter(h => h.sessionStatus === 'completed');
  const pending = history.filter(h => h.sessionStatus !== 'completed');

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}>
      <TouchableOpacity style={[s.requestBtn, (requesting||!pairedChild)&&s.requestBtnOff]} onPress={requestVideoCall} disabled={requesting||!pairedChild}>
        <Text style={s.requestBtnTxt}>{requesting?'Sending...':'📷 Request Selfie Check-in'}</Text>
      </TouchableOpacity>
      <Text style={s.hint}>Child will take a selfie which instantly appears here</Text>

      {pending.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Pending Requests</Text>
          {pending.map(h => (
            <View key={h.id} style={s.pendingCard}>
              <Text style={s.pendingStatus}>{h.sessionStatus === 'requested' ? '⏳ Waiting for response' : h.sessionStatus === 'accepted' ? '✓ Accepted' : '✗ Declined'}</Text>
              <Text style={s.pendingTime}>{new Date(h.requestedAt).toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}

      {completed.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Verification History</Text>
          {completed.map(h => (
            <View key={h.id} style={s.card}>
              {h.snapshotUrl ? (
                <Image source={{uri: h.snapshotUrl}} style={s.photo}/>
              ) : (
                <View style={[s.photo, s.noPhoto]}><Text style={s.noPhotoTxt}>No photo</Text></View>
              )}
              <View style={s.cardInfo}>
                <Text style={s.cardChild}>{h.child?.name || 'Child'}</Text>
                <Text style={s.cardTime}>{new Date(h.completedAt || h.requestedAt).toLocaleString()}</Text>
                <View style={s.badge}><Text style={s.badgeTxt}>Verified</Text></View>
              </View>
            </View>
          ))}
        </View>
      )}

      {history.length === 0 && !requesting && (
        <View style={s.empty}><Text style={s.emptyTxt}>No verifications yet. Request a selfie check-in above.</Text></View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#F3F4F6'},
  content:{padding:16,paddingBottom:40},
  requestBtn:{backgroundColor:'#4F46E5',borderRadius:14,paddingVertical:15,alignItems:'center',marginBottom:8},
  requestBtnOff:{opacity:0.5},
  requestBtnTxt:{color:'#fff',fontWeight:'800',fontSize:16},
  hint:{color:'#9CA3AF',fontSize:12,textAlign:'center',marginBottom:20},
  section:{marginBottom:20},
  sectionTitle:{fontSize:16,fontWeight:'700',color:'#111827',marginBottom:10},
  pendingCard:{backgroundColor:'#fff',borderRadius:12,padding:14,marginBottom:8,borderLeftWidth:4,borderLeftColor:'#F59E0B'},
  pendingStatus:{fontSize:13,fontWeight:'600',color:'#374151'},
  pendingTime:{fontSize:11,color:'#9CA3AF',marginTop:4},
  card:{backgroundColor:'#fff',borderRadius:14,overflow:'hidden',marginBottom:12,elevation:3,shadowColor:'#000',shadowOpacity:0.06,shadowRadius:8},
  photo:{width:'100%',height:220,resizeMode:'cover'},
  noPhoto:{backgroundColor:'#1F2937',justifyContent:'center',alignItems:'center'},
  noPhotoTxt:{color:'#6B7280',fontSize:14},
  cardInfo:{padding:14,flexDirection:'row',alignItems:'center'},
  cardChild:{fontSize:15,fontWeight:'700',color:'#111827',flex:1},
  cardTime:{fontSize:11,color:'#9CA3AF',flex:1,textAlign:'center'},
  badge:{backgroundColor:'#D1FAE5',borderRadius:8,paddingHorizontal:10,paddingVertical:4},
  badgeTxt:{color:'#059669',fontSize:12,fontWeight:'700'},
  empty:{paddingTop:60,alignItems:'center'},
  emptyTxt:{color:'#9CA3AF',fontSize:14,textAlign:'center',lineHeight:22},
});
