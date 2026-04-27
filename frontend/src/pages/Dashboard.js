import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dashboardAPI, usersAPI } from '../lib/api';
import { speak, getSpeechRate } from '../lib/speech';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Flame, Trophy, Target, Volume2, ArrowRight, Star,
  BookOpen, MessageSquare, Award, TrendingUp, Loader2
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [speakingWord, setSpeakingWord] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Update streak on dashboard visit
        await usersAPI.updateStreak();
        const response = await dashboardAPI.get();
        setData(response.data);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSpeakWord = async (text) => {
    setSpeakingWord(true);
    try {
      await speak(text, 'af-ZA', getSpeechRate(user?.skill_level));
    } catch (error) {
      console.error('Speech error:', error);
    } finally {
      setSpeakingWord(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </Layout>
    );
  }

  const { word_of_day, recommended_topic, progress, recent_quizzes, rank, badges } = data || {};

  // Calculate overall confidence
  const avgConfidence = progress?.length
    ? Math.round(progress.reduce((acc, p) => acc + (p.confidence_score || 0), 0) / progress.length)
    : 0;

  return (
    <Layout>
      <div className="space-y-8" data-testid="dashboard-page">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">
              {t('welcome')}, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground mt-1">Ready to learn some Afrikaans today?</p>
          </div>
        </div>

        {/* Stats Grid - Bento Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          {/* Streak Card - Large */}
          <div className="md:col-span-2 glass-card p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                  <Flame className="w-8 h-8 text-orange-500 fire-icon" />
                </div>
                <div>
                  <div className="text-5xl font-bold">{data?.user?.streak || 0}</div>
                  <div className="text-muted-foreground">{t('streak')}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {data?.user?.streak >= 7 ? 'Amazing streak! Keep it going!' : 'Practice daily to build your streak!'}
              </p>
            </div>
          </div>

          {/* Points Card */}
          <div className="glass-card p-6 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-teal-500" />
            </div>
            <div>
              <div className="text-3xl font-bold">{data?.user?.total_points || 0}</div>
              <div className="text-sm text-muted-foreground">{t('points')}</div>
            </div>
          </div>

          {/* Rank Card */}
          <div className="glass-card p-6 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <div className="text-3xl font-bold">#{rank || '-'}</div>
              <div className="text-sm text-muted-foreground">{t('rank')}</div>
            </div>
          </div>

          {/* Word of the Day - Wide */}
          <div className="md:col-span-2 glass-card p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t('wordOfDay')}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSpeakWord(word_of_day?.afrikaans)}
                disabled={speakingWord}
                data-testid="word-of-day-speak-btn"
                className="rounded-full hover:bg-orange-500/20"
              >
                <Volume2 className={`w-5 h-5 ${speakingWord ? 'text-orange-500' : ''}`} />
              </Button>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-orange-500">{word_of_day?.afrikaans}</div>
              <div className="text-lg text-foreground">{word_of_day?.english}</div>
              {user?.interface_language === 'nso' && (
                <div className="text-sm text-teal-500">{word_of_day?.sepedi}</div>
              )}
              <div className="text-sm text-muted-foreground italic mt-2">"{word_of_day?.example}"</div>
              {word_of_day?.fun_fact && (
                <div className="text-xs text-muted-foreground/60 mt-2">{word_of_day?.fun_fact}</div>
              )}
            </div>
          </div>

          {/* Progress Overview */}
          <div className="md:col-span-2 glass-card p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{t('yourProgress')}</h3>
              <div className="text-2xl font-bold text-teal-500">{avgConfidence}%</div>
            </div>
            <Progress value={avgConfidence} className="h-3 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {progress?.slice(0, 4).map((p) => (
                <div key={p.topic_id} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground truncate">{p.topic_name}</span>
                  <span className="text-sm font-medium">{p.confidence_score}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Lesson */}
          {recommended_topic && (
            <div className="md:col-span-2 glass-card p-6 md:p-8 group hover:border-orange-500/30 transition-all cursor-pointer"
                 onClick={() => navigate(`/lessons/${recommended_topic.topic_id}`)}
                 data-testid="recommended-lesson-card">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                  <Target className="w-7 h-7 text-orange-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground mb-1">{t('recommended')}</div>
                  <div className="text-xl font-semibold">{recommended_topic.topic_name}</div>
                  <div className="text-sm text-muted-foreground">Confidence: {recommended_topic.confidence_score}%</div>
                </div>
                <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          )}

          {/* Badges Preview */}
          <div className="md:col-span-2 glass-card p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t('badges')}</h3>
              <span className="text-sm text-muted-foreground">
                {data?.user?.badges?.length || 0} earned
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(badges || {}).slice(0, 6).map(([id, badge]) => {
                const earned = data?.user?.badges?.includes(id);
                return (
                  <div
                    key={id}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      earned ? 'bg-orange-500/20' : 'bg-muted/30'
                    }`}
                    title={badge.name?.en}
                  >
                    <Award className={`w-6 h-6 ${earned ? 'text-orange-500' : 'text-muted-foreground/30'}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => navigate('/lessons')}
            data-testid="dashboard-lessons-btn"
            className="h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 hover:border-orange-500/40 text-foreground flex items-center justify-center gap-4"
          >
            <BookOpen className="w-6 h-6 text-orange-500" />
            <span className="text-lg font-medium">{t('lessons')}</span>
          </Button>
          <Button
            onClick={() => navigate('/chatbot')}
            data-testid="dashboard-chatbot-btn"
            className="h-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-600/10 border border-teal-500/20 hover:border-teal-500/40 text-foreground flex items-center justify-center gap-4"
          >
            <MessageSquare className="w-6 h-6 text-teal-500" />
            <span className="text-lg font-medium">{t('chatbot')}</span>
          </Button>
          <Button
            onClick={() => navigate('/leaderboard')}
            data-testid="dashboard-leaderboard-btn"
            className="h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 hover:border-purple-500/40 text-foreground flex items-center justify-center gap-4"
          >
            <TrendingUp className="w-6 h-6 text-purple-500" />
            <span className="text-lg font-medium">{t('leaderboard')}</span>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
