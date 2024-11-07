import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';
import { supabase, checkSupabaseConnection } from '../lib/supabaseClient';
import { useMessageSound } from '../hooks/useMessageSound';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import ChatContainer from '../components/ChatContainer';
import InputContainer from '../components/InputContainer';
import HelpBox from '../components/HelpBox';
import MenuButtons from '../components/MenuButtons';

// Import types and utilities from the original MainPage.tsx
// Add necessary types, constants, and utility functions here

const MAX_ROOM_NAME_LENGTH = 100;

// Add this interface for the animated typing state
interface AnimatedTypingState {
  user: string;
  userNumber: number;
  content: string;
  lastUpdated: number;
  position: number; // Add this to track order
  lastContent?: string;  // Add this to track last non-empty content
  clearedAt?: number;    // Add this to track when content was cleared
}

const stringToColor = (str: string): string => {
  // Special case for "main"
  if (str === 'main') {
    return 'rgb(0, 0, 0)';
  }
  
  // Original hash function for other strings
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const r = Math.abs((hash & 0xFF0000) >> 16) % 105;
  const g = Math.abs((hash & 0x00FF00) >> 8) % 105;
  const b = Math.abs(hash & 0x0000FF) % 105;
  
  return `rgb(${r}, ${g}, ${b})`;
}

const sanitizeRoomName = (name: string): string => {
  const sanitized = name
    .replace(/\s/g, '_')
    .replace(/\//g, '÷')
    .replace(/\*/g, '×')
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\u0400-\u04FF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\u0080-\u024F'?!&@\-~+%$#^*÷=:;_]/g, '');
  
  return sanitized.slice(0, MAX_ROOM_NAME_LENGTH);
};

const getInitialRoom = () => {
  const path = window.location.pathname;
  if (path === '/' || path === '') {
    return 'main';
  }
  if (path.startsWith('/t/')) {
    const room = path.slice(3); // Remove '/t/'
    const sanitized = sanitizeRoomName(room);
    return sanitized || 'main';
  }
  return 'main';
};

const PageContainer = styled.div<{ $bgColor: string }>`
  // Add styles from the original MainPage.tsx
`;

const MainContent = styled.main`
  // Add styles from the original MainPage.tsx
`;

const MainPageNew: React.FC = () => {
  // Add state variables and hooks from the original MainPage.tsx
const [messages, setMessages] = useState<Message[]>([]);
const [newMessage, setNewMessage] = useState('');
const [navigationTitle, setNavigationTitle] = useState(getInitialRoom());
const backgroundColor = stringToColor(navigationTitle);
const [anonymousId] = useState(() => crypto.randomUUID());
const [isConnected, setIsConnected] = useState(false);
const [viewerCount, setViewerCount] = useState(0);
const [isInitialViewerCount, setIsInitialViewerCount] = useState(true);
const viewerChannelRef = useRef<any>(null);
const [isLoadingMore, setIsLoadingMore] = useState(false);
const [isHelpOpen, setIsHelpOpen] = useState(false);
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [typingUsers, setTypingUsers] = useState<AnimatedTypingState[]>([]);

const [localGhostMessage, setLocalGhostMessage] = useState<{
  content: string;
  lastUpdated: number;
} | null>(null);

const getCurrentUserNumber = () => {
  const roomMapping = roomUserNumbers.find(r => r.room_id === navigationTitle);
  if (!roomMapping) {
    // If no number exists yet, calculate from existing messages
    const nextNumber = getNextUserNumber(messages);
    setUserNumberForRoom(navigationTitle, nextNumber);
    return nextNumber;
  }
  return roomMapping.user_number;
};

const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Enter') {
    if (e.shiftKey) {
      // Allow newline when Shift is pressed
      return;
    }
    e.preventDefault();
    handleSubmitMessage(e);
  }
};

const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
  const container = e.currentTarget;
  // For reversed layout, we check scrollTop directly since "top" is visually at the bottom
  const isNearTop = container.scrollTop <= SCROLL_THRESHOLD;
  
  if (isNearTop && !isLoadingMore && hasMoreMessages) {
    setIsLoadingMore(true);
    
    try {
      const { data: olderMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', navigationTitle)
        .lt('created_at', oldestLoadedTimestamp!)
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (error) throw error;

      if (olderMessages && olderMessages.length > 0) {
        setMessages(prev => [...prev, ...olderMessages]);
        setOldestLoadedTimestamp(olderMessages[olderMessages.length - 1].created_at);
        setHasMoreMessages(olderMessages.length === MESSAGES_PER_PAGE);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }
};

// Add useEffects and other hooks from the original MainPage.tsx
useEffect(() => {
  checkSupabaseConnection().then(connected => {
    setIsConnected(connected);
  });
}, []);

useEffect(() => {
  setIsInitialViewerCount(true);
}, [navigationTitle]);

useEffect(() => {
  if (!isConnected) return;

  const setupViewerHandlers = (channel: any) => {
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const newCount = Object.keys(state).length;
        
        if (isInitialViewerCount) {
          setViewerCount(newCount);
          setIsInitialViewerCount(false);
        } else {
          setTimeout(() => {
            setViewerCount(newCount);
          }, 1000);
        }
      })
      .subscribe(async (status: 'SUBSCRIBED' | 'CLOSED' | 'TIMED_OUT' | 'CHANNEL_ERROR') => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user: anonymousId });
        }
      });
  };

  const viewerChannel = supabase.channel(`presence:${navigationTitle}`, {
    config: {
      presence: {
        key: anonymousId,
      },
    }
  });

  viewerChannelRef.current = viewerChannel;
  setupViewerHandlers(viewerChannel);

  return () => {
    if (viewerChannelRef.current) {
      viewerChannelRef.current.unsubscribe();
      viewerChannelRef.current = null;
    }
  };
}, [navigationTitle, isConnected, anonymousId]);

// Add other useEffect hooks...

  // Add handler functions from the original MainPage.tsx
  const handleSubmitMessage = async (e: React.FormEvent) => {
    // Implementation...
  };

  const handleNavigationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Implementation...
  };

  // Add other handler functions...

  return (
    <PageContainer $bgColor={backgroundColor}>
      <Header />
      <Navigation
        navigationTitle={navigationTitle}
        onNavigationChange={handleNavigationChange}
      />
      <MainContent>
<ChatContainer
  navigationTitle={navigationTitle}
  messages={messages}
  viewerCount={viewerCount}
  typingUsers={typingUsers}
  localGhostMessage={localGhostMessage}
  isLoadingMore={isLoadingMore}
  onScroll={handleScroll}
  onSubmitMessage={handleSubmitMessage}
  newMessage={newMessage}
  onNewMessageChange={setNewMessage}
  onKeyDown={handleKeyDown}
  getCurrentUserNumber={getCurrentUserNumber}
  anonymousId={anonymousId}
  setNavigationTitle={setNavigationTitle}
/>
      </MainContent>
      <HelpBox isOpen={isHelpOpen} />
      <MenuButtons
        isHelpOpen={isHelpOpen}
        isMenuOpen={isMenuOpen}
        onHelpToggle={() => setIsHelpOpen(!isHelpOpen)}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
      />
    </PageContainer>
  );
};

export default MainPageNew;