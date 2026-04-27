import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { quizAPI, lessonsAPI } from '../lib/api';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, ArrowRight, Check, X, Loader2, Trophy,
  Target, Clock, RefreshCw, Home, Award
} from 'lucide-react';

const Quiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const topicId = searchParams.get('topic');

  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(topicId || '');
  const [quiz, setQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await lessonsAPI.getTopics();
        setTopics(response.data);
      } catch (error) {
        console.error('Topics fetch error:', error);
      }
    };
    fetchTopics();
  }, []);

  useEffect(() => {
    if (topicId) {
      startQuiz(topicId);
    }
  }, [topicId]);

  const startQuiz = async (topic) => {
    setLoading(true);
    setResult(null);
    setAnswers([]);
    setCurrentIndex(0);
    try {
      const response = await quizAPI.generate({
        topic_id: topic,
        skill_level: user?.skill_level || 'beginner'
      });
      setQuiz(response.data);
      setStartTime(Date.now());
    } catch (error) {
      console.error('Quiz generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const response = await quizAPI.submit({
        topic_id: quiz.topic_id,
        questions: quiz.questions,
        answers,
        time_taken: timeTaken
      });
      setResult(response.data);
      await refreshUser();
    } catch (error) {
      console.error('Quiz submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = quiz?.questions?.[currentIndex];
  const isLastQuestion = currentIndex === (quiz?.questions?.length || 0) - 1;
  const allAnswered = answers.length === quiz?.questions?.length && !answers.includes(undefined);

  // Topic Selection View
  if (!quiz && !loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto space-y-8" data-testid="quiz-topic-selection">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{t('quiz')}</h1>
            <p className="text-muted-foreground mt-1">Select a topic to test your knowledge</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => {
                  setSelectedTopic(topic.id);
                  startQuiz(topic.id);
                }}
                data-testid={`quiz-topic-${topic.id}`}
                className="glass-card p-6 text-left hover:border-orange-500/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <Target className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <div className="font-semibold">{topic.name}</div>
                    <div className="text-sm text-muted-foreground">{topic.word_count} words</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Loading View
  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
          <p className="text-muted-foreground">Generating quiz questions...</p>
        </div>
      </Layout>
    );
  }

  // Result View
  if (result) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-8" data-testid="quiz-result">
          {/* Score Card */}
          <div className="glass-card p-8 md:p-12 text-center">
            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
              result.score >= 80 ? 'bg-green-500/20' : result.score >= 50 ? 'bg-yellow-500/20' : 'bg-red-500/20'
            }`}>
              <Trophy className={`w-10 h-10 ${
                result.score >= 80 ? 'text-green-500' : result.score >= 50 ? 'text-yellow-500' : 'text-red-500'
              }`} />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-2">{result.score}%</h1>
            <p className="text-xl text-muted-foreground mb-6">
              {result.correct} / {result.total} {t('correct').toLowerCase()}
            </p>

            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">+{result.points_earned}</div>
                <div className="text-sm text-muted-foreground">{t('points')}</div>
              </div>
              {result.badges_earned?.length > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">+{result.badges_earned.length}</div>
                  <div className="text-sm text-muted-foreground">{t('badges')}</div>
                </div>
              )}
            </div>

            {/* Badges Earned */}
            {result.badges_earned?.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-center gap-3">
                  {result.badges_earned.map((badge) => (
                    <div key={badge} className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Award className="w-7 h-7 text-purple-500" />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-purple-500 mt-2">New badge earned!</p>
              </div>
            )}

            {/* AI Feedback */}
            <div className="p-4 rounded-xl bg-muted/30 border border-white/5 text-left">
              <div className="text-sm text-muted-foreground mb-2">{t('feedback')}</div>
              <p className="text-foreground">{result.feedback}</p>
            </div>
          </div>

          {/* Wrong Answers Review */}
          {result.wrong_answers?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Review your mistakes</h3>
              <div className="space-y-4">
                {result.wrong_answers.map((wrong, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                    <p className="text-sm text-muted-foreground mb-2">{wrong.question}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <X className="w-4 h-4 text-red-500" />
                      <span className="text-red-400">{wrong.your_answer}</span>
                      <span className="text-muted-foreground">→</span>
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-green-400">{wrong.correct_answer}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              data-testid="quiz-home-btn"
              className="rounded-full px-6 border-white/10"
            >
              <Home className="w-4 h-4 mr-2" />
              {t('dashboard')}
            </Button>
            <Button
              onClick={() => {
                setQuiz(null);
                setResult(null);
              }}
              data-testid="quiz-retry-btn"
              className="rounded-full px-6 bg-orange-500 hover:bg-orange-600 text-black font-semibold"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('tryAgain')}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Quiz View
  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8" data-testid="quiz-page">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setQuiz(null);
              navigate('/quiz');
            }}
            data-testid="quiz-back-btn"
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Quiz</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {quiz?.questions?.length}
            </p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">In progress</span>
          </div>
        </div>

        {/* Progress */}
        <Progress value={((currentIndex + 1) / quiz?.questions?.length) * 100} className="h-2" />

        {/* Question Card */}
        <div className="glass-card p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-center">
            {currentQuestion?.question}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion?.options?.map((option, idx) => {
              const isSelected = answers[currentIndex] === option;
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  data-testid={`quiz-option-${idx}`}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-500/20'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isSelected ? 'bg-orange-500 text-black' : 'bg-muted'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="font-medium">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            data-testid="quiz-prev-btn"
            className="rounded-full px-6 border-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {isLastQuestion && allAnswered ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              data-testid="quiz-submit-btn"
              className="rounded-full px-8 bg-teal-500 hover:bg-teal-600 text-black font-semibold glow-secondary"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t('submitQuiz')}
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!answers[currentIndex]}
              data-testid="quiz-next-btn"
              className="rounded-full px-6 bg-orange-500 hover:bg-orange-600 text-black font-semibold"
            >
              {t('nextQuestion')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Question Indicators */}
        <div className="flex items-center justify-center gap-2">
          {quiz?.questions?.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentIndex
                  ? 'bg-orange-500 scale-125'
                  : answers[idx]
                    ? 'bg-teal-500'
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Quiz;
