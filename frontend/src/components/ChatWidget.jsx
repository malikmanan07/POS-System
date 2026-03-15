import React, { useState, useEffect, useRef } from 'react';
import '../styles/chat-widget.css';

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi there! 👋 I\'m your Force POS assistant. Ask me anything about our features, pricing, or how to get started!' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            // Optional: focus input when opened
            setTimeout(() => inputRef.current?.focus(), 400);
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async (e) => {
        e?.preventDefault();

        if (!input.trim() || isTyping) return;

        const userMsg = { role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        const currentHistory = [...messages, userMsg];

        try {
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: currentHistory.map(m => ({ role: m.role, content: String(m.content) })) })
            });

            if (!response.ok) {
                throw new Error('API Response not ok');
            }

            // Create a new assistant message slot
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
            setIsTyping(false);

            // Handle the Server-Sent Events stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunkText = decoder.decode(value, { stream: true });
                const lines = chunkText.split('\n');

                for (let line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') {
                            break;
                        }

                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.error) {
                                console.error(parsed.error);
                                break;
                            }

                            if (parsed.text) {
                                setMessages(prev => {
                                    const newMsgs = [...prev];
                                    const lastIndex = newMsgs.length - 1;
                                    newMsgs[lastIndex] = {
                                        ...newMsgs[lastIndex],
                                        content: newMsgs[lastIndex].content + parsed.text
                                    };
                                    return newMsgs;
                                });
                            }
                        } catch (err) {
                            // ignore lines that are not valid JSON chunks
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Chat error:', error);
            setIsTyping(false);
            setMessages(prev => [...prev, { role: 'error', content: 'Connection failed. Please try again later.' }]);
        }
    };

    // Very basic markdown bold renderer for the chat string
    const renderMarkdown = (text) => {
        if (typeof text !== 'string') return text;
        const parts = text.split(/(?<=\*\*)|(?=\*\*)/);
        let inBold = false;
        return parts.map((part, i) => {
            if (part === '**') {
                inBold = !inBold;
                return null;
            }
            return inBold ? <strong key={i}>{part}</strong> : part;
        });
    };

    return (
        <div className="chat-widget-wrapper">
            {/* The Main Chat Window */}
            <div className={`chat-window ${isOpen ? 'open' : ''}`}>
                <div className="chat-header">
                    <div className="chat-header-info">
                        <div className="chat-header-avatar">
                            <i className="bi bi-robot"></i>
                        </div>
                        <div className="chat-header-text">
                            <h3>Force POS AI</h3>
                            <p>Online</p>
                        </div>
                    </div>
                    <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
                        <i className="bi bi-x"></i>
                    </button>
                </div>

                <div className="chat-messages">
                    {messages.map((msg, i) => (
                        <div key={i} className={`chat-msg ${msg.role}`}>
                            {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                        </div>
                    ))}
                    {isTyping && (
                        <div className="chat-typing">
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-area" onSubmit={handleSendMessage}>
                    <input
                        ref={inputRef}
                        type="text"
                        className="chat-input"
                        placeholder="Ask me anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isTyping}
                    />
                    <button type="submit" className="chat-send-btn" disabled={!input.trim() || isTyping}>
                        <i className="bi bi-send-fill"></i>
                    </button>
                </form>
            </div>

            {/* The Floating Bubble */}
            <button
                className={`chat-widget-button ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(true)}
            >
                <i className="bi bi-chat-dots-fill"></i>
            </button>
        </div>
    );
}
