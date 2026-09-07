# Resume Analyzer and Dashboard upgrade

## Outcome
Make resume analysis dependable for PDF/DOC/DOCX uploads, save complete result data, and give new users a useful dashboard without mixing demo values into real data.

## Work
- Extend the resume analysis contract and persisted record with category scores, detected skills, placement readiness, and extracted-content status.
- Add robust upload validation, selected-file/status states, readable error and retry states, and a detailed analysis result view.
- Use the existing AI gateway to analyze the uploaded file content, reject empty/unreadable inputs, and never render a result when analysis fails.
- Add replaceable dashboard fallback metrics, skill/learning/readiness charts, and recent activity that disappear or update as real records exist.
- Keep existing navigation, authentication, styling, and mutations; invalidate relevant queries after a saved analysis.
- Verify with a production build and browser checks for resume navigation, upload states, failure handling, and dashboard rendering.

## Technical details
- Use the existing `resume_analyses` table and add only the missing analysis fields through a migration with grants/RLS preserved.
- Keep file bytes and extraction inside the existing server function boundary; do not expose secrets or create a new edge function.
- Use design tokens and existing glass/card/button components.
