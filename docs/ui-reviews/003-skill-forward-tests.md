# `$ui-ux-review` forward tests

These tests exercise routing and decision behavior; they are not production page approvals.

## Home hero and offer hierarchy

Mode: Critique Mode  
Fixture: hero with a generic factory claim, two customer links below the fold, and three equal offer cards  
Expected behavior: prioritize customer paths and remove unsupported proof rather than add decoration  
Observed: `EMPHASIZE` two customer paths, `REPLACE` instant-price language, `REMOVE` unsupported claims, and `MERGE` equal cards into a stage comparison. Backend/API behavior was untouched.  
Result: PASS

## Mobile quote-form improvement

Mode: Implementation Plan Mode  
Fixture: all quote fields displayed simultaneously with a sticky action covering consent  
Expected behavior: map the approved progressive form change to frontend files without changing the lead contract  
Observed: planned three visible stages, error-summary focus, safe-area handling, sticky-action omission on form routes, loading/idempotency UI, and explicit preservation of the Python API contract.  
Result: PASS

## Excessive gallery cards

Mode: Final Review Mode  
Fixture: every gallery image inside two nested rounded cards, each with a badge, icon, duplicate CTA, gradient, helper copy, and large empty padding  
Scores: task clarity 2; hierarchy 1; density 1; responsive 2; semantics/accessibility 2; consistency 1; maintainability 1  
AI-template smell: `HIGH` because repeated decoration competes with the work, creates nested containers, duplicates actions, and obscures editorial hierarchy.  
Gate result: FAIL. The skill correctly refuses approval and recommends removing wrappers/badges/icons, merging captions, and rebuilding hierarchy from image scale.

