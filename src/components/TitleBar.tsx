import React from 'react';
import styled from 'styled-components';
import logoSvg from '../assets/noun-spinning-top-753468.svg';

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

  &:hover {
    background-color: #f4f4f5;
    color: #000;
  }
`;

const SignUpButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  background-color: #cf5699;
  color: white;
  font-family: 'DM Mono', monospace;
  cursor: pointer;

  &:hover {
    background-color: #fff;
    color: #000;
  }
`;

interface TitleBarProps {
  navigationTitle: string;
  onNavigationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TitleBar: React.FC<TitleBarProps> = ({ navigationTitle, onNavigationChange }) => {
  return (
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
          onChange={onNavigationChange}
          placeholder="Enter a room..."
        />
      </NavigationContainer>
      <AuthButtons>
        <LoginButton>Log in</LoginButton>
        <SignUpButton>Sign up</SignUpButton>
      </AuthButtons>
    </Header>
  );
};

export default TitleBar;