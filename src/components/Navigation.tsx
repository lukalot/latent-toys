import React from 'react';
import styled from 'styled-components';

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

interface NavigationProps {
  navigationTitle: string;
  onNavigationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Navigation: React.FC<NavigationProps> = ({ navigationTitle, onNavigationChange }) => {
  return (
    <NavigationContainer>
      <NavigationPrefix>t/</NavigationPrefix>
      <NavigationField
        type="text"
        value={navigationTitle}
        onChange={onNavigationChange}
        placeholder="Enter a room..."
      />
    </NavigationContainer>
  );
};

export default Navigation;