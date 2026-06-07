# Learnzur Creation Studio

The learner creation area gives ages 8-18 a safe, simplified studio for videos, animations, mini movies, games, code, storyboards, and posters.

Every creation page uses the same communication path: SvelteKit page -> `frontend/src/lib/api.ts` -> `/api/media`, `/api/san`, `/api/flag`, `/api/find`, or `/api/lanmat` -> Golang API routes -> engine boundary.

Child-friendly editing features included across the studio:

1. Scene cards for planning.
2. Scene order editing.
3. Colour mood picker.
4. Character notes.
5. Caption writing.
6. Voice or narration notes.
7. Music mood selection.
8. Sticker and icon layer notes.
9. Safe title and description checker.
10. Preview checklist.
11. Save draft.
12. Render request.
13. Publish or teacher review flow.
14. Parent/teacher safety status.

The UI avoids complex professional editing language and uses clear verbs such as save, render, add scene, remove scene, and run safely.
