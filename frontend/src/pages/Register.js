import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Loader2, User, BookOpen, Rocket } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    interface_language: 'en',
    skill_level: 'beginner',
  });

  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register(formData);
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const skillLevels = [
    { value: 'beginner', label: t('beginner'), icon: User, desc: 'New to Afrikaans' },
    { value: 'intermediate', label: t('intermediate'), icon: BookOpen, desc: 'Know some basics' },
    { value: 'pro', label: t('pro'), icon: Rocket, desc: 'Want to master it' },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute top-1/4 -right-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => step > 1 ? setStep(step - 1) : navigate('/')}
          data-testid="register-back-btn"
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('back')}
        </Button>

        {/* Card */}
        <div className="glass-card p-8">
          {success ? (
            <div className="space-y-6 animate-fade-in text-center py-4">
              <div className="w-20 h-20 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-bold">Registration Successful!</h1>
              <p className="text-muted-foreground">
                Your account has been created successfully.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting you to login...
              </p>
            </div>
          ) : (
            <>
              {/* Progress indicator */}
              <div className="flex gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      s <= step ? 'bg-orange-500' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center animate-shake">
                  {error}
                </div>
              )}
              {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">Create your account</h1>
                  <p className="text-muted-foreground">Start your Afrikaans learning journey</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('name')}</Label>
                    <Input
                      id="name"
                      data-testid="register-name-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your name"
                      required
                      className="h-12 bg-muted/50 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      data-testid="register-email-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email"
                      required
                      className="h-12 bg-muted/50 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      data-testid="register-phone-input"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      placeholder="+27 79 274 3603"
                      required
                      className="h-12 bg-muted/50 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('password')}</Label>
                    <Input
                      id="password"
                      type="password"
                      data-testid="register-password-input"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Create a password"
                      required
                      minLength={6}
                      className="h-12 bg-muted/50 border-white/10"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">Choose your language</h1>
                  <p className="text-muted-foreground">Select your interface language</p>
                </div>

                <RadioGroup
                  value={formData.interface_language}
                  onValueChange={(value) => setFormData({ ...formData, interface_language: value })}
                  className="space-y-3"
                >
                  <label
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.interface_language === 'en'
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <RadioGroupItem value="en" id="en" data-testid="register-lang-en" />
                    <div>
                      <div className="font-medium">English</div>
                      <div className="text-sm text-muted-foreground">Interface in English</div>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.interface_language === 'nso'
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <RadioGroupItem value="nso" id="nso" data-testid="register-lang-nso" />
                    <div>
                      <div className="font-medium">Sepedi (Northern Sotho)</div>
                      <div className="text-sm text-muted-foreground">Seemo ka Sepedi</div>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">Your skill level</h1>
                  <p className="text-muted-foreground">We'll personalize your experience</p>
                </div>

                <RadioGroup
                  value={formData.skill_level}
                  onValueChange={(value) => setFormData({ ...formData, skill_level: value })}
                  className="space-y-3"
                >
                  {skillLevels.map((level) => (
                    <label
                      key={level.value}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        formData.skill_level === level.value
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <RadioGroupItem value={level.value} id={level.value} data-testid={`register-skill-${level.value}`} />
                      <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                        <level.icon className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <div className="font-medium">{level.label}</div>
                        <div className="text-sm text-muted-foreground">{level.desc}</div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              data-testid="register-submit-btn"
              className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-semibold glow-primary"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : step === 3 ? (
                t('get_started')
              ) : (
                t('next')
              )}
            </Button>
          </form>
        </>
      )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('hasAccount')}{' '}
            <Link to="/login" className="text-orange-500 hover:underline" data-testid="register-login-link">
              {t('login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
