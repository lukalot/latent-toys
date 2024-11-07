import React from 'react';
import styled from 'styled-components';

const InputContainerStyled = styled.form`
  margin-top: auto;

  @media (max-width: 700px) {
    position: sticky;
    bottom: 0;
    background: #000;
    margin-top: 0;
  }
`;

const MessageInput = styled.textarea`
  width: 100%;
  padding: 1rem;
  padding-top: 0.8rem;
  padding-bottom: 0.9rem;
  border: 1px solid #2d2d2d;
  font-size: 1rem;
  background-color: #2d2d2d;
  border-radius: 0;
  color: white;
  resize: none;
  max-height: 12rem;
  font-family: inherit;
  line-height: 1.3;
  scrollbar-width: none;
  height: 100%;

  @media (max-width: 700px) {
    padding: 0.7rem;
    font-size: 0.85rem;
    line-height: 1.4;
  }

  &:focus {
    outline: none;
    border-color: #ffffff;
  }

  &::placeholder {
    color: #777;
    font-weight: 400;
    opacity: 1;
  }
`;

interface InputContainerProps {
  onSubmit: (e: React.FormEvent) => void;
  newMessage: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const InputContainer: React.FC<InputContainerProps> = ({
  onSubmit,
  newMessage,
  onChange,
  onKeyDown
}) => {
  return (
    <InputContainerStyled onSubmit={onSubmit}>
      <MessageInput
        value={newMessage}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="Type your message..."
        rows={1}
      />
    </InputContainerStyled>
  );
};

export default InputContainer;