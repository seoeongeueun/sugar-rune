# Sugar Heart

An interactive magical diary inspired by _Sugar Sugar Rune_. Users write diary entries, unlock the heart pendant with gesture and voice input, and collect emotion-based hearts that contribute to their witch rank.

Sugar Heart started as a personal recreation of the anime's heart pendant and grew into a full web application with 3D interaction, authentication, AI emotion classification, persistent diary data, and a custom postcard-style writing interface.

![Sugar Heart preview](/public/images/main.png)
![Sugar Heart preview](/public/images/heart.gif)

## Tech Stack

### Frontend

- Vite
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand for local UI state
- TanStack Query for server-state caching
- React Hook Form for auth and diary forms
- React Three Fiber, Drei, and Three.js for the 3D pendant scene
- GSAP for modal, postcard, and deletion animations
- MediaPipe Tasks Vision for browser hand tracking
- Web Speech API for voice spell recognition
- Pretext for custom text layout around stamps

### Backend and Services

- Supabase Authentication
- Supabase PostgreSQL for users, notes, hearts, stamps, and profile data
- Row Level Security for user-owned diary data
- PostgreSQL triggers for derived profile values such as total notes and Ecru
- AWS API Gateway
- AWS Lambda on Node.js
- Amazon Bedrock, using Nova Micro for diary emotion classification


## Architecture

```text
React + Vite client
  |
  |-- Supabase Auth
  |-- Supabase PostgreSQL
  |     |-- users
  |     |-- notes
  |     |-- stamps JSON
  |     |-- profile counters / Ecru
  |
  |-- Browser APIs
  |     |-- MediaPipe hand tracking
  |     |-- Web Speech API
  |
  |-- AWS API Gateway
        |
        |-- Lambda: analyze-note
              |
              |-- Amazon Bedrock Nova Micro
```


## Major Features

### 3D Heart Pendant
![녹화_2026_04_09_22_38_56_897](https://github.com/user-attachments/assets/644d1f51-f8a3-4efd-9c9d-e2b1e1d9d3ed)
<img width="1484" height="868" alt="image" src="https://github.com/user-attachments/assets/be1104be-d89a-46d7-8fc3-9655725d4093" />

**Stack:** Blender, Three.js, React Three Fiber, Drei, GSAP

The main screen is built around a custom heart pendant from Sugar Sugar Rune rendered in a real-time Three.js scene. I modeled the 3d heart pendant and the heart gems myself using Blender.

**Technical implementation:**

- Loads a custom `.glb` model with Drei's `useGLTF` and clones the scene safely before mutating mesh properties.
- Uses `useFrame` to animate the pendant with frame-based interpolation instead of relying on fixed-duration CSS animation.
- Builds custom Three.js `ShapeGeometry` particles for floating hearts and stars, then updates position, opacity, rotation, and scale over each particle's lifetime.
- Derives particle color from the currently selected diary heart, connecting application state to the 3D scene.
- Uses React Three Fiber for declarative scene composition while still applying low-level Three.js controls where direct mesh/material mutation is more efficient.

### Gesture and Spell Unlock

![Sugar Heart preview](/public/images/spell.png)

**Stack:** MediaPipe Tasks Vision, Web Speech API, Canvas 2D, React hooks

Sugar Heart includes a browser-native unlock flow that combines hand tracking and voice recognition.

**Technical implementation:**

- Initializes MediaPipe Hand Landmarker with local WASM assets and a hosted hand landmark model.
- Runs detection in `VIDEO` mode inside a `requestAnimationFrame` loop for continuous gesture tracking.
- Implements a custom victory-sign classifier from raw hand landmarks by checking finger extension, horizontal alignment, and folded ring/pinky state.
- Starts a bounded Web Speech API session only after the gesture is detected in lock mode.
- Normalizes the saved spell and transcript before comparison to reduce false negatives from casing and spacing.

### Diary and Calendar

![Sugar Heart preview](/public/images/calendar.png)

**Stack:** Supabase, TanStack Query, Zustand, React, TypeScript

Diary entries are date-based and organized through a query-backed calendar interface.

**Technical implementation:**

- Fetches notes by `userId` and year range using Supabase queries with `gte` / `lt` date filters.
- Uses TanStack Query keys structured by user and year so calendar data can be cached and invalidated precisely.
- Maps fetched notes into a date-indexed lookup for efficient calendar rendering.
- Opens either an existing note or a new note draft through a Zustand note store, keeping transient UI state outside the server cache.
- Updates note lists and profile data through targeted query invalidation after create, update, and delete operations.
- Supports year/month navigation, keyboard month switching, and automatic selection of today's date or the currently open note date.

### AI Emotion Analysis

![Sugar Heart preview](/public/images/postcard_front.png)

**Stack:** AWS Lambda, AWS API Gateway, Amazon Bedrock Nova Micro, TypeScript, Supabase

When a diary entry is saved, the app classifies its dominant emotion into one predefined heart category.

**Technical implementation:**

- Calls Amazon Bedrock's Converse API from a dedicated Node.js Lambda package.
- Constrains the model to return JSON with exactly `color`, `label`, and `confidence`.
- Extracts and parses the JSON object from the model response, then validates color, label pairing, and confidence range.
- Performs a second client-side validation pass before storing the returned heart color.

### Heart Collection and Ecru

![Sugar Heart preview](/public/images/rank.png)

**Stack:** Supabase PostgreSQL, database triggers, TanStack Query

Each emotional category maps to a collectible heart color and an Ecru value.

| Heart | Emotion | Ecru |
| --- | --- | ---: |
| ❤️ | Love | 5000 |
| 🩷 | Affection | 1000 |
| 💛 | Surprise | 5 |
| 💚 | Friendship | 350 |
| 🩵 | Family | 350 |
| 💜 | Lust / Desire | 2500 |
| 🖤 | Hatred / Fear | 1000 |
| 🤍 | Purity | 1000 |

Ecru is used to progress through witch ranks

**Technical implementation:**

- Uses heart color as the stable domain value connecting AI classification, UI rendering, database records, and calendar icons.
- Maintains derived profile values such as total notes and Ecru through backend database automation rather than recalculating everything in the client.
- Invalidates profile queries after note changes so rank and Ecru displays stay consistent with saved diary data.

### Postcard Writing Interface

![Sugar Heart preview](/public/images/stamp.png)

**Stack:** React, TypeScript, Chenglou Pretext, Tailwind CSS, React Hook Form, Supabase

Diary entries are presented as interactive postcards with editable text, saved stamps, and custom text wrapping.

**Technical implementation:**

- Uses React Hook Form for editing note content while keeping the current draft synchronized with local component state.
- Stores stamp data with each note as structured JSON containing `id`, `pageIndex`, `size`, `x`, and `y`.
- Saves stamp centers as percentages of the postcard surface so positions scale with the rendered card.
- Uses Pretext to measure and lay out text line-by-line instead of relying on normal browser text flow.
- Computes available text slots for each line by subtracting circular stamp obstacles from the paragraph width.
- Paginates text when it overflows the available postcard height.
- Scales stamp size and text collision radius from the desktop postcard design width, keeping the composition consistent across mobile and desktop.

### Animation Details

![Sugar Heart preview](/public/images/postcard_back.png)


**Stack:** GSAP, CSS transforms, React refs, Tailwind CSS

GSAP is used for UI transitions that need more control than simple CSS transitions:

- Auth, calendar, and postcard modal entrance animations.
- 3D-looking postcard open and close behavior.
- A delete animation where the postcard visually splits before closing.

**Technical implementation:**

- Uses GSAP contexts scoped to component refs so animations are reverted cleanly on unmount.
- Temporarily disables conflicting CSS transitions during delete animation so GSAP can control transform state directly.
- Animates opacity, scale, rotation, and transform origin to make modals and postcards feel physical without introducing extra routing complexity.
- Uses a separate `PostCardCut` overlay to perform the split-card delete animation while the original postcard fades out.

### Authentication and Data Ownership

**Stack:** Supabase Auth, Supabase PostgreSQL, Row Level Security, TanStack Query, React Hook Form

Users authenticate with email/password and own their diary data through Supabase.

**Technical implementation:**

- Uses Supabase Auth sessions to determine the active user and admin state.
- Listens for auth state changes and clears note/profile query caches on sign out.
- Uses React Hook Form validation for login and signup inputs.
- Separates user profile fetching from auth session state so profile-derived values such as Ecru, rank, lock mode, and spell can be cached independently.
- Uses optimistic mutation behavior for lock-mode updates, with rollback on error.

## Technical Highlights

- AI output is schema-checked on both the Lambda and client side before it affects user data.
- Server state is isolated behind feature modules such as `notes`, `userProfile`, and `analyzeNote`.
- Zustand stores handle UI-specific state for auth, calendar, and the currently open note without overloading server-state cache.
- The gesture detector separates camera lifecycle, hand landmark processing, speech recognition, drag state, and persisted position handling.
- The postcard text system computes available slots per line, subtracts circular stamp obstacles, and paginates text when it overflows.
- Uses Pretext to measure text width, calculate line breaks, and drive custom postcard text wrapping around interactive stamp obstacles.
