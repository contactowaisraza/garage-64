
import { parseTextInput } from './parseTextInput.js';

export const parseAndValidateUsers = (data, source, isRTL = false) => {
  let parsedData = [];
  
  if (source === 'text') {
    parsedData = parseTextInput(data, isRTL);
  } else if (source === 'csv') {
    // Expect exactly 5 columns from CSV headers: email, name, tier, password, phone
    parsedData = data.map((row, index) => {
      const keys = Object.keys(row);
      const isIncorrectLength = keys.length > 0 && keys.length !== 5;
      
      return {
        email: row.email?.trim() || '',
        name: (row.name || row.username)?.trim() || '',
        tier: row.tier?.trim() || '',
        password: row.password?.trim() || '',
        phone: (row.phone || row.phone_number)?.trim() || '',
        rowNumber: index + 1,
        _formatError: isIncorrectLength ? (isRTL ? `يجب أن يحتوي السطر ${index + 1} على 5 أعمدة` : `Line ${index + 1} must contain exactly 5 columns`) : null
      };
    });
  }

  const validUsers = [];
  const invalidUsers = [];
  const seenEmails = new Set();
  const seenNames = new Set();

  // Name regex: Arabic characters, Latin letters, numbers, underscores, and spaces
  const NAME_REGEX = /^[\u0621-\u064a a-zA-Z0-9_]+$/;
  // Basic phone format (numbers, +, -, spaces, parentheses)
  const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;

  parsedData.forEach((user) => {
    const rowNumber = user.rowNumber;
    const errors = [];

    // Format error from parsing
    if (user._formatError) {
      errors.push(user._formatError);
    }

    // 1. Email validation
    if (!user.email || !/^\S+@\S+\.\S+$/.test(user.email)) {
      errors.push(isRTL ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format');
    } else if (seenEmails.has(user.email.toLowerCase())) {
      errors.push(isRTL ? 'بريد إلكتروني مكرر في الإدخال' : 'Duplicate email in input');
    } else {
      seenEmails.add(user.email.toLowerCase());
    }

    // 2. Name validation (Length 3-20 & specific characters)
    if (!user.name || user.name.length < 3 || user.name.length > 20 || !NAME_REGEX.test(user.name)) {
      errors.push(isRTL 
        ? 'صيغة الاسم غير صحيحة' 
        : 'Invalid name format. Use Arabic/Latin letters, numbers, underscores, and spaces only.'
      );
    } else if (seenNames.has(user.name.toLowerCase())) {
      errors.push(isRTL ? 'الاسم موجود بالفعل في الإدخال' : 'Name already exists in input');
    } else {
      seenNames.add(user.name.toLowerCase());
    }

    // 3. Tier validation
    const validTiers = ['hobbyist', 'collector', 'dealer', 'observer'];
    if (!user.tier || !validTiers.includes(user.tier.toLowerCase())) {
      errors.push(isRTL ? 'فئة غير صحيحة' : 'Invalid tier. Use: Hobbyist, Collector, or Dealer');
    }

    // 4. Password validation
    if (!user.password || user.password.length < 8) {
      errors.push(isRTL ? 'يجب أن تكون كلمة المرور 8 أحرف على الأقل' : 'Password must be at least 8 characters');
    }

    // 5. Phone validation (Optional)
    if (user.phone && !PHONE_REGEX.test(user.phone)) {
      errors.push(isRTL ? 'صيغة الهاتف غير صحيحة' : 'Invalid phone format');
    }

    const processedUser = {
      email: user.email,
      name: user.name,
      tier: user.tier ? user.tier.charAt(0).toUpperCase() + user.tier.slice(1).toLowerCase() : '',
      password: user.password,
      phone: user.phone,
      rowNumber
    };

    if (errors.length > 0) {
      invalidUsers.push({ ...processedUser, errors });
    } else {
      validUsers.push(processedUser);
    }
  });

  return {
    validUsers,
    invalidUsers,
    summary: {
      totalLines: parsedData.length,
      validCount: validUsers.length,
      errorCount: invalidUsers.length
    }
  };
};
