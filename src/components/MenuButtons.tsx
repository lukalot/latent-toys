import React from 'react';
import styled from 'styled-components';

const HelpButton = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 2rem;
  height: 2rem;
  background-color: #000;
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DM Mono', monospace;
  font-size: 1rem;
  cursor: pointer;
  z-index: 11;

  &:hover {
    background-color: #ffffff;
    color: #000;
  }
  @media (max-width: 700px) {
    bottom: 0rem;
    right: 0rem;
  }
`;

const MenuButton = styled.button<{ $isOpen: boolean }>`
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  width: 2rem;
  height: 2rem;
  background-color: #000;
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DM Mono', monospace;
  font-size: 1rem;
  cursor: pointer;
  z-index: 11;
  font-weight: 500;
  transition: transform 0.2s ease;

  &:hover {
    background-color: #ffffff;
    color: #000;
  }

  @media (max-width: 700px) {
    bottom: 0rem;
    left: 0rem;
  }

  ${props => props.$isOpen && `
    transform: rotate(45deg);
  `}
`;

const PlusIcon = styled.svg`
  width: 1rem;
  height: 1rem;
`;

const MenuPanel = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  width: 20rem;
  height: 30rem;
  background-color: #000;
  border-right: 1.5px solid #fff;
  outline: 1.5px dashed #fff;
  outline-offset: -1.5px;
  z-index: 10;
  transition: transform 0.2s ease-out;
  opacity: ${props => props.$isOpen ? 1 : 0};
  transform-origin: bottom left;
  transform: ${props => props.$isOpen ? 'scale(1)' : 'scale(0.2)'};
  pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
`;

const MenuContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #666;
  font-family: 'DM Mono', monospace;
  text-align: center;
  line-height: 1.6;
`;

const MenuTitle = styled.div`
  font-size: 1.1rem;
  margin-bottom: 1rem;
`;

const MenuText = styled.div`
  font-size: 0.9rem;
  opacity: 0.7;
`;

interface MenuButtonsProps {
  isHelpOpen: boolean;
  isMenuOpen: boolean;
  onHelpToggle: () => void;
  onMenuToggle: () => void;
}

const MenuButtons: React.FC<MenuButtonsProps> = ({
  isHelpOpen,
  isMenuOpen,
  onHelpToggle,
  onMenuToggle
}) => {
  return (
    <>
      <HelpButton onClick={onHelpToggle}>
        ?
      </HelpButton>
      <MenuButton
        $isOpen={isMenuOpen}
        onClick={onMenuToggle}
      >
        <PlusIcon
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
        >
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </PlusIcon>
      </MenuButton>
      <MenuPanel $isOpen={isMenuOpen}>
        <MenuContent>
          <MenuTitle>work in progress</MenuTitle>
          <MenuText>this menu will be populated eventually...</MenuText>
        </MenuContent>
      </MenuPanel>
    </>
  );
};

export default MenuButtons;