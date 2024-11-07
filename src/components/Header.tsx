import React from 'react';
import styled from 'styled-components';
import logoSvg from '../assets/noun-spinning-top-753468.svg';

const HeaderContainer = styled.header`
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

const Header: React.FC = () => {
  return (
    <HeaderContainer>
      <LogoContainer>
        <LogoIcon src={logoSvg} alt="Latent Toys Logo" />
        <LogoText>latent.toys</LogoText>
      </LogoContainer>
      <AuthButtons>
        <LoginButton><s>Log in</s></LoginButton>
        <SignUpButton><s>Sign up</s></SignUpButton>
      </AuthButtons>
    </HeaderContainer>
  );
};

export default Header;