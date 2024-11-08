import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import halftonePattern from '../assets/untitled.png';
import logoSvg from '../assets/noun-spinning-top-753468.svg';
import { supabase, checkSupabaseConnection } from '../lib/supabaseClient';
import horseAnimation from '../assets/wired-outline-1531-rocking-horse-hover-pinch.webp';
import { useMessageSound } from '../hooks/useMessageSound';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  user_number: number;
  created_at: string;
  room_id: string;
  local?: boolean;
  type?: 'join' | 'message';
  style?: { [key: string]: string };
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
  lastUpdated: number;
  position: number; // Add this to track order
  lastContent?: string;  // Add this to track last non-empty content
  clearedAt?: number;    // Add this to track when content was cleared
}

// Add this interface near the top with other interfaces
interface RoomJoinState {
  room_id: string;
  hasJoined: boolean;
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
  height: 100dvh;
  width: 100vw;
  overflow: hidden;
  background-color: ${props => props.$bgColor};
  position: relative;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

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
  z-index: 10;
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

const NavigationContainer = styled.div<{ $navigationOpen: boolean }>`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background-color: #000;
  padding: 0.5rem 0.65rem;
  width: 40%;
  max-width: 600px;
  display: flex;
  align-items: left;
  gap: 0.1rem;
  font-family: 'DM Mono', monospace;
  
  /* Use a pseudo-element for the border to prevent layout shift */
  &::after {
    content: '';
    position: absolute;
    inset: -1.5px;
    border: ${props => props.$navigationOpen ? '1.5px solid #fff' : '1.5px solid transparent'};
    pointer-events: none;
  }

  /* Move the bottom border to the container itself so it's always present */
  border-bottom: 1.5px solid #fff;
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
  min-height: 0;

  @media (max-width: 700px) {
    padding: 0rem;
    padding-top: 0.3rem;
  }
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
  min-height: 0;

  @media (max-width: 700px) {
    padding: 0.9rem;
    padding-bottom: 2rem;
    padding-top: 0.6rem;
    box-shadow: none;
  }
`;

const ChatTitle = styled.h1`
  font-size: 2.5rem;
  color: white;
  margin-bottom: 0rem;
  width: fit-content;
  max-width: 100%;
  border-bottom: 2px solid #282828;

  @media (max-width: 700px) {
    font-size: 2rem;
  }
`;

const MessageBubble = styled.div<{ $isUser?: boolean }>`
  max-width: 80%;
  padding: 0.65rem 0.9rem;
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  background-color: ${props => props.$isUser ? '#2d2d2d' : '#fff'};
  color: ${props => props.$isUser ? '#fff' : '#000'};

  @media (max-width: 700px) {
    padding: 0.5rem 0.7rem;
    font-size: 0.85rem;
  }
`;

const InputContainer = styled.form`
  margin-top: auto;
  
  @media (max-width: 700px) {
    position: sticky;
    bottom: 0;
    background: #000;
    margin-top: 0;
  }
`;

const MessageInput = styled.textarea`
  width: 100%;
  padding: 1rem;
  padding-top: 0.8rem;
  padding-bottom: 0.9rem;
  border: 1px solid #2d2d2d;
  font-size: 1rem;
  background-color: #2d2d2d;
  border-radius: 0;
  color: white;
  resize: none;
  max-height: 12rem;
  font-family: inherit;
  line-height: 1.3;
  scrollbar-width: none;
  height: 100%;
  
  @media (max-width: 700px) {
    padding: 0.7rem;
    font-size: 0.85rem;
    line-height: 1.4;
  }
  
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
const SCROLL_THRESHOLD = 200;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 1rem;
  color: #666;
  font-size: 0.9rem;
  font-family: 'DM Mono', monospace;
  order: 1; // This will push it to the end of the flex container
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
  padding-top: 0.4rem;
`;

const JoinMessage = styled.div<{ $isUser: boolean }>`
  text-align: ${props => props.$isUser ? 'right' : 'left'};
  padding: 0rem 0.5rem;
  margin: 0;
  color: #666;
  font-family: 'DM Mono', monospace;
  border-left: ${props => props.$isUser ? 'none' : '1.5px solid #666'};
  border-right: ${props => props.$isUser ? '1.5px solid #666' : 'none'};
  font-size: 0.8rem;
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  max-width: 80%;
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
  @media (max-width: 700px) {
    bottom: 0rem;
    right: 0rem;
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

  @media (max-width: 700px) {
    bottom: 0rem;
    left: 0rem;
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

// Add these new styled components after the existing MessageBubble component
const MessageGroup = styled.div<{ $isUser: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 1.5px;
  max-width: 80%;
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
`;

// Update the roundUpToNearestEm function to conditionally add padding
const roundUpToNearestEm = (width: number, hasLinks: boolean): number => {
  const emInPixels = 16; // 1em is typically 16px
  const roundTo = 2.4 * emInPixels; // Round to nearest 2.4em
  const extraPadding = hasLinks ? 0 * emInPixels : 0; // Only add padding if there are links
  return Math.ceil((width + extraPadding) / roundTo) * roundTo;
};

// Update the GroupedMessageBubble to use a ref and useEffect for width calculation
const GroupedMessageBubble = styled(MessageBubble)<{ $isFirst?: boolean }>`
  max-width: 100%;
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  text-align: left;
  width: var(--rounded-width, auto); // Use CSS variable for width
  
  ${MessageHeader} {
    justify-content: flex-start;
  }
  
  /* Only show header for first message in group */
  ${props => !props.$isFirst && `
    ${MessageHeader} {
      display: none;
    }
  `}
  
  /* Adjust padding for consecutive messages */
  ${props => !props.$isFirst && `
    padding-top: 0.65rem;
    padding-bottom: 0.65rem;
  `}
`;

// Add styled components for markdown elements
const MarkdownContent = styled.div`
  /* Base text styles */
  p {
    margin: 0;
    white-space: pre-wrap;
    display: inline; // Keep this to maintain inline paragraphs
  }

  /* Links */
  a {
    color: inherit;
    text-decoration: underline;
    text-decoration-style: dotted;
    display: inline-block; // Change from inline to inline-block
    white-space: nowrap; // Add this to prevent wrapping within links
    
    &:hover {
      opacity: 0.8;
    }
  }

  /* Lists */
  ul, ol {
    margin: 0.5em 0;
    padding-left: 1.5em;
  }

  li {
    margin: 0.25em 0;
  }

  /* Emphasis */
  em {
    font-style: italic;
  }

  strong {
    font-weight: bold;
  }

  /* Code */
  code {
    font-family: 'DM Mono', monospace;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.1em 0.3em;
    border-radius: 3px;
  }

  /* Blockquotes */
  blockquote {
    margin: 0.5em 0;
    padding-left: 1em;
    border-left: 2px solid rgba(255, 255, 255, 0.2);
    font-style: italic;
  }
`;

// Update the createRoomLinkPlugin function to add a class to room links
const createRoomLinkPlugin = () => {
  const ROOM_PATTERN = /\b(t\/[a-zA-Z0-9\u0400-\u04FF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\u0080-\u024F'?!&@\-~+%$#^*÷=:;_]+)\b/g;
  
  return () => (tree: any) => {
    const visitNode = (node: any): any => {
      if (node.type === 'text' && typeof node.value === 'string') {
        const parts = [];
        let lastIndex = 0;
        let match;
        
        ROOM_PATTERN.lastIndex = 0;
        while ((match = ROOM_PATTERN.exec(node.value)) !== null) {
          if (match.index > lastIndex) {
            parts.push({
              type: 'text',
              value: node.value.slice(lastIndex, match.index)
            });
          }
          
          parts.push({
            type: 'link',
            url: `/${match[1]}`,
            data: { roomLink: true }, // Add this to mark room links
            children: [{
              type: 'text',
              value: match[1]
            }]
          });
          
          lastIndex = match.index + match[1].length;
        }
        
        if (lastIndex < node.value.length) {
          parts.push({
            type: 'text',
            value: node.value.slice(lastIndex)
          });
        }
        
        if (parts.length > 0) {
          return parts;
        }
      }
      
      if (node.children) {
        const newChildren = [];
        for (const child of node.children) {
          const result = visitNode(child);
          if (Array.isArray(result)) {
            newChildren.push(...result);
          } else if (result !== undefined) {
            newChildren.push(result);
          } else {
            newChildren.push(child);
          }
        }
        node.children = newChildren;
      }
      
      return node;
    };

    return visitNode(tree);
  };
};

// Create a context for the navigation function
const NavigationContext = React.createContext<((roomName: string) => void) | null>(null);

// Create a provider component
const NavigationProvider: React.FC<{
  children: React.ReactNode;
  onNavigate: (roomName: string) => void;
}> = ({ children, onNavigate }) => {
  return (
    <NavigationContext.Provider value={onNavigate}>
      {children}
    </NavigationContext.Provider>
  );
};

// Update the RoomLink component styling
const RoomLink: Components['a'] = ({ href, children, ...props }) => {
  const navigate = React.useContext(NavigationContext);
  const isRoomLink = href?.startsWith('/t/');
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isRoomLink && href && navigate) {
      const roomName = href.slice(3);
      navigate(sanitizeRoomName(roomName));
      window.history.pushState({}, '', href);
    } else {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };
  
  return (
    <a 
      href={href}
      onClick={handleClick}
      {...props}
      className={isRoomLink ? 'room-link' : undefined}
      style={{
        cursor: 'pointer',
        textDecoration: isRoomLink ? 'none' : 'underline',
        background: isRoomLink ? '#000' : 'transparent',
        borderRadius: '4em',
        padding: '0.1em 0.6em',
        margin: '0 0.1em', // Add small margin between links
        color: 'white',
        fontFamily: 'DM Mono',
        fontSize: '0.9em',
        display: 'inline-block',
        verticalAlign: 'middle', // Align with text
        ...(props.style || {})
      }}
    >
      {children}
    </a>
  );
};

// Update the MessageBubbleWithWidth measurement logic
const MessageBubbleWithWidth = React.memo<{
  message: Message;
  isUser: boolean;
  isFirst: boolean;
  onNavigate: (roomName: string) => void;
}>(({ message, isUser, isFirst, onNavigate }) => {
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bubbleRef.current && !message.style) {
      // Create a temporary container for measurement
      const measureDiv = document.createElement('div');
      measureDiv.style.cssText = `
        position: absolute;
        visibility: hidden;
        padding: 0.65rem 0.9rem;
        max-width: 80%;
        font-family: inherit;
        font-size: inherit;
        white-space: pre-wrap;
      `;
      
      // Create header content
      const headerDiv = document.createElement('div');
      headerDiv.style.cssText = `
        font-size: 0.8rem;
        font-family: 'DM Mono', monospace;
        margin-bottom: 0.2rem;
      `;
      const shapeName = shapeNames[(message.user_number - 1) % shapeNames.length];
      const loopCount = Math.floor((message.user_number - 1) / shapeNames.length) + 1;
      headerDiv.textContent = loopCount > 1 ? `${shapeName} ${loopCount}` : shapeName;
      
      // Check if content contains any room links
      const hasLinks = /\bt\/[a-zA-Z0-9\u0400-\u04FF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\u0080-\u024F'?!&@\-~+%$#^*÷=:;_]+\b/.test(message.content);
      
      // Add content with room link styling
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = message.content.replace(
        /\b(t\/[a-zA-Z0-9\u0400-\u04FF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\u0080-\u024F'?!&@\-~+%$#^*÷=:;_]+)\b/g,
        '<span class="room-link" style="padding: 0.1em 0.6em; margin: 0 0.1em; display: inline-block; background: #000; border-radius: 4em; font-family: DM Mono; font-size: 0.9em;">$1</span>'
      );
      
      measureDiv.appendChild(headerDiv);
      measureDiv.appendChild(contentDiv);
      document.body.appendChild(measureDiv);
      
      // Get the width including any room links
      const naturalWidth = measureDiv.getBoundingClientRect().width;
      const width = roundUpToNearestEm(naturalWidth, hasLinks);
      
      document.body.removeChild(measureDiv);
      bubbleRef.current.style.setProperty('--rounded-width', `${width}px`);
    }
  }, [message.content, message.style, message.user_number]);

  return (
    <GroupedMessageBubble
      ref={bubbleRef}
      $isUser={isUser}
      $isFirst={isFirst}
      style={message.style}
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
      <MarkdownContent>
        <NavigationProvider onNavigate={onNavigate}>
          <ReactMarkdown 
            remarkPlugins={[
              () => (tree: any) => {
                tree.children.forEach((node: any) => {
                  if (node.type === 'heading') {
                    node.type = 'paragraph';
                  }
                });
                return tree;
              },
              createRoomLinkPlugin()
            ]}
            components={{
              a: RoomLink
            }}
          >
            {message.content}
          </ReactMarkdown>
        </NavigationProvider>
      </MarkdownContent>
    </GroupedMessageBubble>
  );
});

// Update FlatListContainer to flip the content
const FlatListContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: 1rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  flex: 1;
  min-height: 0;
  padding: 0rem;
  padding-bottom: 1rem;
  padding-top: 1rem;
  scrollbar-width: none;
  overflow-x: hidden;
  -ms-overflow-style: none;

  @media (max-width: 700px) {
    flex: 1;
    gap: 0.9rem;
    height: 0; // Force it to shrink
  }

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

// Add these styled components after NavigationContainer
const NavigationDropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: -1.5px; // Compensate for the border
  right: -1.5px; // Compensate for the border
  background-color: #000;
  border: 1.5px solid #fff;
  border-top: 1.5px dashed #fff;
  margin-top: 0px; // Pull up to overlap with container border
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  z-index: 1;
`;

const NavigationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const NavigationItem = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1rem;
  background: none;
  border: none;
  color: #fff;
  font-family: 'DM Mono', monospace;
  text-align: left;
  cursor: pointer;
  width: 100%;

  &:hover {
    background-color: #fff;
    color: #000;
  }
`;

const ViewerBadge = styled.span`
  color: #666;
  font-size: 0.9em;
`;

// Add this interface near other interfaces
interface PopularRoom {
  room_id: string;
  viewer_count: number;
}

// Add this function near the top of the file, after interfaces
const updateRoomPresence = async (roomId: string, viewerCount: number) => {
  const { error } = await supabase
    .from('presence')
    .upsert(
      { 
        room_id: roomId,
        viewer_count: viewerCount,
        last_active: new Date().toISOString()
      },
      { onConflict: 'room_id' }
    );

  if (error) {
    console.error('Error updating presence:', error);
  }
};

// Add this near the top of the file with other constants
const BLACKLISTED_ROOMS = [
  'fuck',
  'admin',
  'system'
];

// Add this near other constants
const MIN_ROOM_LENGTH = 3;

const MainPage: React.FC = () => {
  const getInitialRoom = () => {
    const path = window.location.pathname;
    if (path === '/' || path === '') {
      return 'main';
    }
    if (path.startsWith('/t/')) {
      const room = path.slice(3);
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Add back local ghost tracking
  const [localGhostMessage, setLocalGhostMessage] = useState<{
    content: string;
    lastUpdated: number;
  } | null>(null);

  // Add this state after other useState declarations
  const [joinedRooms, setJoinedRooms] = useState<RoomJoinState[]>([]);

  // Add these new state declarations and refs
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [popularRooms, setPopularRooms] = useState<PopularRoom[]>([]);
  const navigationRef = useRef<HTMLDivElement>(null);

  // Add this function inside MainPage component
  const leaveRoom = async (roomId: string) => {
    try {
      // Find and unsubscribe from the specific room's presence channel
      const channels = supabase.getChannels();
      const roomChannel = channels.find(ch => ch.topic === `presence:${roomId}`);
      if (roomChannel) {
        await roomChannel.unsubscribe();
      }

      // Update presence count for the room we're leaving
      const { data: currentPresence } = await supabase
        .from('presence')
        .select('viewer_count')
        .eq('room_id', roomId)
        .single();

      if (currentPresence) {
        const newCount = Math.max(0, currentPresence.viewer_count - 1);
        await updateRoomPresence(roomId, newCount);

        // If room is empty, remove it from presence table
        if (newCount === 0) {
          await supabase
            .from('presence')
            .delete()
            .eq('room_id', roomId);
        }
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  // Update the useEffect that handles room changes
  useEffect(() => {
    // Only proceed if connected
    if (!isConnected) return;

    let previousRoom = '';

    console.log('Loading messages for:', navigationTitle);

    // Function to load messages
    const loadToyMessages = async () => {
      try {
        // If we're coming from another room, clean up first
        if (previousRoom && previousRoom !== navigationTitle) {
          await leaveRoom(previousRoom);
        }

        // Store current room for next transition
        previousRoom = navigationTitle;

        // First ensure the room exists
        const { error: roomError } = await supabase
          .from('rooms')
          .upsert({ id: navigationTitle })
          .select();

        if (roomError) {
          console.error('Error creating/updating room:', roomError);
          return;
        }

        // Rest of your existing loadToyMessages code...
      } catch (error) {
        console.error('Error in loadToyMessages:', error);
      }
    };

    // Load initial messages
    loadToyMessages();

    // Cleanup function
    return () => {
      if (previousRoom) {
        leaveRoom(previousRoom);
      }
    };
  }, [navigationTitle, isConnected, anonymousId]);

  // Update the resetPresenceState function
  const resetPresenceState = async () => {
    try {
      // 1. Delete all records from the presence table
      const { error: deleteError } = await supabase
        .from('presence')
        .delete()
        .neq('room_id', ''); // Delete all records

      if (deleteError) throw deleteError;

      // 2. Force all presence channels to unsubscribe
      const channels = supabase.getChannels();
      await Promise.all(channels.map(channel => {
        if (channel.topic.startsWith('presence:')) {
          return channel.unsubscribe();
        }
      }));

      // 3. Resubscribe only to current room's presence
      const newChannel = supabase.channel(`presence:${navigationTitle}`, {
        config: {
          presence: {
            key: anonymousId,
          },
        }
      });

      setupViewerHandlers(newChannel);

      console.log('Presence state reset complete');
    } catch (error) {
      console.error('Error resetting presence state:', error);
    }
  };

  // Add near the start of the MainPage component
useEffect(() => {
  // Make resetPresenceState available globally
  (window as any).resetPresenceState = resetPresenceState;
}, []);

// Add effect to make resetPresenceState available globally
useEffect(() => {
  (window as any).resetPresenceState = resetPresenceState;
}, [resetPresenceState]); // Add resetPresenceState as dependency

  // Add this effect for handling clicks outside navigation
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navigationRef.current && !navigationRef.current.contains(event.target as Node)) {
        setIsNavigationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update the useEffect for popular rooms to include real-time subscription
  useEffect(() => {
    const fetchPopularRooms = async () => {
      try {
        // Get presence data directly from the database
        const { data: presenceData, error } = await supabase
          .from('presence')
          .select('room_id, viewer_count')
          .not('room_id', 'in', `(${BLACKLISTED_ROOMS.map(r => `'${r}'`).join(',')})`)
          .gt('viewer_count', 0) // Only get rooms with active viewers
          .gt('room_id', '')
          .gte('last_active', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Only get rooms active in last 5 minutes
          .order('viewer_count', { ascending: false })
          .limit(8);

        if (error) throw error;

        if (presenceData) {
          // Filter and sort rooms
          const filteredRooms = presenceData
            .filter(room => 
              room.room_id.length >= MIN_ROOM_LENGTH && 
              !BLACKLISTED_ROOMS.includes(room.room_id.toLowerCase())
            )
            .sort((a, b) => b.viewer_count - a.viewer_count)
            .slice(0, 4);

          console.log('Popular rooms:', filteredRooms);
          setPopularRooms(filteredRooms);
        }
      } catch (error) {
        console.error('Error fetching popular rooms:', error);
      }
    };

    if (isNavigationOpen) {
      fetchPopularRooms();
      const interval = setInterval(fetchPopularRooms, 2000); // Poll every 2 seconds while open
      return () => clearInterval(interval);
    }
  }, [isNavigationOpen]);

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

        // Then get the most recent messages for this room
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
          console.log('=== Initial Messages Load ===');
          setMessages(existingMessages); // Don't reverse, keep in descending order
          setHasMoreMessages(existingMessages.length === MESSAGES_PER_PAGE);
          if (existingMessages.length > 0) {
            setOldestLoadedTimestamp(existingMessages[existingMessages.length - 1].created_at);
          }
          
          const nextNumber = getNextUserNumber(existingMessages);
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
          if (payload.new.room_id !== navigationTitle) {
            return;
          }

          if (payload.new.sender_id !== anonymousId) {
            playMessageSound();
          }
          
          setTypingUsers(current => 
            current.filter(user => 
              !(user.user === payload.new.sender_id && user.content === payload.new.content)
            )
          );
          
          // Add new messages to the beginning of the array for column-reverse layout
          setMessages(current => {
            const filtered = current.filter(msg => 
              !(msg.local && msg.content === payload.new.content)
            );
            return [payload.new as Message, ...filtered];
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
    
    setLocalGhostMessage(null);
    
    const tempMessage: Message = {
      id: crypto.randomUUID(),
      content: sanitizedMessage,
      sender_id: anonymousId,
      user_number: currentUserNumber,
      created_at: new Date().toISOString(),
      room_id: navigationTitle,
      local: true
    };

    setMessages(prev => [tempMessage, ...prev]);
    setNewMessage('');
    
    // Reset textarea height
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.style.height = 'auto';
    }

    const { error } = await supabase
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
    // Call handleFirstType on first input
    handleFirstType();
    
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    setNewMessage(textarea.value);
    
    const content = textarea.value.trim();
    
    // Update local ghost immediately
    if (content) {
      setLocalGhostMessage({
        content,
        lastUpdated: Date.now()
      });
    } else {
      setLocalGhostMessage(null);
    }
    
    // Broadcast to others with position
    if (typingChannelRef.current) {
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user: anonymousId,
          userNumber: getCurrentUserNumber(),
          content: content || null,
          position: typingUsers.length // Use current length as position
        }
      });
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

  // Replace the handleFirstType function with this updated version
  const handleFirstType = async () => {
    // Check if user has already joined this specific room
    const hasJoinedRoom = joinedRooms.some(room => room.room_id === navigationTitle);
    
    if (!hasJoinedRoom) {
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

      setMessages(prev => [localJoinMessage, ...prev]);
      // Mark this room as joined
      setJoinedRooms(prev => [...prev, { room_id: navigationTitle, hasJoined: true }]);
      
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
        // Remove the room from joined rooms if the message failed
        setJoinedRooms(prev => prev.filter(room => room.room_id !== navigationTitle));
      } else {
        // Force scroll after server confirmation
        setTimeout(() => scrollToBottom(true), 100);
      }
    }
  };

  // Add this effect to clear joined rooms state when switching rooms
  useEffect(() => {
    // Optional: Clear joined rooms that are over 1 hour old
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    setJoinedRooms(prev => prev.filter(room => {
      const message = messages.find(msg => 
        msg.room_id === room.room_id && 
        msg.sender_id === anonymousId &&
        msg.type === 'join'
      );
      
      // Keep the room if there's a recent join message
      return message && new Date(message.created_at) > oneHourAgo;
    }));
  }, [navigationTitle]);

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

    if (payload.new.sender_id !== anonymousId && payload.new.type !== 'join' && !document.hasFocus()) {
      playMessageSound();
    }
    
    setTypingUsers(current => 
      current.filter(user => user.user !== payload.new.sender_id)
    );

    // Create a temporary container for measurement
    const measureDiv = document.createElement('div');
    measureDiv.style.cssText = `
      position: absolute;
      visibility: hidden;
      padding: 0.65rem 0.9rem;
      max-width: 80%;
      font-family: inherit;
      font-size: inherit;
      white-space: pre-wrap;
    `;
    
    // Create header content
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = `
      font-size: 0.8rem;
      font-family: 'DM Mono', monospace;
      margin-bottom: 0.2rem;
    `;
    const shapeName = shapeNames[(payload.new.user_number - 1) % shapeNames.length];
    const loopCount = Math.floor((payload.new.user_number - 1) / shapeNames.length) + 1;
    headerDiv.textContent = loopCount > 1 ? `${shapeName} ${loopCount}` : shapeName;
    
    // Check if content contains any room links
    const hasLinks = /\bt\/[a-zA-Z0-9\u0400-\u04FF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\u0080-\u024F'?!&@\-~+%$#^*÷=:;_]+\b/.test(payload.new.content);
    
    // Add content with room link styling
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = payload.new.content.replace(
      /\b(t\/[a-zA-Z0-9\u0400-\u04FF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\u0080-\u024F'?!&@\-~+%$#^*÷=:;_]+)\b/g,
      '<span class="room-link" style="padding: 0.1em 0.6em; margin: 0 0.1em; display: inline-block; background: #000; border-radius: 4em; font-family: DM Mono; font-size: 0.9em;">$1</span>'
    );
    
    measureDiv.appendChild(headerDiv);
    measureDiv.appendChild(contentDiv);
    document.body.appendChild(measureDiv);
    
    // Get the width including any room links
    const naturalWidth = measureDiv.getBoundingClientRect().width;
    const width = roundUpToNearestEm(naturalWidth, hasLinks);
    
    document.body.removeChild(measureDiv);

    // Add the server message with pre-calculated width
    setMessages(current => {
      const serverMessage = {
        ...payload.new,
        style: { '--rounded-width': `${width}px` }
      } as Message;
      
      // Filter out local message and add new message at the start
      return [
        serverMessage,
        ...current.filter(msg => 
          !(msg.local && msg.sender_id === payload.new.sender_id && msg.content === payload.new.content)
        )
      ];
    });
  };

  const setupTypingHandlers = (channel: any) => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(current => 
        current.filter(user => {
          // Keep message for 3 seconds after clearing content
          if (user.clearedAt) {
            return now - user.clearedAt < 3000;
          }
          // Otherwise use normal 5 second timeout
          return now - user.lastUpdated < 5000;
        })
      );
      
      // Clean up local ghost if it's old
      setLocalGhostMessage(current => {
        if (current && now - current.lastUpdated >= 5000) {
          return null;
        }
        return current;
      });
    }, 1000);

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }: { payload: any }) => {
        if (!payload?.user || !payload?.userNumber) return;
        
        setTypingUsers(current => {
          const others = current.filter(u => u.user !== payload.user);
          const existingUser = current.find(u => u.user === payload.user);
          const position = existingUser?.position ?? payload.position;

          if (payload.content?.trim()) {
            // Content exists - update or add user
            return [...others, {
              user: payload.user,
              userNumber: payload.userNumber,
              content: payload.content,
              lastUpdated: Date.now(),
              position,
              lastContent: payload.content,
              clearedAt: undefined // Reset cleared timestamp
            }].sort((a, b) => a.position - b.position);
          } else {
            // Content was cleared - keep last content for 3 seconds
            const now = Date.now();
            if (existingUser?.lastContent) {
              return [...others, {
                ...existingUser,
                content: existingUser.lastContent,
                clearedAt: now,
                lastUpdated: now
              }].sort((a, b) => a.position - b.position);
            }
            return others;
          }
        });
      })
      .subscribe();

    return () => {
      clearInterval(cleanupInterval);
    };
  };

  const setupViewerHandlers = (channel: any) => {
    channel
      .on('presence', { event: 'sync' }, async () => {
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

        // Update presence for current room
        await updateRoomPresence(navigationTitle, newCount);
      })
      .subscribe(async (status: 'SUBSCRIBED' | 'CLOSED' | 'TIMED_OUT' | 'CHANNEL_ERROR') => {
        if (status === 'SUBSCRIBED') {
          // Track both user and room info
          await channel.track({
            user: anonymousId,
            room_id: navigationTitle
          });
        }
      });
  };

  // Update the keyboard height effect
  useEffect(() => {
    const viewport = window.visualViewport;
    
    if (!viewport) return;

    const handleResize = () => {
      if (document.activeElement?.tagName === 'TEXTAREA') {
        const currentHeight = window.innerHeight - viewport.height;
        setKeyboardHeight(currentHeight > 0 ? currentHeight : 0);
        
        // Force scroll to bottom when keyboard appears
        setTimeout(() => scrollToBottom(true), 100);
      } else {
        setKeyboardHeight(0);
      }
    };

    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);

    // Also handle focus/blur events
    const handleFocus = () => {
      if (document.activeElement?.tagName === 'TEXTAREA') {
        setTimeout(() => {
          const currentHeight = window.innerHeight - viewport.height;
          setKeyboardHeight(currentHeight > 0 ? currentHeight : 0);
          scrollToBottom(true);
        }, 100);
      }
    };

    const handleBlur = () => {
      setKeyboardHeight(0);
    };

    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, []);

  // Add cleanup for stale presence data
  useEffect(() => {
    const cleanupStalePresence = async () => {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      await supabase
        .from('presence')
        .delete()
        .lt('last_active', oneHourAgo.toISOString());
    };

    // Run cleanup every hour
    const interval = setInterval(cleanupStalePresence, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Update the renderMessages function to handle ghost messages correctly
  const renderMessages = () => {
    let currentGroup: Message[] = [];
    const messageGroups: Message[][] = [];
    
    // First render all real messages
    messages.forEach((message, index) => {
      if (message.type === 'join') {
        // Flush current group if any
        if (currentGroup.length > 0) {
          messageGroups.push([...currentGroup]);
          currentGroup = [];
        }
        // Add join message as its own group
        messageGroups.push([message]);
      } else if (
        currentGroup.length > 0 && 
        currentGroup[0].sender_id === message.sender_id &&
        Math.abs(new Date(currentGroup[currentGroup.length - 1].created_at).getTime() - 
                new Date(message.created_at).getTime()) < 120000
      ) {
        // Add to current group if same sender
        currentGroup.unshift(message); // Use unshift to maintain correct order within group
      } else {
        // Flush current group if any and start new one
        if (currentGroup.length > 0) {
          messageGroups.push([...currentGroup]);
        }
        currentGroup = [message];
      }
    });
    
    // Add last group
    if (currentGroup.length > 0) {
      messageGroups.push(currentGroup);
    }

    return (
      <>
        {messageGroups.map((group, groupIndex) => {
          const firstMessage = group[0];
          
          if (firstMessage.type === 'join') {
            return (
              <JoinMessage 
                key={firstMessage.id} 
                $isUser={firstMessage.sender_id === anonymousId}
              >
                {firstMessage.content}
              </JoinMessage>
            );
          }

          const isUser = firstMessage.sender_id === anonymousId;
          
          return (
            <MessageGroup key={`group-${groupIndex}`} $isUser={isUser}>
              {group.map((message, messageIndex) => (
                <MessageBubbleWithWidth
                  key={message.id}
                  message={message}
                  isUser={isUser}
                  isFirst={messageIndex === 0} // Change back to 0 to show header on first message
                  onNavigate={setNavigationTitle}
                />
              ))}
            </MessageGroup>
          );
        })}
      </>
    );
  };

  // Update the messages rendering in the MessageContainer
  return (
    <PageContainer $bgColor={backgroundColor}>
      <Header>
        <LogoContainer>
          <LogoIcon src={logoSvg} alt="Latent Toys Logo" />
          <LogoText>latent.toys</LogoText>
        </LogoContainer>
        <NavigationContainer ref={navigationRef} $navigationOpen={isNavigationOpen}>
          <NavigationPrefix>t/</NavigationPrefix>
          <NavigationField
            type="text"
            value={navigationTitle}
            onChange={handleNavigationChange}
            placeholder="Enter a room..."
            onFocus={() => setIsNavigationOpen(true)}
          />
          <NavigationDropdown $isOpen={isNavigationOpen}>
            <NavigationList>
              {popularRooms.map(room => (
                <NavigationItem
                  key={room.room_id}
                  onClick={() => {
                    setNavigationTitle(room.room_id);
                    setIsNavigationOpen(false);
                  }}
                >
                  t/{room.room_id}
                  <ViewerBadge>
                    {room.viewer_count} {room.viewer_count === 1 ? 'person' : 'people'}
                  </ViewerBadge>
                </NavigationItem>
              ))}
            </NavigationList>
          </NavigationDropdown>
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
                  {viewerCount} {viewerCount === 1 ? 'person' : 'people'}
                </ViewerCount>
              </ChatHeader>
              <FlatListContainer 
                ref={messageContainerRef}
                onScroll={handleScroll}
              >
                {messages.length > 0 ? (
                  <>
                    {/* Ghost messages first (will appear at bottom visually) */}
                    {[
                      ...typingUsers
                        .filter(user => user.user !== anonymousId)
                        .map(user => ({
                          isLocal: false,
                          content: user.content,
                          userNumber: user.userNumber,
                          user: user.user
                        })),
                      ...(localGhostMessage ? [{
                        isLocal: true,
                        content: localGhostMessage.content,
                        userNumber: getCurrentUserNumber(),
                        user: anonymousId
                      }] : [])
                    ]
                      .sort((a, b) => b.content.length - a.content.length)
                      .map(ghost => (
                        <GhostMessageBubble key={ghost.user} $isUser={ghost.isLocal}>
                          <MessageHeader>
                            <ShapeName>
                              {shapeNames[(ghost.userNumber - 1) % shapeNames.length]}
                            </ShapeName>
                            {Math.floor((ghost.userNumber - 1) / shapeNames.length) > 0 && (
                              <LoopCount>
                                {Math.floor((ghost.userNumber - 1) / shapeNames.length) + 1}
                              </LoopCount>
                            )}
                          </MessageHeader>
                          <MarkdownContent>
                            <NavigationProvider onNavigate={setNavigationTitle}>
                              <ReactMarkdown 
                                remarkPlugins={[
                                  () => (tree: any) => {
                                    tree.children.forEach((node: any) => {
                                      if (node.type === 'heading') {
                                        node.type = 'paragraph';
                                      }
                                    });
                                    return tree;
                                  },
                                  createRoomLinkPlugin()
                                ]}
                                components={{
                                  a: RoomLink
                                }}
                              >
                                {ghost.content}
                              </ReactMarkdown>
                            </NavigationProvider>
                          </MarkdownContent>
                        </GhostMessageBubble>
                      ))}
                    {renderMessages()}
                    {isLoadingMore && (
                      <LoadingIndicator>Loading more messages...</LoadingIndicator>
                    )}
                  </>
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
              </FlatListContainer>
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