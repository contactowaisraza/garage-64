
export const calculateDaysRemaining = (endDate) => {
  if (!endDate) return null;
  const end = new Date(endDate);
  const today = new Date();
  const diffTime = end - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isSubscriptionActive = (user) => {
  if (!user || user.subscription_status !== 'approved') return false;
  const days = calculateDaysRemaining(user.subscription_end_date);
  return days !== null && days >= 0;
};

export const isSubscriptionExpired = (user) => {
  if (!user || !user.subscription_end_date) return false;
  const days = calculateDaysRemaining(user.subscription_end_date);
  return days !== null && days < 0;
};

export const getTierRank = (tier) => {
  const rankMap = {
    dealer: 1,
    collector: 2,
    hobbyist: 3,
    observer: 4
  };
  return rankMap[tier?.toLowerCase()] || 99;
};

export const formatTierName = (tier) => {
  if (!tier) return 'Unknown';
  const names = {
    observer: 'Observer',
    hobbyist: 'Hobbyist',
    collector: 'Collector',
    dealer: 'Dealer'
  };
  return names[tier.toLowerCase()] || tier.charAt(0).toUpperCase() + tier.slice(1);
};
