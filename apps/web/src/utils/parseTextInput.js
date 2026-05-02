
export const parseTextInput = (text, isRTL = false) => {
  if (!text) return [];
  
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const parsedData = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Split by comma and clean up each part
    const parts = line.split(',').map(part => part.trim());
    
    // We expect exactly 5 columns: email, name, tier, password, phone
    if (parts.length !== 5) {
      parsedData.push({
        _formatError: isRTL 
          ? `السطر ${i + 1} يجب أن يحتوي على 5 قيم مفصولة بفواصل بالضبط` 
          : `Line ${i + 1} must contain exactly 5 comma-separated values`,
        email: parts[0] || '',
        name: parts[1] || '',
        tier: parts[2] || '',
        password: parts[3] || '',
        phone: parts[4] || '',
        rowNumber: i + 1
      });
      continue;
    }
    
    parsedData.push({
      email: parts[0],
      name: parts[1],
      tier: parts[2],
      password: parts[3],
      phone: parts[4],
      rowNumber: i + 1
    });
  }
  
  return parsedData;
};
