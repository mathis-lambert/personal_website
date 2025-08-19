import React, { useState } from 'react';
import MarkdownView from '@/components/ui/MarkdownView';
import LoadingDots from '@/components/ui/LoadingDots';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, Brain } from 'lucide-react';

interface AssistantMessageProps {
    content: string;
    reasoning?: string | null;
    reasoning_content?: string | null;
    isLoading?: boolean;
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({
    content,
    reasoning,
    reasoning_content,
    isLoading = false,
}) => {
    const [isReasoningOpen, setIsReasoningOpen] = useState(false);
    const hasReasoning = reasoning || reasoning_content;
    const reasoningText = reasoning || reasoning_content;
    const isReasoningInProgress = isLoading && hasReasoning && !content;

    return (
        <div className="px-4 py-2 rounded-lg inline-block max-w-[85%] break-words bg-gray-100/60 text-gray-900 dark:bg-gray-700/60 dark:text-gray-100 shadow-sm">
            {isLoading && !content ? (
                <div className="py-2">
                    {isReasoningInProgress ? (
                        <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-blue-500" />
                            <span className="text-blue-600 dark:text-blue-400 font-medium drop-shadow-sm">
                                Reasoning...
                            </span>
                            <LoadingDots className="ml-1" />
                        </div>
                    ) : (
                        <LoadingDots />
                    )}
                </div>
            ) : (
                <>
                    <MarkdownView content={content} />

                    {hasReasoning && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <Collapsible open={isReasoningOpen} onOpenChange={setIsReasoningOpen}>
                                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                                    <Brain className="w-4 h-4" />
                                    <span>
                                        {isReasoningInProgress ? 'Raisonnement en cours...' : 'Voir le raisonnement'}
                                    </span>
                                    <ChevronRight className="w-4 h-4 transition-transform data-[state=open]:rotate-90" />
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                        <MarkdownView content={reasoningText || ''} />
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AssistantMessage;
