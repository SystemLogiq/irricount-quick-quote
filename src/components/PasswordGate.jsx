import { useState } from "react";

const DEMO_PASSWORD = "irricount2026";

export default function PasswordGate({ children }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem("iq_unlocked") === "true"
  );

  if (unlocked) return children;

  function handleSubmit(e) {
    e.preventDefault();
    if (input === DEMO_PASSWORD) {
      sessionStorage.setItem("iq_unlocked", "true");
      setUnlocked(true);
    } else {
      setError(true);
      setInput("");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0a0a0a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        <img src="/IC_Dark_BG.svg" alt="IrriCount" style={{ height: "48px", width: "auto" }} />
      </div>

      <form onSubmit={handleSubmit} style={{
        width: "100%",
        maxWidth: "320px",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}>
        <input
          type="password"
          placeholder="Enter access code"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false); }}
          autoFocus
          style={{
            padding: "14px 16px",
            fontSize: "16px",
            borderRadius: "8px",
            border: error ? "2px solid #ef4444" : "2px solid #333",
            backgroundColor: "#1a1a1a",
            color: "#ffffff",
            outline: "none",
            width: "100%",
            boxSizing: "border-box"
          }}
        />
        {error && (
          <div style={{ color: "#ef4444", fontSize: "13px", textAlign: "center" }}>
            Incorrect access code. Please try again.
          </div>
        )}
        <button type="submit" style={{
          padding: "14px",
          fontSize: "16px",
          fontWeight: "bold",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#00876A",
          color: "#ffffff",
          cursor: "pointer",
          width: "100%"
        }}>
          Enter
        </button>
      </form>

      <div style={{ marginTop: "48px", fontSize: "11px", color: "#444" }}>
        © 2026 SystemLogiq LLC — Authorized access only
      </div>
    </div>
  );
}
