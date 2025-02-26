import sys
import os
import json
import re
import io
import warnings
from textblob_fr import PatternTagger, PatternAnalyzer
from textblob import TextBlob
from google.cloud import bigquery
import pandas as pd

# Configuration et initialisation
warnings.filterwarnings("ignore", category=UserWarning)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "C:/Users/PC/Downloads/Youtube/mon-projet/config/trendly-446310-1a3b86c5d915.json"
client = bigquery.Client()

# Lecture de l'ID depuis les arguments
id_argument = sys.argv[1] if len(sys.argv) > 1 else None

# Requête pour récupérer les données
query = f"""
    SELECT description, comments, published_at, view_count, like_count, video_id
    FROM trendly-446310.youtube_data.FINAL_CHANNELS
    WHERE video_id = '{id_argument}'
    LIMIT 1
"""
df = client.query(query).to_dataframe()

if df.empty:
    print(json.dumps({'error': 'Aucune donnée trouvée pour cet ID'}))
    sys.exit(1)

# Nettoyage et analyse des sentiments
df['description_clean'] = df['description'].astype(str).apply(lambda x: re.sub(r'http\S+|@\S+|#\S+', '', x.lower()))
df['comments_clean'] = df['comments'].astype(str).apply(lambda x: re.sub(r'http\S+|@\S+|#\S+', '', x.lower()))

def analyze_sentiment(text):
    blob = TextBlob(text, pos_tagger=PatternTagger(), analyzer=PatternAnalyzer())
    return blob.sentiment[0]

df['description_sentiment_score'] = df['description_clean'].apply(analyze_sentiment)
df['comm_sentiment_score'] = df['comments_clean'].apply(analyze_sentiment)

# Catégorisation des sentiments
def categorize_sentiment(score):
    if score > 0.1:
        return 'positif'
    elif score < -0.1:
        return 'négatif'
    else:
        return 'neutre'

df['description_sentiment_category'] = df['description_sentiment_score'].apply(categorize_sentiment)
df['comm_sentiment_category'] = df['comm_sentiment_score'].apply(categorize_sentiment)

# ✅ Générer l'histogramme des scores des commentaires
comment_scores = df['comm_sentiment_score'].tolist()
score_bins = pd.cut(comment_scores, bins=10, include_lowest=True)
comments_distribution = score_bins.value_counts().sort_index().to_dict()

# ✅ **Convertir les données en types natifs JSON-compatibles**
result = {
    'description_sentiments': df['description_sentiment_category'].value_counts().to_dict(),
    'comments_sentiments': df['comm_sentiment_category'].value_counts().to_dict(),
    'comments_distribution': [{'score': str(interval), 'count': count} for interval, count in comments_distribution.items()],
    'video_data': df[['video_id', 'description', 'comments', 'view_count', 'like_count']].astype(str).to_dict(orient='records')
}

print(json.dumps(result, ensure_ascii=False))
sys.stdout.flush()
sys.exit(0)
