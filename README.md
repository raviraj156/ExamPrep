<div align="center">

<!-- Custom SVG Header -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:6366f1,50:8b5cf6,100:a855f7&height=220&section=header&text=ExamPrep&fontSize=80&fontColor=ffffff&fontAlignY=35&desc=AI-Powered%20Learning%20Platform&descSize=20&descAlignY=55&animation=fadeIn" width="100%" />

<br/>

<p>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-Python-000000?style=for-the-badge&logo=flask&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Scikit--Learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" />
</p>

<p>
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/github/last-commit/Anubhav-Akhil/ExamPrep?style=flat-square&color=blue" />
  <img src="https://img.shields.io/github/repo-size/Anubhav-Akhil/ExamPrep?style=flat-square&color=purple" />
</p>

<h3>
  An intelligent, full-stack educational platform that combines <b>Generative AI</b> for dynamic quiz generation with a custom <b>Machine Learning</b> backend for personalized student evaluations and actionable learning advice.
</h3>

<br/>

[Features](#-features) · [Architecture](#-architecture) · [Tech Stack](#-tech-stack) · [Quick Start](#-quick-start) · [ML Pipeline](#-training-the-ml-model)

<br/>

</div>

---

<br/>

## ✨ Features

<table>
<tr>
<td width="50%">

### 🧠 Dynamic Quiz Generation
Generate MCQ and subjective quizzes on **any topic** in seconds using the Gemini API. Supports multiple difficulty levels and customizable question counts.

</td>
<td width="50%">

### 📊 ML-Powered Analytics
A custom **Random Forest model** analyzes accuracy, consistency, time spent, and difficulty to determine student skill level and generate personalized study advice.

</td>
</tr>
<tr>
<td width="50%">

### 🏆 Gamification & Streaks
Engage students with a **streak system**, performance badges, and a comprehensive dashboard tracking historical data with interactive charts.

</td>
<td width="50%">

### 🧑‍🏫 Teacher Dashboard
Educators can **monitor student progress**, review test analytics, and analyze class-wide performance trends from a dedicated portal.

</td>
</tr>
<tr>
<td width="50%">

### 🔐 Secure Auth
Seamless **Google Sign-In** powered by Firebase Authentication with role-based access for students and teachers.

</td>
<td width="50%">

### 💾 Real-time Database
All user profiles, quiz history, and performance data stored securely on **Cloud Firestore** with real-time sync.

</td>
</tr>
</table>

<br/>

---

<br/>

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                                                                  │
│   ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│   │ Landing  │  │   Quiz   │  │ Dashboard │  │   Teacher    │  │
│   │   Page   │  │  Engine  │  │  & Stats  │  │   Portal     │  │
│   └────┬─────┘  └────┬─────┘  └─────┬─────┘  └──────┬───────┘  │
│        └──────────────┼──────────────┼───────────────┘          │
│                       │              │                           │
│              React 19 + TypeScript + Tailwind CSS               │
└───────────────────────┼──────────────┼──────────────────────────┘
                        │              │
              ┌─────────▼──┐    ┌──────▼──────┐
              │  Gemini    │    │  Flask API  │
              │  API       │    │  (Python)   │
              │            │    │             │
              │ Quiz Gen & │    │ ML Model    │
              │ Evaluation │    │ Prediction  │
              └─────────┬──┘    └──────┬──────┘
                        │              │
                        │     ┌────────▼────────┐
                        │     │  Scikit-Learn   │
                        │     │  RandomForest   │
                        │     │  + model.pkl    │
                        │     └─────────────────┘
                        │
              ┌─────────▼──────────┐
              │   Firebase         │
              │  ┌──────────────┐  │
              │  │  Firestore   │  │
              │  │  (Database)  │  │
              │  ├──────────────┤  │
              │  │  Auth        │  │
              │  │  (Google)    │  │
              │  └──────────────┘  │
              └────────────────────┘
```

<br/>

---

<br/>

## 🛠 Tech Stack

<table>
<tr>
<td align="center" width="140">
<img src="https://skillicons.dev/icons?i=react" width="48" height="48" alt="React" />
<br/><b>React 19</b>
<br/><sub>UI Framework</sub>
</td>
<td align="center" width="140">
<img src="https://skillicons.dev/icons?i=ts" width="48" height="48" alt="TypeScript" />
<br/><b>TypeScript</b>
<br/><sub>Type Safety</sub>
</td>
<td align="center" width="140">
<img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="Tailwind" />
<br/><b>Tailwind CSS</b>
<br/><sub>Styling</sub>
</td>
<td align="center" width="140">
<img src="https://skillicons.dev/icons?i=vite" width="48" height="48" alt="Vite" />
<br/><b>Vite 6</b>
<br/><sub>Build Tool</sub>
</td>
<td align="center" width="140">
<img src="https://skillicons.dev/icons?i=firebase" width="48" height="48" alt="Firebase" />
<br/><b>Firebase</b>
<br/><sub>Auth & DB</sub>
</td>
</tr>
<tr>
<td align="center" width="140">
<img src="https://skillicons.dev/icons?i=python" width="48" height="48" alt="Python" />
<br/><b>Python</b>
<br/><sub>ML Backend</sub>
</td>
<td align="center" width="140">
<img src="https://skillicons.dev/icons?i=flask" width="48" height="48" alt="Flask" />
<br/><b>Flask</b>
<br/><sub>API Server</sub>
</td>
<td align="center" width="140">
<img src="https://skillicons.dev/icons?i=sklearn" width="48" height="48" alt="Scikit-Learn" />
<br/><b>Scikit-Learn</b>
<br/><sub>ML Model</sub>
</td>
<td align="center" width="140">
<img src="https://cdn.simpleicons.org/google/4285F4" width="48" height="48" alt="Gemini" />
<br/><b>Gemini API</b>
<br/><sub>Gen AI</sub>
</td>
<td align="center" width="140">
<img src="https://skillicons.dev/icons?i=github" width="48" height="48" alt="GitHub" />
<br/><b>GitHub</b>
<br/><sub>Version Control</sub>
</td>
</tr>
</table>

<br/>

---

<br/>

## 📂 Project Structure

```
ExamPrep/
├── 📁 src/
│   ├── 📁 components/
│   │   ├── Landing.tsx          # Hero page & onboarding
│   │   ├── Home.tsx             # Topic selection & quiz config
│   │   ├── Quiz.tsx             # Quiz engine (MCQ + Subjective)
│   │   ├── Result.tsx           # Score breakdown & AI feedback
│   │   ├── Dashboard.tsx        # Student analytics & charts
│   │   └── About.tsx            # Platform info
│   ├── 📁 lib/
│   │   ├── ai.ts                # Gemini API integration
│   │   ├── performanceModel.ts  # Client-side fallback model
│   │   └── trainedSummaryModel.ts
│   ├── 📁 data/
│   │   └── aiSummaryModel.ts    # Exported model weights
│   ├── App.tsx                  # Router & auth logic
│   └── types.ts                 # TypeScript interfaces
├── 📁 ml/
│   ├── app.py                   # Flask REST API
│   ├── train_ai_summary_model.py
│   ├── generate_synthetic_data.py
│   ├── model.pkl                # Trained model artifact
│   └── 📁 data/                 # Training datasets
├── firestore.rules              # Security rules
├── package.json
└── vite.config.ts
```

<br/>

---

<br/>

## 🚀 Quick Start

### Prerequisites

> **Required:** Node.js `v18+` · Python `3.8+` · Firebase Project · [Gemini API Key](https://aistudio.google.com/app/apikey)

### 1️⃣ Clone & Install

```bash
git clone https://github.com/Anubhav-Akhil/ExamPrep.git
cd ExamPrep
npm install
```

### 2️⃣ Environment Variables

Create a `.env` file in the project root:

```env
# 🤖 AI API Key
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# 🔥 Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3️⃣ Start the Frontend

```bash
npm run dev
```

### 4️⃣ Start the ML Backend

```bash
pip install -r ml/requirements.txt
python ml/app.py
```

> The Flask API will be available at `http://127.0.0.1:5000`

### ⚡ Or launch everything at once:

```bash
npm run start:all
```

<br/>

---

<br/>

## 🧠 Training the ML Model

The platform uses a **custom-trained Random Forest classifier** for performance analysis. The Gemini API handles quiz generation, while the ML model handles the **summary, level prediction, and advice generation**.

<details>
<summary><b>Option 1: Train with synthetic data (Quick Start)</b></summary>
<br/>

```bash
npm run ml:train
```

This uses the pre-built `synthetic_10k_dataset.csv` and outputs:
- `ml/model.pkl` — Serialized model for the Flask API
- `src/data/aiSummaryModel.ts` — Frontend fallback weights

</details>

<details>
<summary><b>Option 2: Train with real Firestore data (Advanced)</b></summary>
<br/>

**Step 1.** Export your `results` collection from Firestore to JSON.

**Step 2.** Build the training CSV:
```bash
python ml/build_training_csv_from_firestore.py \
  --results-json path/to/results.json \
  --output-csv ml/data/ai_quiz_training_from_firestore.csv
```

**Step 3.** Label and train:
```bash
python ml/train_ai_summary_model.py \
  --input-csv ml/data/ai_quiz_training_from_firestore.csv \
  --output-ts src/data/aiSummaryModel.ts
```

</details>

<br/>

---

<br/>

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

<br/>

---

<br/>

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<br/>

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:6366f1,50:8b5cf6,100:a855f7&height=120&section=footer" width="100%" />

<p>
  <b>Built with ❤️ by <a href="https://github.com/Anubhav-Akhil">Anubhav</a></b>
</p>

<p>
  <a href="https://github.com/Anubhav-Akhil/ExamPrep/stargazers">⭐ Star this repo if you found it helpful!</a>
</p>

</div>
