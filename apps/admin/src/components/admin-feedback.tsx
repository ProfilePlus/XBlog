"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type FeedbackTone = "success" | "error" | "info";

type FeedbackInput = {
  title: string;
  description?: string;
  tone?: FeedbackTone;
  ttlMs?: number;
};

type FeedbackItem = FeedbackInput & {
  id: string;
  tone: FeedbackTone;
};

type FeedbackContextValue = {
  latestItem: FeedbackItem | null;
  pushFeedback: (input: FeedbackInput) => string;
  removeFeedback: (id: string) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

function toneLabel(tone: FeedbackTone) {
  if (tone === "success") {
    return "Success";
  }

  if (tone === "error") {
    return "Error";
  }

  return "Notice";
}

export function AdminFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const removeFeedback = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }

    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const pushFeedback = useCallback(
    ({ title, description, tone = "info", ttlMs }: FeedbackInput) => {
      const id = crypto.randomUUID();
      const item: FeedbackItem = {
        id,
        title,
        description,
        tone,
        ttlMs,
      };

      setItems([item]);

      const life = ttlMs ?? (tone === "error" ? 7200 : 4200);
      const timer = setTimeout(() => {
        removeFeedback(id);
      }, life);
      timers.current.set(id, timer);

      return id;
    },
    [removeFeedback],
  );

  useEffect(() => {
    const timerMap = timers.current;

    return () => {
      timerMap.forEach((timer) => clearTimeout(timer));
      timerMap.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      latestItem: items[items.length - 1] ?? null,
      pushFeedback,
      removeFeedback,
    }),
    [items, pushFeedback, removeFeedback],
  );

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function AdminFeedbackRail() {
  const { latestItem, removeFeedback } = useAdminFeedback();

  if (!latestItem) {
    return null;
  }

  return (
    <div aria-atomic="true" aria-live="polite" className="admin-feedback-rail" role="status">
      <div className={`admin-feedback-toast is-${latestItem.tone}`}>
        <div className={`admin-feedback-pill is-${latestItem.tone}`}>{toneLabel(latestItem.tone)}</div>
        <div className="admin-feedback-copy">
          <strong>{latestItem.title}</strong>
          {latestItem.description ? <p className="admin-subtle">{latestItem.description}</p> : null}
        </div>
        <div className="admin-feedback-meta">
          <button
            aria-label="关闭提示"
            className="admin-feedback-close"
            onClick={() => removeFeedback(latestItem.id)}
            type="button"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export function useAdminFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error("useAdminFeedback must be used within AdminFeedbackProvider.");
  }

  return context;
}
