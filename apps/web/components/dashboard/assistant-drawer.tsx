'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { ease } from '../../lib/motion';

const PROMPTS = [
  'Summarize this sprint for standup',
  'Draft a reply to an open escalation',
  'Triage new issues by priority',
];

// This app has no LLM/assistant backend wired up — the drawer is a real,
// working chat UI, but every reply is this one canned message rather than a
// fabricated "smart" response.
const CANNED_REPLY =
  'This AI Assistant is a preview built for this project. Purchase a plan to unlock full functionality.';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

export function AssistantDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);

  function send(text: string) {
    const t = text.trim();
    if (!t || thinking) return;
    const userMsg: Message = { id: Date.now(), role: 'user', text: t };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [...m, { id: Date.now() + 1, role: 'assistant', text: CANNED_REPLY }]);
      setThinking(false);
    }, 550);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-zinc-900/15"
          />
          <motion.div
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ duration: 0.22, ease }}
            className="fixed inset-y-0 right-0 z-50 flex w-[380px] max-w-[90vw] flex-col border-l border-edge bg-panel shadow-[-16px_0_40px_-20px_rgba(16,24,40,0.25)]"
          >
            <div className="flex items-center justify-between border-b border-edge px-5 py-[18px]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-brand">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                  </svg>
                </span>
                <span className="text-[14px] font-semibold text-zinc-900">Assistant</span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-elevated hover:text-zinc-700"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-5">
              <div className="rounded-2xl bg-elevated px-3.5 py-3.5 text-[12.5px] leading-relaxed text-zinc-700">
                Hi — I can summarize your sprint, draft standup notes, or triage new issues. What do
                you need?
              </div>

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.role === 'user'
                      ? 'ml-6 rounded-2xl bg-brand px-3.5 py-3 text-[12.5px] leading-relaxed text-white'
                      : 'mr-2 rounded-2xl bg-elevated px-3.5 py-3 text-[12.5px] leading-relaxed text-zinc-700'
                  }
                >
                  {m.text}
                </div>
              ))}

              {thinking && (
                <div className="mr-2 flex items-center gap-1.5 rounded-2xl bg-elevated px-3.5 py-3">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-zinc-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              )}

              {messages.length === 0 && (
                <div className="flex flex-col gap-2">
                  {PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="rounded-xl border border-edge bg-panel px-3 py-2.5 text-left text-[12.5px] text-zinc-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-edge p-4">
              <div className="flex items-center gap-2 rounded-xl border border-edge bg-elevated/40 py-2 pl-3.5 pr-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') send(input);
                  }}
                  placeholder="Ask the assistant…"
                  className="flex-1 border-none bg-transparent text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400"
                />
                <button
                  onClick={() => send(input)}
                  aria-label="Send"
                  className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-brand text-white transition-opacity hover:opacity-90"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
