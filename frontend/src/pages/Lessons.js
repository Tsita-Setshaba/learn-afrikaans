import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { lessonsAPI } from '../lib/api';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, ChevronRight, Loader2, Lock } from 'lucide-react';

const Lessons = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await lessonsAPI.getTopics();
        setTopics(response.data);
      } catch (error) {
        console.error('Topics fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-500 bg-green-500/20';
      case 'intermediate': return 'text-yellow-500 bg-yellow-500/20';
      case 'pro': return 'text-red-500 bg-red-500/20';
      default: return 'text-muted-foreground bg-muted';
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

  return (
    <Layout>
      <div className="space-y-8" data-testid="lessons-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{t('lessons')}</h1>
          <p className="text-muted-foreground mt-1">Choose a topic to start learning</p>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {topics.map((topic) => {
            const confidence = topic.progress?.confidence_score || 0;
            const lessonsCompleted = topic.progress?.lessons_completed || 0;

            return (
              <div
                key={topic.id}
                className="glass-card p-6 group hover:border-orange-500/30 transition-all cursor-pointer"
                onClick={() => navigate(`/lessons/${topic.id}`)}
                data-testid={`lesson-topic-${topic.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                    <BookOpen className="w-7 h-7 text-orange-500" />
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getDifficultyColor(topic.difficulty)}`}>
                    {topic.difficulty}
                  </span>
                </div>

                <h3 className="text-xl font-semibold mb-2">{topic.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{topic.description}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{topic.word_count} {t('words')}</span>
                    <span className="font-medium text-teal-500">{confidence}%</span>
                  </div>
                  <Progress value={confidence} className="h-2" />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {lessonsCompleted > 0 ? `${lessonsCompleted}x ${t('completed').toLowerCase()}` : 'Not started'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>

        {topics.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No lessons available for your skill level yet.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Lessons;
