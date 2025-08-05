export async function callGeminiAPI(prompt: string): Promise<string> {
  // The API key is handled by the environment and should not be hardcoded.
  const apiKey = '';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
  const payload = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const result = await response.json();
    return (
      result.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No content returned from API.'
    );
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return 'Sorry, the AI is taking a coffee break. Please try again later.';
  }
}
