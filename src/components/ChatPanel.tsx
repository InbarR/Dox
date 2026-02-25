import React, { useState, useRef, useEffect } from 'react';
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
    whiteSpace: 'pre-wrap',
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const docs = useDocStore((s) => s.docs);
  const selectedDocId = useDocStore((s) => s.selectedDocId);
  const selectedDoc = docs.find((d) => d.id === selectedDocId);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function buildSystemMessage(): string {
    const docListSummary = docs
      .map((d) => `- "${d.title}" (${TYPE_LABELS[d.type]}, ${SOURCE_LABELS[d.source]}${d.sharedBy ? `, by ${d.sharedBy}` : ''}${d.status !== 'new' ? `, status: ${d.status}` : ''}${d.openIn ? `, open in ${d.openIn}` : ''})`)
      .join('\n');

    let context = `You are Dox AI, an assistant built into the Dox document tracker app. You help users manage and understand their documents.

The user has ${docs.length} documents tracked:
${docListSummary}
`;

    if (selectedDoc) {
      context += `
The user currently has selected: "${selectedDoc.title}"
- Type: ${TYPE_LABELS[selectedDoc.type]}
- Source: ${SOURCE_LABELS[selectedDoc.source]}
- URL: ${selectedDoc.url || 'none'}
${selectedDoc.sharedBy ? `- Owner: ${selectedDoc.sharedBy}` : ''}
${selectedDoc.notes ? `- Notes: ${selectedDoc.notes}` : ''}
${selectedDoc.tags.length ? `- Tags: ${selectedDoc.tags.join(', ')}` : ''}
${selectedDoc.status !== 'new' ? `- Status: ${selectedDoc.status}` : ''}
${selectedDoc.openIn ? `- Currently open in: ${selectedDoc.openIn}` : ''}
`;
    }

    context += `
Be concise and helpful. If the user asks about a document, reference it by name. You can help with:
- Summarizing what documents are about (based on titles and context)
- Finding documents by topic, person, or type
- Suggesting which documents to prioritize
- Answering questions about the document list`;

    return context;
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || streaming) return;

    setInput('');
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    // Build full message history with system context
    const apiMessages = [
      { role: 'system', content: buildSystemMessage() },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: text },
    ];

    // Set up streaming listeners
    let assistantText = '';
    const removeChunk = window.docshelf.onChatChunk((chunk) => {
      assistantText += chunk;
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === 'assistant') {
          updated[updated.length - 1] = { ...last, content: assistantText };
        } else {
          updated.push({ role: 'assistant', content: assistantText });
        }
        return updated;
      });
    });

    const removeDone = window.docshelf.onChatDone(() => {
      setStreaming(false);
      removeChunk();
      removeDone();
    });

    const result = await window.docshelf.chatSend(apiMessages);
    if (result.error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${result.error}` },
      ]);
      setStreaming(false);
      removeChunk();
      removeDone();
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Text weight="semibold" size={300}>
          Dox AI
        </Text>
        <Button
          appearance="subtle"
          size="small"
          icon={<Dismiss24Regular />}
          onClick={onClose}
        />
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
            Try: "What docs need my attention?" or "Summarize my PowerPoint docs"
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
              {msg.content}
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
