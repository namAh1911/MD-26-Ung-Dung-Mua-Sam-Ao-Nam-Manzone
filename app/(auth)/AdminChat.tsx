import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../src/AuthContext';
import { chatAPI } from '../src/ChatAPI';
import { socket } from '../src/socket';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  responseType?: string;
  uuid: string;
  adminId?: string;
  userId?: string;
}

const AdminChatScreen = React.memo(() => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<any>(null);
  const messageQueueRef = useRef<Set<string>>(new Set());
  const processingMessagesRef = useRef<Set<string>>(new Set());
  const lastActionTimeRef = useRef<number>(0);

  // Generate unique UUID for messages
  const generateUUID = useCallback((): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 15)}`;
  }, []);

  // Helper function to safely format timestamps
  const formatTimestamp = useCallback((timestamp: any): string => {
    if (!timestamp) return 'Vừa xong';
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(date.getTime())) return 'Vừa xong';
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Vừa xong';
    }
  }, []);

  // Emit typing indicator to admin
  const emitTypingIndicator = useCallback((isTyping: boolean) => {
    if (sessionId && user) {
      if (isTyping) {
        socket.emit('adminChatTyping', { sessionId, userId: user.id });
      } else {
        socket.emit('adminChatStopTyping', { sessionId, userId: user.id });
      }
    }
  }, [sessionId, user]);

  // Initialize admin chat session
  const initializeAdminChatSession = useCallback(async () => {
    if (!user || !token) {
      setError('Vui lòng đăng nhập để sử dụng chat');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { sessionId: newSessionId, messages: initialMessages, isExisting } = await chatAPI.createUserAdminChatSession(token);
      
      setSessionId(newSessionId);
      const formattedMessages = initialMessages.map(msg => ({
        id: msg.message_id,
        text: msg.text,
        isUser: msg.is_user,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        responseType: msg.response_type,
        uuid: generateUUID(),
        adminId: msg.admin_id,
        userId: msg.user_id
      }));
      
      console.log('📱 Setting initial messages:', {
        count: formattedMessages.length,
        sessionId: newSessionId,
        messages: formattedMessages.map(m => ({ id: m.id, text: m.text.substring(0, 30), isUser: m.isUser }))
      });
      
      setMessages(formattedMessages);
      
      // Reset tracking for new session
      messageQueueRef.current.clear();
      processingMessagesRef.current.clear();
      lastActionTimeRef.current = 0;
      
      if (isExisting) {
        console.log('📱 Reconnected to existing admin chat session');
      } else {
        console.log('🆕 Created new admin chat session');
      }
      
    } catch (err: any) {
      console.error('Error initializing admin chat:', err);
      setError(err.message || 'Không thể khởi tạo chat với nhân viên');
    } finally {
      setLoading(false);
    }
  }, [user, token, generateUUID]);

  // Setup socket connection for admin chat
  const setupSocketConnection = useCallback(() => {
    if (!user || !token || socketRef.current) {
      return;
    }

    console.log('🔌 Setting up admin chat socket connection...');
    
    // Disconnect any existing connection
    socket.disconnect();
    
    // Connect and setup
    socket.connect();
    socket.emit('joinUser', user.id);
    
    // Join admin chat room
    if (sessionId) {
      socket.emit('joinAdminChat', { sessionId, userId: user.id });
      // Also join the admin chat session room
      socket.emit('joinChatSession', { sessionId, chatType: 'admin' });
    }
    
    // Listen for new admin messages
    socket.on('newAdminMessage', (data: any) => {
      console.log('📱 Received newAdminMessage socket event:', data);

      if (data.sessionId === sessionId) {
        // Handle different data formats from server
        let messageData: any;
        
        if (data.message) {
          // Format: { sessionId, message: { message_id, text, is_user, timestamp, admin_id } }
          messageData = data.message;
        } else if (data.text) {
          // Format: { sessionId, text, timestamp, adminId }
          messageData = {
            message_id: `admin_${Date.now()}`,
            text: data.text,
            is_user: false,
            timestamp: data.timestamp,
            admin_id: data.adminId
          };
        } else {
          console.log('❌ Unknown message format:', data);
          return;
        }
        
        const messageUUID = `socket_${messageData.message_id}`;
        
        // Check if we already processed this message
        if (messageQueueRef.current.has(messageUUID) || processingMessagesRef.current.has(messageUUID)) {
          console.log('🚫 Duplicate admin message blocked:', messageUUID);
          return;
        }
        
        const newMessage: Message = {
          id: messageData.message_id,
          text: messageData.text,
          isUser: messageData.is_user,
          timestamp: messageData.timestamp ? new Date(messageData.timestamp) : new Date(),
          responseType: messageData.response_type || 'admin_response',
          uuid: messageUUID,
          adminId: messageData.admin_id,
          userId: messageData.user_id
        };
        
        console.log('📱 Adding new admin message to UI:', newMessage);
        
        // Mark as processed immediately
        messageQueueRef.current.add(messageUUID);
        processingMessagesRef.current.add(messageUUID);
        
        setMessages(prev => {
          // Double-check for duplicates in current state
          const isDuplicate = prev.some(msg => 
            msg.text === newMessage.text && 
            msg.isUser === newMessage.isUser &&
            Math.abs(msg.timestamp.getTime() - newMessage.timestamp.getTime()) < 1000
          );
          
          if (isDuplicate) {
            console.log('🚫 Duplicate admin message blocked:', newMessage.text);
            return prev;
          }
          
          const updatedMessages = [...prev, newMessage];
          console.log('📱 Messages state updated, new count:', updatedMessages.length);
          return updatedMessages;
        });
        
        if (!messageData.is_user) {
          setIsTyping(false);
          setIsAdminTyping(false);
        }
        
        // Remove from processing after a delay
        setTimeout(() => {
          processingMessagesRef.current.delete(messageUUID);
        }, 1000);
      }
    });

    // Listen for admin typing indicators
    socket.on('adminTyping', (data: { sessionId: string; isTyping: boolean }) => {
      if (data.sessionId === sessionId) {
        setIsAdminTyping(data.isTyping);
      }
    });

    // Listen for message sent confirmation
    socket.on('messageSent', (data: { sessionId: string; messageId: string }) => {
      if (data.sessionId === sessionId) {
        console.log('✅ Message sent confirmation received:', data.messageId);
        // The message is already in the UI, just confirm it was sent
      }
    });

    // Debug: Log socket connection status
    socket.on('connect', () => {
      console.log('🔌 Socket connected with ID:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
    });

    // Debug: Log all socket events we're listening for
    console.log('🔌 Socket listeners set up for: newAdminMessage, adminTyping, messageSent, connect, disconnect, connect_error');

    socketRef.current = socket;
    console.log('✅ Admin chat socket connection established');

    return () => {
      console.log('🔌 Cleaning up admin chat socket connection...');
      
      // Leave admin chat room if session exists
      if (sessionId) {
        console.log('🔌 Leaving admin chat room for session:', sessionId);
        socket.emit('leaveAdminChat', { sessionId });
        socket.emit('leaveChatSession', { sessionId, chatType: 'admin' });
      }
      
      socket.off('newAdminMessage');
      socket.off('adminTyping');
      socket.off('messageSent');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, token, sessionId]);

  // Send message to admin
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !sessionId || !token) return;

    const messageText = inputText.trim();
    const currentTime = Date.now();
    
    // Prevent rapid message sending
    if (currentTime - lastActionTimeRef.current < 1000) {
      console.log('🚫 Message blocked - too rapid');
      return;
    }
    
    // Check for duplicate content in recent messages
    const recentDuplicate = messages.some(msg => 
      msg.text === messageText && 
      msg.isUser && 
      currentTime - msg.timestamp.getTime() < 3000
    );
    
    if (recentDuplicate) {
      console.log('🚫 Duplicate message content blocked:', messageText);
      setInputText('');
      return;
    }
    
    setInputText('');
    setIsTyping(true);
    lastActionTimeRef.current = currentTime;

    try {
      // Generate unique UUID for this message
      const messageUUID = generateUUID();
      
      // Create temporary message
      const tempUserMessage: Message = {
        id: `temp_${Date.now()}`,
        text: messageText,
        isUser: true,
        timestamp: new Date(),
        uuid: messageUUID
      };
      
      // Mark as processing
      processingMessagesRef.current.add(messageUUID);
      
      // Add to messages immediately
      console.log('📱 Adding temporary message to UI:', tempUserMessage);
      setMessages(prev => {
        const newMessages = [...prev, tempUserMessage];
        console.log('📱 Messages after adding temp:', newMessages.length);
        return newMessages;
      });

      // Send to API - use sendAdminMessage for admin chat
      const response = await chatAPI.sendAdminMessage(sessionId, messageText, token);
      
      // Update temporary message with real data
      const finalMessage: Message = {
        id: response.message.message_id,
        text: messageText,
        isUser: true,
        timestamp: response.message.timestamp ? new Date(response.message.timestamp) : new Date(),
        uuid: messageUUID
      };
      
      // Replace temporary message with final message
      console.log('📱 Replacing temporary message with final:', finalMessage);
      setMessages(prev => {
        const updatedMessages = prev.map(msg => 
          msg.uuid === messageUUID ? finalMessage : msg
        );
        console.log('📱 Messages after replacement:', updatedMessages.length);
        return updatedMessages;
      });
      
      // Mark as processed in queue
      messageQueueRef.current.add(messageUUID);
      
      // Remove from processing
      processingMessagesRef.current.delete(messageUUID);
      
      // Emit typing indicator to admin
      socket.emit('adminChatTyping', { sessionId, userId: user.id });
      
      // Emit new user message to admin
      socket.emit('newUserMessage', { 
        sessionId, 
        userId: user.id, 
        text: messageText, 
        timestamp: new Date() 
      });
      
    } catch (err: any) {
      console.error('Error sending admin message:', err);
      
      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => msg.text !== messageText));
      
      Alert.alert('Lỗi gửi tin nhắn', err.message || 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setIsTyping(false);
    }
  }, [inputText, sessionId, token, messages, generateUUID, user.id]);

  // Initialize chat when component mounts
  useEffect(() => {
    initializeAdminChatSession();
  }, [initializeAdminChatSession]);

  // Setup socket connection when session is ready
  useEffect(() => {
    if (sessionId && user && token && !socketRef.current) {
      const cleanup = setupSocketConnection();
      return cleanup;
    }
  }, [sessionId, user, token, setupSocketConnection]);

  // Debug: Log message changes
  useEffect(() => {
    console.log('📱 Messages state updated:', {
      count: messages.length,
      lastMessage: messages[messages.length - 1],
      allMessages: messages.map(m => ({ id: m.id, text: m.text.substring(0, 30), isUser: m.isUser }))
    });
  }, [messages]);

  // Initial scroll to end when messages are first loaded
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      // Scroll to end when chat is first opened and messages are loaded
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToEnd({ animated: true });
        } catch (error) {
          console.log('Initial scroll error handled gracefully:', error);
        }
      }, 300); // Longer delay to ensure layout is complete
    }
  }, [messages.length, loading]);

  // Scroll to end when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (messages.length > 0 && !loading) {
        // Scroll to end when user navigates back to this screen
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToEnd({ animated: true });
          } catch (error) {
            console.log('Focus scroll error handled gracefully:', error);
          }
        }, 300);
      }
    }, [messages.length, loading])
  );

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isAdminMessage = !item.isUser && item.adminId;
    
    return (
      <View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.adminMessage]}>
        <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.adminBubble]}>
          {isAdminMessage && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#fff" />
              <Text style={styles.adminBadgeText}>Nhân viên</Text>
            </View>
          )}
          <Text style={[styles.messageText, item.isUser ? styles.userText : styles.adminText]}>
            {item.text}
          </Text>
          <Text style={[styles.timestamp, item.isUser ? styles.userTimestamp : styles.adminTimestamp]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  }, [formatTimestamp]);

  const renderTypingIndicator = useCallback(() => (
    <View style={[styles.messageContainer, styles.adminMessage]}>
      <View style={[styles.messageBubble, styles.adminBubble, styles.typingBubble]}>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={12} color="#fff" />
          <Text style={styles.adminBadgeText}>Nhân viên</Text>
        </View>
        <Text style={styles.typingText}>Đang nhập...</Text>
      </View>
    </View>
  ), []);

  // Enhanced scroll to bottom using multiple methods
  const forceScrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      try {
        // Primary scroll method
        flatListRef.current.scrollToEnd({ animated: true });
      } catch (error) {
        console.log('Scroll error handled gracefully:', error);
      }
    }
  }, [messages.length]);

  // Show loading screen
  if (loading) {
    return (
      <View style={styles.rootContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Đang kết nối với nhân viên...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Show error screen
  if (error) {
    return (
      <View style={styles.rootContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={initializeAdminChatSession}>
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Show login required screen
  if (!user) {
    return (
      <View style={styles.rootContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.loginRequiredText}>
              Vui lòng đăng nhập để chat với nhân viên
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.avatarContainer}>
                <Ionicons name="people" size={24} color="#fff" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Chat với Nhân viên</Text>
                <Text style={styles.headerSubtitle}>Hỗ trợ trực tiếp • Phản hồi nhanh</Text>
              </View>
            </View>
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={16} color="#3498db" />
            <Text style={styles.infoText}>
              Nhân viên sẽ phản hồi trong thời gian sớm nhất. Bạn có thể đặt câu hỏi về sản phẩm, đơn hàng, hoặc bất kỳ vấn đề gì.
            </Text>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.uuid || item.id || `msg_${Date.now()}_${Math.random()}`}
            renderItem={renderMessage}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={isAdminTyping ? renderTypingIndicator : null}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            // Better performance and stability
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
            // Force re-render when messages change
            extraData={messages.length}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={(text) => {
                setInputText(text);
                // Emit typing indicator
                if (text.length > 0) {
                  emitTypingIndicator(true);
                  // Clear previous timeout
                  if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                  }
                  // Set timeout to stop typing indicator
                  typingTimeoutRef.current = setTimeout(() => {
                    emitTypingIndicator(false);
                  }, 1000);
                } else {
                  emitTypingIndicator(false);
                }
              }}
              placeholder="Nhập tin nhắn cho nhân viên..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive]}
              onPress={sendMessage}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? '#fff' : '#ccc'}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
});

export default AdminChatScreen;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2c3e50',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#34495e',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#bdc3c7',
    marginTop: 2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#b3d9ff',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#2c3e50',
    lineHeight: 18,
    marginLeft: 8,
  },
  debugButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  adminMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#3498db',
  },
  adminBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  typingBubble: {
    opacity: 0.7,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  adminBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  adminText: {
    color: '#2c3e50',
  },
  typingText: {
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  adminTimestamp: {
    color: '#95a5a6',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
    marginBottom: 30,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#e74c3c',
  },
  sendButtonInactive: {
    backgroundColor: '#f1f3f4',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginRequiredText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
