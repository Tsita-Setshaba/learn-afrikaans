import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { lessonsAPI } from '../lib/api';
import { speak, getSpeechRate, createSpeechRecognition, comparePronunciation } from '../lib/speech';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Volume2, Mic, MicOff, ArrowLeft, ArrowRight, Check, X,
  Loader2, BookOpen, Play
} from 'lucide-react';

const LessonDetail = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await lessonsAPI.getLesson(topicId);
        setLesson(response.data);
      } catch (error) {
        console.error('Lesson fetch error:', error);
        navigate('/lessons');
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [topicId, navigate]);

  const currentWord = lesson?.words?.[currentIndex];
  const speechRate = getSpeechRate(user?.skill_level);

  const handleSpeak = async () => {
    if (!currentWord) return;
    setSpeaking(true);
    try {
      await speak(currentWord.afrikaans, 'af-ZA', speechRate);
    } catch (error) {
      console.error('Speech error:', error);
    } finally {
      setSpeaking(false);
    }
  };

  const handleListen = () => {
    const recognition = createSpeechRecognition();
    if (!recognition) {
      alert('Speech recognition not supported in your browser');
      return;
    }

    setListening(true);
    setSpokenText('');
    setFeedback(null);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSpokenText(transcript);
      const result = comparePronunciation(transcript, currentWord.afrikaans);
      setFeedback(result);
    };

    recognition.onerror = (event) => {
      console.error('Recognition error:', event.error);
      let errorMessage = 'Could not hear you. Please try again.';
      
      if (event.error === 'not-allowed') {
        errorMessage = 'Microphone access denied. Please enable it in your browser settings.';
      } else if (event.error === 'no-speech') {
        errorMessage = 'No speech detected. Try speaking a bit louder or closer to the mic.';
      } else if (event.error === 'language-not-supported') {
        // If Afrikaans is not supported, try falling back to English or Dutch
        console.warn('af-ZA not supported, attempting fallback to nl-NL');
        recognition.lang = 'nl-NL';
        try {
          recognition.start();
          return;
        } catch (e) {
          errorMessage = 'Speech recognition is not available for Afrikaans on this browser.';
        }
      }
      
      setFeedback({ match: false, score: 0, feedback: errorMessage });
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  const handleNext = () => {
    if (currentIndex < lesson.words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSpokenText('');
      setFeedback(null);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSpokenText('');
      setFeedback(null);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await lessonsAPI.completeLesson(topicId);
      await refreshUser();
      navigate('/lessons');
    } catch (error) {
      console.error('Complete lesson error:', error);
    } finally {
      setCompleting(false);
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
      <div className="max-w-3xl mx-auto space-y-8" data-testid="lesson-detail-page">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/lessons')}
            data-testid="lesson-back-btn"
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{lesson?.name}</h1>
            <p className="text-sm text-muted-foreground">{lesson?.description}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Word {currentIndex + 1} of {lesson?.words?.length}</span>
            <span className="font-medium">{Math.round(((currentIndex + 1) / lesson?.words?.length) * 100)}%</span>
          </div>
          <Progress value={((currentIndex + 1) / lesson?.words?.length) * 100} className="h-2" />
        </div>

        {/* Word Card */}
        <div className="glass-card p-8 md:p-12 text-center space-y-8">
          {/* Afrikaans Word */}
          <div className="space-y-4">
            <div className="text-5xl md:text-6xl font-bold text-orange-500">
              {currentWord?.afrikaans}
            </div>
            <div className="text-2xl text-foreground">
              {currentWord?.english}
            </div>
            {user?.interface_language === 'nso' && currentWord?.sepedi && (
              <div className="text-lg text-teal-500">
                {currentWord?.sepedi}
              </div>
            )}
          </div>

          {/* Example Sentence */}
          <div className="p-4 rounded-xl bg-muted/30 border border-white/5">
            <div className="text-sm text-muted-foreground mb-1">Example</div>
            <div className="text-lg italic">"{currentWord?.example}"</div>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={handleSpeak}
              disabled={speaking}
              data-testid="lesson-speak-btn"
              className="rounded-full w-16 h-16 bg-orange-500 hover:bg-orange-600 text-black glow-primary"
            >
              {speaking ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleListen}
              disabled={listening}
              data-testid="lesson-mic-btn"
              className={`rounded-full w-16 h-16 border-white/10 ${
                listening ? 'bg-red-500/20 border-red-500 recording' : 'hover:bg-white/5'
              }`}
            >
              {listening ? (
                <Mic className="w-6 h-6 text-red-500" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>
          </div>

          {/* Speech Feedback */}
          {(spokenText || feedback) && (
            <div className={`p-4 rounded-xl border ${
              feedback?.match
                ? 'bg-green-500/10 border-green-500/20'
                : 'bg-yellow-500/10 border-yellow-500/20'
            }`}>
              {spokenText && (
                <div className="text-sm text-muted-foreground mb-2">
                  You said: <span className="font-medium text-foreground">"{spokenText}"</span>
                </div>
              )}
              {feedback && (
                <div className="flex items-center justify-center gap-2">
                  {feedback.match ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className={feedback.match ? 'text-green-500' : 'text-yellow-500'}>
                    {feedback.feedback}
                  </span>
                  <span className="text-muted-foreground">({feedback.score}%)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            data-testid="lesson-prev-btn"
            className="rounded-full px-6 border-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentIndex === lesson?.words?.length - 1 ? (
            <Button
              onClick={handleComplete}
              disabled={completing}
              data-testid="lesson-complete-btn"
              className="rounded-full px-8 bg-teal-500 hover:bg-teal-600 text-black font-semibold glow-secondary"
            >
              {completing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t('completeLesson')}
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              data-testid="lesson-next-btn"
              className="rounded-full px-6 bg-orange-500 hover:bg-orange-600 text-black font-semibold"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Start Quiz Prompt */}
        {currentIndex === lesson?.words?.length - 1 && (
          <div className="glass-card p-6 text-center">
            <BookOpen className="w-10 h-10 text-orange-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Ready to test your knowledge?</h3>
            <p className="text-sm text-muted-foreground mb-4">Take a quiz to reinforce what you've learned!</p>
            <Button
              onClick={() => navigate(`/quiz?topic=${topicId}`)}
              data-testid="lesson-start-quiz-btn"
              className="rounded-full px-6 bg-orange-500 hover:bg-orange-600 text-black font-semibold"
            >
              <Play className="w-4 h-4 mr-2" />
              {t('startQuiz')}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LessonDetail;
