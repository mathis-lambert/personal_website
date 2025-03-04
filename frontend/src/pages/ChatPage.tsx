import {useEffect, useState} from 'react';
import '../style/App.scss';
import 'katex/dist/katex.min.css';
import useChatCompletion from '../hooks/useChatCompletion';
import ChatInput from '../components/chatInput/chatInput';
import MarkdownView from '../components/markdownView/markdownView';

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

const ChatPage = () => {
    const [response, setResponse] = useState<string>('');
    const [isStreaming] = useState<boolean>(true);
    const [request, setRequest] = useState<ChatCompletionsRequest>({
        model: 'mistral-small-latest',
        input: '',
        prompt:
            'You are a helpful assistant answering questions in a Markdown format. Everything you say should be in Markdown format. Equations should be in LaTeX format within $$.',
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
        setResponse(''); // Réinitialisation de la réponse pour une nouvelle requête
    };

    // const toggleStreaming = (): void => {
    //   setIsStreaming((prev) => !prev);
    // };

    return (
        <div style={{width: '100%'}}>
            <h2>Poser une question</h2>

            <div className="chat-output">
                <MarkdownView content={response}/>
            </div>
            <br/>
            <ChatInput onSendMessage={handleSendMessage}/>
            {/*<label>*/}
            {/*  <input type="checkbox" checked={isStreaming} onChange={toggleStreaming} />*/}
            {/*  Enable Streaming*/}
            {/*</label>*/}
        </div>
    );
};

export default ChatPage;
