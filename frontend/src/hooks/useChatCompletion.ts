import { useEffect, useRef, useState } from 'react';

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

interface ChatCompletionsChunk {
    chunk: string;
    finish_reason: string | null;
    job_id: string;
}

interface ChatCompletionsResult {
    result: string;
    finish_reason: string;
    job_id: string;
}

const useChatCompletion = (
    request: ChatCompletionsRequest,
    isActive: boolean
): string => {
    const [response, setResponse] = useState<string>('');
    const controllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!isActive || !request.input.trim()) return; // Ne rien faire si inactive ou input vide

        const controller = new AbortController();
        controllerRef.current = controller;

        const fetchData = async () => {
            try {
                const res = await fetch('http://localhost:8081/api/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': request.stream ? 'text/event-stream' : 'application/json',
                    },
                    body: JSON.stringify(request),
                    signal: controller.signal,
                });

                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }

                if (request.stream) {
                    // Mode streaming avec SSE
                    if (!res.body) throw new Error('ReadableStream non disponible.');
                    const reader = res.body.getReader();
                    const decoder = new TextDecoder('utf-8');
                    let buffer = '';

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        buffer += chunk;

                        const events = buffer.split('\n\n');
                        buffer = events.pop() || ''; // Conserver le fragment incomplet

                        for (const event of events) {
                            if (!event.trim()) continue;

                            const lines = event.split('\n');
                            const eventTypeLine = lines.find((line) => line.startsWith('event:'));
                            const dataLine = lines.find((line) => line.startsWith('data:'));

                            if (dataLine) {
                                const data = dataLine.replace('data:', '').trim();
                                try {
                                    if (eventTypeLine?.includes('done')) {
                                        const jsonResponse: ChatCompletionsResult = JSON.parse(data);
                                        setResponse(jsonResponse.result);
                                    } else {
                                        const jsonResponse: ChatCompletionsChunk = JSON.parse(data);
                                        setResponse((prev) => prev + jsonResponse.chunk);
                                    }
                                } catch (e) {
                                    console.error('Échec du parsing du chunk SSE :', data, e);
                                }
                            }
                        }
                    }
                } else {
                    // Mode non-streaming
                    const data: ChatCompletionsResult = await res.json();
                    setResponse(data.result);
                }
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Erreur lors de la récupération :', error.message);
                }
            }
        };

        // Réinitialiser la réponse avant chaque nouvelle requête
        setResponse('');
        fetchData();

        return () => {
            controller.abort();
        };
    }, [request, isActive]); // Dépendances : request et isActive

    return response;
};

export default useChatCompletion;