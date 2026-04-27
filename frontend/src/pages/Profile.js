import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usersAPI, badgesAPI } from '../lib/api';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  User, Settings, Award, LogOut, Loader2, Save,
  Flame, Star, Trophy, BookOpen, Rocket, Check
} from 'lucide-react';
import { useEffect } from 'react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { t, changeLanguage } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [badges, setBadges] = useState([]);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    interface_language: user?.interface_language || 'en',
    skill_level: user?.skill_level || 'beginner',
  });

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const response = await badgesAPI.getAll();
        setBadges(response.data);
      } catch (error) {
        console.error('Badges fetch error:', error);
      }
    };
    fetchBadges();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await usersAPI.updateProfile(formData);
      updateUser(response.data);
      changeLanguage(formData.interface_language);
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const skillLevels = [
    { value: 'beginner', label: t('beginner'), icon: User },
    { value: 'intermediate', label: t('intermediate'), icon: BookOpen },
    { value: 'pro', label: t('pro'), icon: Rocket },
  ];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8" data-testid="profile-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{t('profile')}</h1>
          <p className="text-muted-foreground mt-1">{t('settings')}</p>
        </div>

        {/* User Stats Card */}
        <div className="glass-card p-6 md:p-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-orange-500/20 flex items-center justify-center">
              <User className="w-10 h-10 text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-muted/30">
              <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{user?.streak || 0}</div>
              <div className="text-xs text-muted-foreground">{t('streak')}</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/30">
              <Star className="w-6 h-6 text-teal-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{user?.total_points || 0}</div>
              <div className="text-xs text-muted-foreground">{t('points')}</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/30">
              <Award className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{user?.badges?.length || 0}</div>
              <div className="text-xs text-muted-foreground">{t('badges')}</div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="glass-card p-6 md:p-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-500" />
            {t('badges')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border ${
                  badge.earned
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-muted/20 border-white/5 opacity-50'
                }`}
                data-testid={`badge-${badge.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    badge.earned ? 'bg-purple-500/20' : 'bg-muted/30'
                  }`}>
                    <Award className={`w-5 h-5 ${badge.earned ? 'text-purple-500' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{badge.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{badge.description}</div>
                  </div>
                  {badge.earned && <Check className="w-4 h-4 text-purple-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings Form */}
        <div className="glass-card p-6 md:p-8 space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('settings')}
          </h3>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('name')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              data-testid="profile-name-input"
              className="h-12 bg-muted/50 border-white/10"
            />
          </div>

          {/* Language Selection */}
          <div className="space-y-3">
            <Label>{t('language')}</Label>
            <RadioGroup
              value={formData.interface_language}
              onValueChange={(value) => setFormData({ ...formData, interface_language: value })}
              className="grid grid-cols-2 gap-3"
            >
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.interface_language === 'en'
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <RadioGroupItem value="en" id="profile-en" data-testid="profile-lang-en" />
                <span>English</span>
              </label>
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.interface_language === 'nso'
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <RadioGroupItem value="nso" id="profile-nso" data-testid="profile-lang-nso" />
                <span>Sepedi</span>
              </label>
            </RadioGroup>
          </div>

          {/* Skill Level */}
          <div className="space-y-3">
            <Label>{t('skillLevel')}</Label>
            <RadioGroup
              value={formData.skill_level}
              onValueChange={(value) => setFormData({ ...formData, skill_level: value })}
              className="space-y-2"
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
                  <RadioGroupItem value={level.value} id={`skill-${level.value}`} data-testid={`profile-skill-${level.value}`} />
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                    <level.icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <span className="font-medium">{level.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            data-testid="profile-save-btn"
            className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-semibold"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t('saveChanges')}
              </>
            )}
          </Button>
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          onClick={handleLogout}
          data-testid="profile-logout-btn"
          className="w-full h-12 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t('logout')}
        </Button>
      </div>
    </Layout>
  );
};

export default Profile;
