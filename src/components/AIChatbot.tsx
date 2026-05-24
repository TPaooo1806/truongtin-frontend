"use client";

import { useState, useRef, useEffect } from "react";
import api from "@/lib/axios";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "Dạ em chào anh/chị, em là Trợ lý báo giá của Trường Tín. Em có thể giúp gì cho anh/chị ạ?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message to UI
    const updatedMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      const res = await api.post("/api/chat", {
        message: userMessage,
        history: messages
      });

      if (res.data.success) {
        setMessages([...updatedMessages, { role: "model", content: res.data.reply }]);
      } else {
        setMessages([...updatedMessages, { role: "model", content: "Dạ hệ thống đang bận, anh/chị vui lòng thử lại sau hoặc gọi Hotline nhé!" }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([...updatedMessages, { role: "model", content: "Dạ hệ thống đang bận, anh/chị vui lòng thử lại sau hoặc gọi Hotline nhé!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Nút bấm tròn (Toggle Button) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="d-flex align-items-center justify-content-center shadow-lg position-relative border-0 text-white chatbot-toggle-btn"
          title="Chat với Trợ lý AI"
        >
          {/* Hiệu ứng vòng sóng nhấp nháy */}
          <span className="position-absolute top-0 start-0 w-100 h-100 rounded-circle animate-ping" 
                style={{ backgroundColor: "#0078D4", opacity: 0.4, animationDuration: '1.5s' }}></span>
          <i className="bi bi-robot fs-4" style={{ zIndex: 1 }}></i>
        </button>
      )}

      {/* Cửa sổ Chat */}
      {isOpen && (
        <div
          className="position-fixed shadow-lg d-flex flex-column chat-window"
          style={{
            zIndex: 10000,
            backgroundColor: "#fff",
            border: "1px solid rgba(0,0,0,0.1)"
          }}
        >
          {/* Header */}
          <div className="text-white p-3 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #0078D4, #005a9e)' }}>
            <div className="d-flex align-items-center gap-2">
              <div className="d-flex align-items-center justify-content-center rounded-circle bg-white bg-opacity-25" style={{ width: '32px', height: '32px' }}>
                <i className="bi bi-robot" style={{ fontSize: '1rem' }}></i>
              </div>
              <div>
                <div className="fw-bold" style={{ fontSize: '0.9rem' }}>Trợ lý AI Trường Tín</div>
                <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Báo giá • Tư vấn • Chốt đơn</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="btn-close btn-close-white"
              aria-label="Close"
            ></button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-3" style={{ backgroundColor: "#f8f9fa" }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`d-flex ${msg.role === "user" ? "justify-content-end" : "justify-content-start"}`}
              >
                <div
                  className={`p-2 px-3 rounded-4 ${
                    msg.role === "user" 
                      ? "text-white" 
                      : "bg-white border text-dark shadow-sm"
                  }`}
                  style={{ 
                    maxWidth: "85%", 
                    borderBottomRightRadius: msg.role === "user" ? "4px" : "",
                    borderBottomLeftRadius: msg.role === "model" ? "4px" : "",
                    whiteSpace: "pre-wrap",
                    ...(msg.role === "user" ? { backgroundColor: '#0078D4' } : {})
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="d-flex justify-content-start">
                <div className="bg-white border rounded-4 p-2 px-3 shadow-sm d-flex gap-1 align-items-center" style={{ borderBottomLeftRadius: "4px" }}>
                  <span className="spinner-grow spinner-grow-sm text-secondary" style={{ width: "0.4rem", height: "0.4rem" }}></span>
                  <span className="spinner-grow spinner-grow-sm text-secondary" style={{ width: "0.4rem", height: "0.4rem", animationDelay: "0.2s" }}></span>
                  <span className="spinner-grow spinner-grow-sm text-secondary" style={{ width: "0.4rem", height: "0.4rem", animationDelay: "0.4s" }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-top d-flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi giá sản phẩm..."
              className="form-control"
              style={{ resize: "none", borderRadius: "20px", height: "40px", overflow: "hidden" }}
              disabled={isTyping}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="btn rounded-circle d-flex align-items-center justify-content-center text-white"
              style={{ width: "40px", height: "40px", backgroundColor: '#0078D4', border: 'none' }}
            >
              <i className="bi bi-send-fill"></i>
            </button>
          </div>
        </div>
      )}

      {/* CSS cho Chatbot UI */}
      <style jsx>{`
        .chatbot-toggle-btn {
          width: 55px;
          height: 55px;
          background-color: #0078D4;
          border-radius: 50%;
          transition: all 0.3s ease;
        }
        
        /* Mobile-first: Full màn hình */
        .chat-window {
          bottom: 0;
          right: 0;
          width: 100vw;
          height: 100vh;
          border-radius: 0;
        }

        /* Desktop: Cửa sổ nổi góc dưới */
        @media (min-width: 768px) {
          .chat-window {
            bottom: 20px;
            right: 20px;
            width: 380px;
            height: 600px;
            max-height: calc(100vh - 40px);
            border-radius: 1rem;
            overflow: hidden;
          }
        }
      `}</style>
    </>
  );
}
