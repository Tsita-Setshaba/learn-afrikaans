import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const LanguageContext = createContext(null);

// Translations
const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    lessons: 'Lessons',
    quiz: 'Quiz',
    chatbot: 'Practice Chat',
    leaderboard: 'Leaderboard',
    profile: 'Profile',
    logout: 'Logout',
    bookstore: 'Bookstore',

    // Auth
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',

    // Dashboard
    welcome: 'Welcome back',
    streak: 'Day Streak',
    points: 'Total Points',
    rank: 'Your Rank',
    wordOfDay: 'Word of the Day',
    recommended: 'Recommended for You',
    recentQuizzes: 'Recent Quizzes',
    yourProgress: 'Your Progress',
    badges: 'Badges',

    // Lessons
    startLesson: 'Start Lesson',
    continueLesson: 'Continue',
    completed: 'Completed',
    words: 'words',
    listenAgain: 'Listen Again',
    tryPronunciation: 'Try Pronunciation',
    completeLesson: 'Complete Lesson',

    // Quiz
    startQuiz: 'Start Quiz',
    nextQuestion: 'Next',
    submitQuiz: 'Submit',
    yourScore: 'Your Score',
    correct: 'Correct',
    incorrect: 'Incorrect',
    feedback: 'Feedback',
    tryAgain: 'Try Again',

    // Chatbot
    typeMessage: 'Type your message...',
    send: 'Send',
    chatbotIntro: 'Practice your Afrikaans conversation skills with our AI tutor!',

    // Leaderboard
    allTime: 'All Time',
    thisWeek: 'This Week',
    topLearners: 'Top Learners',

    // Profile
    settings: 'Settings',
    language: 'Interface Language',
    skillLevel: 'Skill Level',
    saveChanges: 'Save Changes',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    pro: 'Pro',

    // General
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success!',
    cancel: 'Cancel',
    back: 'Back',
    continue: 'Continue',
    getStarted: 'Get Started',
    learnMore: 'Learn More',

    // Landing
    heroTitle: 'Learn Afrikaans',
    heroSubtitle: 'The Fun Way',
    heroDescription: 'Master Afrikaans with AI-powered lessons, interactive quizzes, and real conversation practice. Built for South Africans, by South Africans.',
    feature1Title: 'AI-Powered Learning',
    feature1Desc: 'Personalized quizzes and feedback tailored to your level',
    feature2Title: 'Voice Practice',
    feature2Desc: 'Listen to native pronunciation and practice speaking',
    feature3Title: 'Conversation AI',
    feature3Desc: 'Chat with our AI tutor for real Afrikaans practice',

    // Bookstore
    bookstoreTitle: 'Afrikaans Bookstore',
    bookstoreSubtitle: 'Expand your learning with our curated Afrikaans books',
    physicalBook: 'Physical Book',
    digitalBook: 'Digital Book',
    inStock: 'in stock',
    outOfStock: 'Out of Stock',
    buyNow: 'Buy Now',
    addToCart: 'Add to Cart',
    bookDetails: 'Book Details',
    purchaseSuccess: 'Purchase Successful!',
    purchaseFailed: 'Purchase Failed. Please try again.',
    stockLow: 'Only {count} left!',
    freeShipping: 'Free shipping on orders over R500',
  },
  nso: {
    // Navigation
    dashboard: 'Dashiboto',
    lessons: 'Dithuto',
    quiz: 'Dipotšišo',
    chatbot: 'Poledišano',
    leaderboard: 'Lenane la Bafenyi',
    profile: 'Profaele',
    logout: 'Tšwa',
    bookstore: 'Lebenkele la Dibuka',

    // Auth
    login: 'Tsena',
    register: 'Ngwadiša',
    email: 'Imeile',
    password: 'Phasewete',
    name: 'Leina',
    confirmPassword: 'Netefatša Phasewete',
    forgotPassword: 'O lebetše phasewete?',
    noAccount: 'Ga o na akhaonto?',
    hasAccount: 'O šetše o na le akhaonto?',

    // Dashboard
    welcome: 'O amogetšwe gape',
    streak: 'Matšatši a go Latellana',
    points: 'Dipoente ka Moka',
    rank: 'Boemo bja Gago',
    wordOfDay: 'Lentšu la Lehono',
    recommended: 'Le Šišinyetšwa Wena',
    recentQuizzes: 'Dipotšišo tša Moragorago',
    yourProgress: 'Tšwelopele ya Gago',
    badges: 'Dipheta',

    // Lessons
    startLesson: 'Thoma Thuto',
    continueLesson: 'Tšwela Pele',
    completed: 'E Phethilwe',
    words: 'mantšu',
    listenAgain: 'Theeletša Gape',
    tryPronunciation: 'Leka go Bolela',
    completeLesson: 'Phetha Thuto',

    // Quiz
    startQuiz: 'Thoma Dipotšišo',
    nextQuestion: 'E Latelago',
    submitQuiz: 'Romela',
    yourScore: 'Dintlha tša Gago',
    correct: 'E Nepile',
    incorrect: 'E Fošagetše',
    feedback: 'Phetolo',
    tryAgain: 'Leka Gape',

    // Chatbot
    typeMessage: 'Ngwala molaetša wa gago...',
    send: 'Romela',
    chatbotIntro: 'Itlwaetše bokgoni bja gago bja poledišano ya Seafrikanse le morutiši wa rena wa AI!',

    // Leaderboard
    allTime: 'Nako Yohle',
    thisWeek: 'Beke Ye',
    topLearners: 'Baithuti ba Godimo',

    // Profile
    settings: 'Dipeakanyo',
    language: 'Polelo ya Seemo',
    skillLevel: 'Maemo a Bokgoni',
    saveChanges: 'Boloka Diphetogo',
    beginner: 'Mothomi',
    intermediate: 'Magareng',
    pro: 'Setsebi',

    // General
    loading: 'E a laela...',
    error: 'Phošo e hlageile',
    success: 'E atlega!',
    cancel: 'Khansela',
    back: 'Morago',
    continue: 'Tšwela Pele',
    getStarted: 'Thoma',
    learnMore: 'Ithute Gape',

    // Landing
    heroTitle: 'Ithute Seafrikanse',
    heroSubtitle: 'Ka Tsela e Monate',
    heroDescription: 'Tseba Seafrikanse ka dithuto tša AI, dipotšišo tša go tsenelela, le tlwaetšo ya dipoledišano tša nnete. E agetšwe MaAfrika Borwa, ke MaAfrika Borwa.',
    feature1Title: 'Go Ithuta ka AI',
    feature1Desc: 'Dipotšišo le diphetolo tše di diretšwego maemo a gago',
    feature2Title: 'Tlwaetšo ya Lentšu',
    feature2Desc: 'Theeletša polelo ya setlogo le go itlwaetša go bolela',
    feature3Title: 'Poledišano le AI',
    feature3Desc: 'Bolela le morutiši wa rena wa AI go itlwaetša Seafrikanse sa nnete',

    // Bookstore
    bookstoreTitle: 'Lebenkele la Dibuka tša Seafrikanse',
    bookstoreSubtitle: 'Oketša go ithuta ga gago ka dibuka tša rena tša Seafrikanse',
    physicalBook: 'Buka ya Nnete',
    digitalBook: 'Buka ya Dijithale',
    inStock: 'di le teng',
    outOfStock: 'E Fedile',
    buyNow: 'Reka Bjale',
    addToCart: 'Tlela Segorogelo',
    bookDetails: 'Dintlha tša Buka',
    purchaseSuccess: 'Go Reka go Atlegile!',
    purchaseFailed: 'Go Reka go Hlolehile. Leka Gape.',
    stockLow: '{count} fela di šetše!',
    freeShipping: 'Go romela mahala go ditšheletšo tše dingata go feta R500',
  }
};

export function LanguageProvider({ children }) {
  const { user } = useAuth();
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    if (user?.interface_language) {
      setLanguage(user.interface_language === 'nso' ? 'nso' : 'en');
    }
  }, [user]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage, translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}