export const translateToArabic = async (text) => {
  if (!text?.trim()) return text || '';
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ar`
    );
    if (!res.ok) return text;
    const data = await res.json();
    return data?.responseData?.translatedText || text;
  } catch {
    return text;
  }
};

// Translates an array of strings with limited concurrency to avoid rate limits
export const translateBatch = async (texts, concurrency = 8) => {
  const results = new Array(texts.length).fill('');
  for (let i = 0; i < texts.length; i += concurrency) {
    const slice = texts.slice(i, i + concurrency);
    const translated = await Promise.all(slice.map(translateToArabic));
    translated.forEach((t, j) => { results[i + j] = t; });
  }
  return results;
};
