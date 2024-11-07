import React from 'react';
import styled from 'styled-components';
import { Message } from '../../types/chat';

interface JoinMessageProps {
  message: Message;
  isUser: boolean;
}

const JoinMessageContainer = styled.div<{ $isUser: boolean }>`
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

export const JoinMessage: React.FC<JoinMessageProps> = ({ message, isUser }) => (
  <JoinMessageContainer $isUser={isUser}>
    {message.content}
  </JoinMessageContainer>
); 