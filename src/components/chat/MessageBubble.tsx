import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { Message } from '../../types/chat';
import { shapeNames } from '../../utils/roomUtils';
import { NavigationProvider } from '../../context/RoomContext';

interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
  isFirst: boolean;
  onNavigate: (roomName: string) => void;
}

const BubbleContainer = styled.div<{ $isUser: boolean; $isFirst: boolean }>`
  max-width: 100%;
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  text-align: left;
  width: var(--rounded-width, auto);
  padding: 0.65rem 0.9rem;
  background-color: ${props => props.$isUser ? '#2d2d2d' : '#fff'};
  color: ${props => props.$isUser ? '#fff' : '#000'};

  @media (max-width: 700px) {
    padding: 0.5rem 0.7rem;
    font-size: 0.85rem;
  }

  /* Adjust padding for consecutive messages */
  ${props => !props.$isFirst && `
    padding-top: 0.65rem;
    padding-bottom: 0.65rem;
  `}
`;

const MessageHeader = styled.div`
  font-size: 0.8rem;
  opacity: 0.5;
  margin-bottom: 0.2rem;
  font-family: 'DM Mono', monospace;
  display: flex;
  gap: 0.3rem;
  align-items: baseline;
  justify-content: flex-start;

  /* Only show header for first message in group */
  ${props => !props.$isFirst && `
    display: none;
  `}
`;

const ShapeName = styled.span``;

const LoopCount = styled.span`
  font-size: 0.7rem;
  opacity: 0.7;
`;

const MarkdownContent = styled.div`
  /* Base text styles */
  p {
    margin: 0;
    white-space: pre-wrap;
    display: inline;
  }

  /* Links */
  a {
    color: inherit;
    text-decoration: underline;
    text-decoration-style: dotted;
    display: inline-block;
    white-space: nowrap;
    
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

const RoomLink: React.FC<any> = ({ href, children, ...props }) => {
  const isRoomLink = href?.startsWith('/t/');
  
  return (
    <a 
      href={href}
      {...props}
      className={isRoomLink ? 'room-link' : undefined}
      style={{
        cursor: 'pointer',
        textDecoration: isRoomLink ? 'none' : 'underline',
        background: isRoomLink ? '#000' : 'transparent',
        borderRadius: '4em',
        padding: '0.1em 0.6em',
        margin: '0 0.1em',
        color: 'white',
        fontFamily: 'DM Mono',
        fontSize: '0.9em',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...(props.style || {})
      }}
    >
      {children}
    </a>
  );
};

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
            data: { roomLink: true },
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
        return {
          ...node,
          children: node.children.map(visitNode).flat()
        };
      }
      
      return node;
    };

    return visitNode(tree);
  };
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isUser,
  isFirst,
  onNavigate
}) => {
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bubbleRef.current && !message.style) {
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
      
      const headerDiv = document.createElement('div');
      headerDiv.style.cssText = `
        font-size: 0.8rem;
        font-family: 'DM Mono', monospace;
        margin-bottom: 0.2rem;
      `;
      const shapeName = shapeNames[(message.user_number - 1) % shapeNames.length];
      const loopCount = Math.floor((message.user_number - 1) / shapeNames.length) + 1;
      headerDiv.textContent = loopCount > 1 ? `${shapeName} ${loopCount}` : shapeName;
      
      const hasLinks = /\bt\/[a-zA-Z0-9\u0400-\u04FF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\u0080-\u024F'?!&@\-~+%$#^*÷=:;_]+\b/.test(message.content);
      
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = message.content.replace(
        /\b(t\/[a-zA-Z0-9\u0400-\u04FF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\u0080-\u024F'?!&@\-~+%$#^*÷=:;_]+)\b/g,
        '<span class="room-link" style="padding: 0.1em 0.6em; margin: 0 0.1em; display: inline-block; background: #000; border-radius: 4em; font-family: DM Mono; font-size: 0.9em;">$1</span>'
      );
      
      measureDiv.appendChild(headerDiv);
      measureDiv.appendChild(contentDiv);
      document.body.appendChild(measureDiv);
      
      const naturalWidth = measureDiv.getBoundingClientRect().width;
      const width = Math.ceil(naturalWidth / 38.4) * 38.4;
      
      document.body.removeChild(measureDiv);
      bubbleRef.current.style.setProperty('--rounded-width', `${width}px`);
    }
  }, [message.content, message.style, message.user_number]);

  return (
    <BubbleContainer
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
    </BubbleContainer>
  );
}; 