# Learnzur Create + Explore Spec

Create and Explore turn Learnzur into a learning, building, and sharing platform.

## Create

Learners can create code projects, animations, movies, and games. Code and game logic goes through San; animations, movies, thumbnails, and assets go through Media. Published projects are scanned by Flag and rewarded by Gamfy when safe. Senior learner selling can later go through Lanmat.

## Explore

Learners can browse approved public projects, search/filter, like, comment, and report. Public Explore is SEO-friendly and shows only approved public classes and public content.

## Required safety

- Learner must be authenticated.
- Learner can edit, delete, and publish only their own projects.
- Private/draft/unsafe projects never appear in Explore.
- Published projects and comments are scanned by Flag.
- Code runs inside Docker with 10MB RAM, 0.05 CPU, no host access, limited output, and timeouts.
- Explore hides private learner data and uses safe public cards.

## Required speed

- Code output streams without blocking UI.
- Autosave is debounced.
- Animation/movie rendering is queued.
- Thumbnails are generated asynchronously.
- Explore is paginated, cached, indexed, and mobile-first.
