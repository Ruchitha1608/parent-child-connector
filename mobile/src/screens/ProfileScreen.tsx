import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Switch } from 'react-native';
import { useStore } from '../../store/useStore';
import { authAPI, userAPI } from '../../services/api';
import { disconnectSocket } from '../../services/socket';

export default function ProfileScreen() {
  const { user, clearAuth, setAuth, accessToken, refreshToken } = useStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      {
        text: 'Logout', style: 'destructive', onPress: async () => {
          try { await authAPI.logout(); } catch {}
          disconnectSocket();
          await clearAuth();
        },
      },
    ]);
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    setSaving(true);
    try {
      const { data } = await userAPI.updateProfile({ name: name.trim(), phone: phone.trim() });
      if (user && accessToken && refreshToken) {
        await setAuth({ ...user, name: data.name, phone: data.phone }, accessToken, refreshToken);
      }
      setEditing(false);
      Alert.alert('Saved', 'Profile updated!');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to update');
    } finally { setSaving(false); }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.avatarCard}>
        <View style={s.avatar}><Text style={s.avatarText}>{user?.role === 'parent' ? '👨‍👧' : '👧'}</Text></View>
        <Text style={s.roleBadge}>{user?.role?.toUpperCase()}</Text>
      </View>

      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Profile Info</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}><Text style={s.editBtn}>Edit</Text></TouchableOpacity>
          )}
        </View>
        {editing ? (
          <>
            <Text style={s.fieldLabel}>Name</Text>
            <TextInput style={s.input} value={name} onChangeText={setName} placeholder='Your name' placeholderTextColor='#9CA3AF'/>
            <Text style={s.fieldLabel}>Phone</Text>
            <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder='Phone number' keyboardType='phone-pad' placeholderTextColor='#9CA3AF'/>
            <View style={s.row}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setEditing(false); setName(user?.name||''); setPhone(user?.phone||''); }}>
                <Text style={s.cancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.saveBtn, saving&&s.saveBtnOff]} onPress={handleSave} disabled={saving}>
                <Text style={s.saveBtnTxt}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={s.field}><Text style={s.fieldLabel}>Name</Text><Text style={s.fieldValue}>{user?.name}</Text></View>
            <View style={s.field}><Text style={s.fieldLabel}>Email</Text><Text style={s.fieldValue}>{user?.email}</Text></View>
            <View style={s.field}><Text style={s.fieldLabel}>Phone</Text><Text style={s.fieldValue}>{user?.phone || 'Not set'}</Text></View>
            <View style={s.field}><Text style={s.fieldLabel}>Paired with</Text><Text style={s.fieldValue}>{user?.pairedWith ? 'Yes' : 'No'}</Text></View>
          </>
        )}
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutTxt}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#F3F4F6'},
  content:{padding:16,paddingBottom:40},
  avatarCard:{alignItems:'center',marginBottom:20,marginTop:8},
  avatar:{width:80,height:80,borderRadius:40,backgroundColor:'#EEF2FF',justifyContent:'center',alignItems:'center',marginBottom:8},
  avatarText:{fontSize:40},
  roleBadge:{backgroundColor:'#4F46E5',color:'#fff',paddingHorizontal:12,paddingVertical:3,borderRadius:10,fontSize:12,fontWeight:'700'},
  card:{backgroundColor:'#fff',borderRadius:16,padding:16,marginBottom:16,elevation:3},
  cardHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12},
  cardTitle:{fontSize:17,fontWeight:'700',color:'#111827'},
  editBtn:{color:'#4F46E5',fontWeight:'700',fontSize:14},
  field:{marginBottom:12},
  fieldLabel:{fontSize:12,color:'#9CA3AF',fontWeight:'600',marginBottom:3,textTransform:'uppercase'},
  fieldValue:{fontSize:15,color:'#111827',fontWeight:'500'},
  input:{borderWidth:1.5,borderColor:'#E5E7EB',borderRadius:10,paddingHorizontal:14,paddingVertical:11,fontSize:15,color:'#111827',marginBottom:10},
  row:{flexDirection:'row',gap:10},
  cancelBtn:{flex:1,borderWidth:1.5,borderColor:'#E5E7EB',borderRadius:10,paddingVertical:12,alignItems:'center'},
  cancelBtnTxt:{color:'#374151',fontWeight:'600'},
  saveBtn:{flex:1,backgroundColor:'#4F46E5',borderRadius:10,paddingVertical:12,alignItems:'center'},
  saveBtnOff:{backgroundColor:'#C4B5FD'},
  saveBtnTxt:{color:'#fff',fontWeight:'700'},
  logoutBtn:{backgroundColor:'#FEE2E2',borderRadius:14,paddingVertical:15,alignItems:'center',marginTop:8},
  logoutTxt:{color:'#EF4444',fontWeight:'800',fontSize:16},
});
