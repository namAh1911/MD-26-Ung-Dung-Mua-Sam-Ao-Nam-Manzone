import { Ionicons } from '@expo/vector-icons';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
      messageQueueRef.current.clear();
      processingMessagesRef.current.clear();
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
    socket.connect();
    socket.emit('joinUser', user.id);
    
    // Listen for new messages with strict deduplication
    socket.on('newMessage', (data: { sessionId: string; message: ChatMessage }) => {
      if (data.sessionId === sessionId) {
        const messageUUID = `socket_${data.message.message_id}`;
        
        // Check if we already processed this message
        if (messageQueueRef.current.has(messageUUID) || processingMessagesRef.current.has(messageUUID)) {
          console.log('🚫 Duplicate socket message blocked:', messageUUID);
          return;
        }
        
        const newMessage: Message = {
          id: data.message.message_id,
          text: data.message.text,
          isUser: data.message.is_user,
          timestamp: data.message.timestamp ? new Date(data.message.timestamp) : new Date(),
          responseType: data.message.response_type,
          uuid: messageUUID,
          subAnswers: data.message.sub_answers || [],
          followUpQuestions: data.message.follow_up_questions || []
        };
        
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
            console.log('🚫 Duplicate message in state blocked:', newMessage.text);
            return prev;
          }
          
          return [...prev, newMessage];
        });
        
        if (!data.message.is_user) {
          setIsTyping(false);
        }
        
        // Remove from processing after a delay
        setTimeout(() => {
          processingMessagesRef.current.delete(messageUUID);
        }, 1000);
      }
    });

    // Listen for typing indicators
    socket.on('userTyping', (data: { sessionId: string; isTyping: boolean }) => {
      if (data.sessionId === sessionId) {
        setIsTyping(data.isTyping);
      }
    });

    socketRef.current = socket;
    console.log('✅ Socket connection established');

    return () => {
      console.log('🔌 Cleaning up socket connection...');
      socket.off('newMessage');
      socket.off('userTyping');
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
      
      // Mark as processing
      processingMessagesRef.current.add(messageUUID);
      
      // Add to messages immediately
      setMessages(prev => [...prev, tempUserMessage]);

      // Send to API
      const response = await chatAPI.sendMessage(sessionId, messageText, token);
      
      // Update temporary message with real data
      const finalMessage: Message = {
        id: response.message.message_id,
        text: messageText,
        isUser: true,
        timestamp: response.message.timestamp ? new Date(response.message.timestamp) : new Date(),
        uuid: messageUUID
      };
      
      setMessages(prev => 
        prev.map(msg => 
          msg.uuid === messageUUID ? finalMessage : msg
        )
      );
      
      // Mark as processed in queue
      messageQueueRef.current.add(messageUUID);
      
      // Join chat session for real-time updates
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

  // Initialize chat when component mounts
  useEffect(() => {
    initializeChatSession();
  }, [initializeChatSession]);

  // Setup socket connection when session is ready
  useEffect(() => {
    if (sessionId && user && token && !socketRef.current) {
      const cleanup = setupSocketConnection();
      return cleanup;
    }
  }, [sessionId, user, token, setupSocketConnection]);

  // Auto scroll to show question at top and answer in view
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage.isUser) {
        // Scroll to show the user question at top and bot answer in view
        setTimeout(() => {
          // Find the user question that triggered this response
          const userQuestionIndex = messages.length - 2; // The message before bot response
          if (userQuestionIndex >= 0) {
            flatListRef.current?.scrollToIndex({
              index: userQuestionIndex,
              animated: true,
              viewPosition: 0.1 // Show user question at top
            });
          }
        }, 100);
      }
    }
  }, [messages.length]);

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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.avatarContainer}>
                <Ionicons name="chatbubbles" size={24} color="#fff" />
              </View>
              <View>
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
              onPress={() => handleQuickAction('Quần jeans nào đang hot?')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>
                👖 Quần jeans
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('Có khuyến mãi gì không?')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>
                💰 Khuyến mãi
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
          />

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
    marginBottom: 100,
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
});
