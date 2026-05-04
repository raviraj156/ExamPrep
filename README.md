<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# ExamPrep: AI-Powered Learning Platform

An intelligent, full-stack educational platform that combines generative AI for dynamic quiz generation with a custom Machine Learning backend to provide highly personalized student evaluations and actionable advice.
</div>

---

## 🚀 Features

- **🧠 Dynamic Quiz Generation:** Generates subjective and objective quizzes on any topic using the Gemini API.
- **📊 ML-Powered Analytics:** A custom Scikit-Learn Random Forest model analyzes student performance (accuracy, consistency, time spent) to determine their skill level and provide specific study advice.
- **🧑‍🏫 Teacher Dashboard:** Tools for educators to monitor student progress, review test analytics, and manage class performance.
- **🏆 Gamification:** Engage students with streaks, badges, and a comprehensive performance dashboard tracking historical data.
- **🔐 Secure Authentication:** Seamless Google Sign-In powered by Firebase Authentication.
- **💾 Real-time Database:** Stores user profiles and quiz history securely using Cloud Firestore.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React with TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Icons:** Lucide React

### Backend & AI
- **API Server:** Flask (Python)
- **Machine Learning:** Scikit-Learn (`RandomForestClassifier`, `MultiOutputClassifier`)
- **Generative AI:** Google Gemini API (for quiz creation & answer checking)
- **Database & Auth:** Firebase (Firestore, Auth)

---

## ⚙️ Prerequisites

Before you begin, ensure you have met the following requirements:
* **Node.js** (v18 or higher recommended)
* **Python** (3.8 or higher)
* A **Firebase Project** with Authentication (Google provider) and Firestore enabled
* A **Gemini API Key** from Google AI Studio

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/ExamPrep.git
cd ExamPrep
```

### 2. Environment Variables
Create a `.env` or `.env.local` file in the root directory and add your keys:
```env
# AI API Key
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Frontend Setup
Install the necessary NPM packages:
```bash
npm install
```

Start the React development server:
```bash
npm run dev
```

### 4. Machine Learning Backend Setup
The ML backend processes advanced analytics for the dashboard.

Install Python dependencies:
```bash
pip install -r ml/requirements.txt
```

Start the Flask server:
```bash
python ml/app.py
```
*The API will run on `http://127.0.0.1:5000`.*

---

## 🧠 Training the Custom AI Summary Model

While quiz generation uses the Gemini API, the **Summary and Advice logic** uses a locally trained Python model for domain-specific accuracy.

**Option 1: Train with provided template data**
```bash
npm run ml:train
```

**Option 2: Train using real Firestore student data**
1. Export your `results` collection from Firestore to a JSON file.
2. Build the training CSV:
   ```bash
   python ml/build_training_csv_from_firestore.py --results-json path/to/results.json --output-csv ml/data/ai_quiz_training_from_firestore.csv
   ```
3. Provide labels for your CSV and run the training script:
   ```bash
   python ml/train_ai_summary_model.py --input-csv ml/data/ai_quiz_training_from_firestore.csv --output-ts src/data/aiSummaryModel.ts
   ```

*Training automatically outputs the frontend artifact at `src/data/aiSummaryModel.ts` and saves `ml/model.pkl`.*

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

---

<div align="center">
  <b>Made with ❤️ by Anubhav</b>
</div>
