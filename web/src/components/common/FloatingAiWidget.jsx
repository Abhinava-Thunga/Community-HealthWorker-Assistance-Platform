import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import "./FloatingAiWidget.css";

const QUICK_QUESTIONS = [
  "BP 160/110 pregnant warning signs",
  "Child fever with stiff neck",
  "WHO ORS & Zinc dose for diarrhea",
  "Missed 9-mo MR vaccine catch-up",
];

export default function FloatingAiWidget() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your AshaBot CHW Clinical Assistant. How can I support your field consultation today?",
      triageLevel: "INFO",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const messagesEndRef = useRef(null);

  // If already on the dedicated /ai-assistant page, don't show the floating widget
  if (location.pathname === "/ai-assistant") {
    return null;
  }

  // Check login
  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }

  const handleSend = async (customQuery = null) => {
    const text = customQuery || input;
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", { message: text });
      if (res.data?.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.data.message.content,
            triageLevel: res.data.message.triageLevel,
          },
        ]);
      }
    } catch (err) {
      console.warn("Floating AI error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Unable to get clinical advice right now. Please check network connection.",
          triageLevel: "INFO",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  };

  return (
    <>
      <div className="floating-ai-launcher">
        {showTooltip && !isOpen && (
          <div className="floating-ai-tooltip">🤖 CHW AI Co-Pilot</div>
        )}

        <button
          className="floating-ai-btn"
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          title="Open AI Health Assistant"
        >
          {isOpen ? "✕" : "🤖"}
          <span className="floating-ai-badge-pulse" />
        </button>
      </div>

      {isOpen && (
        <div className="floating-ai-drawer">
          <div className="drawer-header">
            <div className="drawer-header-left">
              <div className="drawer-bot-icon">🩺</div>
              <div className="drawer-header-title">
                <h4>AshaBot Assistant</h4>
                <p>Frontline Decision Support</p>
              </div>
            </div>

            <div className="drawer-header-actions">
              <button
                title="Open Fullscreen Workspace"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/ai-assistant");
                }}
              >
                ⤢
              </button>
              <button title="Close" onClick={() => setIsOpen(false)}>
                ✕
              </button>
            </div>
          </div>

          <div className="drawer-messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`drawer-bubble ${m.role}`}>
                {m.role === "assistant" && m.triageLevel && m.triageLevel !== "INFO" && (
                  <span className={`drawer-triage-pill ${m.triageLevel}`}>
                    {m.triageLevel === "URGENT" && "🔴 URGENT REFERRAL"}
                    {m.triageLevel === "MODERATE" && "🟡 MODERATE FOLLOW-UP"}
                    {m.triageLevel === "ROUTINE" && "🟢 ROUTINE"}
                  </span>
                )}
                <div>
                  {m.content.split("\n").map((line, lIdx) => (
                    <p key={lIdx} style={{ margin: "0 0 4px 0" }}>
                      {line.replace(/\[TRIAGE:.*?\]/g, "").replace(/\*\*/g, "")}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {loading && (
              <div className="drawer-bubble assistant" style={{ fontStyle: "italic", color: "#64748b" }}>
                Analyzing clinical guidelines...
              </div>
            )}

            {messages.length === 1 && (
              <div className="drawer-quick-chips">
                {QUICK_QUESTIONS.map((q, qIdx) => (
                  <button
                    key={qIdx}
                    className="drawer-chip"
                    onClick={() => handleSend(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            className="drawer-input-area"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              className="drawer-input"
              placeholder="Ask a quick clinical question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="drawer-send-btn"
              disabled={!input.trim() || loading}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
