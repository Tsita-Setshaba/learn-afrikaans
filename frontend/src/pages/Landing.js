import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Sparkles, Volume2, MessageSquare, Trophy, ArrowRight, ChevronRight } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const features = [
    {
      icon: Sparkles,
      title: t('feature1Title'),
      description: t('feature1Desc'),
      color: 'text-orange-500',
    },
    {
      icon: Volume2,
      title: t('feature2Title'),
      description: t('feature2Desc'),
      color: 'text-teal-500',
    },
    {
      icon: MessageSquare,
      title: t('feature3Title'),
      description: t('feature3Desc'),
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden noise-overlay">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl" />

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">LA</span>
            </div>
            <span className="font-bold text-xl tracking-tight">LearnAfrikaans</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              data-testid="landing-login-btn"
              className="text-muted-foreground hover:text-foreground"
            >
              {t('login')}
            </Button>
            <Button
              onClick={() => navigate('/register')}
              data-testid="landing-register-btn"
              className="rounded-full px-6 bg-orange-500 hover:bg-orange-600 text-black font-semibold glow-primary"
            >
              {t('getStarted')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-6 pt-16 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none">
                  <span className="block">{t('heroTitle')}</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-teal-500">
                    {t('heroSubtitle')}
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                  {t('heroDescription')}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate('/register')}
                  data-testid="hero-get-started-btn"
                  className="rounded-full px-8 py-6 text-lg font-bold bg-orange-500 hover:bg-orange-600 text-black glow-primary hover:scale-105 transition-all"
                >
                  {t('getStarted')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/login')}
                  data-testid="hero-login-btn"
                  className="rounded-full px-8 py-6 text-lg font-medium border-white/10 hover:bg-white/5"
                >
                  {t('login')}
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-orange-500">1000+</div>
                  <div className="text-sm text-muted-foreground">Vocabulary Words</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-teal-500">AI</div>
                  <div className="text-sm text-muted-foreground">Powered Learning</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-500">Free</div>
                  <div className="text-sm text-muted-foreground">To Get Started</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative animate-fade-in stagger-2">
              <div className="relative rounded-3xl overflow-hidden glass-card p-2">
                <img
                  src="https://images.unsplash.com/photo-1530187589563-1ff5b061d4f9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHw0fHxTb3V0aCUyMEFmcmljYSUyMGxhbmRzY2FwZSUyMGRyYW1hdGljJTIwbGlnaHRpbmd8ZW58MHx8fHwxNzczNDMyNjQxfDA&ixlib=rb-4.1.0&q=85"
                  alt="South African landscape"
                  className="w-full h-[400px] object-cover rounded-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl" />
                
                {/* Floating card */}
                <div className="absolute bottom-6 left-6 right-6 glass rounded-2xl p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <div className="font-semibold">Join the Leaderboard</div>
                      <div className="text-sm text-muted-foreground">Compete with other learners</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl" />
            </div>
          </div>

          {/* Features */}
          <div className="mt-32 grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`glass-card p-8 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 animate-slide-up stagger-${index + 1}`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-6 ${feature.color}`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          Built for South Africans, by South Africans.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
