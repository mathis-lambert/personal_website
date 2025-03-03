import { useEffect, useState } from 'react';
import './style/App.scss';
import useChatCompletion from './hooks/useChatCompletion';
import ChatInput from './components/chatInput/chatInput';
import MarkdownView from './components/markdownView/markdownView';

interface ChatCompletionsRequest {
  model: string;
  input: string;
  prompt: string;
  history: Message[];
  temperature: number;
  max_tokens: number;
  top_p: number;
  stream: boolean;
}

interface Message {
  role: string;
  content: string;
}

function App() {
  const [response, setResponse] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [request, setRequest] = useState<ChatCompletionsRequest>({
    model: 'mistral-small-latest',
    input: '',
    prompt: 'You are a helpful assistant.',
    history: [],
    temperature: 0.7,
    max_tokens: 512,
    top_p: 1,
    stream: false,
  });

  const chatResponse = useChatCompletion(request, request.input.trim() !== '');

  useEffect(() => {
    if (chatResponse) {
      setResponse(chatResponse);
    }
  }, [chatResponse]);

  const handleSendMessage = (message: string): void => {
    const newRequest: ChatCompletionsRequest = {
      ...request,
      input: message,
      stream: isStreaming,
    };
    setRequest(newRequest);
    setResponse(''); // Réinitialiser avant chaque nouvelle requête
  };

  const toggleStreaming = (): void => {
    setIsStreaming((prev) => !prev);
  };

  return (
    <div className="card">
      <h1>Chat Completions</h1>
      <div className="chat-output">
        <MarkdownView content={response} />
      </div>
      <br />
      <ChatInput onSendMessage={handleSendMessage} />
      <label>
        <input
          type="checkbox"
          checked={isStreaming}
          onChange={toggleStreaming}
        />
        Enable Streaming
      </label>
    </div>
  );
}

export default App;
