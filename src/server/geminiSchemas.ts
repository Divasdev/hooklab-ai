import { hookFrameworks } from '../types/hooks.js';

/** The OpenAPI subset Gemini accepts as `generationConfig.responseSchema`. */
export interface GeminiSchema {
  type: 'OBJECT' | 'ARRAY' | 'STRING' | 'INTEGER' | 'BOOLEAN';
  enum?: string[];
  items?: GeminiSchema;
  properties?: Record<string, GeminiSchema>;
  required?: string[];
  propertyOrdering?: string[];
  minItems?: number;
  maxItems?: number;
}

const text: GeminiSchema = { type: 'STRING' };
const integer: GeminiSchema = { type: 'INTEGER' };

const scores: GeminiSchema = {
  type: 'OBJECT',
  properties: {
    curiosity: integer,
    clarity: integer,
    scroll_stop: integer,
    platform_fit: integer,
  },
  required: ['curiosity', 'clarity', 'scroll_stop', 'platform_fit'],
  propertyOrdering: ['curiosity', 'clarity', 'scroll_stop', 'platform_fit'],
};

// Spoken text comes first so a streamed hook is readable as soon as it lands.
const hookFields = ['text', 'why', 'on_screen_text', 'visual', 'scores'];

const hook: GeminiSchema = {
  type: 'OBJECT',
  properties: {
    framework: { type: 'STRING', enum: [...hookFrameworks] },
    text,
    why: text,
    on_screen_text: text,
    visual: text,
    scores,
    best_pick: { type: 'BOOLEAN' },
  },
  required: ['framework', ...hookFields, 'best_pick'],
  propertyOrdering: ['framework', ...hookFields, 'best_pick'],
};

const hooks: GeminiSchema = {
  type: 'ARRAY',
  items: hook,
  minItems: hookFrameworks.length,
  maxItems: hookFrameworks.length,
};

export const hooksSchema: GeminiSchema = {
  type: 'OBJECT',
  properties: { hooks },
  required: ['hooks'],
};

export const roastSchema: GeminiSchema = {
  type: 'OBJECT',
  properties: {
    roast: {
      type: 'OBJECT',
      properties: {
        grade: text,
        bullets: { type: 'ARRAY', items: text, minItems: 4, maxItems: 6 },
        biggest_fix: text,
      },
      required: ['grade', 'bullets', 'biggest_fix'],
      propertyOrdering: ['grade', 'bullets', 'biggest_fix'],
    },
    hooks,
  },
  required: ['roast', 'hooks'],
  propertyOrdering: ['roast', 'hooks'],
};

export const rewriteSchema: GeminiSchema = {
  type: 'OBJECT',
  properties: { text, why: text, on_screen_text: text, visual: text, scores },
  required: hookFields,
  propertyOrdering: hookFields,
};

const verdict: GeminiSchema = {
  type: 'OBJECT',
  properties: { winner: { type: 'STRING', enum: ['A', 'B'] }, reason: text },
  required: ['winner', 'reason'],
  propertyOrdering: ['winner', 'reason'],
};

export const compareSchema: GeminiSchema = {
  type: 'OBJECT',
  properties: {
    winner: { type: 'STRING', enum: ['A', 'B'] },
    confidence: integer,
    summary: text,
    analysis: {
      type: 'OBJECT',
      properties: {
        clarity: verdict,
        curiosity: verdict,
        emotion: verdict,
        retention: verdict,
      },
      required: ['clarity', 'curiosity', 'emotion', 'retention'],
      propertyOrdering: ['clarity', 'curiosity', 'emotion', 'retention'],
    },
    improvedHook: text,
  },
  required: ['winner', 'confidence', 'summary', 'analysis', 'improvedHook'],
  propertyOrdering: [
    'winner',
    'confidence',
    'summary',
    'analysis',
    'improvedHook',
  ],
};
