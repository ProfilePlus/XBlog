"use client";

import React, { useState } from "react";

export function NewsletterForm() {
  const [showNotification, setShowNotification] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowNotification(true);
  };

  return (
    <>
      <div className="form-container">
        <div className="emailoctopus-form-wrapper emailoctopus-form-default">
          <form className="emailoctopus-form" onSubmit={handleSubmit}>
            <div className="main-form">
              <div>
                <div className="emailoctopus-form-row form-group mb-2">
                  <input 
                    className="form-control" 
                    placeholder="你的邮箱地址" 
                    type="email" 
                    required
                  />
                </div>
              </div>
              <button 
                className="btn w-100 btn-primary mb-2" 
                type="submit"
                style={{ 
                  cursor: "pointer",
                  background: "var(--color-text)",
                  color: "var(--color-bg)",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "4px",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  transition: "opacity 0.3s ease"
                }}
              >
                订阅
              </button>
            </div>
          </form>
        </div>
      </div>

      {showNotification && (
        <div className="vibe-notification-overlay" onClick={() => setShowNotification(false)}>
          <div className="vibe-notification-content" onClick={(e) => e.stopPropagation()}>
            <p className="vibe-notification-text">
              “在心流的尽头，<br/>
              连接正在酝酿中。”
            </p>
            <p style={{ fontSize: "1rem", color: "var(--color-textdim)", marginBottom: "2rem", fontFamily: "var(--font-sans)" }}>
              订阅功能暂未实现，你可以通过 GitHub 捕捉我的下一次灵感。
            </p>
            <button 
              className="vibe-notification-close"
              onClick={() => setShowNotification(false)}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </>
  );
}
