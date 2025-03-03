import pandas as pd
import re
import json
import sys
import io
import warnings
from textblob_fr import PatternTagger, PatternAnalyzer
from textblob import TextBlob
from google.cloud import bigquery
import os

warnings.filterwarnings("ignore", category=UserWarning)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "C:/Users/PC/Downloads/Youtube/mon-projet/config/trendly-446310-1a3b86c5d915.json"

client = bigquery.Client()

query = """
    SELECT transcription, comments, published_at, view_count, like_count
    FROM trendly-446310.youtube_data.FINAL_CHANNELS
"""
df = client.query(query).to_dataframe()

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'http\S+|@\S+|#\S+', '', text)
    return text.strip()

df['transcription_clean'] = df['transcription'].astype(str).apply(clean_text)
df['comments_clean'] = df['comments'].astype(str).apply(clean_text)

def analyze_sentiment(text):
    blob = TextBlob(text, pos_tagger=PatternTagger(), analyzer=PatternAnalyzer())
    return blob.sentiment[0]

# Analyse des sentiments
df['transcription_sentiment_score'] = df['transcription_clean'].apply(analyze_sentiment)
df['comm_sentiment_score'] = df['comments_clean'].apply(analyze_sentiment)

# Fonction pour catégoriser les sentiments
def categorize_sentiment(score):
    if score > 0.1:
        return 'positif'
    elif score < -0.1:
        return 'négatif'
    else:
        return 'neutre'

df['transcription_sentiment_category'] = df['transcription_sentiment_score'].apply(categorize_sentiment)
df['comm_sentiment_category'] = df['comm_sentiment_score'].apply(categorize_sentiment)

# Calcul de la distribution des sentiments
transcription_sentiments = df['transcription_sentiment_category'].value_counts().to_dict()
comments_sentiments = df['comm_sentiment_category'].value_counts().to_dict()

df['video_data'] = df.apply(lambda row: {
    'comm_sentiment_score': row['comm_sentiment_score'],
    'view_count': row['view_count'],
    'like_count': row['like_count']
}, axis=1)

correlation = df[['comm_sentiment_score', 'view_count', 'like_count']].corr().to_dict()

result = {
    'transcription_sentiments': transcription_sentiments,
    'comments_sentiments': comments_sentiments,
    'video_data': df['video_data'].tolist(),
    'correlation': correlation
}

# ✅ Seul cet print() est autorisé
print(json.dumps(result))

sys.stdout.flush()
sys.exit(0)
