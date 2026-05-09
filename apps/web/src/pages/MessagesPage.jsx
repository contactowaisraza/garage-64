
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import DepositRequestModal from '@/components/DepositRequestModal';
import PaymentProofModal from '@/components/PaymentProofModal';
import BargainOfferModal from '@/components/BargainOfferModal';
import { MessageSquare, Search, Send, ArrowLeft, Coins, AlertCircle, Upload, TrendingDown } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { toast } from 'sonner';

const NAVBAR_H = 60; // px — matches Header h-[60px]

const parseLastMessage = (msg, isRTL) => {
  if (!msg) return '';
  if (msg.startsWith('DEPOSIT_REQ|')) {
    const amount = msg.split('|')[2];
    return isRTL ? `طلب إيداع: ${amount} QI` : `Deposit request: ${amount} QI`;
  }
  if (msg.startsWith('PAYMENT_PROOF|')) return isRTL ? 'تم رفع إثبات الدفع' : 'Payment proof uploaded';
  if (msg.startsWith('BARGAIN_OFFER|')) {
    const amount = msg.split('|')[2];
    return isRTL ? `عرض تفاوض: ${amount} QI` : `Bargain offer: ${amount} QI`;
  }
  return msg;
};

const formatConvTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'dd/MM/yy');
};

// ─── Chat Panel (right side) ───────────────────────────────────────────────
const ChatPanel = ({ conversationId, currentUser, onBack, isRTL }) => {
  const [conv, setConv] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [convNotFound, setConvNotFound] = useState(false);
  const [deposits, setDeposits] = useState({}); // depositId → record
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showBargainModal, setShowBargainModal] = useState(false);
  const [activeDeposit, setActiveDeposit] = useState(null);
  const scrollRef = useRef(null);

  // Seller = user2_id in the conversation (the one being contacted)
  const isSeller = conv?.user2_id === currentUser?.id;
  const userTier = currentUser?.subscription_tier?.toLowerCase();
  const canRequestDeposit = isSeller && (userTier === 'dealer' || userTier === 'collector');

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 80);
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    setMessages([]);
    setOtherUser(null);
    setConv(null);
    setDeposits({});

    const load = async () => {
      try {
        const convData = await pb.collection('conversations').getOne(conversationId, {
          $autoCancel: false,
        });
        setConv(convData);

        const otherUserId =
          convData.user1_id === currentUser.id ? convData.user2_id : convData.user1_id;
        try {
          const user = await pb.collection('users').getOne(otherUserId, { $autoCancel: false });
          setOtherUser(user);
        } catch {
          setOtherUser({ id: otherUserId });
        }

        const [msgs, depositsArr] = await Promise.all([
          pb.collection('messages').getFullList({
            filter: `conversation_id="${conversationId}"`,
            sort: 'created',
            $autoCancel: false,
          }),
          pb.collection('deposits').getFullList({
            filter: `conversation_id="${conversationId}"`,
            $autoCancel: false,
          }),
        ]);

        setMessages(msgs);
        const depositsMap = {};
        depositsArr.forEach(d => { depositsMap[d.id] = d; });
        setDeposits(depositsMap);
        scrollToBottom();

        msgs.forEach((m) => {
          if (m.recipient_id === currentUser.id && !m.read_at) {
            pb.collection('messages').update(
              m.id,
              { read_at: new Date().toISOString() },
              { $autoCancel: false }
            ).catch(() => {});
          }
        });
      } catch (err) {
        if (err?.status === 404) setConvNotFound(true);
        console.error('Error loading chat:', err);
      } finally {
        setLoading(false);
      }
    };

    load();

    pb.collection('messages').subscribe(
      '*',
      (e) => {
        if (e.action !== 'create') return;
        setMessages((prev) =>
          prev.some((m) => m.id === e.record.id) ? prev : [...prev, e.record]
        );
        scrollToBottom();
        if (e.record.recipient_id === currentUser.id) {
          pb.collection('messages').update(
            e.record.id,
            { read_at: new Date().toISOString() },
            { $autoCancel: false }
          ).catch(() => {});
        }
      },
      { filter: `conversation_id = "${conversationId}"` }
    );

    pb.collection('deposits').subscribe(
      '*',
      (e) => {
        if (e.action === 'delete') {
          setDeposits(prev => { const n = { ...prev }; delete n[e.record.id]; return n; });
        } else {
          setDeposits(prev => ({ ...prev, [e.record.id]: e.record }));
        }
      },
      { filter: `conversation_id = "${conversationId}"` }
    );

    return () => {
      pb.collection('messages').unsubscribe('*');
      pb.collection('deposits').unsubscribe('*');
    };
  }, [conversationId]);

  const handleSend = async (e) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || !otherUser?.id) return;
    setNewMessage('');
    try {
      const created = await pb.collection('messages').create(
        { sender_id: currentUser.id, recipient_id: otherUser.id, content, conversation_id: conversationId },
        { $autoCancel: false }
      );
      setMessages((prev) =>
        prev.some((m) => m.id === created.id) ? prev : [...prev, created]
      );
      scrollToBottom();
      pb.collection('conversations').update(
        conversationId,
        { last_message: content, last_message_sender_id: currentUser.id },
        { $autoCancel: false }
      ).catch(() => {});
    } catch (err) {
      console.error('Error sending message:', err);
      setNewMessage(content);
      toast.error(isRTL ? 'فشل إرسال الرسالة' : 'Failed to send message');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
  };

  const handleApprove = async (deposit) => {
    try {
      // Accepting a bargain moves to bargain_accepted (buyer must still upload proof)
      // Approving a proof submission moves to fully approved
      const newStatus = deposit.status === 'bargaining' ? 'bargain_accepted' : 'approved';
      await pb.collection('deposits').update(deposit.id, { status: newStatus }, { $autoCancel: false });
      toast.success(
        newStatus === 'bargain_accepted'
          ? (isRTL ? 'تمت الموافقة على العرض — في انتظار إثبات الدفع' : 'Offer accepted — awaiting payment proof')
          : (isRTL ? 'تمت الموافقة على الإيداع' : 'Deposit approved')
      );
    } catch {
      toast.error(isRTL ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleReject = async (deposit) => {
    try {
      await pb.collection('deposits').update(deposit.id, { status: 'rejected' }, { $autoCancel: false });
      toast.success(isRTL ? 'تم رفض الإيداع' : 'Deposit rejected');
    } catch {
      toast.error(isRTL ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const getStatusLabel = (status) => ({
    pending:          isRTL ? 'قيد الانتظار'          : 'Pending',
    proof_submitted:  isRTL ? 'تم رفع الإثبات'       : 'Proof Submitted',
    bargaining:       isRTL ? 'جارٍ التفاوض'          : 'Negotiating',
    bargain_accepted: isRTL ? 'تمت الموافقة على العرض' : 'Offer Accepted',
    approved:         isRTL ? 'تمت الموافقة'          : 'Approved',
    rejected:         isRTL ? 'مرفوض'                 : 'Rejected',
    completed:        isRTL ? 'مكتمل'                 : 'Completed',
  })[status] || status;

  const getStatusColor = (status) => {
    if (status === 'approved' || status === 'completed') return 'text-green-400';
    if (status === 'bargain_accepted') return 'text-green-400';
    if (status === 'rejected') return 'text-red-400';
    return 'text-yellow-400';
  };

  const renderMessage = (msg) => {
    const isMine = msg.sender_id === currentUser.id;
    const content = msg.content || '';

    // Plain text message
    if (!content.startsWith('DEPOSIT_REQ|') && !content.startsWith('PAYMENT_PROOF|') && !content.startsWith('BARGAIN_OFFER|')) {
      return (
        <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
          <div className={`max-w-[72%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
            isMine
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-[#1c1c1c] border border-white/6 rounded-bl-sm'
          }`}>
            <p className="whitespace-pre-wrap break-words font-medium text-base">{content}</p>
          </div>
          <span className="text-[12px] text-white/60 mt-0.5 mx-1">{format(new Date(msg.created), 'HH:mm')}</span>
        </div>
      );
    }

    const parts = content.split('|');
    const msgType = parts[0];
    const depositId = parts[1];
    const deposit = deposits[depositId];
    const isTerminal = deposit?.status === 'approved' || deposit?.status === 'rejected' || deposit?.status === 'completed';

    if (msgType === 'DEPOSIT_REQ') {
      const amount = parts[2];
      return (
        <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} w-full`}>
          <div className="max-w-[85%] border border-primary/30 bg-primary/[0.08] rounded-2xl px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-[11px] uppercase tracking-wide">
              <Coins className="w-3.5 h-3.5" />
              {isRTL ? 'طلب إيداع' : 'Deposit Request'}
            </div>
            <p className="text-lg font-bold text-foreground">{amount} QI</p>
            {deposit?.notes && <p className="text-xs text-muted-foreground">{deposit.notes}</p>}
            <span className={`text-xs font-medium ${getStatusColor(deposit?.status || 'pending')}`}>
              {getStatusLabel(deposit?.status || 'pending')}
            </span>
            {!isTerminal && deposit && (
              <div className="flex gap-2 pt-1 flex-wrap">
                {!isSeller && deposit.status === 'pending' && (
                  <>
                    <button
                      onClick={() => { setActiveDeposit(deposit); setShowProofModal(true); }}
                      className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full hover:bg-primary/90 transition-colors"
                    >
                      {isRTL ? 'رفع إثبات الدفع' : 'Upload Proof'}
                    </button>
                    <button
                      onClick={() => { setActiveDeposit(deposit); setShowBargainModal(true); }}
                      className="text-xs border border-white/15 text-foreground px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors"
                    >
                      {isRTL ? 'طلب تفاوض' : 'Negotiate'}
                    </button>
                  </>
                )}
                {isSeller && deposit.status === 'proof_submitted' && (
                  <>
                    {deposit.payment_proof && (
                      <a
                        href={pb.files.getURL(deposit, deposit.payment_proof)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs border border-white/15 text-foreground px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors"
                      >
                        {isRTL ? 'عرض الإثبات' : 'View Proof'}
                      </a>
                    )}
                    <button onClick={() => handleApprove(deposit)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-500 transition-colors">
                      {isRTL ? 'موافقة' : 'Approve'}
                    </button>
                    <button onClick={() => handleReject(deposit)} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-full hover:bg-red-500 transition-colors">
                      {isRTL ? 'رفض' : 'Reject'}
                    </button>
                  </>
                )}
                {isSeller && deposit.status === 'bargaining' && (
                  <>
                    <span className="text-xs text-muted-foreground self-center">
                      {isRTL ? `العرض: ${deposit.bargain_amount} QI` : `Offer: ${deposit.bargain_amount} QI`}
                    </span>
                    <button onClick={() => handleApprove(deposit)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-500 transition-colors">
                      {isRTL ? 'قبول العرض' : 'Accept'}
                    </button>
                    <button onClick={() => handleReject(deposit)} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-full hover:bg-red-500 transition-colors">
                      {isRTL ? 'رفض' : 'Reject'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <span className="text-[12px] text-white/60 mt-0.5 mx-1">{format(new Date(msg.created), 'HH:mm')}</span>
        </div>
      );
    }

    if (msgType === 'PAYMENT_PROOF') {
      return (
        <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} w-full`}>
          <div className="max-w-[85%] border border-blue-500/30 bg-blue-500/[0.08] rounded-2xl px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-[11px] uppercase tracking-wide">
              <Upload className="w-3.5 h-3.5" />
              {isRTL ? 'إثبات الدفع' : 'Payment Proof'}
            </div>
            {deposit?.payment_proof && (
              <a
                href={pb.files.getURL(deposit, deposit.payment_proof)}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg overflow-hidden border border-white/10"
              >
                <img
                  src={pb.files.getURL(deposit, deposit.payment_proof)}
                  alt={isRTL ? 'إثبات الدفع' : 'Payment proof'}
                  className="max-h-40 w-full object-contain bg-black/30"
                />
              </a>
            )}
            <span className={`text-xs font-medium ${getStatusColor(deposit?.status || 'proof_submitted')}`}>
              {getStatusLabel(deposit?.status || 'proof_submitted')}
            </span>
            {!isTerminal && isSeller && deposit?.status === 'proof_submitted' && (
              <div className="flex gap-2 pt-1">
                <button onClick={() => handleApprove(deposit)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-500 transition-colors">
                  {isRTL ? 'موافقة' : 'Approve'}
                </button>
                <button onClick={() => handleReject(deposit)} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-full hover:bg-red-500 transition-colors">
                  {isRTL ? 'رفض' : 'Reject'}
                </button>
              </div>
            )}
          </div>
          <span className="text-[12px] text-white/60 mt-0.5 mx-1">{format(new Date(msg.created), 'HH:mm')}</span>
        </div>
      );
    }

    if (msgType === 'BARGAIN_OFFER') {
      const offerAmount = parts[2];
      return (
        <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} w-full`}>
          <div className="max-w-[85%] border border-orange-500/30 bg-orange-500/[0.08] rounded-2xl px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 text-orange-400 font-semibold text-[11px] uppercase tracking-wide">
              <TrendingDown className="w-3.5 h-3.5" />
              {isRTL ? 'عرض تفاوض' : 'Bargain Offer'}
            </div>
            <p className="text-lg font-bold text-foreground">{offerAmount} QI</p>
            {deposit && (
              <p className="text-xs text-muted-foreground">
                {isRTL ? `المبلغ الأصلي: ${deposit.amount} QI` : `Original: ${deposit.amount} QI`}
              </p>
            )}
            <span className={`text-xs font-medium ${getStatusColor(deposit?.status || 'bargaining')}`}>
              {getStatusLabel(deposit?.status || 'bargaining')}
            </span>
            {!isTerminal && deposit && (
              <div className="flex flex-col gap-2 pt-1">
                {isSeller && deposit.status === 'bargaining' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(deposit)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-500 transition-colors">
                      {isRTL ? 'قبول' : 'Accept'}
                    </button>
                    <button onClick={() => handleReject(deposit)} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-full hover:bg-red-500 transition-colors">
                      {isRTL ? 'رفض' : 'Reject'}
                    </button>
                  </div>
                )}
                {!isSeller && deposit.status === 'bargain_accepted' && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-green-400 font-medium">
                      {isRTL ? 'وافق البائع على عرضك! الرجاء رفع إثبات الدفع.' : 'Seller accepted your offer! Please upload payment proof.'}
                    </p>
                    <button
                      onClick={() => { setActiveDeposit(deposit); setShowProofModal(true); }}
                      className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full hover:bg-primary/90 transition-colors"
                    >
                      {isRTL ? 'رفع إثبات الدفع' : 'Upload Proof'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <span className="text-[12px] text-white/60 mt-0.5 mx-1">{format(new Date(msg.created), 'HH:mm')}</span>
        </div>
      );
    }

    return null;
  };

  if (convNotFound) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 text-muted-foreground px-6">
        <AlertCircle className="w-10 h-10 opacity-30" />
        <p className="text-sm text-center">
          {isRTL ? 'هذه المحادثة لم تعد موجودة.' : 'This conversation no longer exists.'}
        </p>
        <button onClick={onBack} className="text-xs text-primary underline underline-offset-2">
          {isRTL ? 'العودة إلى الرسائل' : 'Back to messages'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Chat header */}
      <div className="h-14 border-b border-white/6 bg-[#111] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/8 transition-colors -ml-1 shrink-0"
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          {loading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-28 h-4" />
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {otherUser?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <span className="font-semibold text-sm text-foreground">
                {otherUser?.name || otherUser?.email || '—'}
              </span>
            </>
          )}
        </div>

        {canRequestDeposit && otherUser && (
          <button
            onClick={() => setShowDepositModal(true)}
            className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors"
          >
            <Coins className="w-3.5 h-3.5" />
            {isRTL ? 'طلب إيداع' : 'Request Deposit'}
          </button>
        )}
      </div>

      {/* Messages — scrollable */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        {loading ? (
          <div className="space-y-4 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <Skeleton className={`h-9 rounded-2xl bg-white/5 ${i % 2 === 0 ? 'w-44' : 'w-52'}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 gap-2 py-20">
            <MessageSquare className="w-10 h-10 opacity-20" />
            <p className="text-xs">{isRTL ? 'ابدأ المحادثة' : 'Start the conversation'}</p>
          </div>
        ) : (
          messages.map((msg) => renderMessage(msg))
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-3 py-3 border-t border-white/6 bg-[#0f0f0f]">
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message…'}
            className="flex-1 h-10 rounded-full bg-[#1c1c1c] border border-white/8 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-colors"
            dir="auto"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            <Send className={`w-4 h-4 text-primary-foreground ${isRTL ? 'rotate-180' : 'ml-0.5'}`} />
          </button>
        </form>
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
      {activeDeposit && (
        <PaymentProofModal
          isOpen={showProofModal}
          onClose={() => { setShowProofModal(false); setActiveDeposit(null); }}
          deposit={activeDeposit}
          conversationId={conversationId}
          currentUserId={currentUser.id}
          otherUserId={otherUser?.id}
        />
      )}
      {activeDeposit && (
        <BargainOfferModal
          isOpen={showBargainModal}
          onClose={() => { setShowBargainModal(false); setActiveDeposit(null); }}
          deposit={activeDeposit}
          conversationId={conversationId}
          currentUserId={currentUser.id}
          otherUserId={otherUser?.id}
        />
      )}
    </div>
  );
};

// ─── Main MessagesPage ─────────────────────────────────────────────────────
const MessagesPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isRTL } = useLanguage();
  const { currentUser } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startingConv, setStartingConv] = useState(false);

  const tier = currentUser?.subscription_tier?.toLowerCase();
  const isObserver = !tier || tier === 'observer';

  // Handle "Contact Seller" navigation state
  useEffect(() => {
    if (!location.state?.sellerId || !currentUser || isObserver) return;
    const sellerId = location.state.sellerId;
    if (sellerId === currentUser.id) return;
    openOrCreateConversation(sellerId);
    window.history.replaceState({}, '');
  }, [location.state?.sellerId, currentUser]);

  const openOrCreateConversation = async (sellerId) => {
    setStartingConv(true);
    try {
      const existing = await pb.collection('conversations').getList(1, 1, {
        filter: `(user1_id="${currentUser.id}" && user2_id="${sellerId}") || (user1_id="${sellerId}" && user2_id="${currentUser.id}")`,
        $autoCancel: false,
      });
      if (existing.items.length > 0) {
        navigate(`/messages/${existing.items[0].id}`, { replace: true });
      } else {
        const conv = await pb.collection('conversations').create(
          { user1_id: currentUser.id, user2_id: sellerId },
          { $autoCancel: false }
        );
        navigate(`/messages/${conv.id}`, { replace: true });
      }
    } catch (err) {
      console.error('Error opening conversation:', err);
    } finally {
      setStartingConv(false);
    }
  };

  const fetchConversations = useCallback(async () => {
    if (!currentUser || isObserver) return;
    try {
      const recs = await pb.collection('conversations').getFullList({
        filter: `user1_id="${currentUser.id}" || user2_id="${currentUser.id}"`,
        sort: '-updated',
        $autoCancel: false,
      });
      setConversations(recs);

      // Batch-fetch the other participant's profile for each conversation
      const otherIds = [...new Set(
        recs.map(c => c.user1_id === currentUser.id ? c.user2_id : c.user1_id).filter(Boolean)
      )];
      if (otherIds.length > 0) {
        const filter = otherIds.map(id => `id="${id}"`).join(' || ');
        const users = await pb.collection('users').getFullList({ filter, $autoCancel: false });
        const map = {};
        users.forEach(u => { map[u.id] = u; });
        setUsersMap(map);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isObserver]);

  useEffect(() => {
    if (!currentUser || isObserver) { setLoading(false); return; }
    fetchConversations();

    pb.collection('conversations').subscribe('*', () => fetchConversations());

    return () => { pb.collection('conversations').unsubscribe('*'); };
  }, [currentUser]);

  const getOtherUser = (conv) => {
    const otherId = conv.user1_id === currentUser?.id ? conv.user2_id : conv.user1_id;
    return usersMap[otherId] || { id: otherId };
  };

  const filtered = conversations.filter((conv) => {
    if (!search.trim()) return true;
    const other = getOtherUser(conv);
    const q = search.toLowerCase();
    return (
      other?.name?.toLowerCase().includes(q) ||
      other?.email?.toLowerCase().includes(q)
    );
  });

  const handleBack = () => navigate('/messages');

  if (isObserver) {
    return (
      <>
        <Helmet>
          <title>{`Messages - ${t('brand.name')}`}</title>
        </Helmet>
        <div className="min-h-screen bg-background">
          <Header />
          <div
            className="flex items-center justify-center"
            style={{ height: `calc(100vh - ${NAVBAR_H}px)`, marginTop: NAVBAR_H }}
          >
            <div className="text-center text-muted-foreground px-4">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">
                {isRTL
                  ? 'المراسلة متاحة للأعضاء المدفوعين فقط'
                  : 'Messaging is available for paid members only'}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Messages - ${t('brand.name')}`}</title>
      </Helmet>

      {/* Fixed navbar */}
      <Header />

      {/* Full-height split layout, starts exactly below navbar */}
      <div
        className="flex overflow-hidden bg-background"
        style={{ height: `calc(100dvh - ${NAVBAR_H}px)`, marginTop: NAVBAR_H }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Centered container with side borders */}
        <div className="flex w-full max-w-5xl mx-auto border-x border-white/5 overflow-hidden">

          {/* ── Left: conversation list ─────────────────── */}
          <div
            className={`${
              conversationId ? 'hidden md:flex' : 'flex'
            } w-full md:w-80 lg:w-96 flex-col border-r border-white/5 bg-[#0a0a0a] shrink-0`}
          >
            {/* Search header */}
            <div className="shrink-0 px-4 pt-5 pb-3 border-b border-white/5">
              <h1 className="text-lg font-bold mb-3 text-foreground">
                {isRTL ? 'الرسائل' : 'Messages'}
              </h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isRTL ? 'بحث...' : 'Search…'}
                  className="w-full h-9 rounded-lg bg-[#141414] border border-white/8 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>
            </div>

            {/* Conversation list — scrollable */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {loading || startingConv ? (
                <div className="p-2 space-y-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-3">
                      <Skeleton className="w-10 h-10 rounded-full shrink-0 bg-white/5" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-28 bg-white/5" />
                        <Skeleton className="h-3 w-40 bg-white/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/30 gap-2">
                  <MessageSquare className="w-8 h-8 opacity-20" />
                  <p className="text-xs">
                    {isRTL ? 'لا توجد محادثات' : 'No conversations yet'}
                  </p>
                </div>
              ) : (
                filtered.map((conv) => {
                  const other = getOtherUser(conv);
                  if (!other) return null;
                  const isActive = conv.id === conversationId;
                  const isMySentLast = conv.last_message_sender_id === currentUser?.id;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => navigate(`/messages/${conv.id}`)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left ${
                        isActive
                          ? `bg-primary/10 ${isRTL ? 'border-l-2' : 'border-r-2'} border-primary`
                          : 'hover:bg-white/3'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {other.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-1">
                          <span className="text-sm font-semibold truncate text-foreground">
                            {other.name || other.email}
                          </span>
                          <span className="text-[12px] text-white/60 shrink-0">
                            {formatConvTime(conv.updated)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground/60 truncate mt-0.5">
                          {conv.last_message
                            ? `${isMySentLast ? (isRTL ? 'أنت: ' : 'You: ') : ''}${parseLastMessage(conv.last_message, isRTL)}`
                            : isRTL
                            ? 'لا توجد رسائل'
                            : 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right: chat or empty state ─────────────── */}
          <div
            className={`${
              !conversationId ? 'hidden md:flex' : 'flex'
            } flex-1 flex-col overflow-hidden bg-[#0d0d0d]`}
          >
            {conversationId ? (
              <ChatPanel
                key={conversationId}
                conversationId={conversationId}
                currentUser={currentUser}
                onBack={handleBack}
                isRTL={isRTL}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/25 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/6 flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 opacity-40" />
                </div>
                <p className="text-sm">
                  {isRTL ? 'اختر محادثة للبدء' : 'Select a conversation to start'}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default MessagesPage;
