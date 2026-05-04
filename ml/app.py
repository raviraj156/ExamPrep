from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)

try:
    models = joblib.load('ml/model.pkl')
    level_model = models['level_model']
    advice_model = models['advice_model']
    advice_tags = models['advice_tags']
    feature_columns = models['feature_columns']
except Exception as e:
    print(f"Error loading model. Make sure to run train_ai_summary_model.py first! {e}")
    level_model = None

@app.route('/api/summary', methods=['POST'])
def get_summary():
    if level_model is None:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.json
    
    # Extract features from input data
    features = {
        "overall_accuracy": data.get('overall_accuracy', 0),
        "mcq_accuracy": data.get('mcq_accuracy', 0),
        "subjective_score": data.get('subjective_score', 0),
        "consistency": data.get('consistency', 0),
        "attempted_ratio": data.get('attempted_ratio', 0),
        "avg_time_spent": data.get('avg_time_spent', 0),
        "avg_difficulty": data.get('avg_difficulty', 1)
    }
    
    # Convert to DataFrame to match training data
    df = pd.DataFrame([features])[feature_columns]
    
    # Predict level
    level = level_model.predict(df)[0]
    
    # Predict advice tags
    advice_preds = advice_model.predict(df)[0]
    predicted_tags = [tag for tag, pred in zip(advice_tags, advice_preds) if pred == 1]
    
    if not predicted_tags:
        predicted_tags = ["revise_fundamentals"]

    advice_tag_to_suggestion = {
        'revise_fundamentals': 'Revisit AI fundamentals and core definitions before attempting the next mixed quiz.',
        'practice_mcq': 'Do focused MCQ drills in AI topics and apply elimination before finalizing options.',
        'practice_subjective': 'Structure subjective answers as concept, mechanism, and one practical AI example.',
        'improve_consistency': 'Practice timed mini-sets to reduce performance variance across AI subtopics.',
        'level_up_challenge': 'Move to higher-difficulty AI questions to convert momentum into advanced mastery.',
        'improve_speed': 'You are taking longer than average on questions. Try practicing with a timer to improve your pace.',
        'read_carefully': 'Your response time is very fast but accuracy is low. Try reading the questions more carefully before answering.'
    }
    
    suggestions = [advice_tag_to_suggestion[tag] for tag in predicted_tags if tag in advice_tag_to_suggestion]

    # Generate basic strengths/weaknesses and AI feedback
    accuracy = features['overall_accuracy']
    strengths = []
    weaknesses = []
    
    if accuracy >= 0.75:
        strengths.append('Strong overall score in this quiz attempt.')
    elif accuracy <= 0.5:
        weaknesses.append('Overall score is below target and needs reinforcement.')
        
    if features['mcq_accuracy'] >= 0.75:
        strengths.append('Good MCQ decision-making accuracy.')
    elif 0 < features['mcq_accuracy'] < 0.6:
        weaknesses.append('MCQ accuracy is low; option elimination needs improvement.')
        
    if features['subjective_score'] >= 0.72:
        strengths.append('Subjective responses show good depth and clarity.')
    elif 0 < features['subjective_score'] < 0.6:
        weaknesses.append('Subjective answers need better structure and completeness.')
        
    if features['consistency'] >= 0.78:
        strengths.append('Performance is consistent across different questions.')
    elif features['consistency'] < 0.65:
        weaknesses.append('Performance is inconsistent across questions.')
        
    if not strengths:
        strengths.append('You are attempting consistently, which is a strong learning behavior.')
    if not weaknesses:
        weaknesses.append('No major weakness detected in this attempt; focus on speed and retention.')

    # Feature 2: Measuring Understanding (Topic-based)
    topic_performance = data.get('topic_performance', {})
    current_topic_scores = data.get('current_topic_scores', {})
    
    # Historical Performance
    strong_history = [t for t, p in topic_performance.items() if p.get('avgAccuracy', 0) >= 0.75]
    weak_history = [t for t, p in topic_performance.items() if p.get('avgAccuracy', 0) < 0.6]

    # Current Quiz Performance
    strong_current = [t for t, s in current_topic_scores.items() if s >= 0.8]
    weak_current = [t for t, s in current_topic_scores.items() if s < 0.5]

    if strong_current:
        strengths.append(f"In this quiz, you excelled in: {', '.join(strong_current[:2])}")
    elif strong_history:
        strengths.append(f"Overall, you have a strong understanding in: {', '.join(strong_history[:2])}")

    if weak_current:
        weaknesses.append(f"In this quiz, you struggled with: {', '.join(weak_current[:2])}. Review these specifically.")
    elif weak_history:
        weaknesses.append(f"Generally, you need more practice in: {', '.join(weak_history[:2])}")

    # Feature 3: Analyzing Performance Patterns
    pattern_feedback = ""
    if features['avg_time_spent'] > 90 and features['overall_accuracy'] > 0.8:
        pattern_feedback = "Pattern: Slow but Highly Accurate. You take your time but get it right."
    elif features['avg_time_spent'] < 30 and features['overall_accuracy'] < 0.5:
        pattern_feedback = "Pattern: Rushing. You are answering very quickly but missing core concepts."
    elif features['avg_difficulty'] > 2.5 and features['overall_accuracy'] > 0.7:
        pattern_feedback = "Pattern: Advanced Mastery. You handle hard problems with ease."

    # Calculate Overall Level based on historical overall_accuracy if available
    overall_acc_hist = features['overall_accuracy'] # This is now current due to Quiz.tsx change, let's fix logic
    # Actually, let's assume we want to show current level as the primary.
    
    ai_feedback = f"Model-based performance summary: you scored {round(accuracy * 100)}% in this quiz.\n\n"
    ai_feedback += f"Current Quiz Level: {level.upper()}.\n\n"
    
    # Use topic performance to estimate an overall level
    all_attempts_acc = [p.get('avgAccuracy', 0) for p in topic_performance.values()]
    if all_attempts_acc:
        avg_hist = sum(all_attempts_acc) / len(all_attempts_acc)
        overall_level = "BEGINNER" if avg_hist < 0.5 else "INTERMEDIATE" if avg_hist < 0.75 else "ADVANCED"
        ai_feedback += f"Overall Progress Level: {overall_level}.\n\n"

    if pattern_feedback:
        ai_feedback += f"{pattern_feedback}\n\n"
    ai_feedback += "Keep up the good work and focus on your recommended suggestions!"

    return jsonify({
        "level": level,
        "adviceTags": predicted_tags,
        "strengths": strengths[:4],
        "weaknesses": weaknesses[:4],
        "aiFeedback": ai_feedback,
        "suggestions": suggestions[:5]
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)


