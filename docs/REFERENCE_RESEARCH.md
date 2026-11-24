# Video-reference research before new episodes

This extends CONTENT_SYSTEM section 3. `scout.py` discovers and scores story links. It does not watch clips and is not a video-craft reviewer. No third-party Doomscroll package is required or installed.

## Operator workflow

1. Read recent TWK matched-age results and cover lessons. Search current tech/science explainers across YouTube Shorts, Instagram Reels and TikTok with permitted sources. Include smaller creators where discoverable. Record queries, native URLs, creator, platform and check time. Deduplicate URLs and topics. If a platform is inaccessible, record the actual failed access route rather than claiming coverage or requiring a paid product.
2. Review actual video evidence before ranking supported craft dimensions. Watch the opening, explanation, transitions and payoff. Record method and extent honestly. Sampled frames can support composition observations, not cut cadence or motion claims. A transcript does not establish hearing, delivery or sound design. Declare audio access separately. Never label a partial review as a full watch.
3. Assign AI/editorial usefulness scores from 0 to 5 for hook, pacing, visuals and platform fit. Each score needs a reason tied to observed moments. Use null for unassessed dimensions with the reason, notably pacing when only sampled frames were inspected. The output ranks mean assessed scores and shows coverage; do not compare unequal coverage as a matched benchmark. Never rank by views. This is an editorial judgment, not a growth prediction or a model inference API. No extra service is called by the validator.
4. Use view counts only with capture time and source. Claim creator-relative outperformance only with a defensible comparable same-creator set, similar format and publication age, and explicit limitations. Otherwise leave creator_baseline absent. No zero-fill for unavailable metrics, no ratio from incomparable clips.
5. Select lessons before the concept/storyboard. For each, say where it will inform TWK and what must not be copied. Study explanatory techniques, never lift scripts, assets, exact shots, music or identities. Discovery does not license reuse.
6. Put the report in the authored plan as `reference_research`, run `python scripts/reference_review.py --report <report.json>`, then `python scripts/new_episode.py --plan <plan.json>`. Both use the same validator. No reviewed video sequence means stop new creation and report the actual access gap, not fabricate observations. Keep researching unblocked sources.

## Report contract

- `stage`: `before_concept`
- `discovery_notes`: queries, dates, sources, deduping and platform access limits.
- `references`: list with unique `id`, native HTTPS `url`, `creator`, `platform`, `checked_at`, `access_notes`, `coverage` (`metadata_only`, `sampled_frames`, `sampled_sequence`, `motion_review`) and `audio` (`heard`, `not_heard`, `unavailable`).
- Every entry declares `extraction` for `video`, `metadata`, `transcript` and `audio`, each with `status` (`available`, `unavailable`, `not_attempted`) and `evidence` (retrievable source/artifact locator, method, access failure, or reason not attempted). Keep downloaded files private; record SHA-256 and exact extractor command in the evidence when files are available. Captions and auto-transcripts stay distinct from direct hearing.
- Sampled-sequence and motion-reviewed entries require available video evidence. They also require positive `duration_seconds`, `review_method` (extent included), `observations` with `at_seconds` and `observed` covering the hook and a later beat, and `scores` for hook/pacing/visuals/platform_fit, each with integer `value` 0-5 or null and `reason`. Sampled-sequence pacing must be null. Metadata-only or isolated-still coverage must not have scores.
- Optional `creator_baseline` must include `comparable_evidence` and `limitations`. This freeform evidence requires editorial scrutiny, not a mechanical sample-size blessing.
- `selected_lessons`: list with `reference_id`, `lesson`, `application` and `do_not_copy`, referring only to actual sequence-reviewed entries.

The validator checks record completeness, not whether a person or model truly watched a clip. Actual evidence review remains the operator's responsibility. It makes no network request, downloads nothing and requires no credentials. The gate is at new_episode.py creation, not a scheduler or a universal defense against manually bypassing that entry point. Approved ice/ANC videos, current render settings, labels, end cards, music and publication schedules are unchanged.

## Tested local evidence path

Run `python scripts/extract_reference.py --video <permitted-local-video> --output <new-private-directory> --interval 5 [--transcript <supplied-text>]`. Requires existing ffmpeg/ffprobe. It records SHA-256, probe metadata, timestamped frames and a16kHz mono audio WAV. It does not download, transcribe, watch or rank automatically. Inspect the extracted sequence; use an available audio/transcription reader and record whether it produced a transcript rather than direct auditory review. Preserve raw transcript provenance and errors. Do not commit external clips/audio to this public repository. See REFERENCE_ACCESS_TRIAL.md for actual test and limits.
