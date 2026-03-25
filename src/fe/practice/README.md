# Practice Feature

Place practice-specific UI, data, and services here.

Temporary local judging notes:

- Practice submissions are persisted in `PracticeRunRecord`
- Live updates use SSE from `/api/practice/submissions/:submissionId/stream`
- Gemini is backend-only and is used for conservative code understanding and feedback, not real execution
