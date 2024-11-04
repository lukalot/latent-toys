import React, { useState } from 'react';
import styled from 'styled-components';
import halftonePattern from '../assets/untitled.png';

interface Message {
  content: string;
  isUser?: boolean;
}

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

const PageContainer = styled.div<{ bgColor: string }>`
  min-height: 100vh;
  background-color: ${props => props.bgColor};
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

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 400;
  font-family: 'DM Mono', monospace;
  color: #fff;
  text-shadow: 0 0 28px rgba(72,174,137, 0.2);
  background-color: #000;
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
`;

const ChatContainer = styled.div`
  background-color: #000;
  //border-radius: 1rem;
  padding: 2rem;
  padding-top: 1.3rem;
  color: white;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-shadow: 0 0 120px rgba(56, 132, 86, 0.25);
`;

const ChatTitle = styled.h1`
  font-size: 2.5rem;
  color: white;
  margin-bottom: 1.25rem;
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
  padding-bottom: 1rem;
`;

const MessageBubble = styled.div<{ isUser?: boolean }>`
  max-width: 80%;
  padding: 0.65rem 0.9rem;
  //border-radius: 0.7rem;
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  background-color: ${props => props.isUser ? '#6e56cf' : '#2d2d2d'};
  color: white;
`;

const InputContainer = styled.form`
  margin-top: auto;
`;

const MessageInput = styled.input`
  width: 100%;
  padding: 1rem;
  border: 1px solid #2d2d2d;
  //border-radius: 0.5rem;
  font-size: 1rem;
  background-color: #2d2d2d;
  color: white;
  
  &:focus {
    outline: none;
    border-color: #ffffff;
  }

  &::placeholder {
    color: #888;
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
  opacity: 0.5;
  margin-top: -1rem;
`;

const MainPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { content: "Welcome! How can I help you today?", isUser: false },
    { content: "Hello! I'd like to generate some images.", isUser: true },
    { content: "I can help you with that. What kind of images would you like to create?", isUser: false },
    { content: "I'd like to create some images of trees.", isUser: true },
    { content: "I can help you with that. What kind of trees would you like to create?", isUser: false },
    { content: "I'd like to create some images of trees.", isUser: true },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [navigationTitle, setNavigationTitle] = useState('main');
  const backgroundColor = stringToColor(navigationTitle);

  const handleSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setMessages([...messages, { content: newMessage, isUser: true }]);
      setNewMessage('');
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

  return (
    <PageContainer bgColor={backgroundColor}>
      <Header>
        <Logo>latent.toys</Logo>
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
          <LoginButton>Log in</LoginButton>
          <SignUpButton>Sign up</SignUpButton>
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
            <ChatTitle>{navigationTitle}</ChatTitle>
            <MessageContainer>
              {messages.map((message, index) => (
                <MessageBubble key={index} isUser={message.isUser}>
                  {message.content}
                </MessageBubble>
              ))}
            </MessageContainer>
            <InputContainer onSubmit={handleSubmitMessage}>
              <MessageInput
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
              />
            </InputContainer>
          </ChatContainer>
        )}
      </MainContent>
    </PageContainer>
  );
};

export default MainPage;