# HookLab.AI API Reference

This document outlines the serverless API endpoints powering HookLab.AI.

## Endpoints

### 1. `POST /api/generate-hooks`

Analyzes a video script or topic idea and generates 10 high-performing hook frameworks.

#### Request Body
```json
{
  "script": "String (required): The transcript or core video concept (10-1500 words)",
  "platform": "String (optional): 'Instagram Reels' | 'TikTok' | 'YouTube Shorts' (default: 'Instagram Reels')",
  "tone": "String (optional): 'Clean' | 'Spicy' | 'Story' | 'Data-Driven'",
  "audience": "String (optional): 'Beginners' | 'Founders' | 'Mass Audience'",
  "intensity": "String (optional): 'Safe' | 'Punchy' | 'Extreme'",
  "language": "String (optional): 'English' | 'Hindi' (default: 'English')",
  "hookWindow": "Number (optional): 5 | 8 (default: 5)"
}
```

#### Response (200 OK)
```json
{
  "hooks": [
    {
      "framework": "CURIOSITY GAP",
      "text": "The single mistake costing founders their first $10k.",
      "why": "Creates an immediate information gap that demands resolution.",
      "timecode": "00:00–00:05",
      "scores": {
        "curiosity": 94,
        "clarity": 88,
        "scroll_stop": 92,
        "platform_fit": 90
      },
      "best_pick": true
    }
  ],
  "roast": {
    "weakness": "Explanation of the original script's retention bottlenecks",
    "tip": "Actionable takeaway for better viewer retention"
  }
}
```

### 2. `POST /api/rewrite-hook`

Rewrites a single hook with a specific tone or focus adjustment.

### 3. `POST /api/expand-hook`

Expands an approved hook into a structured 30-60 second video script outline.
