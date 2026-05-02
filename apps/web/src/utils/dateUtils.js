
export const calculateEndDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString();
};
