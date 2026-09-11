import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  FileCode2,
  FolderSearch,
  GitBranch,
  Menu,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  SquareTerminal,
  WandSparkles,
  X,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./components/ui/tooltip";
import { ChatMessage, mockResponse, starters, ToolStep } from "./mock";

declare const acquireVsCodeApi:
  | undefined
  | (() => { postMessage(message: unknown): void });
const vscode =
  typeof acquireVsCodeApi === "function"
    ? acquireVsCodeApi()
    : { postMessage: (_: unknown) => {} };

function ToolRow({ step }: { step: ToolStep }) {
  const [open, setOpen] = useState(false);
  const Icon =
    step.icon === "edit"
      ? FileCode2
      : step.icon === "terminal"
        ? SquareTerminal
        : Search;
  return (
    <button className="tool-row" onClick={() => setOpen(!open)}>
      <span className="tool-main">
        <Icon size={14} />
        <span>{step.title}</span>
        <Check size={13} className="tool-check" />
      </span>
      {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}{" "}
      {open && <span className="tool-detail">{step.detail}</span>}
    </button>
  );
}

function AssistantMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="assistant-message">
      {message.steps && (
        <div className="steps">
          {message.steps.map((s, i) => (
            <ToolRow key={i} step={s} />
          ))}
        </div>
      )}
      <p>{message.text}</p>
      {message.code && (
        <div className="code-block">
          <div className="code-head">
            <span>tsx</span>
            <button
              onClick={() =>
                vscode.postMessage({ type: "insertText", text: message.code })
              }
            >
              <Code2 size={12} /> Insert
            </button>
          </div>
          <pre>{message.code}</pre>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(
    () => end.current?.scrollIntoView({ behavior: "smooth" }),
    [messages, busy],
  );
  useEffect(() => {
    const listener = (e: MessageEvent) =>
      e.data.type === "newChat" && (setMessages([]), setInput(""));
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  const send = (raw?: string) => {
    const prompt = (raw ?? input).trim();
    if (!prompt || busy) return;
    setInput("");
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", text: prompt },
    ]);
    setBusy(true);
    window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), ...mockResponse(prompt) },
      ]);
      setBusy(false);
    }, 850);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    send();
  };
  const keydown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <main className="app-shell">
      <header>
        <div className="brand">
          <span className="brand-mark">
            <WandSparkles size={14} />
          </span>
          <span>Ateliers</span>
        </div>
        <div className="header-actions">
          <Tooltip>
            <TooltipTrigger
              render={<Button variant="ghost" size="icon" onClick={() => setMessages([])} />}
            >
              <Plus size={16} />
            </TooltipTrigger>
            <TooltipContent>New chat</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon">
            <Menu size={16} />
          </Button>
        </div>
      </header>
      <section className="conversation">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <WandSparkles size={24} />
            </div>
            <h1>What can I help you build?</h1>
            <p>Ask about your code, plan a feature, or make a change.</p>
            <div className="starters">
              {starters.map((s, i) => (
                <button key={s} onClick={() => send(s)}>
                  {i === 0 ? (
                    <FolderSearch />
                  ) : i === 1 ? (
                    <WandSparkles />
                  ) : (
                    <Code2 />
                  )}
                  <span>{s}</span>
                  <ChevronRight />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="user-message">
                  {m.text}
                </div>
              ) : (
                <AssistantMessage key={m.id} message={m} />
              ),
            )}
            {busy && (
              <div className="thinking">
                <span />
                <span />
                <span /> Thinking
              </div>
            )}
            <div ref={end} />
          </div>
        )}
      </section>
      <footer>
        <form className="composer" onSubmit={submit}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={keydown}
            placeholder="Ask Atelier…"
            rows={1}
          />
          <div className="composer-bar">
            <div className="composer-tools">
              <Tooltip>
                <TooltipTrigger render={<Button type="button" variant="ghost" size="icon" />}>
                  <Paperclip size={16} />
                </TooltipTrigger>
                <TooltipContent>Add context</TooltipContent>
              </Tooltip>
              <button type="button" className="context-pill">
                <span>@</span> Add context
              </button>
            </div>
            <Button
              className="send"
              size="icon"
              disabled={!input.trim() || busy}
            >
              <Send size={14} />
            </Button>
          </div>
        </form>
        <div className="statusbar">
          <div className="model-wrap">
            <button onClick={() => setModelOpen(!modelOpen)} className="model">
              <span className="model-dot" />
              Sonnet 4.5
              <ChevronDown size={12} />
            </button>
            {modelOpen && (
              <div className="model-menu">
                <button>
                  <span>
                    <b>Sonnet 4.5</b>
                    <small>Balanced · mocked</small>
                  </span>
                  <Check size={14} />
                </button>
                <button>
                  <span>
                    <b>Opus 4.1</b>
                    <small>Most capable · mocked</small>
                  </span>
                </button>
              </div>
            )}
          </div>
          <span className="branch">
            <GitBranch size={12} /> main
          </span>
          <button className="more">
            <MoreHorizontal size={15} />
          </button>
        </div>
      </footer>
    </main>
  );
}
