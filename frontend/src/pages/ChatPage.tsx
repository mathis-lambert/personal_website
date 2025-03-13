import { useEffect, useRef, useState } from 'react';
import '../style/App.scss';
import 'katex/dist/katex.min.css';
import useChatCompletion from '../hooks/useChatCompletion';
import ChatInput from '../components/chatInput/chatInput';
import MarkdownView from '../components/markdownView/markdownView';
import MainDialog from '@/components/dialog/MainDialog.tsx';

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
  job_id?: string;
  role: string;
  content: string;
}

const ChatPage = () => {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming] = useState<boolean>(true);
  const [request, setRequest] = useState<ChatCompletionsRequest>({
    model: 'mistral-small-latest',
    input: '',
    prompt:
      'You are a helpful assistant answering questions in a Markdown format. Everything you say should be in Markdown format. Equations should be in LaTeX format within $$.',
    history: [],
    temperature: 0.7,
    max_tokens: 1024,
    top_p: 1,
    stream: false
  });

  const chatResponse = useChatCompletion(request, request.input.trim() !== '');

  useEffect(() => {
    if (import.meta.env.VITE_MAINTENANCE_MODE) {
      console.log('Maintenance mode is enabled');
      setDialogOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!chatResponse?.result) return;

    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1];

      // Vérifier si le dernier message appartient au même job_id pour éviter duplication
      if (lastMessage?.role === 'assistant' && lastMessage.job_id === chatResponse.job_id) {
        // scroll to bottom
        containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);

        // mettre à jour le dernier message
        return prev.map((msg, i) =>
          i === prev.length - 1 ? { ...msg, content: chatResponse.result } : msg
        );
      }

      // Sinon, on ajoute un nouveau message
      return [...prev, { role: 'assistant', content: chatResponse.result, job_id: chatResponse.job_id }];
    });
  }, [chatResponse?.result, chatResponse?.job_id]); // Déclenchement seulement si le job_id ou le résultat change

  useEffect(() => {
    if (!chatResponse?.finish_reason) return;

    if (chatResponse.finish_reason === 'stop') {
      // update request history
      setRequest((prev) => ({
        ...prev,
        history: [...prev.history, { role: 'assistant', content: chatResponse.result }],
        input: ''
      }));
    }
  }, [chatResponse?.result, chatResponse?.job_id, chatResponse?.finish_reason]);


  const handleSendMessage = (message: string): void => {
    const newRequest: ChatCompletionsRequest = {
      ...request,
      input: message,
      history: [...request.history, { role: 'user', content: message }],
      stream: isStreaming
    };
    setRequest(newRequest);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: message }
    ]);
  };

  return (
    <div className="chat-container">
      {dialogOpen && (
        <>
          <MainDialog title={'⚠️ Information importante ⚠️'}
                      message={'Ce site est actuellement en cours de construction 👷🏼‍♂️ 🚧 ! Pour patienter vous pouvez utiliser Nexia 🤖, mon assistant personnel qui saura répondre à toutes vos questions. À très vite !'}
                      validationLabel={'Compris !'} isOpen={dialogOpen} onClose={() => setDialogOpen(false)}
          />
        </>
      )}
      <div className="chat-inner-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <p>
              Salut moi c'est Nexia, tu as une question sur Mathis ? <br />Je serai ravi de t'aider !
            </p>
          </div>
        )}
        {messages.length > 0 && (
          <div className="chat-output" ref={containerRef}>
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <MarkdownView content={message.content} />
              </div>
            ))}
          </div>
        )}
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
    ;
};

export default ChatPage;
