import React from 'react';
import styled from 'styled-components';
import MessageList from './MessageList';
import InputContainer from './InputContainer';

const ChatContainerStyled = styled.div`
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

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: top;
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

const ViewerCount = styled.div`
  font-size: 0.9rem;
  color: #666;
  font-family: 'DM Mono', monospace;
  padding-right: 0.2rem;
  padding-top: 0.4rem;
`;

const KeyboardAwareContainer = styled.div<{ $keyboardHeight: number }>`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  
  @media (max-width: 700px) {
    position: relative;
    height: ${props => `calc(100dvh - ${props.$keyboardHeight}px - 3.5rem)`}; // Account for header
    transition: height 0.1s ease-out;
  }
`;

interface ChatContainerProps {
  navigationTitle: string;
  viewerCount: number;
  messages: any[]; // Replace 'any' with your Message type
  typingUsers: any[];
  localGhostMessage: any;
  isLoadingMore: boolean;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onSubmitMessage: (e: React.FormEvent) => void;
  newMessage: string;
  onNewMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  getCurrentUserNumber: () => number;
  anonymousId: string;
  setNavigationTitle: (title: string) => void;
}

const MessageListContainer = styled.div`
  flex: 1;
  min-height: 0;
`;

const ChatContainer: React.FC<ChatContainerProps> = ({
  navigationTitle,
  viewerCount,
  messages,
  typingUsers,
  localGhostMessage,
  isLoadingMore,
  onScroll,
  onSubmitMessage,
  newMessage,
  onNewMessageChange,
  onKeyDown,
  getCurrentUserNumber,
  anonymousId,
  setNavigationTitle
}) => {
  return (
    <ChatContainerStyled>
      <ChatHeader>
        <ChatTitle>{navigationTitle}</ChatTitle>
        <ViewerCount>
          {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
        </ViewerCount>
      </ChatHeader>
      <MessageListContainer onScroll={onScroll}>
        {/* TODO: Render messages, ghost messages, and typing indicators */}
        <MessageList
          messages={messages}
          typingUsers={typingUsers}
          localGhostMessage={localGhostMessage}
          isLoadingMore={isLoadingMore}
          onScroll={onScroll}
          getCurrentUserNumber={getCurrentUserNumber}
          anonymousId={anonymousId}
          setNavigationTitle={setNavigationTitle}
        />
      </MessageListContainer>
    </ChatContainerStyled>
  );
};

export default ChatContainer;