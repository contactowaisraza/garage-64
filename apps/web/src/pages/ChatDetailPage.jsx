
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import DepositRequestModal from '@/components/DepositRequestModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Send, Clock, Coins } from 'lucide-react';
import { format } from 'date-fns';

const ChatDetailPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { currentUser } = useAuth();
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchData();
    const unsubscribe = pb.collection('messages').subscribe('*', (e) => {
      if (e.action === 'create' && e.record.conversation_id === conversationId) {
        setMessages(prev => [...prev, e.record]);
        scrollToBottom();
      }
    });

    return () => {
      pb.collection('messages').unsubscribe('*');
    };
  }, [conversationId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const conv = await pb.collection('conversations').getOne(conversationId, {
        expand: 'user1_id,user2_id',
        $autoCancel: false
      });
      setConversation(conv);
      
      const partner = conv.user1_id === currentUser.id ? conv.expand?.user2_id : conv.expand?.user1_id;
      setOtherUser(partner);

      const msgs = await pb.collection('messages').getFullList({
        filter: `conversation_id="${conversationId}"`,
        sort: 'created',
        $autoCancel: false
      });
      setMessages(msgs);
      scrollToBottom();
      
      // Mark as read
      msgs.forEach(m => {
        if (m.recipient_id === currentUser.id && !m.read_at) {
          pb.collection('messages').update(m.id, { read_at: new Date().toISOString() }, { $autoCancel: false });
        }
      });

    } catch (error) {
      console.error('Error fetching chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherUser) return;

    try {
      const msgData = {
        sender_id: currentUser.id,
        recipient_id: otherUser.id,
        content: newMessage,
        conversation_id: conversationId,
      };
      
      await pb.collection('messages').create(msgData, { $autoCancel: false });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const isExpiringSoon = messages.some(m => {
    if (!m.expires_at) return false;
    const timeToExpiry = new Date(m.expires_at) - new Date();
    return timeToExpiry > 0 && timeToExpiry < (7 * 60 * 60 * 1000);
  });

  const userTier = currentUser?.tier?.toLowerCase() || currentUser?.subscription_tier?.toLowerCase();
  const canRequestDeposit = userTier === 'dealer' || userTier === 'collector';

  return (
    <>
      <Helmet>
        <title>{`${otherUser?.name || 'Chat'} - ${t('brand.name')}`}</title>
      </Helmet>
      <div className="flex flex-col h-[100dvh] bg-background">
        <Header />
        
        <main className="flex-1 flex flex-col container mx-auto max-w-3xl border-x border-border/40 relative overflow-hidden bg-card/30">
          {/* Chat Header */}
          <div className="h-16 border-b border-border/50 bg-card/80 backdrop-blur flex items-center justify-between px-4 shrink-0 z-10">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => navigate('/messages')} className="mr-2">
                <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                  {otherUser?.name?.charAt(0).toUpperCase()}
                </div>
                <h2 className="font-semibold text-lg">{otherUser?.name || otherUser?.email || 'Loading...'}</h2>
              </div>
            </div>
            
            {canRequestDeposit && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDepositModal(true)}
                className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Coins className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {isRTL ? 'طلب إيداع' : 'Request Deposit'}
              </Button>
            )}
          </div>

          {isExpiringSoon && (
            <Alert className="rounded-none border-x-0 expiry-warning-banner shrink-0 py-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <AlertTitle className="mb-0 text-sm">{t('messages.expiryWarning')}</AlertTitle>
              </div>
            </Alert>
          )}

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="text-center text-muted-foreground mt-10">{t('common.loading')}</div>
            ) : messages.map(msg => {
              const isMine = msg.sender_id === currentUser.id;
              const isDepositRequest = msg.content.startsWith('Deposit Request:');
              
              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[75%] ${isMine ? 'bubble-sent' : 'bubble-received'} ${isDepositRequest ? 'border border-primary/50 bg-primary/10' : ''}`}>
                    {isDepositRequest && (
                      <div className="flex items-center gap-2 mb-1 text-primary font-bold text-xs uppercase tracking-wider">
                        <Coins className="w-3 h-3" />
                        {isRTL ? 'طلب إيداع' : 'Deposit Request'}
                      </div>
                    )}
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-1 mx-1">
                    {format(new Date(msg.created), 'HH:mm')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border/50 bg-card shrink-0">
            <form onSubmit={handleSend} className="flex gap-2 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('messages.typeMessage')}
                className="flex-1 bg-input border-transparent h-12 rounded-full px-6"
                dir="auto"
              />
              <Button type="submit" disabled={!newMessage.trim()} className="rounded-full w-12 h-12 p-0 shrink-0">
                <Send className={`w-5 h-5 ${isRTL ? 'rotate-180' : 'ml-1'}`} />
              </Button>
            </form>
          </div>
        </main>
      </div>

      {otherUser && (
        <DepositRequestModal 
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          conversationId={conversationId}
          currentUserId={currentUser.id}
          otherUserId={otherUser.id}
        />
      )}
    </>
  );
};

export default ChatDetailPage;
