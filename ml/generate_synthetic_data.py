import pandas as pd
import numpy as np
import os

np.random.seed(42)
num_rows = 10000

# We will create 3 types of student profiles to make the dataset realistic.

# Group 1: Beginners (30% of dataset)
n_beg = int(num_rows * 0.3)
beg_mcq = np.clip(np.random.normal(0.4, 0.1, n_beg), 0, 1)
beg_subj = np.clip(np.random.normal(0.3, 0.15, n_beg), 0, 1)
beg_cons = np.clip(np.random.normal(0.4, 0.15, n_beg), 0, 1)
beg_att = np.clip(np.random.normal(0.6, 0.2, n_beg), 0, 1)
# Beginners either take a long time or rush (bimodal)
beg_time = np.where(np.random.rand(n_beg) > 0.5, 
                   np.random.normal(130, 20, n_beg), 
                   np.random.normal(25, 5, n_beg))
beg_diff = np.random.choice([1, 2], size=n_beg, p=[0.7, 0.3])

# Group 2: Intermediates (50% of dataset)
n_int = int(num_rows * 0.5)
int_mcq = np.clip(np.random.normal(0.7, 0.1, n_int), 0, 1)
int_subj = np.clip(np.random.normal(0.6, 0.15, n_int), 0, 1)
int_cons = np.clip(np.random.normal(0.65, 0.1, n_int), 0, 1)
int_att = np.clip(np.random.normal(0.85, 0.1, n_int), 0, 1)
int_time = np.random.normal(60, 15, n_int)
int_diff = np.random.choice([1, 2, 3], size=n_int, p=[0.2, 0.6, 0.2])

# Group 3: Advanced (20% of dataset)
n_adv = num_rows - n_beg - n_int
adv_mcq = np.clip(np.random.normal(0.9, 0.05, n_adv), 0, 1)
adv_subj = np.clip(np.random.normal(0.85, 0.1, n_adv), 0, 1)
adv_cons = np.clip(np.random.normal(0.85, 0.05, n_adv), 0, 1)
adv_att = np.clip(np.random.normal(0.98, 0.02, n_adv), 0, 1)
adv_time = np.random.normal(40, 10, n_adv)
adv_diff = np.random.choice([2, 3], size=n_adv, p=[0.3, 0.7])

# Combine them
mcq_acc = np.concatenate([beg_mcq, int_mcq, adv_mcq])
subj_score = np.concatenate([beg_subj, int_subj, adv_subj])
cons = np.concatenate([beg_cons, int_cons, adv_cons])
att = np.concatenate([beg_att, int_att, adv_att])
times = np.concatenate([beg_time, int_time, adv_time])
diffs = np.concatenate([beg_diff, int_diff, adv_diff])

# Overall accuracy is heavily correlated to MCQ and Subjective scores, with some noise
overall_acc = np.clip((mcq_acc * 0.6) + (subj_score * 0.4) + np.random.normal(0, 0.05, num_rows), 0, 1)

df = pd.DataFrame({
    'user_id': [f'u{i}' for i in range(1, num_rows + 1)],
    'quiz_id': [f'q{i}' for i in range(1, num_rows + 1)],
    'overall_accuracy': np.round(overall_acc, 2),
    'mcq_accuracy': np.round(mcq_acc, 2),
    'subjective_score': np.round(subj_score, 2),
    'consistency': np.round(cons, 2),
    'attempted_ratio': np.round(att, 2),
    'avg_time_spent': np.round(np.clip(times, 5, 300), 0),
    'avg_difficulty': diffs
})

# Shuffle dataset
df = df.sample(frac=1).reset_index(drop=True)

# Ensure directory exists
os.makedirs('ml/data', exist_ok=True)

df.to_csv('ml/data/synthetic_10k_dataset.csv', index=False)
print("Successfully generated 10,000 synthetic rows in ml/data/synthetic_10k_dataset.csv")
