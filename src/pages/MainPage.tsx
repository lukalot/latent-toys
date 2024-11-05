import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import halftonePattern from '../assets/untitled.png';
import logoSvg from '../assets/noun-spinning-top-753468.svg';
import { supabase, checkSupabaseConnection } from '../lib/supabaseClient';
import horseAnimation from '../assets/wired-outline-1531-rocking-horse-hover-pinch.webp';
import { useMessageSound } from '../hooks/useMessageSound';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  user_number: number;
  created_at: string;
  room_id: string;
  local?: boolean;
  type?: 'join' | 'message';
}

interface RoomUserNumber {
  room_id: string;
  user_number: number;
}

interface TypingState {
  user: string;
  userNumber: number;
  content: string;
}

// Add this interface for the animated typing state
interface AnimatedTypingState {
  user: string;
  userNumber: number;
  content: string;
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

const JoinMessage = styled.div`
  text-align: center;
  padding: 0rem;
  margin: 0rem;
  color: #666;
  font-family: 'DM Mono', monospace;
  font-size: 0.9rem;
`;

const HelpButton = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 2rem;
  height: 2rem;
  background-color: #000;
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DM Mono', monospace;
  font-size: 1rem;
  cursor: pointer;
  z-index: 11;

  &:hover {
    background-color: #ffffff;
    color: #000;
  }
`;

const MenuButton = styled.button<{ $isOpen: boolean }>`
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  width: 2rem;
  height: 2rem;
  background-color: #000;
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DM Mono', monospace;
  font-size: 1rem;
  cursor: pointer;
  z-index: 11;
  font-weight: 500;
  transition: transform 0.2s ease;

  &:hover {
    background-color: #ffffff;
    color: #000;
  }

  ${props => props.$isOpen && `
    transform: rotate(45deg);
  `}
`;

const HelpBox = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 20rem;
  height: 30rem;
  background-color: #000;
  border-left: 1.5px solid #fff;
  outline: 1.5px dashed #fff;
  outline-offset: -1.5px;
  z-index: 10;
  transition: transform 0.2s ease-out;
  opacity: ${props => props.$isOpen ? 1 : 0};
  transform-origin: bottom right;
  transform: ${props => props.$isOpen ? 'scale(1)' : 'scale(0.2)'};
  pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
`;

const MenuPanel = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  width: 20rem;
  height: 30rem;
  background-color: #000;
  border-right: 1.5px solid #fff;
  outline: 1.5px dashed #fff;
  outline-offset: -1.5px;
  z-index: 10;
  transition: transform 0.2s ease-out;
  opacity: ${props => props.$isOpen ? 1 : 0};
  transform-origin: bottom left;
  transform: ${props => props.$isOpen ? 'scale(1)' : 'scale(0.2)'};
  pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
`;

// Update PlusIcon to remove the rotation transform
const PlusIcon = styled.svg`
  width: 1rem;
  height: 1rem;
`;

const HelpContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const HelpTitle = styled.div`
  color: #fff;
  font-size: 1.1rem;
  padding: 1.5rem;
  padding-top: 1.2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #222;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AuthorLink = styled.a`
  color: #666;
  font-size: 0.8rem;
  text-decoration: none;
  font-family: 'DM Mono', monospace;
  
  &:hover {
    color: #fff;
  }
`;

const HelpSections = styled.div`
  padding: 1.5rem;
  padding-top: 1.1rem;
  color: #666;
  font-family: 'DM Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  overflow-y: auto;
  flex: 1;

  /* Custom scrollbar styling */
  scrollbar-width: none;
  -ms-overflow-style: none;
  
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

const HelpSection = styled.div`
  margin-bottom: 1.5rem;
`;

const MenuContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #666;
  font-family: 'DM Mono', monospace;
  text-align: center;
  line-height: 1.6;
`;

const MenuTitle = styled.div`
  font-size: 1.1rem;
  margin-bottom: 1rem;
`;

const MenuText = styled.div`
  font-size: 0.9rem;
  opacity: 0.7;
`;

const MAX_MESSAGE_LENGTH = 2000;
const MAX_ROOM_NAME_LENGTH = 100;

const sanitizeMessage = (content: string): string => {
  // Trim whitespace and limit length
  let sanitized = content.trim().slice(0, MAX_MESSAGE_LENGTH);
  
  // Only encode < and > to prevent HTML/script injection
  // but preserve other characters
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  return sanitized;
};

const sanitizeRoomName = (name: string): string => {
  const sanitized = name
    .replace(/\s/g, '_')
    .replace(/\//g, '÷')
    .replace(/\*/g, '×')
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\u0400-\u04FF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\u0080-\u024F'?!&@\-~+%$#^*÷=:;_]/g, '');
  
  return sanitized.slice(0, MAX_ROOM_NAME_LENGTH);
};

// Update the GhostMessageBubble styling
const GhostMessageBubble = styled(MessageBubble)`
  background-color: transparent;
  opacity: 1;
  border: none;
  position: relative;
  color: #666;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 1.5px solid ${props => props.$isUser ? '#ffffff' : '#ffffff'};
    pointer-events: none;
    animation: borderPulse 2s ease-in-out infinite;
  }

  @keyframes borderPulse {
    0%, 100% { opacity: 0.1; }
    50% { opacity: 0.3; }
  }
`;

// Add this constant near the top with other constants
const TYPING_TIMEOUT = 3000; // 3 seconds

const MainPage: React.FC = () => {
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

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [navigationTitle, setNavigationTitle] = useState(getInitialRoom());
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
  const playMessageSound = useMessageSound();
  const [hasTyped, setHasTyped] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasEditedRoom, setHasEditedRoom] = useState(false);
  const [typingUsers, setTypingUsers] = useState<AnimatedTypingState[]>([]);
  const typingChannelRef = useRef<any>(null);
  const viewerChannelRef = useRef<any>(null);

  useEffect(() => {
    checkSupabaseConnection().then(connected => {
      setIsConnected(connected);
    });
  }, []);

  useEffect(() => {
    setIsInitialViewerCount(true);
  }, [navigationTitle]);

  useEffect(() => {
    // Only proceed if connected
    if (!isConnected) return;

    console.log('Loading messages for:', navigationTitle);

    // Function to load messages
    const loadToyMessages = async () => {
      try {
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

        if (existingMessages) {
          const reversedMessages = existingMessages.reverse();
          setMessages(reversedMessages);
          setHasMoreMessages(existingMessages.length === MESSAGES_PER_PAGE);
          if (existingMessages.length > 0) {
            setOldestLoadedTimestamp(existingMessages[0].created_at);
          }
          
          const nextNumber = getNextUserNumber(reversedMessages);
          setUserNumberForRoom(navigationTitle, nextNumber);
          
          setTimeout(() => scrollToBottom(true), 100);
        }
      } catch (error) {
        console.error('Error in loadToyMessages:', error);
      }
    };

    // Load initial messages
    loadToyMessages();

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
          // Add extensive debug logging
          console.log('=== MESSAGE RECEIVED ===', {
            messageRoom: payload.new.room_id,
            currentRoom: navigationTitle,
            message: payload.new.content,
            sender: payload.new.sender_id,
            filter: `room_id=eq.${navigationTitle}`,
            shouldShow: payload.new.room_id === navigationTitle
          });

          // Strict room check
          if (payload.new.room_id !== navigationTitle) {
            console.log('Ignoring message - wrong room:', {
              messageRoom: payload.new.room_id,
              currentRoom: navigationTitle
            });
            return;
          }

          console.log('Processing message for room:', navigationTitle);
          
          if (payload.new.sender_id !== anonymousId) {
            playMessageSound();
          }
          
          setTypingUsers(current => 
            current.filter(user => 
              !(user.user === payload.new.sender_id && user.content === payload.new.content)
            )
          );
          
          setMessages(current => {
            const filtered = current.filter(msg => 
              !(msg.local && msg.content === payload.new.content)
            );
            return [...filtered, payload.new as Message];
          });
        }
      )
      .subscribe((status) => {
        console.log(`Channel ${navigationTitle} status:`, status);
      });

    // Cleanup function
    return () => {
      console.log('=== CLEANING UP CHANNELS ===');
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe();
        typingChannelRef.current = null;
      }
      setTypingUsers([]);
    };
  }, [navigationTitle, isConnected, anonymousId]); // Simplified dependencies array

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
    
    const sanitizedMessage = sanitizeMessage(newMessage);
    if (!sanitizedMessage || sanitizedMessage.length > MAX_MESSAGE_LENGTH) return;

    const currentUserNumber = getCurrentUserNumber();
    
    const tempMessage: Message = {
      id: crypto.randomUUID(),
      content: sanitizedMessage,
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
        content: sanitizedMessage,
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
    const value = sanitizeRoomName(e.target.value);
    setNavigationTitle(value);
    setHasEditedRoom(true);
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
  }, [messages, typingUsers, newMessage]); // Add newMessage to dependencies

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
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    setNewMessage(textarea.value);
    
    if (typingChannelRef.current) {
      // Only broadcast if there's actual content
      const content = textarea.value.trim();
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user: anonymousId,
          userNumber: getCurrentUserNumber(),
          content: content || null // Send null if empty
        }
      });
    }
    
    if (textarea.value.length === 1) {
      handleFirstType();
    }
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

  const handleFirstType = async () => {
    if (!hasTyped) {
      setHasTyped(true);
      
      const currentUserNumber = getCurrentUserNumber();
      if (currentUserNumber === 0) {
        console.error('Invalid user number');
        return;
      }

      const shapeName = shapeNames[(currentUserNumber - 1) % shapeNames.length];
      
      const localJoinMessage: Message = {
        id: crypto.randomUUID(),
        content: `${shapeName} joined the room.`,
        sender_id: anonymousId,
        user_number: currentUserNumber,
        created_at: new Date().toISOString(),
        room_id: navigationTitle,
        type: 'join',
        local: true
      };

      setMessages(prev => [...prev, localJoinMessage]);
      // Force scroll after local message
      setTimeout(() => scrollToBottom(true), 0);

      const { error } = await supabase
        .from('messages')
        .insert({
          content: localJoinMessage.content,
          sender_id: anonymousId,
          user_number: currentUserNumber,
          room_id: navigationTitle,
          type: 'join'
        });

      if (error) {
        console.error('Error sending join message:', error);
        setMessages(prev => prev.filter(msg => msg.id !== localJoinMessage.id));
      } else {
        // Force scroll after server confirmation
        setTimeout(() => scrollToBottom(true), 100);
      }
    }
  };

  // Add effect to update URL when room changes
  useEffect(() => {
    if (hasEditedRoom) {
      const newPath = navigationTitle === 'main' ? '/' : `/t/${navigationTitle}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({}, '', newPath);
      }
    }
  }, [navigationTitle, hasEditedRoom]);

  // Add effect to handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const newRoom = getInitialRoom();
      setNavigationTitle(newRoom);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update the channel setup effect
  useEffect(() => {
    if (!isConnected) return;
    
    console.log('=== CHANNEL SETUP ===');
    console.log('Room:', navigationTitle);
    
    // Clear states when changing rooms
    setTypingUsers([]);
    
    // Set up message channel
    const messageChannel = supabase
      .channel(`room:${navigationTitle}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${navigationTitle}`,
        },
        handleNewMessage
      )
      .subscribe();

    // Set up typing channel
    const typingChannel = supabase.channel(`room-${navigationTitle}-typing`, {
      config: {
        broadcast: {
          self: false,
          ack: false
        }
      }
    });

    // Set up viewer channel
    const viewerChannel = supabase.channel(`presence:${navigationTitle}`, {
      config: {
        presence: {
          key: anonymousId,
        },
      }
    });

    // Store refs
    typingChannelRef.current = typingChannel;
    viewerChannelRef.current = viewerChannel;

    // Set up handlers
    setupViewerHandlers(viewerChannel);
    setupTypingHandlers(typingChannel);

    return () => {
      console.log('=== CLEANING UP ALL CHANNELS ===');
      messageChannel.unsubscribe();
      typingChannel.unsubscribe();
      viewerChannel.unsubscribe();
      typingChannelRef.current = null;
      viewerChannelRef.current = null;
      setTypingUsers([]);
      setMessages([]);
    };
  }, [navigationTitle, isConnected, anonymousId]);

  const handleNewMessage = (payload: any) => {
    console.log('=== MESSAGE RECEIVED ===', {
      messageRoom: payload.new.room_id,
      currentRoom: navigationTitle,
      message: payload.new.content,
      sender: payload.new.sender_id,
      type: payload.new.type
    });

    // Strict room check
    if (payload.new.room_id !== navigationTitle) {
      console.log('Ignoring message - wrong room');
      return;
    }

    // Only play sound for non-join messages from other users
    if (payload.new.sender_id !== anonymousId && payload.new.type !== 'join') {
      playMessageSound();
    }
    
    // Remove typing indicator when message is received
    setTypingUsers(current => 
      current.filter(user => user.user !== payload.new.sender_id)
    );
    
    // Update messages
    setMessages(current => {
      const filtered = current.filter(msg => 
        !(msg.local && msg.sender_id === payload.new.sender_id && msg.content === payload.new.content)
      );
      return [...filtered, payload.new as Message];
    });
  };

  const setupTypingHandlers = (channel: any) => {
    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!payload?.user || !payload?.userNumber) return;
        
        setTypingUsers(current => {
          // Remove existing typing state for this user
          const others = current.filter(u => u.user !== payload.user);
          
          // Add new typing state if there's content
          if (payload.content?.trim()) {
            return [...others, {
              user: payload.user,
              userNumber: payload.userNumber,
              content: payload.content
            }];
          }
          return others;
        });
      })
      .subscribe();
  };

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
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user: anonymousId });
        }
      });
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
            placeholder="Enter a room..."
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
            <PlaceholderSubtext>enter a room name above</PlaceholderSubtext>
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
                messages.map((message) => (
                  message.type === 'join' ? (
                    <JoinMessage key={message.id}>
                      {message.content}
                    </JoinMessage>
                  ) : (
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
                  )
                ))
              ) : (
                <EmptyStateContainer>
                  <EmptyStateImage 
                    src={horseAnimation} 
                    alt="Rocking horse animation"
                  />
                  <EmptyStateText>
                    you found a latent.toy<br />
                    send a message
                  </EmptyStateText>
                </EmptyStateContainer>
              )}
              
              {typingUsers.map(user => (
                <GhostMessageBubble key={user.user} $isUser={false}>
                  <MessageHeader>
                    <ShapeName>
                      {shapeNames[(user.userNumber - 1) % shapeNames.length]}
                    </ShapeName>
                    {Math.floor((user.userNumber - 1) / shapeNames.length) > 0 && (
                      <LoopCount>
                        {Math.floor((user.userNumber - 1) / shapeNames.length) + 1}
                      </LoopCount>
                    )}
                  </MessageHeader>
                  {user.content}
                </GhostMessageBubble>
              ))}
              
              {newMessage.trim() && (
                <GhostMessageBubble $isUser={true}>
                  <MessageHeader>
                    <ShapeName>
                      {shapeNames[(getCurrentUserNumber() - 1) % shapeNames.length]}
                    </ShapeName>
                    {Math.floor((getCurrentUserNumber() - 1) / shapeNames.length) > 0 && (
                      <LoopCount>
                        {Math.floor((getCurrentUserNumber() - 1) / shapeNames.length) + 1}
                      </LoopCount>
                    )}
                  </MessageHeader>
                  {newMessage}
                </GhostMessageBubble>
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
      <HelpBox $isOpen={isHelpOpen}>
        <HelpContent>
          <HelpTitle>
            About latent.toys
            <AuthorLink 
              href="https://x.com/lukalot_" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              lukalot
            </AuthorLink>
          </HelpTitle>
          <HelpSections>
            <HelpSection>
              Welcome to latent.toys! This site is an infinite library of chat rooms, each with a unique theme.
            </HelpSection>
            
            <HelpSection>
              There's no formal room creation - just type any room in the navigation bar to instantly discover a new space. This enables organic community formation around interesting latent.toy rooms.
            </HelpSection>

            <HelpSection>
              Each room assigns geometric shapes to users as they join (POINT, LINE, etc). Your shape persists for one hour after your last message, then becomes available for new users.
            </HelpSection>
          </HelpSections>
        </HelpContent>
      </HelpBox>
      <HelpButton 
        onClick={() => setIsHelpOpen(!isHelpOpen)}
      >
        ?
      </HelpButton>
      <MenuPanel $isOpen={isMenuOpen}>
        <MenuContent>
          <MenuTitle>work in progress</MenuTitle>
          <MenuText>this menu will be populated eventually...</MenuText>
        </MenuContent>
      </MenuPanel>
      <MenuButton 
        $isOpen={isMenuOpen}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <PlusIcon 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.4"
        >
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </PlusIcon>
      </MenuButton>
    </PageContainer>
  );
};

export default MainPage;