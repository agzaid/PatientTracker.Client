import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X, Loader2, Bot, User, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { documentChatApi, type ChatMessage } from '@/services/documentChatApi';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DocumentChatBubbleProps {
  documentId: number;
  documentType?: string;
  isOpen: boolean;
  onToggle: () => void;
}

const DocumentChatBubble: React.FC<DocumentChatBubbleProps> = ({
  documentId,
  documentType,
  isOpen,
  onToggle
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when chat is opened
  useEffect(() => {
    if (isOpen && documentId) {
      loadChatHistory();
    }
  }, [isOpen, documentId]);

  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await documentChatApi.getHistory(documentId);
      const formattedMessages: Message[] = [];
      
      response.messages.forEach((chatMessage: ChatMessage) => {
        formattedMessages.push({
          id: `user_${chatMessage.id}`,
          role: 'user',
          content: chatMessage.message,
          timestamp: new Date(chatMessage.timestamp)
        });
        formattedMessages.push({
          id: `assistant_${chatMessage.id}`,
          role: 'assistant',
          content: chatMessage.response,
          timestamp: new Date(chatMessage.timestamp)
        });
      });
      
      setMessages(formattedMessages);
    } catch (error: any) {
      console.error('Failed to load chat history:', error);
      // Don't show error toast for history loading, just start fresh
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const response = await documentChatApi.sendMessage({
        documentId,
        message: messageContent,
        includeHistory: true
      });

      const assistantMessage: Message = {
        id: `response_${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(response.timestamp)
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update history if returned
      if (response.history && response.history.length > 0) {
        // The backend already includes history, so we don't need to do anything special
        // The messages are already displayed in order
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error.error || 'Failed to get AI response');
      
      // Remove the user message if the request failed
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-50 flex items-center justify-center"
        title="Ask AI about this document"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-medium">Medical Document Assistant</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-blue-700 rounded transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingHistory ? (
          <div className="text-center text-gray-500 py-8">
            <Loader2 className="w-12 h-12 mx-auto mb-2 animate-spin text-gray-300" />
            <p className="text-sm">Loading chat history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Ask me anything about this document</p>
            <p className="text-xs mt-1">e.g., "What are the key findings?"</p>
          </div>
        ) : null}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.content.includes('Please consult with your healthcare provider')
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.content.includes('Please consult with your healthcare provider') ? (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-900 font-medium">Medical Disclaimer</p>
                    <p className="text-sm text-red-700 whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
              <p className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-100' : 
                message.content.includes('Please consult with your healthcare provider') ? 'text-red-500' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about this document..."
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          AI assistant for medical document analysis. Not a substitute for professional medical advice.
        </p>
      </div>
    </div>
  );
};

export default DocumentChatBubble;
