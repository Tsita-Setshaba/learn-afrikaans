import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendStatus, setResendStatus] = useState(''); // '', 'loading', 'success', 'error'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleResendVerification = async () => {
    if (!formData.email) {
      setError('Please enter your email first');
      return;
    }

    setResendStatus('loading');
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${BACKEND_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (response.ok) {
        setResendStatus('success');
        setError('');
      } else {
        setError(data.detail || 'Failed to resend verification');
        setResendStatus('error');
      }
    } catch (err) {
      setError('Connection error');
      setResendStatus('error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Login failed';
      if (err.response?.status === 401 && detail.includes('verify')) {
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      } else {
        setError(detail);
      }
    } finally {
      setLoading(false);
    }
  };

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
          onClick={() => navigate('/')}
          data-testid="login-back-btn"
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('back')}
        </Button>

        {/* Card */}
        <div className="glass-card p-8">
          <div className="space-y-2 mb-8">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground">Continue your Afrikaans journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="login-email-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                  className="h-12 bg-muted/50 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  data-testid="login-password-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                  className="h-12 bg-muted/50 border-white/10"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
                {error.includes('verify') && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="block mt-2 text-orange-500 hover:underline font-medium"
                    disabled={resendStatus === 'loading'}
                  >
                    {resendStatus === 'loading' ? 'Sending...' : 'Resend verification email'}
                  </button>
                )}
              </div>
            )}

            {resendStatus === 'success' && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                Verification link sent! Check your inbox (or backend terminal).
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              data-testid="login-submit-btn"
              className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-semibold glow-primary"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('login')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <Link to="/register" className="text-orange-500 hover:underline" data-testid="login-register-link">
              {t('register')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
