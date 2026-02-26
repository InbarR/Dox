import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  makeStyles,
  tokens,
  Input,
  Button,
  Text,
  Spinner,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  Send24Regular,
  ArrowReset24Regular,
} from '@fluentui/react-icons';
import { useDocStore } from '../store/useDocStore';
import { SOURCE_LABELS, TYPE_LABELS } from '../types';

const useStyles = makeStyles({
  panel: {
    width: '380px',
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    flexShrink: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '4px',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  msg: {
    maxWidth: '90%',
    padding: '8px 12px',
    borderRadius: '10px',
    fontSize: '13px',
    lineHeight: '1.5',
    wordBreak: 'break-word',
  },
  userMsg: {
    alignSelf: 'flex-end',
    backgroundColor: '#1a3a5c',
    color: '#e0e0e0',
    borderBottomRightRadius: '2px',
  },
  assistantMsg: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.colorNeutralBackground4,
    color: tokens.colorNeutralForeground1,
    borderBottomLeftRadius: '2px',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    borderTop: `1px solid ${tokens.colorNeutralStroke3}`,
    flexShrink: 0,
  },
  inputBox: {
    flex: 1,
  },
  context: {
    padding: '6px 12px',
    fontSize: '11px',
    color: tokens.colorNeutralForeground4,
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    flexShrink: 0,
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: tokens.colorNeutralForeground4,
    padding: '24px',
    textAlign: 'center',
  },
  docLink: {
    color: '#6CB4EE',
    cursor: 'pointer',
    fontWeight: 700,
    ':hover': {
      color: '#9DD0FF',
      textDecoration: 'underline',
    },
  },
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  onClose: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const styles = useStyles();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const docs = useDocStore((s) => s.docs);
  const selectedDocId = useDocStore((s) => s.selectedDocId);
  const setSelectedDocId = useDocStore((s) => s.setSelectedDocId);
  const setSearchQuery = useDocStore((s) => s.setSearchQuery);
  const selectedDoc = docs.find((d) => d.id === selectedDocId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const findDocByText = useCallback(
    (text: string) => {
      const clean = text.replace(/[*"']/g, '').trim().toLowerCase();
      if (!clean) return undefined;
      return docs.find((d) => {
        const t = d.title.toLowerCase();
        return t === clean || clean.includes(t) || t.includes(clean);
      });
    },
    [docs]
  );

  const handleDocClick = useCallback(
    (title: string) => {
      const doc = findDocByText(title);
      if (doc) {
        setSelectedDocId(doc.id);
        setTimeout(() => {
          const el = document.querySelector(`[data-doc-id="${doc.id}"]`);
          el?.scrollIntoView({ block: 'nearest' });
        }, 0);
      } else {
        setSearchQuery(title.replace(/[*"]/g, '').trim());
      }
    },
    [findDocByText, setSelectedDocId, setSearchQuery]
  );

  /** Simple markdown renderer: handles **bold**, lists, paragraphs */
  const renderMarkdown = useCallback(
    (content: string) => {
      const lines = content.split('\n');
      const elements: React.ReactNode[] = [];
      let listItems: React.ReactNode[] = [];
      let listType: 'ul' | 'ol' | null = null;

      const flushList = () => {
        if (listItems.length > 0) {
          const Tag = listType === 'ol' ? 'ol' : 'ul';
          elements.push(
            <Tag key={`list-${elements.length}`} style={{ margin: '4px 0', paddingLeft: '18px' }}>
              {listItems}
            </Tag>
          );
          listItems = [];
          listType = null;
        }
      };

      const renderInline = (text: string): React.ReactNode[] => {
        // Split on **bold** patterns
        const parts: React.ReactNode[] = [];
        const regex = /\*\*([^*]+)\*\*/g;
        let lastIndex = 0;
        let match;
        while ((match = regex.exec(text)) !== null) {
          if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
          }
          const boldText = match[1];
          const doc = findDocByText(boldText);
          if (doc) {
            parts.push(
              <span
                key={`bold-${match.index}`}
                className={styles.docLink}
                onClick={() => handleDocClick(boldText)}
                title={`Click to select "${doc.title}"`}
              >
                {boldText}
              </span>
            );
          } else {
            parts.push(<strong key={`bold-${match.index}`}>{boldText}</strong>);
          }
          lastIndex = regex.lastIndex;
        }
        if (lastIndex < text.length) {
          parts.push(text.slice(lastIndex));
        }
        return parts;
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Ordered list: "1. text" or "2. text"
        const olMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
        if (olMatch) {
          if (listType !== 'ol') flushList();
          listType = 'ol';
          listItems.push(<li key={`li-${i}`} style={{ margin: '2px 0' }}>{renderInline(olMatch[2])}</li>);
          continue;
        }

        // Unordered list: "- text" or "* text"
        const ulMatch = trimmed.match(/^[-*]\s+(.+)/);
        if (ulMatch) {
          if (listType !== 'ul') flushList();
          listType = 'ul';
          listItems.push(<li key={`li-${i}`} style={{ margin: '2px 0' }}>{renderInline(ulMatch[1])}</li>);
          continue;
        }

        flushList();

        if (!trimmed) continue; // skip empty lines

        elements.push(
          <p key={`p-${i}`} style={{ margin: '4px 0' }}>
            {renderInline(trimmed)}
          </p>
        );
      }

      flushList();
      return <>{elements}</>;
    },
    [findDocByText, handleDocClick, styles.docLink]
  );

  function buildSystemMessage(): string {
    const docListSummary = docs
      .map(
        (d) =>
          `- "${d.title}" (${TYPE_LABELS[d.type]}, ${SOURCE_LABELS[d.source]}${d.sharedBy ? `, by ${d.sharedBy}` : ''}${d.status !== 'new' ? `, status: ${d.status}` : ''}${d.openIn ? `, open in ${d.openIn}` : ''}${d.category ? `, category: ${d.category}` : ''})`
      )
      .join('\n');

    let context = `You are Dox AI, an assistant built into the Dox document tracker app.

The user has ${docs.length} documents:
${docListSummary}
`;

    if (selectedDoc) {
      context += `
Currently selected: "${selectedDoc.title}"
- Type: ${TYPE_LABELS[selectedDoc.type]}, Source: ${SOURCE_LABELS[selectedDoc.source]}
- URL: ${selectedDoc.url || 'none'}
${selectedDoc.sharedBy ? `- Owner: ${selectedDoc.sharedBy}` : ''}
${selectedDoc.notes ? `- Notes: ${selectedDoc.notes}` : ''}
${selectedDoc.tags.length ? `- Tags: ${selectedDoc.tags.join(', ')}` : ''}
${selectedDoc.category ? `- Category: ${selectedDoc.category}` : ''}
`;
    }

    context += `
IMPORTANT: When listing documents, wrap each document title in **bold** so they become clickable links in the UI.
Be concise. Help find, summarize, and manage documents.`;

    return context;
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || streaming) return;

    setInput('');
    setPromptHistory((prev) => [text, ...prev]);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setStreaming(true);

    const apiMessages = [
      { role: 'system', content: buildSystemMessage() },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: text },
    ];

    const result = await window.docshelf.chatSend(apiMessages);
    if (result.error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${result.error}` }]);
    } else if (result.reply) {
      setMessages((prev) => [...prev, { role: 'assistant', content: result.reply! }]);

      // Auto-filter the doc list to show mentioned docs
      const mentioned: string[] = [];
      const boldRegex = /\*\*([^*]+)\*\*/g;
      let m;
      while ((m = boldRegex.exec(result.reply)) !== null) {
        const doc = findDocByText(m[1]);
        if (doc) mentioned.push(doc.id);
      }
      if (mentioned.length > 0) {
        // Build a search query that matches the mentioned docs
        const titles = mentioned
          .map((id) => docs.find((d) => d.id === id)?.title)
          .filter(Boolean);
        if (titles.length === 1) {
          setSearchQuery(titles[0]!);
        } else if (titles.length > 1) {
          // Find a common substring or use the first few words of the query
          setSearchQuery(text);
        }
      }
    }
    setStreaming(false);
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Text weight="semibold" size={300}>
          Dox AI
        </Text>
        <div className={styles.headerActions}>
          {messages.length > 0 && (
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowReset24Regular />}
              onClick={() => setMessages([])}
              title="New session"
            />
          )}
          <Button
            appearance="subtle"
            size="small"
            icon={<Dismiss24Regular />}
            onClick={onClose}
          />
        </div>
      </div>

      {selectedDoc && (
        <div className={styles.context}>
          Context: <strong>{selectedDoc.title}</strong>
        </div>
      )}

      {messages.length === 0 ? (
        <div className={styles.empty}>
          <Text size={400} weight="semibold">Ask me anything</Text>
          <Text size={200}>
            I can see all {docs.length} of your documents.
            {selectedDoc && ` Currently looking at "${selectedDoc.title}".`}
          </Text>
          <Text size={200} style={{ marginTop: '8px', color: '#888' }}>
            Try: "find docs about triage" or "what PPTs do I have?"
          </Text>
        </div>
      ) : (
        <div className={styles.messages}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`${styles.msg} ${
                msg.role === 'user' ? styles.userMsg : styles.assistantMsg
              }`}
            >
              {msg.role === 'user' ? msg.content : renderMarkdown(msg.content)}
            </div>
          ))}
          {streaming && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className={`${styles.msg} ${styles.assistantMsg}`}>
              <Spinner size="tiny" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className={styles.inputRow}>
        <Input
          className={styles.inputBox}
          placeholder="Ask about your docs..."
          value={input}
          onChange={(_, data) => setInput(data.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
              setHistoryIdx(-1);
            }
            if (e.key === 'ArrowUp') {
              if (promptHistory.length === 0) return;
              e.preventDefault();
              const newIdx = historyIdx < promptHistory.length - 1 ? historyIdx + 1 : historyIdx;
              setHistoryIdx(newIdx);
              setInput(promptHistory[newIdx]);
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (historyIdx <= 0) {
                setHistoryIdx(-1);
                setInput('');
              } else {
                const newIdx = historyIdx - 1;
                setHistoryIdx(newIdx);
                setInput(promptHistory[newIdx]);
              }
            }
          }}
          appearance="filled-darker"
          disabled={streaming}
        />
        <Button
          appearance="primary"
          icon={<Send24Regular />}
          onClick={handleSend}
          disabled={streaming || !input.trim()}
        />
      </div>
    </div>
  );
}
