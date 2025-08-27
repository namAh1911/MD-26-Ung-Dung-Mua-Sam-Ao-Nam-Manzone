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
import { chatAPI, ChatMessage } from '../src/ChatAPI';
import { socket } from '../src/socket';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  responseType?: string;
  uuid: string;
  subAnswers?: string[];
  followUpQuestions?: string[];
}

const ChatScreen = React.memo(() => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<any>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());
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

  // Handle admin chat navigation
  const handleAdminChat = useCallback(() => {
    router.push('/(auth)/AdminChat');
  }, [router]);

  // Initialize chat session
  const initializeChatSession = useCallback(async () => {
    if (!user || !token) {
      setError('Vui lòng đăng nhập để sử dụng chat');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { sessionId: newSessionId, messages: initialMessages } = await chatAPI.createChatSession(token);
      
      setSessionId(newSessionId);
      const formattedMessages = initialMessages.map(msg => ({
        id: msg.message_id,
        text: msg.text,
        isUser: msg.is_user,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        responseType: msg.response_type,
        uuid: generateUUID(),
        subAnswers: msg.sub_answers || [],
        followUpQuestions: msg.follow_up_questions || []
      }));
      
      setMessages(formattedMessages);
      
      // Reset tracking for new session
      processedMessageIds.current.clear();
      lastActionTimeRef.current = 0;
      
    } catch (err: any) {
      console.error('Error initializing chat:', err);
      setError(err.message || 'Không thể khởi tạo chat');
    } finally {
      setLoading(false);
    }
  }, [user, token, generateUUID]);

  // Setup socket connection
  const setupSocketConnection = useCallback(() => {
    if (!user || !token || socketRef.current) {
      return;
    }

    console.log('🔌 Setting up socket connection...');
    
    // Disconnect any existing connection
    socket.disconnect();
    
    // Connect and setup
    console.log('🔌 Connecting to socket...');
    socket.connect();
    console.log('🔌 Emitting joinUser event for user:', user.id);
    socket.emit('joinUser', user.id);
    
    // Join bot chat room for this session
    if (sessionId) {
      console.log('🔌 Joining bot chat room for session:', sessionId);
      socket.emit('joinChatSession', { sessionId, chatType: 'bot' });
    }
    
    // Listen for bot responses only - ignore user messages from socket
    // Remove any existing listeners to avoid conflicts
    socket.off('newMessage');
    
    socket.on('newMessage', (data: { sessionId: string; message: ChatMessage }) => {
      console.log('📱 Received newMessage socket event:', data);
      console.log('📱 Current sessionId:', sessionId);
      console.log('📱 Message is_user:', data.message.is_user);
      console.log('📱 Socket connected status:', socket.connected);
      console.log('📱 Socket ID:', socket.id);
      console.log('🔌 Socket rooms (if available):', (socket as any).rooms);
      
      if (data.sessionId === sessionId && !data.message.is_user) {
        console.log('🤖 Processing bot message from socket');
        // Only handle bot messages from socket
        const botMessageId = `bot_${data.message.message_id}`;
        
        // Check if we already processed this bot message
        if (processedMessageIds.current.has(botMessageId)) {
          console.log('🚫 Duplicate bot message blocked:', data.message.message_id);
          return;
        }
        
        const newBotMessage: Message = {
          id: data.message.message_id,
          text: data.message.text,
          isUser: false,
          timestamp: data.message.timestamp ? new Date(data.message.timestamp) : new Date(),
          responseType: data.message.response_type,
          uuid: botMessageId,
          subAnswers: data.message.sub_answers || [],
          followUpQuestions: data.message.follow_up_questions || []
        };
        
        console.log('🤖 Creating new bot message:', newBotMessage);
        
        // Mark as processed immediately
        processedMessageIds.current.add(botMessageId);
        
        // Add bot message to state
        setMessages(prev => {
          console.log('🤖 Adding bot message to state, previous count:', prev.length);
          const newState = [...prev, newBotMessage];
          console.log('🤖 New state count:', newState.length);
          return newState;
        });
        
        // Stop typing indicator
        setIsTyping(false);
        console.log('🤖 Bot message processed successfully');
      } else {
        console.log('📱 Message ignored - sessionId mismatch or user message');
        console.log('📱 SessionId match:', data.sessionId === sessionId);
        console.log('📱 Is user message:', data.message.is_user);
      }
    });

    // Listen for typing indicators
    socket.on('userTyping', (data: { sessionId: string; isTyping: boolean }) => {
      if (data.sessionId === sessionId) {
        setIsTyping(data.isTyping);
      }
    });

    // Listen for message confirmation
    socket.on('messageSent', (data: { sessionId: string; messageId: string }) => {
      console.log('✅ Message sent confirmation received:', data);
      if (data.sessionId === sessionId) {
        console.log('✅ Message confirmed for session:', sessionId);
      }
    });

    // General socket event listener for debugging
    socket.onAny((eventName, ...args) => {
      console.log('🔌 Socket event received:', eventName, args);
    });

    socketRef.current = socket;
    console.log('✅ Socket connection established');
    
    // Debug: Log socket connection status
    console.log('🔌 Socket connected:', socket.connected);
    console.log('🔌 Socket ID:', socket.id);

    return () => {
      console.log('🔌 Cleaning up socket connection...');
      
      // Leave bot chat room if session exists
      if (sessionId) {
        console.log('🔌 Leaving bot chat room for session:', sessionId);
        socket.emit('leaveChatSession', { sessionId, chatType: 'bot' });
      }
      
      socket.off('newMessage');
      socket.off('userTyping');
      socket.off('messageSent');
      socket.offAny();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, token, sessionId]);

  // Send message function with strict deduplication
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
      
      // Add to messages immediately
      setMessages(prev => [...prev, tempUserMessage]);

      // Send to API
      console.log('📱 Sending message to API for session:', sessionId);
      const response = await chatAPI.sendMessage(sessionId, messageText, token);
      console.log('📱 API response received:', response);
      
      // Update temporary message with real data
      const finalMessage: Message = {
        id: response.message.message_id,
        text: messageText,
        isUser: true,
        timestamp: response.message.timestamp ? new Date(response.message.timestamp) : new Date(),
        uuid: messageUUID
      };
      
      console.log('📱 Updating message with final data:', finalMessage);
      setMessages(prev => 
        prev.map(msg => 
          msg.uuid === messageUUID ? finalMessage : msg
        )
      );
      
      // Mark as processed in queue
      // processedMessageIds.current.add(messageUUID); // No longer needed for user messages
      
      // Join chat session for real-time updates
      console.log('🔌 Emitting joinChatSession event for session:', sessionId);
      socket.emit('joinChatSession', { sessionId });
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      
      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => msg.text !== messageText));
      
      Alert.alert('Lỗi gửi tin nhắn', err.message || 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setIsTyping(false);
    }
  }, [inputText, sessionId, token, messages, generateUUID]);

  // Quick action handler with debouncing
  const handleQuickAction = useCallback((text: string) => {
    const currentTime = Date.now();
    
    // Prevent rapid clicking
    if (currentTime - lastActionTimeRef.current < 1500) {
      console.log('🚫 Quick action blocked - too rapid');
      return;
    }
    
    lastActionTimeRef.current = currentTime;
    setInputText(text);
    console.log('✅ Quick action executed:', text);
  }, []);

  // Handle sub-answer selection
  const handleSubAnswer = useCallback((text: string) => {
    setInputText(text);
    console.log('✅ Sub-answer selected:', text);
  }, []);

  // Function to re-join bot chat room (useful when returning from admin chat)
  const rejoinBotChatRoom = useCallback(() => {
    if (sessionId) {
      console.log('🔌 Attempting to rejoin bot chat room for session:', sessionId);
      
      // Check if socket is connected
      if (!socket.connected) {
        console.log('🔌 Socket not connected, attempting to reconnect...');
        socket.connect();
        
        // Wait for connection then join room
        socket.once('connect', () => {
          console.log('🔌 Socket reconnected, now joining bot chat room');
          socket.emit('joinChatSession', { sessionId, chatType: 'bot' });
        });
      } else {
        console.log('🔌 Socket is connected, joining bot chat room');
        socket.emit('joinChatSession', { sessionId, chatType: 'bot' });
      }
      
      console.log('🔌 Re-join bot chat room event emitted');
    } else {
      console.log('🔌 Cannot rejoin bot chat room: sessionId is null');
    }
  }, [sessionId]);

  // Initialize chat when component mounts
  useEffect(() => {
    console.log('📱 Chat component mounted, initializing session...');
    initializeChatSession();
  }, [initializeChatSession]);

  // Setup socket connection when session is ready
  useEffect(() => {
    console.log('📱 Session effect triggered:', { sessionId, user: !!user, token: !!token, socketRef: !!socketRef.current });
    if (sessionId && user && token && !socketRef.current) {
      console.log('📱 Setting up socket connection...');
      const cleanup = setupSocketConnection();
      return cleanup;
    }
  }, [sessionId, user, token, setupSocketConnection]);

  // Re-join bot chat room when sessionId changes or when returning to screen
  useEffect(() => {
    if (sessionId) {
      console.log('🔌 SessionId changed, attempting to rejoin bot chat room');
      rejoinBotChatRoom();
    }
  }, [sessionId, rejoinBotChatRoom]);

  // Re-join bot chat room when screen comes into focus (useful when returning from admin chat)
  useFocusEffect(
    useCallback(() => {
      if (sessionId) {
        console.log('🔌 Screen focused - attempting to rejoin bot chat room');
        rejoinBotChatRoom();
      }
    }, [sessionId, rejoinBotChatRoom])
  );

  // Simple auto scroll when new messages arrive - FIXED for stability
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        if (flatListRef.current) {
          try {
            flatListRef.current.scrollToEnd({ animated: true });
          } catch (error) {
            console.log('Scroll error handled gracefully');
          }
        }
      }, 150); // Increased delay for stability
    }
  }, [messages.length]);

  // Initial scroll to end when messages are first loaded
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      // Scroll to end when chat is first opened and messages are loaded
      setTimeout(() => {
        if (flatListRef.current) {
          try {
            flatListRef.current.scrollToEnd({ animated: false });
          } catch (error) {
            console.log('Initial scroll error handled gracefully');
          }
        }
      }, 500); // Longer delay to ensure layout is complete
    }
  }, [messages.length, loading]);

  // Scroll to end when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (messages.length > 0 && !loading) {
        // Scroll to end when user navigates back to this screen
        setTimeout(() => {
          if (flatListRef.current) {
            try {
              flatListRef.current.scrollToEnd({ animated: true });
            } catch (error) {
              console.log('Focus scroll error handled gracefully');
            }
          }
        }, 300);
      }
    }, [messages.length, loading])
  );

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

  // Debug function to test socket connection
  const debugSocketConnection = useCallback(() => {
    console.log('🔍 Debug Socket Connection:');
    console.log('📱 Session ID:', sessionId);
    console.log('🔌 Socket connected:', socket?.connected);
    console.log('🔌 Socket ID:', socket?.id);
    console.log('📱 Messages count:', messages.length);
    console.log('📱 Last message:', messages[messages.length - 1]);
    console.log('🔌 Socket ref:', socketRef.current);
    
    // Test socket connection
    if (socket && !socket.connected) {
      console.log('🔌 Attempting to reconnect socket...');
      socket.connect();
    }
    
    // Test emit to user room
    if (socket && socket.connected && user?.id) {
      console.log('🔌 Testing emit to user room:', `user_${user.id}`);
      socket.emit('joinUser', user.id);
    }
  }, [sessionId, socket, messages, user]);

  const renderSubAnswers = useCallback((subAnswers: string[]) => {
    if (!subAnswers || subAnswers.length === 0) return null;
    
    return (
      <View style={styles.subAnswersContainer}>
        <Text style={styles.subAnswersTitle}>💡 Gợi ý nhanh:</Text>
        <View style={styles.subAnswersGrid}>
          {subAnswers.map((answer, index) => (
            <TouchableOpacity
              key={`sub_${index}`}
              style={styles.subAnswerButton}
              onPress={() => handleSubAnswer(answer)}
              activeOpacity={0.7}
            >
              <Text style={styles.subAnswerText}>{answer}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }, [handleSubAnswer]);

  const renderFollowUpQuestions = useCallback((questions: string[]) => {
    if (!questions || questions.length === 0) return null;
    
    return (
      <View style={styles.followUpContainer}>
        <Text style={styles.followUpTitle}>❓ Câu hỏi gợi ý:</Text>
        {questions.map((question, index) => (
          <Text key={`follow_${index}`} style={styles.followUpQuestion}>
            • {question}
          </Text>
        ))}
      </View>
    );
  }, []);

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    return (
      <View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.botMessage]}>
        <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.botBubble]}>
          <Text style={[styles.messageText, item.isUser ? styles.userText : styles.botText]}>
            {item.text}
          </Text>
          <Text style={[styles.timestamp, item.isUser ? styles.userTimestamp : styles.botTimestamp]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
        
        {/* Render sub-answers for bot messages */}
        {!item.isUser && item.subAnswers && item.subAnswers.length > 0 && (
          renderSubAnswers(item.subAnswers)
        )}
        
        {/* Render follow-up questions for bot messages */}
        {!item.isUser && item.followUpQuestions && item.followUpQuestions.length > 0 && (
          renderFollowUpQuestions(item.followUpQuestions)
        )}
      </View>
    );
  }, [formatTimestamp, renderSubAnswers, renderFollowUpQuestions]);

  const renderTypingIndicator = useCallback(() => (
    <View style={[styles.messageContainer, styles.botMessage]}>
      <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
        <Text style={styles.typingText}>Đang nhập...</Text>
      </View>
    </View>
  ), []);

  // Show loading screen
  if (loading) {
    return (
      <View style={styles.rootContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Đang khởi tạo chat...</Text>
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
            <TouchableOpacity style={styles.retryButton} onPress={initializeChatSession}>
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
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.loginRequiredText}>
              Vui lòng đăng nhập để sử dụng tính năng chat
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
          enabled={true}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.avatarContainer}>
                <Ionicons name="chatbubbles" size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Manzone Support</Text>
                <Text style={styles.headerSubtitle}>Trợ lý ảo • Luôn online</Text>
              </View>
            </View>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.quickActionsContainer}>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('Tôi cần áo sơ mi công sở')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>
                👔 Áo sơ mi
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('Tôi cần áo khoác nam')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>
                🧥 Áo khoác
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('Phí ship bao nhiêu?')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>
                🚚 Phí ship
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('Giao hàng bao lâu?')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>
                ⏰ Giao hàng
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('Tư vấn size')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>
                📏 Tư vấn size
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('Hướng dẫn đặt hàng')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>
                📱 Đặt hàng
              </Text>
            </TouchableOpacity>
            
            {/* Admin Chat Button */}
            <TouchableOpacity
              style={[styles.quickActionButton, styles.adminChatButton]}
              onPress={handleAdminChat}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickActionText, styles.adminChatText]}>
                👨‍💼 Chat với nhân viên
              </Text>
            </TouchableOpacity>
          </View>

          {/* Second Row of Quick Action Buttons */}
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('Giờ mở cửa?')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>
                🕐 Giờ mở cửa
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('Chính sách đổi trả?')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>
                📋 Đổi trả
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('Theo dõi đơn hàng')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>
                📦 Theo dõi đơn
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('Liên hệ hỗ trợ')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>
                📞 Liên hệ
              </Text>
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => `${item.uuid}_${index}`}
            renderItem={renderMessage}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={isTyping ? renderTypingIndicator : null}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          />

          {/* Scroll to Bottom Button */}
          {messages.length > 3 && (
            <TouchableOpacity
              style={styles.scrollToBottomButton}
              onPress={forceScrollToBottom}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-down" size={20} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
              textAlignVertical="top"
              autoCapitalize="sentences"
              returnKeyType="default"
              enablesReturnKeyAutomatically={true}
              scrollEnabled={true}
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

export default ChatScreen;

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
    // Fix for "nhảy múa loạn xạ" - container stability
    position: 'relative',
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
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
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
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    gap: 8,
    position: 'relative',
    zIndex: 999,
  },
  quickActionButton: {
    backgroundColor: '#e8f4fd',
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
    paddingBottom: 10,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
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
  botBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  typingBubble: {
    opacity: 0.7,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  botText: {
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
  botTimestamp: {
    color: '#95a5a6',
  },
  // Sub-answers styling
  subAnswersContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  subAnswersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subAnswersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subAnswerButton: {
    backgroundColor: '#e8f4fd',
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  subAnswerText: {
    fontSize: 13,
    color: '#3498db',
    fontWeight: '500',
  },
  // Follow-up questions styling
  followUpContainer: {
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  followUpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  followUpQuestion: {
    fontSize: 13,
    color: '#5a6c7d',
    lineHeight: 18,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
    marginBottom: 30,
    // Fix for "nhảy múa loạn xạ" - stability improvements
    position: 'relative',
    zIndex: 1000,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    // Prevent layout shifts and ensure proper spacing
    minHeight: 70,
    // Better alignment for multiline input
    justifyContent: 'space-between',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 120,
    backgroundColor: '#ffffff',
    // Fix for "nhảy múa loạn xạ" - input stability
    minHeight: 44,
    lineHeight: 22,
    textAlignVertical: 'top',
    includeFontPadding: false, // Android
    // Prevent layout shifts and text cutoff
    paddingTop: 12,
    paddingBottom: 12,
    // Ensure text is visible
    color: '#2c3e50',
    fontWeight: '400',
    // Better text rendering
    textAlign: 'left',
  },
  sendButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // Fix for "nhảy múa loạn xạ" - button stability
    zIndex: 1001,
    elevation: 6, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sendButtonActive: {
    backgroundColor: '#3498db',
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
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminChatButton: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  adminChatText: {
    color: '#fff',
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#3498db',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1002,
    elevation: 7, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  debugButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  debugButtonText: {
    fontSize: 16,
    color: '#fff',
  },
});
