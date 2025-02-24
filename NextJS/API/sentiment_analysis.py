import pandas as pd
import re
from textblob_fr import PatternTagger, PatternAnalyzer
from textblob import TextBlob
from google.cloud import bigquery
import os
import sys
import io
import json
import warnings

# Ignorer les warnings de type UserWarning
warnings.filterwarnings("ignore", category=UserWarning)

# Force l'encodage en UTF-8 pour Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Chargement de l'authentification BigQuery
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "C:/Users/PC/Downloads/Youtube/mon-projet/config/trendly-446310-1a3b86c5d915.json"

# Créer un client BigQuery
client = bigquery.Client()

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'http\S+|@\S+|#\S+', '', text)
    text = text.encode('ascii', 'ignore').decode()
    text = re.sub(r'[^a-zàâçéèêëîïôûùüÿñæœ\s]', '', text)
    return text.strip()

query = """
    SELECT description, comments, published_at
    FROM trendly-446310.youtube_data.TEST_CHANNELS
"""
df = client.query(query).to_dataframe()

if 'description' not in df.columns or 'comments' not in df.columns:
    raise ValueError("Le fichier doit contenir les colonnes 'description' et 'comments'.")

if 'published_at' in df.columns:
    df['published_at'] = pd.to_datetime(df['published_at'], errors='coerce')

df['description_clean'] = df['description'].astype(str).apply(clean_text)
df['comments_clean'] = df['comments'].astype(str).apply(clean_text)

def analyze_sentiment(text):
    blob = TextBlob(text, pos_tagger=PatternTagger(), analyzer=PatternAnalyzer())
    return blob.sentiment[0]

df['desc_sentiment_score'] = df['description_clean'].apply(analyze_sentiment)
df['comm_sentiment_score'] = df['comments_clean'].apply(analyze_sentiment)

def classify_sentiment(score, threshold=0.05):
    if score > threshold:
        return 'positif'
    elif score < -threshold:
        return 'négatif'
    else:
        return 'neutre'

df['desc_sentiment'] = df['desc_sentiment_score'].apply(classify_sentiment)
df['comm_sentiment'] = df['comm_sentiment_score'].apply(classify_sentiment)

sentiment_counts_desc = df['desc_sentiment'].value_counts().to_dict()
sentiment_counts_comm = df['comm_sentiment'].value_counts().to_dict()

result = {
    'description_sentiments': sentiment_counts_desc,
    'comments_sentiments': sentiment_counts_comm
}

print(json.dumps(result))
sys.stdout.flush()
sys.exit(0)
