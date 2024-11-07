import React from 'react';
import styled from 'styled-components';

const HelpBoxContainer = styled.div<{ $isOpen: boolean }>`
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

interface HelpBoxProps {
  isOpen: boolean;
}

const HelpBox: React.FC<HelpBoxProps> = ({ isOpen }) => {
  return (
    <HelpBoxContainer $isOpen={isOpen}>
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
    </HelpBoxContainer>
  );
};

export default HelpBox;