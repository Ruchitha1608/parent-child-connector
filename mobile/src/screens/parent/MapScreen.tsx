import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useStore } from '../../store/useStore';
import { locationAPI, geofenceAPI } from '../../services/api';

const HTML = "<!DOCTYPE html><html><head>\n<meta name='viewport' content='width=device-width,initial-scale=1.0,maximum-scale=1.0'/>\n<link rel='stylesheet' href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'/>\n<script src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'></script>\n<style>*{margin:0;padding:0}#map{width:100vw;height:100vh}</style>\n</head><body><div id='map'></div><script>\nvar map=L.map('map').setView([20.5937,78.9629],5);\nL.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);\nvar cm=null,rl=null,circles=[],tm=null,addMode=false;\nvar ci=L.divIcon({className:'',html:'<div style='background:#4F46E5;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);font-size:20px'>&#128103;</div>',iconSize:[40,40],iconAnchor:[20,20],popupAnchor:[0,-22]});\nmap.on('click',function(e){if(addMode){if(tm)tm.remove();tm=L.circleMarker([e.latlng.lat,e.latlng.lng],{radius:10,color:'#EF4444',fillColor:'#EF4444',fillOpacity:1}).addTo(map);window.ReactNativeWebView.postMessage(JSON.stringify({type:'tap',lat:e.latlng.lat,lng:e.latlng.lng}));}});\nfunction updateLoc(lat,lng,name,ts){var ll=[lat,lng];if(cm){cm.setLatLng(ll);cm.getPopup().setContent('<b>'+name+'</b><br>'+new Date(ts).toLocaleTimeString());}else{cm=L.marker(ll,{icon:ci}).addTo(map).bindPopup('<b>'+name+'</b><br>'+new Date(ts).toLocaleTimeString());map.setView(ll,16);}}\nfunction updateRoute(pts){if(rl)rl.remove();if(pts&&pts.length>1){rl=L.polyline(pts,{color:'#4F46E5',weight:4,opacity:0.8}).addTo(map);map.fitBounds(rl.getBounds(),{padding:[30,30]});}}\nfunction updateFences(fences){circles.forEach(function(c){c.remove();});circles=[];if(!fences)return;fences.forEach(function(gf){var c=L.circle([gf.centerLat,gf.centerLng],{radius:gf.radiusM,color:'#4F46E5',fillColor:'#4F46E5',fillOpacity:0.12,weight:2}).addTo(map).bindPopup('<b>'+gf.label+'</b><br>'+gf.radiusM+'m');var p=L.marker([gf.centerLat,gf.centerLng],{icon:L.divIcon({className:'',html:'<div style='background:#4F46E5;color:white;padding:3px 8px;border-radius:10px;font-size:11px;font-weight:bold;white-space:nowrap'>'+gf.label+'</div>',iconAnchor:[20,8]})}).addTo(map);p.on('click',function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'del',id:gf.id,label:gf.label}));});circles.push(c,p);});}\nfunction setMode(v){addMode=v;if(!v&&tm){tm.remove();tm=null;}}\nfunction centerChild(){if(cm)map.setView(cm.getLatLng(),17,{animate:true});}\nwindow.addEventListener('message',function(e){try{var m=JSON.parse(e.data);if(m.t==='loc')updateLoc(m.lat,m.lng,m.name,m.ts);else if(m.t==='fences')updateFences(m.data);else if(m.t==='route')updateRoute(m.data);else if(m.t==='mode')setMode(m.v);else if(m.t==='center')centerChild();}catch(x){}});\n</script></body></html>";

export default function MapScreen() {
  const { liveLocation, pairedChild, geofences, setGeofences, addGeofence, removeGeofence } = useStore();
  const wvRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [tapped, setTapped] = useState<{lat:number;lng:number}|null>(null);
  const [label, setLabel] = useState('');
  const [radius, setRadius] = useState('300');

  const send = (msg: object) => {
    const json = JSON.stringify(JSON.stringify(msg));
    wvRef.current?.injectJavaScript('(function(){window.dispatchEvent(new MessageEvent("message",{data:' + json + '}));})()');
  };

  useEffect(() => {
    if (!ready || !liveLocation) return;
    send({ t:'loc', lat:liveLocation.latitude, lng:liveLocation.longitude, name:liveLocation.childName||'Child', ts:liveLocation.timestamp });
  }, [liveLocation, ready]);

  useEffect(() => {
    if (!ready) return;
    send({ t:'fences', data:geofences });
  }, [geofences, ready]);

  useEffect(() => { if (pairedChild) loadFences(); }, [pairedChild]);

  async function loadFences() {
    if (!pairedChild) return;
    try { const { data } = await geofenceAPI.list(pairedChild.id); setGeofences(data); } catch {}
  }

  async function loadRoute() {
    if (!pairedChild) return;
    try {
      const { data } = await locationAPI.history(pairedChild.id, undefined, 200);
      send({ t:'route', data: data.map((p:any) => [p.latitude, p.longitude]) });
    } catch {}
  }

  function toggleMode() {
    const next = !addMode;
    setAddMode(next); setTapped(null); setLabel('');
    send({ t:'mode', v:next });
  }

  async function createFence() {
    if (!tapped || !label.trim() || !pairedChild) return;
    try {
      const { data } = await geofenceAPI.create({ childId:pairedChild.id, label:label.trim(), centerLat:tapped.lat, centerLng:tapped.lng, radiusM:parseFloat(radius)||300 });
      addGeofence(data); setAddMode(false); setTapped(null); setLabel('');
      send({ t:'mode', v:false });
      Alert.alert('Done', 'Safe zone '' + data.label + '' created!');
    } catch (e:any) { Alert.alert('Error', e.response?.data?.error || 'Failed to create'); }
  }

  function onMsg(event: any) {
    try {
      const m = JSON.parse(event.nativeEvent.data);
      if (m.type === 'tap') setTapped({ lat:m.lat, lng:m.lng });
      else if (m.type === 'del') {
        Alert.alert('Delete Safe Zone', 'Remove '' + m.label + ''?', [
          { text:'Cancel' },
          { text:'Delete', style:'destructive', onPress: async () => { try { await geofenceAPI.delete(m.id); removeGeofence(m.id); } catch {} } },
        ]);
      }
    } catch {}
  }

  return (
    <View style={s.c}>
      <WebView ref={wvRef} style={s.map} source={{html:HTML}} javaScriptEnabled domStorageEnabled
        originWhitelist={['*']} mixedContentMode='always' onLoadEnd={()=>setReady(true)} onMessage={onMsg}
        startInLoadingState renderLoading={()=><View style={s.loading}><ActivityIndicator size='large' color='#4F46E5'/><Text style={s.loadTxt}>Loading map...</Text></View>}
      />
      <View style={s.toolbar}>
        <TouchableOpacity style={[s.btn, addMode&&s.btnRed]} onPress={toggleMode}>
          <Text style={[s.btnTxt, addMode&&s.btnTxtW]}>{addMode?'✕ Cancel':'+ Safe Zone'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btn} onPress={loadRoute}><Text style={s.btnTxt}>📍 Route</Text></TouchableOpacity>
        {liveLocation&&<TouchableOpacity style={s.btn} onPress={()=>send({t:'center'})}><Text style={s.btnTxt}>🎯 Find</Text></TouchableOpacity>}
      </View>
      {addMode&&(
        <View style={s.panel}>
          <Text style={s.panelTitle}>New Safe Zone</Text>
          <Text style={s.panelHint}>{tapped?'📍 '+tapped.lat.toFixed(4)+', '+tapped.lng.toFixed(4):'Tap on the map to set the center'}</Text>
          <TextInput style={s.input} placeholder='Zone name (e.g. School)' value={label} onChangeText={setLabel} placeholderTextColor='#9CA3AF'/>
          <TextInput style={s.input} placeholder='Radius in meters (default 300)' keyboardType='numeric' value={radius} onChangeText={setRadius} placeholderTextColor='#9CA3AF'/>
          <TouchableOpacity style={[s.cBtn,(!tapped||!label.trim())&&s.cBtnOff]} onPress={createFence} disabled={!tapped||!label.trim()}>
            <Text style={s.cBtnTxt}>Create Safe Zone</Text>
          </TouchableOpacity>
        </View>
      )}
      {!liveLocation&&!addMode&&ready&&(
        <View style={s.noLoc}><Text style={s.noLocTxt}>No live location — ask child to tap Start Sharing Location</Text></View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  c:{flex:1},map:{flex:1},
  loading:{position:'absolute',top:0,left:0,right:0,bottom:0,justifyContent:'center',alignItems:'center',backgroundColor:'#F3F4F6'},
  loadTxt:{marginTop:12,color:'#6B7280',fontSize:14},
  toolbar:{position:'absolute',top:12,right:12},
  btn:{backgroundColor:'#fff',borderRadius:10,paddingHorizontal:14,paddingVertical:9,shadowColor:'#000',shadowOpacity:0.15,shadowRadius:4,elevation:4,marginBottom:8},
  btnRed:{backgroundColor:'#EF4444'},btnTxt:{fontSize:13,fontWeight:'700',color:'#374151'},btnTxtW:{color:'#fff'},
  panel:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:'#fff',borderTopLeftRadius:20,borderTopRightRadius:20,padding:20,elevation:10},
  panelTitle:{fontSize:17,fontWeight:'800',color:'#111827',marginBottom:6},panelHint:{fontSize:13,color:'#6B7280',marginBottom:14},
  input:{borderWidth:1.5,borderColor:'#E5E7EB',borderRadius:10,paddingHorizontal:14,paddingVertical:11,fontSize:15,color:'#111827',marginBottom:10},
  cBtn:{backgroundColor:'#4F46E5',borderRadius:12,paddingVertical:13,alignItems:'center'},
  cBtnOff:{backgroundColor:'#C4B5FD'},cBtnTxt:{color:'#fff',fontWeight:'700',fontSize:15},
  noLoc:{position:'absolute',bottom:20,left:20,right:20,backgroundColor:'rgba(0,0,0,0.65)',borderRadius:12,padding:12},
  noLocTxt:{color:'#fff',fontSize:13,textAlign:'center'},
});
