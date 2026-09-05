Yes — below is a **single master coding prompt** you can paste into Cursor, Claude Code, Codex, Windsurf, Replit Agent, Bolt, or another coding agent to build the complete assignment.

I’ve written it so the coding AI understands the **product requirement, exact UI flow from the screenshots, voice interaction, AI logic, backend, frontend, database, structured outputs, essay-word allocation, academic-integrity constraints, demo requirements, and deployment expectations**.

```text
You are a senior full-stack AI engineer, product architect, UX engineer, and ML/LLM engineer.

Build a COMPLETE, production-quality working prototype for the following assignment.

Do not build a mock-only UI.
Do not build a generic chatbot.
Do not hardcode the final conversation.
Do not generate fake student life stories.
Do not skip backend implementation.
Do not make microphone buttons decorative.
Do not change the overall visual language of the supplied reference screenshots.

The application must work end-to-end.

============================================================
PROJECT
============================================================

Project Name:
Hello Ivy – Voice-Based AI Essay Brainstormer

Optional internal project name:
Ivy Essay Brainstormer

Product tagline:
"Your story. Your voice. Your essay strategy."

This application is designed for high-school students preparing college essays.

The AI must conduct a natural VOICE conversation with the student, ask adaptive questions about the student's real life experiences, identify useful stories, values, character traits, skills, perspectives and future ambitions, and then generate an ESSAY STRUCTURE / STRATEGY with an EXACT word-budget breakdown.

The system must NOT simply write the essay for the student.

It should act like an intelligent admissions/essay brainstorming coach.

============================================================
ASSIGNMENT REQUIREMENT
============================================================

Essay Prompt:

"How has your life experience contributed to your personal story—your character, values, perspectives, or skills—and what you want to pursue at (this college)?"

Word Limit:
350 words

The AI should:

1. Understand the essay prompt.
2. Identify what information is required from the student.
3. Conduct a voice-based interview.
4. Ask questions about the student's real life experiences.
5. Ask adaptive follow-up questions based on the student's answers.
6. Discover meaningful events, challenges, achievements, relationships, motivations, failures, values, character traits, perspectives, skills and future goals.
7. Determine the strongest possible story/angle.
8. Ask additional questions whenever important information is missing.
9. Build a structured profile from the conversation.
10. Generate an essay strategy.
11. Produce an exact 350-word essay structure broken into sections.
12. Explain why the selected story works.
13. Show which student statements/evidence support each inferred value/skill.
14. Never invent experiences or attributes not supported by the student's conversation.

No human intervention should be required during the workflow.

============================================================
REFERENCE UI
============================================================

Use the supplied reference screenshots as the main UI/UX reference.

Reference assets/screens include:

1.png
2.png
3.png
3(1).png
Ivy animation.gif

The UI should closely reproduce the provided Hello Ivy visual style.

Important characteristics:

- Very light blue/white background
- Minimal white application canvas
- Small Hello Ivy logo at top-left
- "New Essay Brainstorming" title
- College + essay title displayed beside it
- Rounded word-count badge
- Profile avatar in top-right
- Thin, elegant borders
- Soft pastel gradients
- Purple / blue / cyan / pink gradient accents
- Rounded cards
- Small typography
- Large whitespace
- Premium education SaaS aesthetic
- No dark dashboard look
- No generic ChatGPT UI
- No huge side navigation

Main gradient identity:
purple → blue → cyan → subtle pink

Use the provided Ivy animation.gif as the visual inspiration or actual assistant animation where technically appropriate.

============================================================
SCREEN FLOW
============================================================

The application should support the following screens/states.

------------------------------------------------------------
SCREEN 1 – INITIAL / EMPTY BRAINSTORMING SESSION
------------------------------------------------------------

Reproduce the initial reference screen.

Header:

Hello Ivy logo

Title:
New Essay Brainstorming

Context:
[College Name], Essay 1: Personal Story

Badge:
350 words

Top-right:
timer/status icon
student avatar
dropdown icon

Below header:

INSTRUCTIONS CARD

Title:
Instructions

Content:

1. This is a short, focused voice session designed to understand your story.
2. Ivy will ask questions about your experiences, values, perspectives, skills and goals.
3. Based only on your answers, Ivy will create a strong essay strategy aligned with the prompt.
4. Ivy will not invent experiences or write a fake story for you.

Include:
"Read more"

Include an outlined:
Listen button

The Listen button must trigger TTS and read the instructions.

Below:

MAIN CONVERSATION CARD

Header:
Let's start building the essay structure

Right side:
session timer, e.g.
05:13 mins

Main empty state:

Display Ivy animated assistant.

Initial AI text:
"Hey! I'm Ivy. I'll help you discover the strongest story for this essay. We won't write the essay yet — first, I'd like to understand you."

Then AI asks:
"Think about an experience that changed the way you see yourself. What comes to mind?"

At bottom:

Text input fallback:
"Write your response here..."

Microphone button.

Primary interaction should be voice.

When microphone is active show:
Listening...
animated waveform
timer
Stop button

The user can either speak or type.

------------------------------------------------------------
SCREEN 2 – INFORMATION CAPTURE
------------------------------------------------------------

Match the supplied Information Capture screen.

Card title:

Information Capture

Show progress:

Example:
3 / 7 areas explored

or:
5/7 questions answered

Do not hardcode exactly 5 questions.
Conversation should determine how many questions are needed.

The UI can still show a progress representation.

Show conversational transcript vertically.

Every AI message should have the Ivy assistant icon.

Every student message should have a circular avatar or "A" avatar similar to screenshot.

At the bottom:
voice/text composer.

Right/bottom action:
Preview Answers →

Questions should cover information such as:

- Life experiences
- Important challenges
- Achievements
- Failure / setback
- Meaningful relationship/person
- Family/community context where relevant
- Values
- Skills
- Perspective changes
- Motivation
- Future academic/career interest
- Why the target college fits
- Long-term aspiration

But the conversation MUST NOT be a static questionnaire.

Questions must be generated dynamically.

------------------------------------------------------------
SCREEN 3 – ACTIVE BRAINSTORMING / TWO-COLUMN VIEW
------------------------------------------------------------

This is one of the main screens.

Use the exact layout style from screenshot 3.

Top of card:
Let's start building the essay structure

Timer on right.

Main card content split into two columns.

LEFT COLUMN:
Conversation

RIGHT COLUMN:
Live Essay Strategy

LEFT COLUMN should show:

AI question
student response
AI follow-up
student response
etc.

RIGHT COLUMN should update dynamically as the conversation develops.

Example right-side information:

Potential Core Story
Community volunteering technology project

Current Theme
Technology became meaningful when it solved a real human problem.

Values identified
- empathy
- initiative
- responsibility

Skills identified
- software development
- communication
- problem solving

Perspective Shift
"Technology is not just about coding; it is about understanding people."

Still Missing
- clearer emotional impact
- future study goal
- specific college connection

Do not show unsupported values.

Every displayed insight must originate from transcript evidence.

At bottom:
Review & Edit Structure →

The button should remain disabled until the conversation has sufficient evidence.

------------------------------------------------------------
SCREEN 4 – STORY REVIEW / PREVIEW ANSWERS
------------------------------------------------------------

Create an intermediate structured review screen.

Title:
Your Story So Far

Sections:

Core Experience

Challenge

Action

Impact

Reflection

Values

Skills

Perspective Shift

Future Goal

College Connection

Each item should show:
- extracted content
- confidence
- evidence from actual transcript

Example:

Value:
Empathy

Evidence:
"I realized technology wasn't only about coding. It could actually solve problems for people."

Allow the student to:
Confirm
Edit
Remove

Do NOT require human intervention to continue, but the student can optionally review.

Primary action:
Build My Essay Strategy →

------------------------------------------------------------
SCREEN 5 – FINAL ESSAY BLUEPRINT
------------------------------------------------------------

This is the final result.

Title:
Your 350-Word Essay Blueprint

Show:

Core Story

Central Message

Why This Story Works

Story Strength Score

Then essay sections.

Default recommended structure:

1. Opening Scene – 45 words
2. Life Experience / Challenge – 100 words
3. Reflection / Perspective Shift – 75 words
4. Character, Values & Skills – 55 words
5. College + Future Direction – 60 words
6. Closing – 15 words

TOTAL:
350 words

The backend MUST verify programmatically:

45 + 100 + 75 + 55 + 60 + 15 = 350

However, the AI may slightly adapt the section allocation if useful.

Any adapted allocation MUST still total exactly 350.

Each section card should contain:

Section title

Allocated word count

Purpose

What to include

Student evidence to use

Questions to answer

Suggested narrative approach

Transition suggestion

DO NOT generate a complete final essay by default.

This assignment is about brainstorming and strategy.

Add optional button:
Export / Copy Strategy

Add:
Review & Edit Structure

============================================================
CORE AI BEHAVIOR
============================================================

The system must behave like an adaptive interviewer.

Never simply ask a predefined list of generic questions.

Use the following loop:

Essay Prompt
↓
Prompt Analyzer
↓
Conversation State
↓
Missing Evidence Detector
↓
Next Best Question Generator
↓
Student Answer
↓
Story Extractor
↓
State Update
↓
Repeat until enough high-quality evidence exists
↓
Story Ranking
↓
Essay Strategy
↓
350-word Blueprint

============================================================
PROMPT ANALYZER
============================================================

Analyze the essay prompt before starting the interview.

For the supplied essay prompt, the expected information requirements include:

life_experience
personal_story
character
values
perspective
skills
personal_growth
future_pursuit
college_connection

Create a structured prompt-analysis object.

Example:

{
  "prompt": "...",
  "word_limit": 350,
  "required_dimensions": [
    "life_experience",
    "character",
    "values",
    "perspective",
    "skills",
    "future_goal",
    "college_connection"
  ],
  "recommended_story_type": "transformational personal experience",
  "desired_narrative_arc": [
    "specific experience",
    "challenge/action",
    "reflection",
    "growth",
    "future direction"
  ]
}

============================================================
ADAPTIVE INTERVIEW ENGINE
============================================================

The AI's responsibility is not only to respond conversationally.

It must determine:

"What is the highest-value thing I still need to understand?"

Every turn should inspect current conversation state.

Example:

Student:
"My mother inspired me."

Weak next question:
"What are your hobbies?"

Good next question:
"Can you remember one specific moment when something your mother said or did changed how you handled a difficult situation?"

The AI should seek:

specificity
context
emotion
action
impact
reflection
transformation
future connection

Avoid asking multiple complex questions in a single turn.

Prefer one focused question.

Occasionally ask a short two-part question only when naturally related.

============================================================
INTERVIEW PHASES
============================================================

Internally use phases.

PHASE 1:
Open Story Discovery

Goal:
Find candidate personal experiences.

PHASE 2:
Deep Dive

Goal:
Understand:
what happened
context
challenge
action
emotion
consequence

PHASE 3:
Reflection

Goal:
What did the student learn?
How did their perspective change?

PHASE 4:
Character and Values

Goal:
What values or traits emerged naturally?

PHASE 5:
Skills

Goal:
What did the student demonstrate or develop?

PHASE 6:
Future

Goal:
What does the student now want to study/build/pursue?

PHASE 7:
College Fit

Goal:
How does the college connect to the student's goals?

PHASE 8:
Validation

Goal:
Fill remaining gaps.

PHASE 9:
Strategy

Generate ranked story and blueprint.

============================================================
CONVERSATION STATE
============================================================

Maintain a server-side structured state.

Example:

{
  "covered": {
    "specific_experience": true,
    "challenge": true,
    "action": true,
    "impact": false,
    "emotion": false,
    "reflection": true,
    "character": true,
    "values": true,
    "skills": true,
    "perspective_shift": true,
    "future_goal": false,
    "college_connection": false
  },
  "candidate_stories": [],
  "story_entities": [],
  "missing_information": [],
  "conversation_quality_score": 0,
  "ready_for_strategy": false
}

============================================================
STRUCTURED STORY EXTRACTION
============================================================

After every student answer, extract structured data.

Use strict structured output / JSON schema.

Example:

{
  "experience_updates": [
    {
      "type": "community_project",
      "summary": "Built a software tool for a community center",
      "evidence": "student transcript quote",
      "confidence": 0.95
    }
  ],
  "values": [
    {
      "name": "initiative",
      "confidence": 0.84,
      "evidence": "..."
    }
  ],
  "skills": [
    {
      "name": "problem solving",
      "confidence": 0.91,
      "evidence": "..."
    }
  ],
  "perspective_shifts": [],
  "emotions": [],
  "future_goals": [],
  "college_connections": []
}

Do not infer sensitive personal traits.

Do not invent information.

If a value is not sufficiently supported, either:

- do not include it
or
- ask another question.

============================================================
STORY CANDIDATES
============================================================

The student may mention multiple experiences.

Store each as a candidate story.

Candidate story schema:

{
  "id": "...",
  "title": "...",
  "summary": "...",
  "experience": "...",
  "challenge": "...",
  "action": "...",
  "impact": "...",
  "reflection": "...",
  "values": [],
  "skills": [],
  "future_connection": "...",
  "evidence_turn_ids": [],
  "scores": {}
}

============================================================
STORY SCORING ENGINE
============================================================

Rank candidate stories.

Score each story on:

specificity
authenticity
reflection_depth
personal_growth
emotional_depth
prompt_relevance
evidence_strength
future_connection
college_connection
distinctiveness

Each criterion:
0–10

Compute final weighted score 0–100.

Example:

Specificity              9
Authenticity             10
Reflection               9
Personal Growth          8
Emotional Depth          7
Prompt Relevance         9
Evidence Strength        9
Future Connection        8
College Connection       6
Distinctiveness          8

Do not use numerical score as absolute admissions quality.
Use it only for internal story selection.

Display a simplified story-strength score if useful.

============================================================
MISSING EVIDENCE DETECTOR
============================================================

Before finishing the interview, evaluate whether there is enough evidence.

Minimum completion fields:

specific experience
challenge or meaningful context
student action
impact
reflection
at least one supported value/character trait
at least one supported skill or perspective
future pursuit
college connection

Do not end the conversation until enough information exists or the student explicitly chooses to finish.

Generate:

{
  "completeness": 0.91,
  "missing": [
    "college_connection"
  ],
  "ready_for_strategy": false
}

If missing college connection:

ask:
"Looking ahead, what do you hope to explore or build in college, and what about this college feels connected to that goal?"

============================================================
VOICE EXPERIENCE
============================================================

Voice functionality is mandatory.

Support:

Microphone permission
Start recording
Stop recording
Speech-to-text
Display transcript
Send transcript into conversation engine
Generate AI response
Convert AI response to speech
Play response
Allow interruption if possible

UI voice states:

idle
requesting_permission
listening
processing
thinking
speaking
error

Show a visual waveform / animated Ivy assistant.

When listening:
"Listening..."

When processing:
"Understanding your story..."

When generating:
"Thinking about the best next question..."

When speaking:
animate the assistant.

============================================================
VOICE IMPLEMENTATION
============================================================

Preferred implementation:

Frontend:
Web Audio API / MediaRecorder

AI voice:
Use OpenAI realtime voice API if available.

Alternative modular architecture:

STT:
OpenAI transcription model

LLM:
OpenAI reasoning/chat model

TTS:
OpenAI text-to-speech

Build the voice layer behind interfaces so providers can be replaced later.

Example backend interfaces:

SpeechToTextProvider
LanguageModelProvider
TextToSpeechProvider

Do not tightly couple the entire product to UI components.

============================================================
TECH STACK
============================================================

Frontend:

Next.js latest stable
React
TypeScript
Tailwind CSS
Framer Motion
Lucide React
React Hook Form where appropriate
Zod

Backend:

Python
FastAPI
Pydantic
async/await
WebSocket where needed

Database:

PostgreSQL
Supabase

Authentication:

Supabase Auth

AI:

OpenAI API

Realtime voice where practical
structured LLM outputs
STT
TTS

Deployment:

Frontend:
Vercel

Backend:
Render / Railway / Fly.io or similar

Database:
Supabase

Monitoring:
Sentry-ready structure

============================================================
REPOSITORY STRUCTURE
============================================================

Use a clean monorepo.

Example:

/
├── README.md
├── .gitignore
├── docs/
│   ├── architecture.md
│   ├── product-flow.md
│   ├── api.md
│   ├── database.md
│   └── demo-script.md
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── essay/
│   │   │   └── [sessionId]/
│   │   │       ├── page.tsx
│   │   │       ├── review/
│   │   │       │   └── page.tsx
│   │   │       └── blueprint/
│   │   │           └── page.tsx
│   │
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── InstructionsCard.tsx
│   │   ├── IvyAssistant.tsx
│   │   ├── VoiceRecorder.tsx
│   │   ├── Waveform.tsx
│   │   ├── ConversationPanel.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── StrategyPanel.tsx
│   │   ├── StoryEvidence.tsx
│   │   ├── StoryProgress.tsx
│   │   ├── EssayBlueprint.tsx
│   │   └── WordBudget.tsx
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   ├── supabase.ts
│   │   └── audio.ts
│   │
│   └── types/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │
│   │   ├── api/
│   │   │   ├── sessions.py
│   │   │   ├── conversation.py
│   │   │   ├── voice.py
│   │   │   ├── story.py
│   │   │   └── essay.py
│   │
│   │   ├── agents/
│   │   │   ├── prompt_analyzer.py
│   │   │   ├── interviewer.py
│   │   │   ├── extractor.py
│   │   │   ├── evidence_detector.py
│   │   │   ├── story_ranker.py
│   │   │   └── strategist.py
│   │
│   │   ├── schemas/
│   │   │   ├── session.py
│   │   │   ├── conversation.py
│   │   │   ├── story.py
│   │   │   └── essay.py
│   │
│   │   ├── services/
│   │   │   ├── llm.py
│   │   │   ├── stt.py
│   │   │   ├── tts.py
│   │   │   ├── scoring.py
│   │   │   └── word_budget.py
│   │
│   │   ├── prompts/
│   │   │   ├── prompt_analyzer.txt
│   │   │   ├── interviewer.txt
│   │   │   ├── extractor.txt
│   │   │   ├── ranker.txt
│   │   │   └── strategist.txt
│   │
│   │   └── core/
│   │       ├── config.py
│   │       └── security.py
│
└── supabase/
    └── migrations/

============================================================
DATABASE
============================================================

Create migrations for:

profiles

essay_sessions

essay_prompts

conversation_turns

story_candidates

story_entities

essay_blueprints

essay_sections

Suggested fields:

essay_sessions:
id
user_id
college_name
essay_title
prompt
word_limit
status
started_at
completed_at
conversation_completeness
selected_story_id

conversation_turns:
id
session_id
speaker
content
source
created_at

source:
voice
text

story_entities:
id
session_id
candidate_story_id
type
name
summary
evidence
confidence
source_turn_id

story_candidates:
id
session_id
title
summary
challenge
action
impact
reflection
future_connection
score
is_selected

essay_blueprints:
id
session_id
core_story
central_message
why_story_works
total_words
created_at

essay_sections:
id
blueprint_id
position
title
word_count
purpose
content_guidance
evidence_json
transition_guidance

============================================================
API ENDPOINTS
============================================================

Implement REST endpoints similar to:

POST /api/sessions

GET /api/sessions/{id}

POST /api/sessions/{id}/message

POST /api/sessions/{id}/transcribe

POST /api/sessions/{id}/next-question

GET /api/sessions/{id}/state

GET /api/sessions/{id}/stories

POST /api/sessions/{id}/generate-blueprint

GET /api/sessions/{id}/blueprint

POST /api/tts

Optional:

WebSocket:
/ws/sessions/{id}

Use WebSocket for responsive conversation state / voice events where helpful.

============================================================
MESSAGE RESPONSE SCHEMA
============================================================

The conversation backend should return structured responses.

Example:

{
  "assistant_message": "That's an important moment. What changed in the way you thought about technology after seeing people use what you built?",
  "phase": "reflection",
  "reason_for_question": "Need evidence of perspective shift",
  "story_updates": [...],
  "covered_dimensions": [...],
  "missing_dimensions": [...],
  "completeness": 0.72,
  "ready_for_strategy": false
}

Do not expose chain-of-thought.

"reason_for_question" should be a concise product-safe explanation.

============================================================
LLM INTERVIEWER SYSTEM PROMPT
============================================================

Use a strong system prompt resembling:

"You are Ivy, an AI essay brainstorming coach for high-school students.

Your goal is to help the student discover and articulate authentic personal experiences relevant to the provided college essay prompt.

You are NOT writing the essay.

Ask thoughtful, short, conversational questions.

Ask ONE main question at a time.

Respond naturally to what the student just said.

Prefer follow-up questions that uncover:
specific events,
actions,
choices,
emotions,
motivation,
consequences,
reflection,
personal growth,
values,
skills,
perspective shifts,
future goals,
and college fit.

Never fabricate details.

Never claim a value or skill unless the student's answers provide evidence.

If the student gives a vague answer, gently ask for one concrete example.

If the student provides a strong experience, deepen it before switching topics.

Avoid sounding like an interview form.

Do not praise every answer excessively.

Do not write admissions clichés.

Do not coach the student to misrepresent themselves.

Stop asking questions once sufficient evidence exists to generate a strong essay structure."

============================================================
STORY EXTRACTOR PROMPT
============================================================

The extractor should be deterministic and conservative.

Instruction:

"Extract ONLY information directly supported by the transcript.

Do not fabricate.

Separate fact from interpretation.

For inferred traits, provide:
confidence
evidence
source turn

If confidence is below an acceptable threshold, omit the trait."

============================================================
FINAL STRATEGIST PROMPT
============================================================

The strategist should receive:

essay prompt
word limit
full story state
selected candidate story
student evidence
future goals
college connection

Return JSON matching strict schema.

Example:

{
  "core_story": "...",
  "central_message": "...",
  "why_this_story_works": [
    "...",
    "..."
  ],
  "story_strength": 88,
  "sections": [
    {
      "title": "Opening Scene",
      "word_count": 45,
      "purpose": "...",
      "include": ["...", "..."],
      "evidence": ["..."],
      "questions_to_answer": ["..."],
      "transition": "..."
    }
  ]
}

============================================================
WORD BUDGET VALIDATOR
============================================================

Implement server-side code.

Never trust LLM arithmetic.

Pseudo:

target = session.word_limit
total = sum(section.word_count)

if total != target:
    rebalance sections

assert total == target

For the demo:
target = 350

Display total prominently.

============================================================
STORY EVIDENCE
============================================================

This is an important differentiator.

Every major AI insight should link back to transcript evidence.

Example:

Value:
Empathy

Confidence:
91%

Evidence:
"I realized technology wasn't only about coding. It could actually solve problems for people."

This prevents unsupported AI conclusions.

============================================================
LIVE STRATEGY PANEL
============================================================

During conversation, show live insights.

Example:

CURRENT STORY

Community technology project

POSSIBLE CENTRAL IDEA

Technology gained meaning when it became a way to solve human problems.

VALUES

Empathy
Initiative

SKILLS

Software development
Problem solving

PERSPECTIVE SHIFT

From:
"Technology = technical skill"

To:
"Technology = understanding and solving people's problems"

MISSING

Future pursuit
Specific college connection

Never show blank ugly sections.
Use skeletons or "Still exploring..." states.

============================================================
PROGRESS LOGIC
============================================================

Do not base progress purely on question count.

Compute semantic completeness.

Example:

Specific Experience        complete
Challenge                  complete
Action                     complete
Impact                     partial
Reflection                 complete
Values                     complete
Perspective                complete
Future Goal                missing
College Connection         missing

Compute normalized progress.

Show UX as:

Story Discovery 72%

or:

5 of 7 story areas explored

============================================================
EXAMPLE DEMO CONVERSATION
============================================================

The implementation must support conversations such as:

Ivy:
"Think about an experience that changed the way you see yourself. What comes to mind?"

Student:
"When I volunteered at a local community center, I noticed they were struggling to manage student records."

Ivy:
"What made you decide to help instead of simply noticing the problem?"

Student:
"I thought I could build something to make the process easier."

Ivy:
"What did you build, and what happened once people started using it?"

Student:
"I created a small application for organizing records."

Ivy:
"I understand what you built. What I want to understand now is what changed in you. How did seeing people use something you created affect the way you thought about technology?"

Student:
"I realized technology wasn't only about coding. It could actually solve problems for people."

Ivy:
"Before that experience, what did being good at technology mean to you?"

Student:
"I thought it mostly meant being technically skilled."

Ivy:
"And today, what do you think matters in addition to technical skill?"

Student:
"Understanding people's needs and building things that are genuinely useful."

Then eventually ask:

"How has that experience influenced what you want to study or pursue next?"

Then:

"What about this college would help you continue in that direction?"

The above is ONLY demonstration content.

Do not hardcode these answers into production.

============================================================
ACADEMIC INTEGRITY
============================================================

The system may:

ask questions
organize experiences
identify themes
suggest narrative strategy
allocate words
highlight evidence
suggest reflection prompts

The system must NOT:

invent experiences
invent family circumstances
invent achievements
invent extracurriculars
invent emotions
invent values without evidence
pretend a student did something they never said
automatically submit college applications

Do not produce a complete polished essay as the default final output.

============================================================
PRIVACY
============================================================

The app is intended for high-school students.

Apply privacy-first design.

Do not permanently store raw microphone audio unless needed.

Preferred flow:

audio
→ transcription
→ process
→ discard temporary audio

Persist transcript only for the session if enabled.

Add a small privacy message near microphone:

"Your voice is used to understand your response. Raw audio is not retained after processing."

Do not collect unnecessary sensitive personal data.

============================================================
ERROR STATES
============================================================

Handle:

microphone permission denied

no speech detected

network failure

AI request failure

transcription failure

TTS failure

empty response

user interruption

session recovery

database unavailable

Show polished friendly UI.

Examples:

"We couldn't hear that clearly. Try again or type your response."

"Microphone access is blocked. You can enable it in your browser settings or continue by typing."

============================================================
LOADING STATES
============================================================

Do not show generic spinners everywhere.

Use contextual messages:

Listening...

Transcribing...

Understanding your story...

Finding the strongest follow-up...

Updating your essay strategy...

Building your 350-word blueprint...

============================================================
ANIMATIONS
============================================================

Use subtle Framer Motion transitions.

Assistant animation should react to states.

Idle:
soft pulse

Listening:
audio responsive / expanding ring

Thinking:
slow gradient movement

Speaking:
active waveform

Use Ivy animation.gif where possible.

Do not make animation distracting.

============================================================
RESPONSIVENESS
============================================================

Desktop should closely resemble supplied reference screenshots.

For tablet/mobile:

Two-column conversation/strategy layout becomes stacked.

Conversation appears first.

Strategy collapses into expandable "Live Strategy" panel.

Keep microphone easy to access.

============================================================
ACCESSIBILITY
============================================================

Use:

keyboard navigation
semantic HTML
aria labels
visible focus states
text alternatives
sufficient contrast

Voice must have text fallback.

============================================================
SEED DATA
============================================================

Provide development seed session.

College:
Bryn Mawr College

Essay:
Essay 1: Personal Story

Word Limit:
350

Prompt:
"How has your life experience contributed to your personal story—your character, values, perspectives, or skills—and what you want to pursue at Bryn Mawr College?"

The user should be able to create another session with another college.

============================================================
ENVIRONMENT VARIABLES
============================================================

Provide:

.env.example

Include examples such as:

NEXT_PUBLIC_API_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=

Do NOT commit credentials.

============================================================
README
============================================================

Create a professional README.

Include:

Project overview

Problem

Solution

Why voice-first

Competitor inspiration:
Unifrog
Sups.ai
Ambitio
Kollegio

Important:
Do not make unsupported claims about competitor capabilities.

Features

Screenshots

Product flow

AI architecture

System architecture

Tech stack

Database

API

Prompt architecture

Voice flow

Academic integrity

Privacy

Local setup

Environment variables

Running frontend

Running backend

Deployment

Demo scenario

Future improvements

============================================================
ARCHITECTURE DOCUMENTATION
============================================================

Create docs/architecture.md.

Include Mermaid diagrams.

High-level:

Student
↓
Next.js UI
↓
Voice Layer
↓
FastAPI
↓
Conversation Orchestrator
├── Prompt Analyzer
├── Interviewer
├── Story Extractor
├── Missing Evidence Detector
├── Story Ranker
└── Blueprint Generator
↓
Supabase/PostgreSQL

AI voice branch:

Microphone
↓
STT
↓
Conversation Agent
↓
TTS
↓
Student

============================================================
PRODUCT FLOW DOCUMENT
============================================================

Create docs/product-flow.md.

Flow:

Start Session
↓
Prompt Analysis
↓
Instructions
↓
Voice Interview
↓
Story Extraction
↓
Adaptive Follow-Up
↓
Evidence Completeness
↓
Story Ranking
↓
Student Story Review
↓
Essay Strategy
↓
350-Word Blueprint

============================================================
DEMO SCRIPT
============================================================

Create docs/demo-script.md.

Target demo:
5–8 minutes.

Structure:

0:00
Show repository and start applications.

Run backend:
uvicorn app.main:app --reload

Run frontend:
npm run dev

0:30
Open application.

Explain:
"This is a voice-first AI essay brainstorming prototype inspired by the supplied Hello Ivy UX."

1:00
Show essay prompt.

1:20
Click Listen and demonstrate TTS.

1:40
Start voice conversation.

2:00–5:00
Demonstrate adaptive questions.

Show live strategy update.

Show extracted evidence.

5:00
Finish information capture.

5:30
Preview story evidence.

6:00
Generate blueprint.

6:30
Show exact 350-word breakdown.

7:00
Briefly show architecture.

============================================================
DESIGN QUALITY
============================================================

This prototype is being evaluated on:

Creativity in technical solutions
Thoroughness in research

Therefore do not settle for a basic CRUD application.

The interface should feel investor/founder-demo ready.

Prioritize:

polished SaaS UI
fast interaction
good typography
smooth animation
excellent empty states
good error handling
clear AI reasoning surface
live strategy updates
evidence traceability
excellent voice UX

============================================================
IMPORTANT PRODUCT DIFFERENTIATORS
============================================================

Make these visible in the final prototype.

1. Voice-first Story Discovery

The student talks naturally instead of filling a long form.

2. Adaptive Questioning

AI chooses the next question based on missing information.

3. Story Evidence

Every conclusion links to transcript evidence.

4. Story Ranking

If multiple experiences emerge, AI identifies the strongest narrative.

5. Semantic Completion

Interview ends based on story completeness, not arbitrary question count.

6. Live Essay Strategy

Structure develops while the conversation happens.

7. Exact Word Budget

Final architecture is programmatically validated.

8. Academic Integrity

AI helps discover the student's story rather than inventing it.

============================================================
OPTIONAL HIGH-VALUE FEATURES
============================================================

If the core application is complete, add:

Story Map visualization

Example:

Experience
↓
Challenge
↓
Action
↓
Impact
↓
Reflection
↓
Value
↓
Future Goal

Add story alternative comparison.

Example:

STORY A
Community app project
Score: 91

STORY B
Sports leadership
Score: 77

Why A is stronger:
more specific
clear perspective change
better future connection

Add session resume support.

Add transcript export.

Add JSON blueprint export.

Add PDF strategy export only if core app is already complete.

============================================================
TESTING
============================================================

Add useful tests.

Backend tests:

prompt analysis schema

story extraction

completeness logic

story scoring

word budget validator

blueprint total = 350

empty transcript handling

LLM failure fallback

Frontend:

critical components render

microphone state transitions

strategy panel state

final word total

============================================================
ACCEPTANCE TEST
============================================================

The project is complete ONLY if this exact scenario works:

1. User opens app.
2. Sees UI matching supplied Hello Ivy screenshots.
3. Sees 350-word essay prompt.
4. Clicks Listen.
5. AI reads instructions.
6. User clicks microphone.
7. Browser records real audio.
8. Audio becomes transcript.
9. Transcript appears in conversation.
10. AI analyzes answer.
11. AI asks context-specific follow-up.
12. AI response is spoken aloud.
13. User continues conversation.
14. Live strategy updates during conversation.
15. AI extracts supported values/skills/perspective.
16. System identifies missing evidence.
17. AI asks targeted questions to fill gaps.
18. System becomes sufficiently complete.
19. Review button becomes enabled.
20. User previews extracted story.
21. System chooses strongest story.
22. Blueprint is generated.
23. Blueprint contains exactly 350 allocated words.
24. Every major insight has supporting evidence.
25. No fabricated student facts appear.
26. Page is responsive.
27. Session persists.
28. README explains complete implementation.
29. Application runs using documented commands.
30. There are no fake UI buttons or TODO placeholders.

============================================================
IMPLEMENTATION ORDER
============================================================

Build this in stages.

PHASE 1
Create project structure.

PHASE 2
Implement UI matching reference screenshots with mock data.

PHASE 3
Create FastAPI backend.

PHASE 4
Add Supabase persistence.

PHASE 5
Add prompt analyzer.

PHASE 6
Add conversation interviewer.

PHASE 7
Add structured story extraction.

PHASE 8
Add missing evidence / completeness algorithm.

PHASE 9
Add voice STT/TTS.

PHASE 10
Add live strategy panel.

PHASE 11
Add story ranking.

PHASE 12
Add exact 350-word blueprint.

PHASE 13
Add evidence review.

PHASE 14
Add loading/error/accessibility states.

PHASE 15
Add tests.

PHASE 16
Write docs and README.

PHASE 17
Prepare deployment.

Do not skip directly to final generation.

============================================================
IMPORTANT DEVELOPMENT RULES
============================================================

Do not use placeholder buttons.

Do not fake microphone functionality.

Do not fake AI responses.

Do not put secret keys in frontend.

Do not expose server API keys.

Do not use dangerously broad CORS configuration in production.

Use type-safe schemas.

Validate all API input.

Handle malformed LLM JSON.

Retry transient AI failures carefully.

Keep conversation history within reasonable limits.

Summarize older context when necessary.

Do not reveal chain-of-thought.

Keep internal reasoning private.

Return concise product-safe rationale only.

Use clean reusable components.

Avoid giant files.

Avoid duplicated logic.

Add comments where architectural intent is important.

============================================================
FINAL OUTPUT EXPECTED FROM YOU
============================================================

After implementation, provide:

1. Complete file tree.
2. All created files.
3. Database migrations.
4. .env.example.
5. Local setup commands.
6. Backend run command.
7. Frontend run command.
8. Supabase setup instructions.
9. OpenAI setup instructions.
10. Architecture explanation.
11. Voice flow explanation.
12. AI prompt architecture.
13. Testing instructions.
14. Deployment instructions.
15. Demo script.
16. README.
17. Any assumptions made.
18. List of optional future improvements.

Most importantly:

THE APPLICATION MUST BE RUNNABLE.

Do not stop after writing architecture.
Do not respond only with snippets.
Do not leave major components as pseudo-code.
Implement the working project.

Start by inspecting the supplied reference screenshots/assets and creating the exact UI shell before implementing backend functionality.
```

### One addition I recommend giving the coding agent

After pasting the main prompt, attach your **four screenshots and `Ivy animation.gif`** and then send this second instruction:

```text
These attached screenshots are the authoritative UI references.

Study them carefully before coding.

I do NOT want a generic redesign.

Recreate:
- spacing
- proportions
- header density
- rounded cards
- subtle border treatment
- conversation layout
- message bubble sizes
- two-column brainstorming structure
- instruction panel
- word-count pill
- timer placement
- bottom actions
- information-capture state
- profile area
- pastel gradient border language

Use the Ivy animation asset for the voice-assistant identity.

The application should look immediately recognizable as the same product family as these screenshots, while adapting the content to the 350-word essay assignment.

Do not copy screenshot text blindly where it conflicts with the assignment.

For example:
250 words → 350 words.

Brynmawr, Essay 1: Learning to let go
→
Bryn Mawr, Essay 1: Personal Story

Use the supplied assignment essay prompt.

Build at desktop size first to match the screenshots and then make it responsive.
```

## Best way to use this prompt

For **Cursor / Claude Code / Codex**, put all the screenshots and GIF inside something like:

```text
/reference/
    1.png
    2.png
    3.png
    3-1.png
    ivy-animation.gif
```

Then give the agent the master prompt and tell it:

```text
Work autonomously through the implementation phases.

After every major phase:
1. run the application,
2. fix compile/runtime errors,
3. run tests,
4. continue to the next phase.

Do not ask me to manually implement unfinished components.

When uncertain about a minor UX detail, use the screenshots as the source of truth.

Prioritize getting the full end-to-end flow working before optional enhancements.
```

The most important thing is that your coding AI understands that this assignment is **not “build an AI chat page.”** It is a **voice-driven story-discovery engine with adaptive interviewing, structured evidence extraction, live essay strategy, and an exact 350-word blueprint**, presented in the exact visual family of the supplied Hello Ivy screens.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
