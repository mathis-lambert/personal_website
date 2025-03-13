import React, { FormEvent, useState, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import './chatInput.scss';
import { Textarea } from '@chakra-ui/react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState<string>('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleInput = () => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      let height = textAreaRef.current.scrollHeight;
      if (height > 200) {
        height = 200;
      }
      textAreaRef.current.style.height = `${height}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Si l'utilisateur appuie sur Enter sans Shift, on envoie le message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim()) {
        onSendMessage(message);
        setMessage('');
        if (textAreaRef.current) {
          textAreaRef.current.style.height = 'auto';
        }
      }
    }
  };

  return (
    <div className="chat-input-container">
      <form onSubmit={handleSubmit} className="chat-input-form">
        <Textarea
          ref={textAreaRef}
          size={'sm'}
          className="chat-input lato-regular"
          placeholder="Poser une question"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          resize="none"
          onInput={handleInput}
        />
        <button
          type="submit"
          className="send-button"
          disabled={!message.trim()}
        >
          <ArrowUp />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
