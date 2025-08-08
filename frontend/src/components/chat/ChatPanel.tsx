import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChat } from '@/hooks/useChat';
import Conversation from '@/components/chat/Conversation';

const ChatPanel: React.FC = () => {
    const { isChatOpen } = useChat();

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        if (isChatOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = originalOverflow;
        }
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isChatOpen]);

    return (
        <AnimatePresence>
            {isChatOpen && (
                <motion.div
                    className="fixed inset-0 w-full h-full flex flex-col items-center justify-center z-40 backdrop-blur-md p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    <div className="relative w-full max-w-4xl h-[calc(90vh-2rem)] flex flex-col bg-transparent">
                        <Conversation />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ChatPanel;


