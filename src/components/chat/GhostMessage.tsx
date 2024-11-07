import React from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { shapeNames } from '../../utils/roomUtils';

interface GhostMessageProps {
  content: string;
  userNumber: number;
  isLocal: boolean;
}

const GhostBubble = styled(MessageBubble)`
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

export const GhostMessage: React.FC<GhostMessageProps> = ({
  content,
  userNumber,
  isLocal
}) => {
  const shapeName = shapeNames[(userNumber - 1) % shapeNames.length];
  const loopCount = Math.floor((userNumber - 1) / shapeNames.length) + 1;

  return (
    <GhostBubble
      message={{
        id: `ghost-${userNumber}`,
        content,
        sender_id: '',
        user_number: userNumber,
        created_at: new Date().toISOString(),
        room_id: ''
      }}
      isUser={isLocal}
      isFirst={true}
      onNavigate={() => {}}
    />
  );
}; 