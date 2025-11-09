import { RcReview, RcLocation, Team } from '@/lib/db/schema';

export type DraftGenerationOptions = {
  review: RcReview;
  location: RcLocation;
  brandVoice?: string;
  contactChannel?: string;
};

export type DraftResult = {
  text: string;
  wordCount: number;
  charCount: number;
  riskFlags: {
    hasUrl: boolean;
    hasProfanity: boolean;
    tooLong: boolean;
    missingDetail: boolean;
  };
};

// Profanity filter - basic list (expand as needed)
const PROFANITY_PATTERNS = [
  /\b(fuck|shit|damn|ass|bitch|crap)\b/gi,
];

// URL detection pattern
const URL_PATTERN = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-z0-9-]+\.(com|net|org|io|co)[^\s]*)/gi;

/**
 * Detects if text contains profanity
 */
function hasProfanity(text: string): boolean {
  return PROFANITY_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Detects if text contains URLs
 */
function hasUrl(text: string): boolean {
  return URL_PATTERN.test(text);
}

/**
 * Strips URLs from text
 */
function stripUrls(text: string): string {
  return text.replace(URL_PATTERN, '').trim();
}

/**
 * Masks profanity in text
 */
function maskProfanity(text: string): string {
  let masked = text;
  PROFANITY_PATTERNS.forEach((pattern) => {
    masked = masked.replace(pattern, (match) => match[0] + '*'.repeat(match.length - 1));
  });
  return masked;
}

/**
 * Counts words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Generates a draft reply using AI (Gemini)
 */
export async function generateDraft(
  options: DraftGenerationOptions
): Promise<DraftResult> {
  const { review, location, brandVoice, contactChannel } = options;

  // Build the prompt based on rating
  const isPositive = review.starRating >= 4;
  const reviewText = review.comment || 'No comment provided';

  let systemPrompt = `You are a professional business review response writer. Generate a reply to a Google Business Profile review.

STRICT REQUIREMENTS:
- Maximum 90 words (≤600 characters)
- Must reference ONE specific detail from the review
- Same language as the review
- Sign-off: "— ${location.name}"
- NO URLs, links, or promotional content
- NO requests for personal information
- Professional and authentic tone`;

  if (brandVoice) {
    systemPrompt += `\n- Brand voice: ${brandVoice}`;
  }

  let userPrompt = '';

  if (isPositive) {
    // 4-5 star review
    userPrompt = `Review (${review.starRating} stars): "${reviewText}"

Write an appreciative response that:
1. Thanks the reviewer by name if available
2. References ONE specific detail they mentioned
3. Reinforces what makes your business special
4. Sounds genuine, not generic`;
  } else {
    // 1-3 star review
    const contactInfo = contactChannel || 'contact us directly';
    userPrompt = `Review (${review.starRating} stars): "${reviewText}"

Write a professional response that:
1. Apologizes sincerely
2. Acknowledges the specific issue they raised
3. Invites them to ${contactInfo} to resolve the matter
4. Shows you take their feedback seriously
5. NO defensive language or excuses`;
  }

  try {
    // Call Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\n${userPrompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
            topP: 0.9,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate draft with AI');
    }

    const data = await response.json();
    let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!generatedText) {
      throw new Error('No text generated from AI');
    }

    // Post-processing: strip URLs and mask profanity
    generatedText = stripUrls(generatedText);
    generatedText = maskProfanity(generatedText);

    // Ensure it ends with the sign-off
    if (!generatedText.includes(`— ${location.name}`)) {
      generatedText = `${generatedText.trim()}\n\n— ${location.name}`;
    }

    // Trim to max length if needed
    const maxChars = 600;
    if (generatedText.length > maxChars) {
      generatedText = generatedText.substring(0, maxChars - 3) + '...';
    }

    const wordCount = countWords(generatedText);
    const charCount = generatedText.length;

    // Calculate risk flags
    const riskFlags = {
      hasUrl: hasUrl(generatedText),
      hasProfanity: hasProfanity(generatedText),
      tooLong: wordCount > 90 || charCount > 600,
      missingDetail: !checkHasSpecificDetail(generatedText, reviewText),
    };

    return {
      text: generatedText,
      wordCount,
      charCount,
      riskFlags,
    };
  } catch (error) {
    console.error('Error generating draft:', error);
    throw error;
  }
}

/**
 * Simple heuristic to check if the draft references specific details from the review
 * This is a basic implementation - can be improved with NLP
 */
function checkHasSpecificDetail(draft: string, review: string): boolean {
  // Extract potential key phrases from review (nouns, adjectives)
  const reviewWords = review
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 4); // Words longer than 4 chars

  const draftLower = draft.toLowerCase();

  // Check if at least one significant word from review appears in draft
  const hasMatch = reviewWords.some((word) => draftLower.includes(word));

  return hasMatch;
}

/**
 * Validates a draft against all guardrails
 */
export function validateDraft(text: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const wordCount = countWords(text);
  const charCount = text.length;

  if (wordCount > 90) {
    errors.push(`Draft is too long (${wordCount} words, max 90)`);
  }

  if (charCount > 600) {
    errors.push(`Draft is too long (${charCount} characters, max 600)`);
  }

  if (hasUrl(text)) {
    errors.push('Draft contains URLs (not allowed)');
  }

  if (hasProfanity(text)) {
    errors.push('Draft contains profanity');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
