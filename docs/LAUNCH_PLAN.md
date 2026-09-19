# HookLab.AI release and launch plan

## Product promise

Help a short-form creator choose and improve their opening before recording.
Initial audience hypothesis: solo educational creators publishing multiple
times a week. Validate this with creator interviews before broadening it.
Success means creators actually use a chosen hook and come back for another
video. Traffic, generated-hook counts, and model scores alone do not show that.

## This release

- Individual saves across Generate, Roast, Compare winner and improved hook.
- Search, platform filters, labels, selection, copy and CSV export.
- Reuse saved hooks in Roast; load two saved hooks into Compare.
- Download branded PNG hook cards for sharing.
- Explain score dimensions and label scores as AI estimates.
- Remove public diagnostics, reduce sensitive logs, fix local outline routing
  and production timeout, and protect successful results from storage failures.
- Regression checks for saved data, safe CSV export, expansion, key rotation,
  per-process limits and mobile/desktop workflows.

## Release checks

1. Run `npm run check` and the browser smoke test documented below.
2. Test real Gemini requests in Generate, Roast, Compare, Rewrite and Expand
   in a deployment preview. Automated browser tests mock model responses and
   therefore do not prove output quality or production keys.
3. Confirm the debug endpoint is absent from the deployed functions.
4. Have five creators complete a real video task, including one mobile user.
   Record confusing steps, failed requests, and whether they use the chosen hook.
5. Publish after reviewing the deployment preview. Monitor platform request
   failures and quota usage without logging scripts or generated text.

## Next development decisions

| Priority | Work                                               | Evidence needed                                            |
| -------- | -------------------------------------------------- | ---------------------------------------------------------- |
| Next     | Private feedback and usage measurement             | Define consent and events; never send scripts or hook text |
| Next     | Durable server-side rate limits and spend controls | Choose a provider and monthly budget                       |
| Next     | Output-quality evaluation set                      | Collect 30 permissioned ideas across languages and niches  |
| Later    | Backup/import and cross-device library             | Users losing or switching browsers                         |
| Later    | Dedicated platform search pages                    | Search demand and distinct examples/content                |
| Later    | Daily practice challenges                          | Returning creators ask for learning/practice               |
| Later    | Paid volume or team features                       | Repeat usage and willingness to pay                        |

Keep the existing zero-gating policy. Pricing, accounts, PWA installation,
creator memory, and scheduling need separate product decisions. Do not claim
scores predict views, retention, or guaranteed viral outcomes.

## First 14 days of marketing

These are proposed experiments and targets, not conversion benchmarks.

| Days  | Action                                                            | What to record                                          |
| ----- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| 1-2   | Observe five creators using their own scripts                     | Time to chosen hook, confusion, useful/unusable outputs |
| 3-5   | Publish three before/after hook teardowns                         | Qualified visits, meaningful questions, creator trials  |
| 6-7   | Offer five personal hook audits to relevant creators              | Replies, whether they record with the result            |
| 8-10  | Publish two permissioned case studies and a short workflow demo   | Repeat visits and voluntary creator feedback            |
| 11-14 | Repeat the strongest content format and interview returning users | Why they returned, what they used, what they would miss |

Each teardown: show the original hook, identify one specific weakness, show
two alternatives, explain the tradeoff, then demonstrate choosing and saving
one in HookLab. Use an actual screen recording. End with one clear invitation
to try a real script. Adapt language and examples to the creator niche.

Suggested first posts:

1. A vague opening transformed into a specific promise.
2. A curiosity hook that still tells viewers what the video is about.
3. Two hooks for the same topic: a claim versus a story opening.
4. A hook that overpromises, rewritten to match the actual footage.
5. From chosen hook to four structural beats for a short video.

Share relevant examples in communities only where promotion is allowed.
Ask permission before publishing anyone's script, screenshot, testimonial,
or performance data. Use campaign links to separate content experiments;
evaluate trends against your own first-week baseline. Avoid paid acquisition
until interviews show the workflow reliably helps the intended audience.

TikTok's official creative guidance recommends a hook/body/close structure
and platform-native production. It concerns advertising; treat it as a
creative starting point, not proof that HookLab improves organic performance.
Source: [TikTok Creative Codes](https://ads.tiktok.com/business/en/blog/creative-best-practices-top-performing-ads).

## Browser regression test

Start `npm run dev -- --port 5174`, then run `node scripts/ui-smoke.mjs` with
Playwright installed. A bundled installation can be supplied through
`PLAYWRIGHT_MODULE`; `TEST_BASE_URL` overrides the default preview address.
Set `PLAYWRIGHT_CHANNEL=chrome` to use an installed Google Chrome browser.
Screenshots and downloaded exports go to a temporary test directory.
The test uses its own isolated browser context and synthetic scripts.
