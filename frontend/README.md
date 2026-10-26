# ScenarioLab

ScenarioLab is an AI voice role-play application that helps students practice workplace conversations. Instead of typing into a chatbot, a student speaks to an AI character and receives a spoken reply.

This repository contains the React frontend. It connects to a separate Spring Boot backend and a Python AI service running on AWS Lambda.

## How it works

The student chooses a scenario and signs in through Amazon Cognito. In the first scenario, **Negotiate a Friday Release**, the student plays a project manager speaking with Alex, a business stakeholder requesting more features before a deadline. The goal is to clarify priorities, discuss limited team capacity, and agree on a realistic plan.

The student records a response in the browser. The frontend requests a presigned upload URL from Spring Boot and uploads the recording directly to S3. Spring Boot saves the conversation turn in DynamoDB and sends a processing request to an SQS FIFO queue.

The queue triggers the Python Lambda worker. Deepgram converts the recording into text, and LangGraph uses Amazon Bedrock to generate Alex's response using the scenario and previous conversation. The model can call tools to check project constraints and release plans. ElevenLabs converts the reply into speech, which is saved to S3. The transcript, reply, and audio key are saved to DynamoDB.

While this happens, React shows a processing indicator and checks the backend for the result. When the reply is ready, the student can read it, listen to Alex, and record their next response. Conversation history provides context for later turns.

```text
React -> Spring Boot -> SQS -> Python Lambda
                                  |
                    Deepgram -> Bedrock/LangGraph -> ElevenLabs
                                  |
                            DynamoDB + S3
                                  |
                       React displays and plays the reply
```

## Features

- Cognito sign-in through Spring Boot.
- Scenario brief and conversation history.
- Microphone recording, preview, and direct S3 upload.
- AI character replies as text and audio.
- Processing indicator and automatic reply polling.
- Restore the last session after refreshing.
- Responsive desktop and mobile layout.

## Tech stack

**Frontend:** React, Vite, JavaScript, CSS, Lucide icons, MediaRecorder API.

**Backend and AI services:** Spring Boot, Spring Security, Python, LangGraph, Amazon Bedrock, Deepgram, and ElevenLabs.

**AWS:** Cognito, S3, DynamoDB, SQS FIFO, Lambda, and ECR.

## Run locally

### 1. Prerequisites

- Node.js 22.12+ or a supported newer version, and npm.
- A browser with microphone access, such as Chrome or Edge.
- The separate Spring Boot backend running at `http://localhost:8080`.
- The backend's AWS resources and Python worker configured and running.

Cloning this frontend alone does not create the backend or AWS resources.

### 2. Install and configure

From the cloned repository folder, enter the frontend directory:

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env`. For local development, use:

```dotenv
BACKEND_URL=http://localhost:8080
VITE_LOGIN_URL=http://localhost:8080/oauth2/authorization/cognito
```

The frontend does not need AWS access keys, a Cognito client secret, or AI provider keys. Keep those in the backend or Lambda environment. Never place secrets in a `VITE_` variable because those values are visible in the browser.

### 3. Check the backend setup

The separate backend and worker need:

- A Cognito app client with the backend callback URL `http://localhost:8080/login/oauth2/code/cognito`.
- DynamoDB tables `LearningSessions` and `ConversationTurns`.
- A private S3 bucket for recordings and generated audio.
- An SQS FIFO queue connected to the Python Lambda worker.
- AWS permissions and backend configuration for these resources.
- Deepgram and ElevenLabs API keys, plus an accessible Bedrock model, configured in the worker.

The frontend expects the existing `/api/v1/sessions` routes for sessions, turns, upload URLs, and playback URLs. Vite forwards local API requests to Spring Boot. Authentication uses the existing Spring session cookie and CSRF protection.

### 4. Allow browser uploads in S3

In your audio bucket, open **Permissions > Cross-origin resource sharing (CORS)**. Add this rule, preserving any existing rules:

```json
[
  {
    "AllowedOrigins": ["http://localhost:5173"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 300
  }
]
```

Uploads use presigned URLs; the bucket does not need to be public.

### 5. Start the frontend

```bash
npm run dev
```

Open **http://localhost:5173**, sign in through Cognito in the same tab, and return to the frontend automatically. Start a practice session, allow microphone access, record a response, and send it.

## Production build

```bash
npm run build
```

The output is in `dist/`. The local Vite API proxy does not run in production. Deployment needs routing from the frontend to Spring Boot, public login/callback URLs, HTTPS, and the deployed frontend origin added to S3 CORS.

## Project structure

```text
src/
  App.jsx       # Practice UI, recording, login, and polling
  api.js        # Backend requests, CSRF, and S3 uploads
  scenarios.js  # Student-facing scenario information
  styles.css    # Responsive styling
  main.jsx      # React entry point
vite.config.js  # Local backend proxy
.env.example    # Frontend configuration example
```

## Status

The backend and deployed AI worker have produced conversation replies and audio saved to DynamoDB and S3. The frontend builds successfully; full browser workflow verification is still in progress. The MVP currently includes one scenario. API Gateway, CI/CD, and backend deployment are planned next.
