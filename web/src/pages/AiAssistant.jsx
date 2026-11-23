import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import ChangePasswordModal from "../components/ChangePasswordModal";
import "./AiAssistant.css";

const PRESET_PROMPTS = [
  {
    category: "emergency",
    label: "🚨 Emergency Triage",
    text: "Pregnant woman BP 165/115 with severe persistent headache and blurry vision. What are the danger signs and immediate emergency steps?",
  },
  {
    category: "maternal",
    label: "🤰 Antenatal Care",
    text: "Protocol for 2nd trimester ANC home visit: IFA and Calcium dosing schedule, vital sign thresholds, and maternal nutrition advice.",
  },
  {
    category: "vaccine",
    label: "💉 Missed Vaccine",
    text: "A 14-month-old toddler missed their 9-month Measles-Rubella (MR) and Vitamin A dose. What is the national catch-up protocol?",
  },
  {
    category: "vitals",
    label: "🩺 Vitals Check",
    text: "Please evaluate vitals: BP 155/98 mmHg, SpO2 93%, Heart Rate 104 bpm, Temperature 101.2°F. Provide triage urgency and actions.",
  },
  {
    category: "child",
    label: "💧 Diarrhea & Dehydration",
    text: "WHO protocol for pediatric diarrhea: assess mild vs severe dehydration, correct preparation of ORS, and 14-day Zinc sulfate dosage.",
  },
  {
    category: "general",
    label: "🧒 Child Nutrition & SAM",
    text: "How to screen for Severe Acute Malnutrition (SAM) using MUAC tape and bilateral pitting edema in community children?",
  },
];

export default function AiAssistant({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  // User info
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();
  const userName = user.fullName || user.name || "Health Worker";
  const userRole = user.role || "WORKER";
  const firstLetter = userName.charAt(0).toUpperCase();

  // State
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(location.state?.patientId || "");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const speechRecognitionRef = useRef(null);

  // Auto-scroll messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load patient list
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get("/patients");
        setPatients(res.data?.patients || []);
      } catch (err) {
        console.warn("Failed to fetch patients:", err);
      }
    };
    fetchPatients();
  }, []);

  // Update selected patient profile
  useEffect(() => {
    if (selectedPatientId && patients.length > 0) {
      const match = patients.find((p) => p._id === selectedPatientId);
      setSelectedPatient(match || null);
    } else {
      setSelectedPatient(null);
    }
  }, [selectedPatientId, patients]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get("/ai/conversations");
      setConversations(res.data?.conversations || []);
    } catch (err) {
      console.warn("Failed to load conversations:", err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load conversation details when selected
  const handleSelectConversation = async (convId) => {
    try {
      setLoading(true);
      const res = await api.get(`/ai/conversations/${convId}`);
      if (res.data?.conversation) {
        setCurrentConversationId(res.data.conversation._id);
        setMessages(res.data.conversation.messages || []);
        if (res.data.conversation.patient) {
          setSelectedPatientId(res.data.conversation.patient._id);
          setSelectedPatient(res.data.conversation.patient);
        }
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  // Start new consultation
  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInputMessage("");
    // Stop speech if playing
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIdx(null);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this consultation history?")) return;
    try {
      await api.delete(`/ai/conversations/${convId}`);
      if (currentConversationId === convId) {
        handleNewChat();
      }
      loadConversations();
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  // Send message
  const handleSendMessage = async (customText = null) => {
    const textToSend = typeof customText === "string" ? customText : inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const payload = {
        message: textToSend,
        conversationId: currentConversationId || undefined,
        patientId: selectedPatientId || undefined,
      };

      const res = await api.post("/ai/chat", payload);

      if (res.data?.success) {
        if (!currentConversationId && res.data.conversationId) {
          setCurrentConversationId(res.data.conversationId);
          loadConversations();
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.data.message.content,
            triageLevel: res.data.message.triageLevel,
            timestamp: res.data.message.timestamp,
            isOfflineEngine: res.data.isOfflineEngine,
          },
        ]);
      }
    } catch (err) {
      console.error("AI Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ **System Communication Issue**: Unable to connect to the healthcare knowledge service. Please check network connectivity or try again in a moment.",
          triageLevel: "INFO",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Voice speech-to-text (Web Speech API)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please type your message.");
      return;
    }

    if (isRecording) {
      speechRecognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN";

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition error:", e.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setIsRecording(false);
    }
  };

  // Read aloud / Text-to-speech
  const toggleSpeech = (idx, text) => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported by your browser.");
      return;
    }

    if (speakingMsgIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIdx(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Strip triage tag and markdown symbols for audio reading
    const cleanAudioText = text
      .replace(/\[TRIAGE:.*?\]/g, "")
      .replace(/[#*`_>]/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanAudioText);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingMsgIdx(null);
    utterance.onerror = () => setSpeakingMsgIdx(null);

    setSpeakingMsgIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  // Copy message
  const handleCopy = (idx, text) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Format markdown helper
  const renderFormattedMessage = (content) => {
    // Strip the triage prefix from main body since we display it as a badge
    const cleaned = content.replace(/\[TRIAGE:\s*(URGENT|MODERATE|ROUTINE|INFO)\]/g, "").trim();

    const lines = cleaned.split("\n");
    return (
      <div className="formatted-content">
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("### ")) {
            return <h4 key={lIdx}>{trimmed.replace("### ", "")}</h4>;
          }
          if (trimmed.startsWith("## ")) {
            return <h3 key={lIdx}>{trimmed.replace("## ", "")}</h3>;
          }
          if (trimmed.startsWith("> ")) {
            return <blockquote key={lIdx}>{trimmed.replace("> ", "")}</blockquote>;
          }
          if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
            const listText = trimmed.substring(2);
            return (
              <ul key={lIdx}>
                <li dangerouslySetInnerHTML={{ __html: parseInlineStyles(listText) }} />
              </ul>
            );
          }
          if (/^\d+\.\s/.test(trimmed)) {
            const listText = trimmed.replace(/^\d+\.\s/, "");
            return (
              <ol key={lIdx}>
                <li dangerouslySetInnerHTML={{ __html: parseInlineStyles(listText) }} />
              </ol>
            );
          }
          if (!trimmed) {
            return <div key={lIdx} style={{ height: "6px" }} />;
          }
          return (
            <p key={lIdx} dangerouslySetInnerHTML={{ __html: parseInlineStyles(trimmed) }} />
          );
        })}
      </div>
    );
  };

  // Inline bold and pill parser
  const parseInlineStyles = (str) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<span class='code-pill'>$1</span>");
  };

  // Export consultation
  const handleExportConsultation = () => {
    if (messages.length === 0) return;
    const docTitle = `CHW_Consultation_${new Date().toISOString().slice(0, 10)}.txt`;
    let output = `=====================================================\nCOMMUNITY HEALTH WORKER PLATFORM - CLINICAL CONSULTATION\nDate: ${new Date().toLocaleString()}\nWorker: ${userName} (${userRole})\n`;
    if (selectedPatient) {
      output += `Patient: ${selectedPatient.fullName} | Age: ${selectedPatient.age} | Gender: ${selectedPatient.gender}\n`;
    }
    output += `=====================================================\n\n`;

    messages.forEach((m) => {
      output += `[${m.role.toUpperCase()}] (${new Date(m.timestamp).toLocaleTimeString()}):\n`;
      output += `${m.content}\n\n-----------------------------------------------------\n\n`;
    });

    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = docTitle;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ai-assistant-page">
      {/* HEADER */}
      <header className="ai-page-header">
        <div className="ai-header-inner">
          <Link to="/dashboard" className="ai-brand">
            <img src="/logo.png" alt="Logo" className="ai-brand-logo" />
            <div className="ai-brand-text">
              <h1>Community Health Worker</h1>
              <p>ASSISTANCE PLATFORM</p>
            </div>
          </Link>

          <nav className="ai-nav">
            <Link to="/dashboard" className="ai-nav-item">Dashboard</Link>
            <Link to="/patients" className="ai-nav-item">Patients</Link>
            <Link to="/appointments" className="ai-nav-item">Appointments</Link>
            <Link to="/health-records" className="ai-nav-item">Health Records</Link>
            <Link to="/ai-assistant" className="ai-nav-item active">AI Assistant</Link>
            {userRole === "ADMIN" && (
              <Link to="/admin" className="ai-nav-item" style={{ background: "#fef3c7", color: "#b45309", fontWeight: "700" }}>
                🛡️ Admin Panel
              </Link>
            )}
          </nav>

          <div className="ai-user-area">
            <span style={{ fontSize: "0.825rem", fontWeight: "600", color: "#475569" }}>
              {userName} {user.workerId ? `(🪪 ${user.workerId})` : ""}
            </span>
            <div className="ai-user-avatar">{firstLetter}</div>
            <button
              className="action-chip-btn"
              onClick={() => setShowPasswordModal(true)}
              title="Change Password"
            >
              🔑 Password
            </button>
            <button
              className="action-chip-btn"
              onClick={() => {
                if (onLogout) onLogout();
                else {
                  localStorage.clear();
                  navigate("/login");
                }
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* WORKSPACE */}
      <div className="ai-workspace">
        {/* SIDEBAR */}
        <aside className="ai-sidebar">
          <div className="sidebar-header">
            <button className="new-chat-btn" onClick={handleNewChat}>
              <span>+</span> New Consultation
            </button>

            {/* Patient Context Selector */}
            <div className="patient-picker-box">
              <div className="patient-picker-label">
                <span>Patient Context</span>
                {selectedPatientId && (
                  <button
                    className="clear-patient-link"
                    onClick={() => setSelectedPatientId("")}
                  >
                    Clear
                  </button>
                )}
              </div>
              <select
                className="patient-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                <option value="">-- No Patient Attached --</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.fullName} ({p.age}y, {p.gender})
                  </option>
                ))}
              </select>

              {selectedPatient && (
                <div className="active-patient-card">
                  <span className="active-patient-name">{selectedPatient.fullName}</span>
                  <span className="active-patient-meta">
                    {selectedPatient.age} yrs • {selectedPatient.gender}
                    {selectedPatient.bloodGroup ? ` • Blood: ${selectedPatient.bloodGroup}` : ""}
                  </span>
                  {selectedPatient.allergies && (
                    <div className="active-patient-vitals">
                      ⚠️ Allergy: {selectedPatient.allergies}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* History List */}
          <div className="sidebar-history">
            <span className="history-heading">Recent Consultations</span>
            {conversations.length === 0 ? (
              <div style={{ padding: "1rem", color: "#94a3b8", fontSize: "0.8rem", textAlign: "center" }}>
                No past consultations yet.
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv._id}
                  className={`history-item ${conv._id === currentConversationId ? "active" : ""}`}
                  onClick={() => handleSelectConversation(conv._id)}
                >
                  <div className="history-item-content">
                    <span className="history-title">{conv.title || "Consultation"}</span>
                    <div className="history-meta">
                      <span className={`triage-dot ${conv.lastTriage || "INFO"}`} />
                      <span>{new Date(conv.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                      <span>• {conv.messageCount} msg</span>
                    </div>
                  </div>
                  <button
                    className="delete-chat-btn"
                    title="Delete session"
                    onClick={(e) => handleDeleteConversation(e, conv._id)}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* CHAT MAIN AREA */}
        <main className="ai-chat-area">
          {/* TOP BAR */}
          <div className="chat-top-bar">
            <div className="bot-profile">
              <div className="bot-avatar-badge">🤖</div>
              <div className="bot-details">
                <h3>AshaBot CHW Co-Pilot</h3>
                <div className="bot-subtext">
                  <span className="pulse-indicator" />
                  <span>Clinical Decision Support & Triage Active</span>
                  {selectedPatient && (
                    <span style={{ color: "#0f766e", fontWeight: "700" }}>
                      • Context: {selectedPatient.fullName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="top-bar-actions">
              {messages.length > 0 && (
                <button
                  className="action-chip-btn"
                  onClick={handleExportConsultation}
                  title="Export Consultation Note"
                >
                  📄 Export Note
                </button>
              )}
              <button
                className="action-chip-btn"
                onClick={handleNewChat}
                title="Reset Workspace"
              >
                🔄 Reset
              </button>
            </div>
          </div>

          {/* MESSAGES SCROLL */}
          <div className="chat-messages-container">
            {messages.length === 0 ? (
              <div className="welcome-chat-hero">
                <div className="welcome-bot-icon">🩺🤖</div>
                <h2>Frontline Clinical Decision Support</h2>
                <p>
                  Empowering community health workers with instant triage, vital signs interpretation,
                  danger-sign detection, national immunization catch-up guides, and maternal-child health protocols.
                </p>

                <div className="preset-categories-title">Quick Field Protocols & Inquiries:</div>
                <div className="preset-chips-grid">
                  {PRESET_PROMPTS.map((prompt, idx) => (
                    <div
                      key={idx}
                      className="prompt-card-chip"
                      onClick={() => handleSendMessage(prompt.text)}
                    >
                      <span className={`chip-tag ${prompt.category}`}>{prompt.label}</span>
                      <span className="chip-text">{prompt.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isAssistant = msg.role === "assistant";
                return (
                  <div
                    key={idx}
                    className={`message-row ${isAssistant ? "assistant" : "user"}`}
                  >
                    <div className="msg-avatar">
                      {isAssistant ? "🤖" : firstLetter}
                    </div>

                    <div className="msg-bubble">
                      {isAssistant && msg.triageLevel && msg.triageLevel !== "INFO" && (
                        <div className={`triage-badge ${msg.triageLevel}`}>
                          {msg.triageLevel === "URGENT" && "🔴 URGENT EMERGENCY REFERRAL"}
                          {msg.triageLevel === "MODERATE" && "🟡 MODERATE CAUTION / CLINICAL REVIEW"}
                          {msg.triageLevel === "ROUTINE" && "🟢 ROUTINE / COMMUNITY CARE"}
                        </div>
                      )}

                      {isAssistant ? (
                        renderFormattedMessage(msg.content)
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                      )}

                      <div className="bubble-footer">
                        <span className="message-time">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        {isAssistant && (
                          <div className="msg-actions">
                            <button
                              className={`msg-btn ${speakingMsgIdx === idx ? "speaking" : ""}`}
                              onClick={() => toggleSpeech(idx, msg.content)}
                              title={speakingMsgIdx === idx ? "Stop Audio" : "Listen Aloud"}
                            >
                              {speakingMsgIdx === idx ? "⏹️ Stop" : "🔊 Listen"}
                            </button>
                            <button
                              className="msg-btn"
                              onClick={() => handleCopy(idx, msg.content)}
                              title="Copy to clipboard"
                            >
                              {copiedIdx === idx ? "✓ Copied" : "📋 Copy"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {loading && (
              <div className="message-row assistant">
                <div className="msg-avatar">🤖</div>
                <div className="typing-bubble">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <div className="chat-input-bar-container">
            {selectedPatient && (
              <div className="attached-patient-chip">
                <span>👤 Context: {selectedPatient.fullName} ({selectedPatient.age}y, {selectedPatient.gender})</span>
                <button
                  className="detach-patient-btn"
                  onClick={() => setSelectedPatientId("")}
                  title="Remove patient context"
                >
                  ✕
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="chat-input-box"
            >
              <textarea
                ref={textareaRef}
                className="chat-textarea"
                rows={1}
                placeholder="Ask about symptoms, vitals, preeclampsia, child fever, vaccine catch-up..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />

              <button
                type="button"
                className={`mic-btn ${isRecording ? "recording" : ""}`}
                onClick={toggleSpeechRecognition}
                title={isRecording ? "Stop recording" : "Speak query (Hands-free)"}
              >
                {isRecording ? "🔴" : "🎙️"}
              </button>

              <button
                type="submit"
                className="send-btn"
                disabled={!inputMessage.trim() || loading}
              >
                <span>Send</span> →
              </button>
            </form>
            <div className="input-hint">
              Press Enter to send, Shift + Enter for newline. Always verify critical guidance with the medical officer.
            </div>
          </div>
        </main>
      </div>

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => {
            setShowPasswordModal(false);
          }}
        />
      )}
    </div>
  );
}
