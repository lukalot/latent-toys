import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import halftonePattern from '../assets/untitled.png';
import logoSvg from '../assets/noun-spinning-top-753468.svg';
import { supabase, checkSupabaseConnection } from '../lib/supabaseClient';
import horseAnimation from '../assets/wired-outline-1531-rocking-horse-hover-pinch.webp';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  user_number: number;
  created_at: string;
  room_id: string;
  local?: boolean;
}

interface RoomUserNumber {
  room_id: string;
  user_number: number;
}

const shapeNames = [
  // 1D
  "POINT",
  "LINE",
  
  // 2D
  "CIRCLE", 
  "TRIANGLE",
  "SQUARE",
  "PENTAGON",
  "HEXAGON",
  "HEPTAGON", 
  "OCTAGON",
  "NONAGON",
  "DECAGON",
  "ICOSAGON",
  
  // 3D
  "SPHERE",
  "CONE",
  "CYLINDER",
  "TETRAHEDRON", 
  "CUBE",
  "OCTAHEDRON",
  "ICOSAHEDRON",
  
  // 4D
  "HYPERSPHERE",
  "PENTATOPE",
  "TESSERACT"
];

const getNextUserNumber = (messages: Message[]): number => {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const recentMessages = messages.filter(msg => 
    new Date(msg.created_at) > oneHourAgo
  );

  const usedNumbers = recentMessages.map(msg => msg.user_number);
  const maxNumber = Math.max(0, ...usedNumbers);
  
  return maxNumber + 1;
};

function stringToColor(str: string): string {
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

const PageContainer = styled.div<{ $bgColor: string }>`
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: ${props => props.$bgColor};
  position: relative;
  display: flex;
  flex-direction: column;

  /* Background layers */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url(${halftonePattern});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0.7;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(40deg, #35623f, #683e4d);
    mix-blend-mode: hard-light;
    opacity: 1;
    z-index: 1;
  }

  /* Ensure content is above background */
  & > * {
    position: relative;
    z-index: 2;
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  position: relative;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 1.5rem;
  font-weight: 400;
  font-family: 'DM Mono', monospace;
  color: #fff;
  text-shadow: 0 0 28px rgba(72,174,137, 0.2);
  background-color: #000;
`;

const LogoIcon = styled.img`
  height: 1.75rem;
  width: 1.75rem;
  filter: invert(1);
`;

const LogoText = styled.span`
  @media (max-width: 760px) {
    display: none;
  }
`;

const NavigationContainer = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background-color: #000;
  padding: 0.5rem 0.65rem;
  //border-radius: 0.5rem;
  border-bottom: 1.5px solid #fff;
  width: 40%;
  max-width: 600px;
  display: flex;
  align-items: left;
  gap: 0.1rem;
  font-family: 'DM Mono', monospace;
`;

const NavigationPrefix = styled.div`
  font-size: 0.95rem;
  color: #fff;
  padding: 0.25rem;
  padding-right: 0rem;
  color: #555555;
`;

const NavigationField = styled.input`
  width: 100%;
  background: none;
  border: none;
  font-size: 0.95rem;
  color: #fff;
  padding: 0.25rem;
  padding-left: 0rem;
  text-align: left;
  font-family: 'DM Mono', monospace;
  &:focus {
    outline: none;
  }

  &::placeholder {
    color: #888;
  }
`;

const AuthButtons = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const LoginButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  font-family: 'DM Mono', monospace;
  color: #fff;
  cursor: pointer;
  //border-radius: 0.5rem;
  
  &:hover {
    background-color: #f4f4f5;
    color: #000;
  }
`;

const SignUpButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  //order-radius: 0.5rem;
  background-color: #cf5699;
  color: white;
  font-family: 'DM Mono', monospace;
  cursor: pointer;
  
  &:hover {
    background-color: #fff;
    color: #000;
  }
`;

const MainContent = styled.main`
  flex: 1;
  margin: 0 auto;
  padding: 2rem;
  padding-top: 1rem;
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ChatContainer = styled.div`
  background-color: #000;
  padding: 2rem;
  padding-top: 1.2rem;
  color: white;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(56, 132, 86, 0.2);
`;

const ChatTitle = styled.h1`
  font-size: 2.5rem;
  color: white;
  margin-bottom: 0rem;
  width: fit-content;
  max-width: 100%;
  border-bottom: 2px solid #282828;
`;

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  flex: 1;
  padding: 0rem;
  padding-bottom: 1rem;
  padding-top: 1rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #1a1a1a;
  }

  &::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 4px;
  }
`;

const MessageBubble = styled.div<{ $isUser?: boolean }>`
  max-width: 80%;
  padding: 0.65rem 0.9rem;
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  background-color: ${props => props.$isUser ? '#2d2d2d' : '#fff'};
  color: ${props => props.$isUser ? '#fff' : '#000'};
`;

const InputContainer = styled.form`
  margin-top: auto;
`;

const MessageInput = styled.textarea`
  width: 100%;
  padding: 1rem;
  padding-top: 0.8rem;
  padding-bottom: 0.9rem;
  border: 1px solid #2d2d2d;
  font-size: 1rem;
  background-color: #2d2d2d;
  color: white;
  resize: none;
  max-height: 12rem;
  font-family: inherit;
  line-height: 1.3;
  scrollbar-width: none;
  height: 100%;
  
  &:focus {
    outline: none;
    border-color: #ffffff;
  }

  &::placeholder {
    color: #777;
    font-weight: 400;
    opacity: 1;
  }
`;

const PlaceholderContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-family: 'DM Mono', monospace;

  padding-bottom: 10rem;
`;

const PlaceholderText = styled.div`
  font-size: 8rem;
  font-weight: 500;
  opacity: 0.4;
`;

const PlaceholderSubtext = styled.div`
  font-size: 1.2rem;
  opacity: 1;
  margin-top: -1rem;
  color: #9c9c99;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #9A9A98;
  flex: 1;
`;

const EmptyStateText = styled.div`
  font-size: 1.2rem;
  text-align: center;
  font-family: 'DM Mono', monospace;
  opacity: 0.5;
`;

const EmptyStateImage = styled.img`
  width: 120px;
  height: 120px;
  margin-bottom: 1.5rem;
  animation: playOnce 1s steps(1) forwards;
  opacity: 0.29;

  @keyframes playOnce {
    from {
      animation-play-state: running;
    }
    to {
      animation-play-state: paused;
    }
  }
`;

const MessageHeader = styled.div`
  font-size: 0.8rem;
  opacity: 0.5;
  margin-bottom: 0.2rem;
  font-family: 'DM Mono', monospace;
  display: flex;
  gap: 0.3rem;
  align-items: baseline;
`;

const ShapeName = styled.span``;

const LoopCount = styled.span`
  font-size: 0.7rem;
  opacity: 0.7;
`;

const MESSAGES_PER_PAGE = 20;
const SCROLL_THRESHOLD = 100; // pixels from top to trigger loading more

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 1rem;
  color: #666;
  font-size: 0.9rem;
  font-family: 'DM Mono', monospace;
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: top;
`;

const ViewerCount = styled.div`
  font-size: 0.9rem;
  color: #666;
  font-family: 'DM Mono', monospace;
  padding-right: 0.2rem;
  padding-top: 0.1rem;
`;

const MainPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [navigationTitle, setNavigationTitle] = useState('main');
  const backgroundColor = stringToColor(navigationTitle);
  const [anonymousId] = useState(() => crypto.randomUUID());
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomUserNumbers, setRoomUserNumbers] = useState<RoomUserNumber[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [oldestLoadedTimestamp, setOldestLoadedTimestamp] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isInitialViewerCount, setIsInitialViewerCount] = useState(true);

  useEffect(() => {
    checkSupabaseConnection().then(connected => {
      setIsConnected(connected);
    });
  }, []);

  useEffect(() => {
    setIsInitialViewerCount(true);
  }, [navigationTitle]);

  useEffect(() => {
    // Clear messages when switching toys
    setMessages([]);
    
    // Load messages for the room
    const loadToyMessages = async () => {
      if (!isConnected) {
        console.error('Not connected to Supabase');
        return;
      }

      try {
        console.log('Loading messages for:', navigationTitle);

        // First ensure the room exists
        const { error: roomError } = await supabase
          .from('rooms')
          .upsert({ id: navigationTitle })
          .select();

        if (roomError) {
          console.error('Error creating/updating room:', roomError);
          return;
        }

        // Then get all messages for this room
        const { data: existingMessages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', navigationTitle)
          .order('created_at', { ascending: false })
          .limit(MESSAGES_PER_PAGE);

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          return;
        }

        console.log('Fetched messages:', existingMessages);
        
        if (existingMessages) {
          const reversedMessages = existingMessages.reverse();
          setMessages(reversedMessages);
          setHasMoreMessages(existingMessages.length === MESSAGES_PER_PAGE);
          if (existingMessages.length > 0) {
            setOldestLoadedTimestamp(existingMessages[0].created_at);
          }
          
          if (!getCurrentUserNumber()) {
            const nextNumber = getNextUserNumber(reversedMessages);
            setUserNumberForRoom(navigationTitle, nextNumber);
          }
          setTimeout(() => scrollToBottom(true), 100);
        }
      } catch (error) {
        console.error('Error in loadToyMessages:', error);
      }
    };

    // Set up real-time subscription
    const channel = supabase
      .channel(`room:${navigationTitle}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${navigationTitle}`,
        },
        (payload) => {
          console.log('Received new message:', payload);
          setMessages(current => {
            const filtered = current.filter(msg => 
              !(msg.local && msg.content === payload.new.content)
            );
            return [...filtered, payload.new as Message];
          });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Add presence channel
    const presenceChannel = supabase.channel(`presence:${navigationTitle}`, {
      config: {
        presence: {
          key: anonymousId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
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
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Join:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Leave:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user: anonymousId });
        }
      });

    loadToyMessages();

    return () => {
      channel.unsubscribe();
      presenceChannel.unsubscribe();
    };
  }, [navigationTitle, isConnected]);

  const getCurrentUserNumber = () => {
    const roomMapping = roomUserNumbers.find(r => r.room_id === navigationTitle);
    return roomMapping?.user_number || 0;
  };

  const setUserNumberForRoom = (room_id: string, number: number) => {
    setRoomUserNumbers(prev => {
      const existing = prev.find(r => r.room_id === room_id);
      if (existing) {
        return prev.map(r => r.room_id === room_id ? { ...r, user_number: number } : r);
      }
      return [...prev, { room_id, user_number: number }];
    });
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const currentUserNumber = getCurrentUserNumber();
    
    const tempMessage: Message = {
      id: crypto.randomUUID(),
      content: newMessage,
      sender_id: anonymousId,
      user_number: currentUserNumber,
      created_at: new Date().toISOString(),
      room_id: navigationTitle,
      local: true
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    
    // Reset textarea height
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.style.height = 'auto';
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        content: newMessage,
        sender_id: anonymousId,
        user_number: currentUserNumber,
        room_id: navigationTitle
      })
      .select();

    if (error) {
      console.error('Error saving message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  };

  const handleNavigationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // First replace spaces with underscores
    let value = e.target.value;
        value = value.replace(/\s/g, '_');
        value = value.replace(/\//g, '÷');
        value = value.replace(/\*/g, '×');
        value = value.toLowerCase();
    
    // Then filter out any disallowed characters
    value = value.replace(/[^a-zA-Z0-9\u0400-\u04FF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\u0080-\u024F'?!&@\-~+%$#^*÷=:;_]/g, '');
    
    setNavigationTitle(value);
  };

  const scrollToBottom = (force = false) => {
    if (messageContainerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = messageContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (force || isNearBottom) {
        messageContainerRef.current.scrollTop = scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const autoResizeTextArea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set new height based on scrollHeight
    textarea.style.height = `${textarea.scrollHeight}px`;
    // Update the message state
    setNewMessage(textarea.value);
  };

  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    
    if (container.scrollTop <= SCROLL_THRESHOLD && !isLoadingMore && hasMoreMessages) {
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
          // Preserve scroll position
          const scrollHeight = container.scrollHeight;
          
          setMessages(prev => [...olderMessages.reverse(), ...prev]);
          setOldestLoadedTimestamp(olderMessages[olderMessages.length - 1].created_at);
          
          // Restore scroll position after new messages are added
          requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight - scrollHeight;
          });

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

  return (
    <PageContainer $bgColor={backgroundColor}>
      <Header>
        <LogoContainer>
          <LogoIcon src={logoSvg} alt="Latent Toys Logo" />
          <LogoText>latent.toys</LogoText>
        </LogoContainer>
        <NavigationContainer>
          <NavigationPrefix>t/</NavigationPrefix>
          <NavigationField
            type="text"
            value={navigationTitle}
            onChange={handleNavigationChange}
            placeholder="Enter a toy..."
          />
        </NavigationContainer>
        <AuthButtons>
          <LoginButton><s>Log in</s></LoginButton>
          <SignUpButton><s>Sign up</s></SignUpButton>
        </AuthButtons>
      </Header>
      
      <MainContent>
        {navigationTitle === '' ? (
          <PlaceholderContainer>
            <PlaceholderText>404</PlaceholderText>
            <PlaceholderSubtext>enter a toy name above</PlaceholderSubtext>
          </PlaceholderContainer>
        ) : (
          <ChatContainer>
            <ChatHeader>
              <ChatTitle>{navigationTitle}</ChatTitle>
              <ViewerCount>
                {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
              </ViewerCount>
            </ChatHeader>
            <MessageContainer 
              ref={messageContainerRef}
              onScroll={handleScroll}
            >
              {isLoadingMore && (
                <LoadingIndicator>Loading more messages...</LoadingIndicator>
              )}
              {messages.length > 0 ? (
                messages.map((message, index) => (
                  <MessageBubble 
                    key={message.id}
                    $isUser={message.sender_id === anonymousId}
                  >
                    <MessageHeader>
                      <ShapeName>
                        {shapeNames[(message.user_number - 1) % shapeNames.length]}
                      </ShapeName>
                      {Math.floor((message.user_number - 1) / shapeNames.length) > 0 && (
                        <LoopCount>
                          {Math.floor((message.user_number - 1) / shapeNames.length) + 1}
                        </LoopCount>
                      )}
                    </MessageHeader>
                    {message.content}
                  </MessageBubble>
                ))
              ) : (
                <EmptyStateContainer>
                  <EmptyStateImage 
                    src={horseAnimation} 
                    alt="Rocking horse animation"
                  />
                  <EmptyStateText>
                    you found an undiscovered toy<br />
                    send a message
                  </EmptyStateText>
                </EmptyStateContainer>
              )}
            </MessageContainer>
            <InputContainer onSubmit={handleSubmitMessage}>
              <MessageInput
                value={newMessage}
                onChange={autoResizeTextArea}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
              />
            </InputContainer>
          </ChatContainer>
        )}
      </MainContent>
    </PageContainer>
  );
};

export default MainPage;