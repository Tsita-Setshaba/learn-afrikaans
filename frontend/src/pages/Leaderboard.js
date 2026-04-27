import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { leaderboardAPI } from '../lib/api';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Flame, Loader2, User, Crown } from 'lucide-react';

const Leaderboard = () => {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await leaderboardAPI.get();
        setData(response.data);
      } catch (error) {
        console.error('Leaderboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
    }
  };

  const LeaderboardList = ({ entries, type }) => (
    <div className="space-y-3">
      {entries?.map((entry, idx) => {
        const isCurrentUser = entry.user_id === data?.user_stats?.user_id;
        return (
          <div
            key={entry.user_id}
            className={`glass-card p-4 flex items-center gap-4 transition-all ${
              isCurrentUser ? 'border-orange-500/30 bg-orange-500/5' : ''
            } ${idx < 3 ? 'border-yellow-500/20' : ''}`}
            data-testid={`leaderboard-entry-${idx}`}
          >
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
              {getRankIcon(idx + 1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {entry.name}
                  {isCurrentUser && <span className="text-orange-500 ml-1">(You)</span>}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="capitalize">{entry.skill_level}</span>
                <div className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span>{entry.streak}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-orange-500">
                {type === 'weekly' ? entry.weekly_points : entry.total_points}
              </div>
              <div className="text-xs text-muted-foreground">points</div>
            </div>
          </div>
        );
      })}
    </div>
  );

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
      <div className="max-w-3xl mx-auto space-y-8" data-testid="leaderboard-page">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold">{t('leaderboard')}</h1>
          <p className="text-muted-foreground mt-1">{t('topLearners')}</p>
        </div>

        {/* User's Rank Card */}
        {data?.user_stats && (
          <div className="glass-card p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                <User className="w-7 h-7 text-orange-500" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t('rank')}</div>
                <div className="text-3xl font-bold">#{data.user_rank || '-'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-orange-500">{data.user_stats.total_points}</div>
              <div className="text-sm text-muted-foreground">total points</div>
            </div>
          </div>
        )}

        {/* Leaderboard Tabs */}
        <Tabs defaultValue="alltime" className="w-full">
          <TabsList className="w-full bg-muted/30 p-1 rounded-xl">
            <TabsTrigger
              value="alltime"
              data-testid="leaderboard-alltime-tab"
              className="flex-1 rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-black"
            >
              <Trophy className="w-4 h-4 mr-2" />
              {t('allTime')}
            </TabsTrigger>
            <TabsTrigger
              value="weekly"
              data-testid="leaderboard-weekly-tab"
              className="flex-1 rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-black"
            >
              <Flame className="w-4 h-4 mr-2" />
              {t('thisWeek')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alltime" className="mt-6">
            <LeaderboardList entries={data?.all_time} type="alltime" />
          </TabsContent>

          <TabsContent value="weekly" className="mt-6">
            <LeaderboardList entries={data?.weekly} type="weekly" />
          </TabsContent>
        </Tabs>

        {/* Empty State */}
        {(!data?.all_time || data.all_time.length === 0) && (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No learners on the leaderboard yet. Be the first!</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Leaderboard;
