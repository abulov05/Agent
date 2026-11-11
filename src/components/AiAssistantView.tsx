import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Mic, MicOff, Copy, Check, Trash2, Sparkles, User, CornerDownLeft } from 'lucide-react';
import { AiChatMessage } from '../types';
import { askAiMaryam } from '../services/api';

export function AiAssistantView() {
  const [messages, setMessages] = useState<AiChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('aa_ai_chat');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Здравствуйте! Я **Марыям** — аналитический ассистент AGENT ANALYTICS. 

Помогаю в проведении OSINT-исследований, деанонимизации телефонных номеров, анализе активности в Telegram и проверке по утечкам. 

Чем я могу помочь вам прямо сейчас?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<any>(null);

  useEffect(() => {
    try {
      localStorage.setItem('aa_ai_chat', JSON.stringify(messages));
    } catch (e) {}
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: AiChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await askAiMaryam(text, messages.map((m) => ({ role: m.role, content: m.content })));
      const assistantMsg: AiChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: 'Извините, произошла ошибка соединения. Попробуйте еще раз через мгновение.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Голосовой ввод не поддерживается вашим браузером");
      return;
    }

    if (isRecording) {
      speechRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ru-RU';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => {
        setIsRecording(false);
      };

      speechRef.current = recognition;
      recognition.start();
    } catch (e) {
      setIsRecording(false);
    }
  };

  const clearChat = () => {
    if (confirm("Очистить историю диалога с Марыям?")) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Диалог очищен. Задайте новый вопрос или выберите подсказку ниже.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      localStorage.removeItem('aa_ai_chat');
    }
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    'Как пробить номер телефона?',
    'Что входит в подписку?',
    'Как купить API токены?',
    'Расскажи о возможностях бота',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-175px)] max-w-3xl mx-auto animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">Марыям AI</h2>
              <span className="text-[10px] font-mono uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold">
                Online
              </span>
            </div>
            <p className="text-xs text-slate-400">Нейросетевой OSINT-аналитик & консультант</p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
          title="Очистить переписку"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center text-xs shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`relative max-w-[85%] group`}>
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-sm shadow-lg shadow-blue-600/10'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm shadow-md'
                  }`}
                >
                  <div
                    className="space-y-1.5 break-words"
                    dangerouslySetInnerHTML={{
                      __html: m.content
                        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                        .replace(/\*(.*?)\*/g, '<i>$1</i>')
                        .replace(/`(.*?)`/g, '<code class="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[11px]">$1</code>')
                        .replace(/\n/g, '<br />'),
                    }}
                  />
                </div>

                <div
                  className={`flex items-center gap-2 text-[10px] text-slate-500 mt-1 px-1 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => copyText(m.id, m.content)}
                      className="opacity-0 group-hover:opacity-100 hover:text-slate-300 transition-opacity"
                      title="Скопировать"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3 h-3 text-emerald-400 inline" />
                      ) : (
                        <Copy className="w-3 h-3 inline" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 flex items-center justify-center text-xs shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center text-xs shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse [animation-delay:200ms]" />
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse [animation-delay:400ms]" />
              <span className="font-mono text-[11px] ml-1">Марыям формулирует ответ...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 text-[11px]">
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>{p}</span>
          </button>
        ))}
      </div>

      {/* Input Composer */}
      <div className="pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center gap-2 bg-slate-900 border border-slate-800 focus-within:border-purple-500/50 rounded-2xl p-1.5 transition-colors shadow-lg"
        >
          <button
            type="button"
            onClick={toggleVoice}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title={isRecording ? 'Остановить запись' : 'Голосовой ввод'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRecording ? 'Слушаю вас...' : 'Задайте вопрос Марыям...'}
            className="flex-1 bg-transparent px-2 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0 shadow-md shadow-purple-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
