import { track } from '@vercel/analytics';

/**
 * Product events carry only categories (mode, platform, framework, outcome),
 * never scripts or hook text, in line with the client-privacy decision.
 */
type EventProperties = Record<string, string | number | boolean>;

export type ProductEvent =
  | 'hooks_generated'
  | 'hook_copied'
  | 'hook_saved'
  | 'hook_shared'
  | 'hook_image_saved'
  | 'hook_rewritten'
  | 'outline_built'
  | 'practice_finished'
  | 'results_exported'
  | 'template_used'
  | 'shared_link_opened';

export const trackEvent = (
  event: ProductEvent,
  properties?: EventProperties,
): void => {
  try {
    track(event, properties);
  } catch {
    /* Analytics must never break the product. */
  }
};
