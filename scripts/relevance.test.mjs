import { strict as assert } from 'node:assert';

import {
  extractTopicAnchors,
  isGenerationGrounded,
} from '../src/server/relevance.ts';

const aviationRequest = {
  script:
    "Most passengers panic when they hear about an engine failure. Pilots don't. Modern airliners are designed to fly safely even after losing one engine.",
  platform: 'Instagram Reels',
  tone: 'Clean',
  audience: 'Beginners',
  intensity: 'Safe',
  language: 'English',
  hookWindow: 5,
  mode: 'generate',
};

const frameworks = [
  'CURIOSITY GAP',
  'BOLD CLAIM',
  'PATTERN INTERRUPT',
  'STORY OPEN',
  'CONTROVERSY',
  'STAT SHOCK',
  'DIRECT CALLOUT',
  'COLD OPEN',
  'QUESTION HOOK',
  'STAKES FIRST',
];

const makeResponse = (text) => ({
  hooks: frameworks.map((framework, index) => ({
    framework,
    text,
    why: 'This stays grounded in the aviation source by using engine failure and pilot safety as the attention mechanism.',
    timecode: '00:00–00:05',
    scores: {
      curiosity: 80,
      clarity: 80,
      scroll_stop: 80,
      platform_fit: 80,
    },
    best_pick: index === 0,
  })),
});

assert.deepEqual(extractTopicAnchors(aviationRequest.script).slice(0, 4), [
  'engine',
  'passengers',
  'airliners',
  'designed',
]);

assert.equal(
  isGenerationGrounded(
    aviationRequest,
    makeResponse(
      'Engine failure sounds terrifying, but pilots train for exactly this.',
    ),
  ),
  true,
);

assert.equal(
  isGenerationGrounded(
    aviationRequest,
    makeResponse("You're probably editing your Reels completely wrong."),
  ),
  false,
);

assert.equal(
  isGenerationGrounded(
    aviationRequest,
    makeResponse(
      'Airliners are certified to fly thousands of hours with one engine out.',
    ),
  ),
  false,
);

const compareResponse = {
  mode: 'compare',
  compare: {
    winner: 'A',
    confidence: 90,
    summary: 'Test summary',
    analysis: {
      clarity: { winner: 'A', reason: 'Test' },
      curiosity: { winner: 'A', reason: 'Test' },
      emotion: { winner: 'A', reason: 'Test' },
      retention: { winner: 'A', reason: 'Test' },
    },
    improvedHook: 'Test hook',
  },
};

assert.equal(
  isGenerationGrounded(
    { ...aviationRequest, mode: 'compare', hookB: 'Test hook B' },
    compareResponse,
  ),
  true,
);

console.log('relevance tests passed');
