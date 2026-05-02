import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MessageSquare, Search, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MessagesPage = () => {
  const { t, isRTL } = useLanguage();
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const isObserver = currentUser?.tier === 'Observer';
  const isHobbyist = currentUser?.tier === 'Hobbyist';

  useEffect(() => {
    if (currentUser && !isObserver) {
      fetchConversations();
    } else {
      setLoading(false);
    }
  }, [currentUser, isObserver]);

  const fetchConversations = async () => {
    try {
      const records = await pb.collection('conversations').getFullList({
        filter: `user1_id="${currentUser.id}" || user2_id="${currentUser.id}"`,
        sort: '-last_activity_at',
        expand: 'user1_id,user2_id',
        $autoCancel: false
      });
      setConversations(records);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOtherUser = (conv) => {
    return conv.user1_id === currentUser.id ? conv.expand?.user2_id : conv.expand?.user1_id;
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const otherUser = getOtherUser(conv);
    return otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           otherUser?.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <>
      <Helmet>
        <title>{`${t('messages.title')} - ${t('brand.name')}`}</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-balance" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {t('messages.title')}
            </h1>
          </div>

          {isObserver ? (
            <Alert className="bg-secondary/50 border-border">
              <Info className="h-5 w-5 text-muted-foreground" />
              <AlertTitle>{t('common.error')}</AlertTitle>
              <AlertDescription>{t('messages.observerWarning')}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {isHobbyist && (
                <Alert className="bg-primary/10 text-primary border-primary/20">
                  <Info className="h-5 w-5" />
                  <AlertTitle>{t('common.error')}</AlertTitle>
                  <AlertDescription>{t('messages.hobbyistWarning')}</AlertDescription>
                </Alert>
              )}

              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`} />
                <Input 
                  placeholder={t('messages.searchUsers')} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`bg-card border-border ${isRTL ? 'pr-10' : 'pl-10'} h-12 text-lg`}
                />
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="bg-card border-border animate-pulse h-24" />
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">{t('messages.noConversations')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredConversations.map(conv => {
                    const otherUser = getOtherUser(conv);
                    if (!otherUser) return null;

                    return (
                      <Link key={conv.id} to={`/messages/${conv.id}`}>
                        <Card className="bg-card hover:bg-secondary/50 transition-colors border-border/50 cursor-pointer">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary shrink-0">
                              <span className="font-bold text-lg">{otherUser.name?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline mb-1">
                                <h3 className="font-semibold text-card-foreground truncate pr-2">
                                  {otherUser.name || otherUser.email}
                                </h3>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {conv.last_activity_at ? formatDistanceToNow(new Date(conv.last_activity_at), { addSuffix: true }) : ''}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {/* Last message preview would go here if fetched. Simplification for UX. */}
                                ...
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default MessagesPage;