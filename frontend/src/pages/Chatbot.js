import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { chatbotAPI } from '../lib/api';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Bot, User, Award, Info } from 'lucide-react';

const Chatbot = () => {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Initial greeting
  useEffect(() => {
    const getGreeting = () => {
      switch (user?.skill_level) {
        case 'beginner':
          return "Hallo! I'm **Lekker AI**, your friendly Afrikaans tutor. I'm here to help you start your journey. We can learn simple words like **dankie** (thank you) or practice basic greetings. What would you like to learn first?";
        case 'intermediate':
          return "Hallo! Hoe gaan dit? I'm **Lekker AI**. I'm excited to help you level up your Afrikaans. Let's have a conversation - you can mix in some Afrikaans words, and I'll help you with any mistakes!";
        case 'pro':
          return "Goeie dag! Ek is **Lekker AI**. Dit is 'n voorreg om met 'n gevorderde student soos jy te gesels. Waaroor wil jy vandag in Afrikaans gesels? Ek kan jou help om jou uitspraak en grammatika te vervolmaak.";
        default:
          return "Hallo! I'm **Lekker AI**, your Afrikaans tutor. How can I help you today?";
      }
    };

    setMessages([{
      role: 'assistant',
      content: getGreeting()
    }]);
  }, [user?.skill_level]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatbotAPI.sendMessage({
        message: input.trim(),
        skill_level: user?.skill_level || 'beginner'
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response
      }]);

      if (response.data.badges_earned?.length > 0) {
        await refreshUser();
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        error: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedPrompts = {
    beginner: [
      "How do I say 'hello' in Afrikaans?",
      "Teach me some numbers",
      "What does 'dankie' mean?"
    ],
    intermediate: [
      "Hoe gaan dit met jou?",
      "Help me order food at a restaurant",
      "Explain when to use 'is' vs 'het'"
    ],
    pro: [
      "Vertel my van die Afrikaanse kultuur",
      "Wat is 'n idioom in Afrikaans?",
      "Laat ons oor politiek praat"
    ]
  };

  const prompts = suggestedPrompts[user?.skill_level] || suggestedPrompts.beginner;

  return (
    <Layout>
      <div className="h-[calc(100vh-12rem)] flex flex-col" data-testid="chatbot-page">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold">{t('chatbot')}</h1>
          <p className="text-muted-foreground text-sm">{t('chatbotIntro')}</p>
        </div>

        {/* Skill Level Indicator */}
        <div className="mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Level: <span className="text-foreground font-medium capitalize">{user?.skill_level}</span>
          </span>
        </div>

        {/* Chat Area */}
        <div className="flex-1 glass-card p-4 mb-4 flex flex-col">
          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
            <div className="space-y-4 pb-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${
                    msg.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-orange-500/20'
                      : 'bg-teal-500/20'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-5 h-5 text-orange-500" />
                    ) : (
                      <Bot className="w-5 h-5 text-teal-500" />
                    )}
                  </div>
                  <div className={`max-w-[75%] p-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-orange-500/20 rounded-tr-sm'
                      : msg.error
                        ? 'bg-red-500/10 border border-red-500/20 rounded-tl-sm'
                        : 'bg-muted/50 rounded-tl-sm'
                  }`}>
                    <p className="text-sm md:text-base whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-teal-500" />
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/50 rounded-tl-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Suggested Prompts */}
          {messages.length <= 1 && (
            <div className="pt-4 border-t border-white/5">
              <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {prompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(prompt)}
                    data-testid={`suggested-prompt-${idx}`}
                    className="text-xs px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex items-center gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('typeMessage')}
            disabled={loading}
            data-testid="chatbot-input"
            className="h-12 bg-muted/50 border-white/10 rounded-xl"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            data-testid="chatbot-send-btn"
            className="h-12 w-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-black"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Chatbot;
