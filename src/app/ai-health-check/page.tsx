"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

const BRAND = "#FF6B35";
const BRAND_LIGHT = "#FFF3EE";
const BRAND_DARK = "#CC4A1A";

const urgencyConfig = {
  NON_URGENT: { label: "Non-Urgent", color: "#16a34a", bg: "#f0fdf4", border: "#86efac" },
  MODERATE: { label: "Moderate", color: "#d97706", bg: "#fffbeb", border: "#fcd34d" },
  EMERGENCY: { label: "Emergency", color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
};

export default function AiHealthCheck() {
  const [activeTab, setActiveTab] = useState<"photo" | "chat">("photo");

  // Photo Analysis State
  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat Assistant State
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant", content: string }[]>([
    { role: "assistant", content: "Hi! I'm AniCare AI. How can I help your pet today? Describe their symptoms and I'll provide immediate first-aid guidance." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleFile = (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload a valid image file (JPG or PNG).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB.");
      return;
    }
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === "string") {
        setImage(e.target.result);
        setImageBase64(e.target.result.split(",")[1]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/analyze-pet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze image");
      }
      
      setResult(data);
    } catch (err) {
      setError("Something went wrong during analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const newMessages = [...chatMessages, { role: "user" as const, content: chatInput.trim() }];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat-pet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }
      
      setChatMessages([...newMessages, { role: "assistant", content: data.text }]);
    } catch (err) {
      setChatMessages([...newMessages, { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const urgency = result ? urgencyConfig[result.urgencyLevel as keyof typeof urgencyConfig] || urgencyConfig.MODERATE : null;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <span style={{ background: BRAND_LIGHT, color: BRAND_DARK, borderRadius: 999, padding: "4px 16px", fontSize: 13, fontWeight: 600, letterSpacing: 0.5 }}>
          AI HEALTH CHECK
        </span>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: "12px 0 8px", color: "#111" }}>
          Is your pet okay?
        </h1>
        <p style={{ color: "#666", fontSize: 16, margin: 0 }}>
          Upload a photo or chat with our AI to get instant first-aid guidance before you see a vet.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "2rem", background: "#f5f5f5", padding: "6px", borderRadius: "12px" }}>
        <button
          onClick={() => setActiveTab("photo")}
          style={{
            flex: 1,
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            background: activeTab === "photo" ? "#fff" : "transparent",
            color: activeTab === "photo" ? BRAND : "#555",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: activeTab === "photo" ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
            transition: "all 0.2s"
          }}
        >
          📷 Photo Analysis
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          style={{
            flex: 1,
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            background: activeTab === "chat" ? "#fff" : "transparent",
            color: activeTab === "chat" ? BRAND : "#555",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: activeTab === "chat" ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
            transition: "all 0.2s"
          }}
        >
          💬 Chat Assistant
        </button>
      </div>

      {activeTab === "photo" && (
        <div>
          {/* Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? BRAND : "#ddd"}`,
              borderRadius: 16,
              background: dragOver ? BRAND_LIGHT : image ? "#fafafa" : "#fff",
              padding: image ? "16px" : "48px 24px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              marginBottom: "1rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            />
            {image ? (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <img
                  src={image}
                  alt="Uploaded pet"
                  style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 12, border: "2px solid #eee" }}
                />
                <div style={{ textAlign: "left" }}>
                  <p style={{ margin: 0, fontWeight: 600, color: "#111" }}>Photo uploaded ✓</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>Click to change photo</p>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🐾</div>
                <p style={{ fontWeight: 600, color: "#333", margin: "0 0 4px" }}>Drop your pet's photo here</p>
                <p style={{ color: "#999", fontSize: 13, margin: 0 }}>or click to browse · JPG or PNG · Max 10MB</p>
              </>
            )}
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 16px", color: "#dc2626", fontSize: 14, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={!image || loading}
            style={{
              width: "100%",
              background: image && !loading ? BRAND : "#ccc",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "16px",
              fontSize: 16,
              fontWeight: 700,
              cursor: image && !loading ? "pointer" : "not-allowed",
              transition: "background 0.2s",
              marginBottom: "2rem",
            }}
          >
            {loading ? "Analyzing your pet's photo…" : "Analyze Now →"}
          </button>

          {/* Loading State */}
          {loading && (
            <div style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
              <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 1s linear infinite", display: "inline-block" }}>🔍</div>
              <p style={{ margin: 0, fontSize: 15 }}>Our AI is examining the image…</p>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Results */}
          {result && urgency && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Urgency Banner */}
              <div style={{ background: urgency.bg, border: `1.5px solid ${urgency.border}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>
                  {result.urgencyLevel === "EMERGENCY" ? "🚨" : result.urgencyLevel === "MODERATE" ? "⚠️" : "✅"}
                </span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: urgency.color, fontSize: 15 }}>{urgency.label}</p>
                  <p style={{ margin: 0, color: "#555", fontSize: 13 }}>{result.urgencyReason}</p>
                </div>
              </div>

              {/* Pet + Condition */}
              <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: "18px 20px" }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: BRAND, textTransform: "uppercase", letterSpacing: 1 }}>What we see</p>
                <p style={{ margin: "0 0 14px", color: "#555", fontSize: 14 }}>{result.petDescription}</p>
                <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: 1 }}>Possible condition</p>
                <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 17, color: "#111" }}>{result.possibleCondition?.primary?.name}</p>
                <p style={{ margin: 0, color: "#555", fontSize: 14, lineHeight: 1.6 }}>{result.possibleCondition?.primary?.description}</p>
                {result.possibleCondition?.alternatives?.length > 0 && (
                  <p style={{ margin: "12px 0 0", color: "#777", fontSize: 13 }}>
                    <strong>Alternatives considered:</strong> {result.possibleCondition.alternatives.join(", ")}
                  </p>
                )}
              </div>

              {/* First Aid Steps */}
              <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: "18px 20px" }}>
                <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 700, color: BRAND, textTransform: "uppercase", letterSpacing: 1 }}>🩹 Immediate first-aid steps</p>
                {result.firstAidSteps.map((step: string, i: number) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                    <span style={{ minWidth: 26, height: 26, background: BRAND_LIGHT, color: BRAND_DARK, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{i + 1}</span>
                    <p style={{ margin: 0, color: "#333", fontSize: 14, lineHeight: 1.6 }}>{step}</p>
                  </div>
                ))}
              </div>

              {/* Products To Use */}
              {result.productsToUse && result.productsToUse.length > 0 && (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 16, padding: "18px 20px" }}>
                  <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: 1 }}>🧴 Suggested Products</p>
                  {result.productsToUse.map((item: string, i: number) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                      <span style={{ color: "#16a34a", fontWeight: 700, marginTop: 2 }}>✓</span>
                      <p style={{ margin: 0, color: "#555", fontSize: 14 }}>{item}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Avoid */}
              <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 16, padding: "18px 20px" }}>
                <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: 1 }}>❌ What to avoid</p>
                {result.thingsToAvoid.map((item: string, i: number) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "#d97706", fontWeight: 700, marginTop: 2 }}>—</span>
                    <p style={{ margin: 0, color: "#555", fontSize: 14 }}>{item}</p>
                  </div>
                ))}
              </div>

              {/* Vet Advice */}
              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 16, padding: "18px 20px" }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#0369a1", textTransform: "uppercase", letterSpacing: 1 }}>🏥 When to see a vet</p>
                <p style={{ margin: 0, color: "#334155", fontSize: 14, lineHeight: 1.6 }}>{result.vetAdvice}</p>
              </div>

              {/* Reassurance */}
              <div style={{ background: BRAND_LIGHT, border: `1px solid ${BRAND}33`, borderRadius: 16, padding: "16px 20px", textAlign: "center" }}>
                <p style={{ margin: 0, color: BRAND_DARK, fontSize: 15, fontStyle: "italic" }}>💛 {result.reassurance}</p>
              </div>

              {/* Disclaimer + CTA */}
              <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
                <p style={{ fontSize: 12, color: "#999", margin: "0 0 16px", lineHeight: 1.5 }}>
                  This AI analysis is for first-aid guidance only and does not constitute a medical diagnosis.<br />Always consult a licensed veterinarian for your pet's health.
                </p>
                <a
                  href="/vets"
                  style={{ display: "inline-block", background: BRAND, color: "#fff", borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 15, textDecoration: "none" }}
                >
                  Find a Vet on Aniwoo →
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "chat" && (
        <div style={{ display: "flex", flexDirection: "column", height: "60vh", background: "#fff", border: "1px solid #eee", borderRadius: "16px", overflow: "hidden" }}>
          
          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "flex-start", alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                {msg.role === "assistant" && (
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: BRAND_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", color: BRAND, flexShrink: 0 }}>
                    <Bot size={18} />
                  </div>
                )}
                
                <div className="chat-message-content" style={{ 
                  background: msg.role === "user" ? BRAND : "#f5f5f5", 
                  color: msg.role === "user" ? "#fff" : "#333",
                  padding: "12px 16px", 
                  borderRadius: msg.role === "user" ? "16px 16px 0 16px" : "16px 16px 16px 0",
                  fontSize: "15px",
                  lineHeight: "1.5",
                  whiteSpace: msg.role === "user" ? "pre-wrap" : "normal"
                }}>
                  {msg.role === "assistant" ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>

                {msg.role === "user" && (
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", flexShrink: 0 }}>
                    <User size={18} />
                  </div>
                )}
              </div>
            ))}
            
            {chatLoading && (
              <div style={{ display: "flex", gap: "12px", alignItems: "center", alignSelf: "flex-start", maxWidth: "85%" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: BRAND_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", color: BRAND, flexShrink: 0 }}>
                  <Bot size={18} />
                </div>
                <div style={{ background: "#f5f5f5", padding: "12px 16px", borderRadius: "16px 16px 16px 0", color: "#888", display: "flex", gap: "4px" }}>
                  <span className="dot" style={{ animation: "pulse 1.5s infinite" }}>●</span>
                  <span className="dot" style={{ animation: "pulse 1.5s infinite 0.2s" }}>●</span>
                  <span className="dot" style={{ animation: "pulse 1.5s infinite 0.4s" }}>●</span>
                  <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div style={{ padding: "16px", borderTop: "1px solid #eee", background: "#fafafa" }}>
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}
              style={{ display: "flex", gap: "12px" }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Describe your pet's symptoms..."
                disabled={chatLoading}
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  borderRadius: "24px",
                  border: "1px solid #ddd",
                  fontSize: "15px",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = BRAND}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: chatInput.trim() && !chatLoading ? BRAND : "#ccc",
                  color: "#fff",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: chatInput.trim() && !chatLoading ? "pointer" : "not-allowed",
                  transition: "background 0.2s"
                }}
              >
                <Send size={20} style={{ marginLeft: "-2px" }} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}