/**
 * Enhanced Text-to-Speech using Google Translate's high-quality engine
 * with fallback to browser synthesis.
 */
export const speak = (text, lang = 'af', rate = 1) => {
  return new Promise((resolve, reject) => {
    try {
      // 1. Try Google Translate TTS first (High Quality)
      // Note: 'tl=af' is the language code for Afrikaans
      const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
      
      const audio = new Audio(googleTtsUrl);
      audio.playbackRate = rate;
      
      audio.onended = () => resolve();
      
      audio.onerror = (e) => {
        console.warn('Google TTS failed, falling back to browser synthesis:', e);
        // 2. Fallback to browser synthesis if Google fails
        fallbackSpeak(text, lang === 'af' ? 'af-ZA' : lang, rate)
          .then(resolve)
          .catch(reject);
      };

      // Set a timeout for Google TTS to avoid hanging if network is slow
      const timeout = setTimeout(() => {
        audio.pause();
        audio.src = "";
        console.warn('Google TTS timed out, falling back to browser synthesis');
        fallbackSpeak(text, lang === 'af' ? 'af-ZA' : lang, rate)
          .then(resolve)
          .catch(reject);
      }, 3000);

      audio.onplay = () => clearTimeout(timeout);
      
      audio.play().catch(err => {
        clearTimeout(timeout);
        console.warn('Audio play failed, falling back to browser:', err);
        fallbackSpeak(text, lang === 'af' ? 'af-ZA' : lang, rate)
          .then(resolve)
          .catch(reject);
      });
    } catch (error) {
      fallbackSpeak(text, lang === 'af' ? 'af-ZA' : lang, rate)
        .then(resolve)
        .catch(error);
    }
  });
};

/**
 * Browser-based Speech Synthesis (Fallback)
 */
const fallbackSpeak = (text, lang = 'af-ZA', rate = 1) => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.lang === 'af-ZA' || v.lang === 'af_ZA');
    
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('af'));
    }
    
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('nl'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
  });
};

// Get speech rate based on skill level
export const getSpeechRate = (skillLevel) => {
  switch (skillLevel) {
    case 'beginner': return 0.7;
    case 'intermediate': return 0.85;
    case 'pro': return 1;
    default: return 0.85;
  }
};

// Speech Recognition
export const createSpeechRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  
  // Try to set language to Afrikaans
  // Note: Support varies by browser. If af-ZA isn't supported, 
  // it might fallback to the default or error out on start.
  recognition.lang = 'af-ZA';

  return recognition;
};

// Compare pronunciation (improved for better matching and robustness)
export const comparePronunciation = (spoken, expected) => {
  if (!spoken) return { match: false, score: 0, feedback: 'No speech detected.' };

  const spokenLower = spoken.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
  const expectedLower = expected.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
  
  if (spokenLower === expectedLower) {
    return { match: true, score: 100, feedback: 'Perfect pronunciation!' };
  }
  
  // Calculate similarity using Levenshtein distance
  const distance = levenshteinDistance(spokenLower, expectedLower);
  const maxLength = Math.max(spokenLower.length, expectedLower.length);
  const similarity = Math.max(0, Math.round((1 - distance / maxLength) * 100));
  
  // Also check if the spoken text contains the expected word
  // This helps when the browser captures extra background noise
  const containsWord = spokenLower.includes(expectedLower) || expectedLower.includes(spokenLower);
  
  let finalScore = similarity;
  if (containsWord && finalScore < 70) {
    finalScore = 70; // Give a baseline score if the word was definitely heard
  }

  let feedback;
  if (finalScore >= 85) {
    feedback = 'Excellent! Your pronunciation is spot on.';
  } else if (finalScore >= 70) {
    feedback = 'Very good! Just a tiny bit off, but clearly understood.';
  } else if (finalScore >= 50) {
    feedback = 'Good attempt! Try to listen again and match the vowels.';
  } else {
    feedback = 'Keep practicing! Focus on the rhythm of the word.';
  }
  
  return { match: finalScore >= 70, score: finalScore, feedback };
};

// Levenshtein distance algorithm
const levenshteinDistance = (a, b) => {
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
};
