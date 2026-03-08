import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../../store/useStore';
import { messageAPI, mediaAPI } from '../../services/api';
import { getSocket, connectSocket, emitMessage, emitTyping } from '../../services/socket';
import { Message } from '../../types';

export default function ChildChatScreen() {
  const { user, messages, setMessages, addMessage, setUnreadCount } = useStore();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();

    connectSocket().then((socket) => {
      socket.on('message:receive', (msg: Message) => {
        addMessage(msg);
        setUnreadCount(0);
        flatRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
      socket.on('message:sent', (msg: Message) => {
        addMessage(msg);
        flatRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
      socket.on('message:typing', () => {
        setIsTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setIsTyping(false), 2000);
      });
    });

    return () => {
      const socket = getSocket();
      socket?.off('message:receive');
      socket?.off('message:sent');
      socket?.off('message:typing');
    };
  }, []);

  async function loadMessages() {
    try {
      const { data } = await messageAPI.getMessages(50);
      setMessages(data);
      const unread = data.filter((m: Message) => !m.isRead && m.senderId !== user?.id);
      if (unread.length) {
        await messageAPI.markRead(unread.map((m: Message) => m.id));
        setUnreadCount(0);
      }
    } catch {}
  }

  async function handleSend() {
    if (!text.trim()) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      emitMessage(content, undefined, 'text');
    } catch {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  async function handleImageSend() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || !result.assets.length) return;
    const asset = result.assets[0];
    try {
      const { data } = await mediaAPI.upload(asset.uri, 'image/jpeg', 'photo.jpg', 'chat');
      emitMessage('', data.url, 'image');
    } catch {
      Alert.alert('Error', 'Failed to upload image');
    }
  }

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const mine = item.senderId === user?.id;
    return (
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        {item.messageType === 'image' && item.mediaUrl ? (
          <Image source={{ uri: item.mediaUrl }} style={styles.msgImage} resizeMode="cover" />
        ) : (
          <Text style={[styles.msgText, mine ? styles.mineText : styles.theirsText]}>{item.content}</Text>
        )}
        <Text style={[styles.msgTime, mine ? styles.mineTime : styles.theirsTime]}>
          {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  }, [user]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.list}
        ListHeaderComponent={isTyping ? (
          <View style={styles.typingRow}><Text style={styles.typingText}>Parent is typing...</Text></View>
        ) : null}
      />
      <View style={styles.inputBar}>
        <TouchableOpacity onPress={handleImageSend} style={styles.iconBtn}>
          <Text style={styles.iconBtnText}>🖼️</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor="#9CA3AF"
          value={text}
          onChangeText={(v) => { setText(v); emitTyping(); }}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]} onPress={handleSend} disabled={!text.trim() || sending}>
          <Text style={styles.sendBtnText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  list: { padding: 12, paddingBottom: 4 },
  bubble: {
    maxWidth: '78%', borderRadius: 18, padding: 10, marginVertical: 3,
  },
  mine: { alignSelf: 'flex-end', backgroundColor: '#059669', borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 4, elevation: 2 },
  msgText: { fontSize: 15 },
  mineText: { color: '#fff' },
  theirsText: { color: '#111827' },
  msgImage: { width: 200, height: 150, borderRadius: 10 },
  msgTime: { fontSize: 10, marginTop: 4 },
  mineTime: { color: 'rgba(255,255,255,0.65)', textAlign: 'right' },
  theirsTime: { color: '#9CA3AF' },
  typingRow: { paddingHorizontal: 16, paddingBottom: 4 },
  typingText: { color: '#9CA3AF', fontStyle: 'italic', fontSize: 13 },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  iconBtn: { padding: 6 },
  iconBtnText: { fontSize: 22 },
  input: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, fontSize: 15, color: '#111827', maxHeight: 100,
  },
  sendBtn: { backgroundColor: '#059669', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#D1D5DB' },
  sendBtnText: { color: '#fff', fontSize: 18 },
});
