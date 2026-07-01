import type {
  Audience,
  HookLanguage,
  HookWindow,
  Platform,
  Tone,
} from '../types/hooks';

export interface TemplateDefaults {
  platform: Platform;
  tone: Tone;
  audience: Audience;
  language: HookLanguage;
  hookWindow: HookWindow;
}

export interface ScriptTemplate {
  id: string;
  category: string;
  title: string;
  description: string;
  script: string;
  defaults: TemplateDefaults;
}

export const templateCategories = [
  'Fitness',
  'Finance',
  'Tech',
  'Study',
  'Business',
  'Personal Story',
] as const;

export type TemplateCategory = (typeof templateCategories)[number];

export const templates: ScriptTemplate[] = [
  // Fitness
  {
    id: 'fit-1',
    category: 'Fitness',
    title: '10k Steps a Day',
    description:
      'Walking 10,000 steps every day for 30 days. Here is what changed.',
    script:
      "I walked 10,000 steps every day for 30 days straight, and the results completely surprised me. I thought I would just lose weight, but my sleep quality improved drastically, and my resting heart rate dropped by 8 beats per minute. If you think walking isn't real exercise, you are missing out on the easiest health hack ever.",
    defaults: {
      platform: 'Instagram Reels',
      tone: 'Story',
      audience: 'Fitness',
      language: 'English',
      hookWindow: 5,
    },
  },
  {
    id: 'fit-2',
    category: 'Fitness',
    title: 'Stop Doing Crunches',
    description:
      'Why crunches are terrible for your back and what to do instead.',
    script:
      "Stop doing crunches immediately. You are literally destroying your lower back and pushing your posture out of alignment. If you want a strong core, you need to be doing anti-extension exercises like planks and dead bugs. Here is a 5-minute routine that is actually effective and won't leave you in pain.",
    defaults: {
      platform: 'TikTok',
      tone: 'Controversial',
      audience: 'Beginners',
      language: 'English',
      hookWindow: 5,
    },
  },

  // Finance
  {
    id: 'fin-1',
    category: 'Finance',
    title: 'Index Funds 101',
    description: 'The boring but guaranteed way to build wealth over time.',
    script:
      "Everyone is trying to day trade crypto, but the real millionaires are quietly buying index funds. If you put $500 a month into an S&P 500 index fund starting at age 25, you will retire with over a million dollars. It's boring, it takes time, but it works every single time. Here is exactly how to set it up today.",
    defaults: {
      platform: 'YouTube Shorts',
      tone: 'Clean',
      audience: 'Finance',
      language: 'English',
      hookWindow: 8,
    },
  },
  {
    id: 'fin-2',
    category: 'Finance',
    title: 'Credit Card Hacks',
    description: 'How to fly for free using everyday spending on credit cards.',
    script:
      "I haven't paid for a flight in three years, and no, I don't travel for work. I just run all my daily expenses through one specific travel credit card and pay it off immediately. The sign-up bonus alone covers a round trip to Europe. Let me show you the exact card strategy that gets you free flights without going into debt.",
    defaults: {
      platform: 'Instagram Reels',
      tone: 'Punchy',
      audience: 'Beginners',
      language: 'English',
      hookWindow: 5,
    },
  },

  // Tech
  {
    id: 'tech-1',
    category: 'Tech',
    title: 'iPhone Battery Drain',
    description: 'The hidden setting that is destroying your battery life.',
    script:
      'If your iPhone battery is draining way too fast, turn this hidden setting off right now. Go to Settings, Privacy, and scroll down to Analytics. Apple is constantly running diagnostics in the background, killing your battery life for no reason. Turn this off and watch your battery last an extra two hours every day.',
    defaults: {
      platform: 'TikTok',
      tone: 'Punchy',
      audience: 'Beginners',
      language: 'English',
      hookWindow: 5,
    },
  },
  {
    id: 'tech-2',
    category: 'Tech',
    title: 'AI Productivity',
    description: 'How I automate my boring tasks using AI agents.',
    script:
      "I use AI to do 40% of my boring weekly tasks, and it feels like cheating. Instead of manually sorting emails and generating weekly reports, I built a simple automation that does it all while I sleep. You don't need to know how to code to do this. Let me show you the exact three tools I use to save ten hours a week.",
    defaults: {
      platform: 'YouTube Shorts',
      tone: 'Clean',
      audience: 'Creators',
      language: 'English',
      hookWindow: 8,
    },
  },

  // Study
  {
    id: 'study-1',
    category: 'Study',
    title: 'Active Recall',
    description: 'The only study method scientifically proven to work.',
    script:
      'Rereading your notes is a complete waste of time. The only study method scientifically proven to actually work is active recall. Stop highlighting everything. Instead, read a page, close the book, and try to write down everything you remember. It feels harder, but that friction is literally your brain building the memory.',
    defaults: {
      platform: 'TikTok',
      tone: 'Controversial',
      audience: 'Beginners',
      language: 'English',
      hookWindow: 5,
    },
  },
  {
    id: 'study-2',
    category: 'Study',
    title: 'The Pomodoro Trap',
    description: 'Why the 25-minute timer might be ruining your focus.',
    script:
      'The Pomodoro technique is actually ruining your deep work. 25 minutes is barely enough time to get into a state of flow, and then the timer forces you to break focus. Instead, try the 90-minute block method. Work until you feel natural fatigue, then take a real break. Here is how to train your brain for 90-minute focus.',
    defaults: {
      platform: 'Instagram Reels',
      tone: 'Story',
      audience: 'Creators',
      language: 'English',
      hookWindow: 8,
    },
  },

  // Business
  {
    id: 'biz-1',
    category: 'Business',
    title: 'The $10k Offer',
    description: 'How to structure a premium offer that clients actually want.',
    script:
      "You aren't struggling to get clients because your marketing is bad. You are struggling because your offer is identical to everyone else in your industry. If you want to charge $10,000, you have to guarantee a specific outcome, not just sell your time. Here is the framework I use to create offers people feel stupid saying no to.",
    defaults: {
      platform: 'YouTube Shorts',
      tone: 'Punchy',
      audience: 'Business',
      language: 'English',
      hookWindow: 8,
    },
  },
  {
    id: 'biz-2',
    category: 'Business',
    title: 'Cold Email Masterclass',
    description: 'The one cold email template that actually gets responses.',
    script:
      "Stop sending cold emails that talk about yourself. Nobody cares about your company's awards. The only cold email template that works right now is hyper-personalized and strictly focused on their biggest problem. I sent 100 emails using this exact format and booked 14 meetings. Here is the word-for-word template.",
    defaults: {
      platform: 'TikTok',
      tone: 'Clean',
      audience: 'Business',
      language: 'English',
      hookWindow: 5,
    },
  },

  // Personal Story
  {
    id: 'story-1',
    category: 'Personal Story',
    title: 'Quitting My Job',
    description: 'The exact moment I knew I had to leave my corporate job.',
    script:
      "I was sitting in a windowless conference room at 8 PM on a Friday when I realized I was giving the best years of my life to a company that would replace me in a week. I didn't have a backup plan, but I knew I couldn't do it anymore. Quitting was terrifying, but here is why it was the best decision I ever made.",
    defaults: {
      platform: 'Instagram Reels',
      tone: 'Story',
      audience: 'Beginners',
      language: 'English',
      hookWindow: 8,
    },
  },
  {
    id: 'story-2',
    category: 'Personal Story',
    title: 'My First Failure',
    description: 'Losing all my savings on my first business idea.',
    script:
      'I lost my entire life savings on my first business idea because I built something nobody actually wanted. I spent six months coding in secret instead of talking to a single customer. It was humiliating, but it taught me the most important lesson about business. Never build before you sell. Here is what I do differently now.',
    defaults: {
      platform: 'YouTube Shorts',
      tone: 'Story',
      audience: 'Creators',
      language: 'English',
      hookWindow: 5,
    },
  },
];
