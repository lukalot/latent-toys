import React from 'react';
import styled from 'styled-components';
import { Message } from '../../types/chat';
import { JoinMessage } from './JoinMessage';

interface MessageGroupProps {
  messages: Message[];
  isUser: boolean;
  onNavigate: (roomName: string) => void;
}

const GroupContainer = styled.div<{ $isUser: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 1.5px;
  max-width: 80%;
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
`;

export const MessageGroup: React.FC<MessageGroupProps> = ({
  messages,
  isUser,
  onNavigate
}) => {
  // Handle join messages differently
  if (messages[0].type === 'join') {
    return <JoinMessage message={messages[0]} isUser={isUser} />;
  }

  return (
    <GroupContainer $isUser={isUser}>
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          isUser={isUser}
          isFirst={index === 0}
          onNavigate={onNavigate}
        />
      ))}
    </GroupContainer>
  );
}; 