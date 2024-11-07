import React from 'react';
import styled from 'styled-components';
import { Message } from '../../types/chat';
import { MessageGroup } from './MessageGroup';

interface MessageListContainerProps {
  messages: Message[];
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onNavigate: (roomName: string) => void;
  anonymousId: string;
}

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column-reverse;
  min-height: 0;
  gap: 1rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 0rem;
  padding-bottom: 1rem;
  padding-top: 1rem;
  scrollbar-width: none;
  overflow-x: hidden;
  -ms-overflow-style: none;

  @media (max-width: 700px) {
    gap: 0.9rem;
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

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 1rem;
  color: #666;
  font-size: 0.9rem;
  font-family: 'DM Mono', monospace;
  order: 1;
`;

export const MessageListContainer: React.FC<MessageListContainerProps> = ({
  messages,
  isLoadingMore,
  hasMoreMessages,
  onScroll,
  onNavigate,
  anonymousId
}) => {
  // Group messages by sender and time
  const groupMessages = () => {
    let currentGroup: Message[] = [];
    const messageGroups: Message[][] = [];
    
    messages.forEach((message) => {
      if (message.type === 'join') {
        if (currentGroup.length > 0) {
          messageGroups.push([...currentGroup]);
          currentGroup = [];
        }
        messageGroups.push([message]);
      } else if (
        currentGroup.length > 0 && 
        currentGroup[0].sender_id === message.sender_id &&
        Math.abs(new Date(currentGroup[currentGroup.length - 1].created_at).getTime() - 
                new Date(message.created_at).getTime()) < 120000
      ) {
        currentGroup.unshift(message);
      } else {
        if (currentGroup.length > 0) {
          messageGroups.push([...currentGroup]);
        }
        currentGroup = [message];
      }
    });
    
    if (currentGroup.length > 0) {
      messageGroups.push(currentGroup);
    }

    return messageGroups;
  };

  const messageGroups = groupMessages();

  return (
    <Container onScroll={onScroll}>
      {messageGroups.map((group, index) => (
        <MessageGroup
          key={`group-${group[0].id}-${index}`}
          messages={group}
          isUser={group[0].sender_id === anonymousId}
          onNavigate={onNavigate}
        />
      ))}
      {isLoadingMore && (
        <LoadingIndicator>Loading more messages...</LoadingIndicator>
      )}
    </Container>
  );
};