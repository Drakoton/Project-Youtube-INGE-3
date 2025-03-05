import os
import json
import sys
import re
from google.cloud import bigquery, storage
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from collections import Counter
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import nltk

# Télécharger les ressources nécessaires de nltk (si non déjà présentes)
nltk.download('punkt')
nltk.download('stopwords')

# Configurer l'authentification avec votre fichier de clé JSON
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "C:/Users/PC/Downloads/Youtube/mon-projet/config/trendly-446310-1a3b86c5d915.json"
client = bigquery.Client()

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "C:/Users/PC/Downloads/trendly_key_bucket.json"
storage_client = storage.Client()

# Spécifier le dataset et la table
dataset_id = 'trendly-446310.youtube_data'
table_id = 'HowToBitcoin_videos_bronze_20250303'

# Requête SQL pour récupérer les données de la vidéo
query = """
    SELECT video_id, transcription_url, comments_url, published_at, view_count, like_count
    FROM `trendly-446310.youtube_data.HowToBitcoin_videos_bronze_20250303`
"""
df = client.query(query).to_dataframe()

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'http\S+|@\S+|#\S+', '', text)
    return text.strip()

# Fonction d'analyse des sentiments avec VADER
def analyze_sentiment(text):
    analyzer = SentimentIntensityAnalyzer()
    sentiment_score = analyzer.polarity_scores(text)
    return sentiment_score['compound']  # Retourne le score composite

def detect_sentiment(score):
    if score >= 0.05:
        return 'positif'
    elif score <= -0.05:
        return 'negatif'
    else:
        return 'neutre'

# Nouvelle fonction pour récupérer la transcription depuis le bucket
def get_transcription_from_bucket(transcription_url):
    bucket_name = transcription_url.split('/')[2]
    blob_name = '/'.join(transcription_url.split('/')[3:])
    bucket = storage_client.get_bucket(bucket_name)
    blob = bucket.blob(blob_name)

    transcription_data = blob.download_as_text()
    return transcription_data

# Fonction pour récupérer les commentaires depuis un bucket
def get_comments_from_bucket(comments_url):
    bucket_name = comments_url.split('/')[2]
    blob_name = '/'.join(comments_url.split('/')[3:])
    bucket = storage_client.get_bucket(bucket_name)
    blob = bucket.blob(blob_name)

    comments_data = json.loads(blob.download_as_text())
    return comments_data

# Analyser les mots les plus fréquents dans les commentaires positifs et négatifs
def get_most_frequent_words(comments, sentiment):
    words = []
    # Charger la liste des mots vides en français
    stop_words = set(stopwords.words('french'))
    
    for comment in comments:
        comment_sentiment = detect_sentiment(analyze_sentiment(comment))
        if comment_sentiment == sentiment:
            words.extend(word_tokenize(clean_text(comment)))
    
    # Filtrer les mots vides et non alphabétiques
    words = [word for word in words if word.isalnum() and word not in stop_words]
    word_counts = Counter(words)
    return word_counts.most_common(50)

comments_sentiments = {"positif": 0, "neutre": 0, "negatif": 0}
transcription_sentiments = {"positif": 0, "neutre": 0, "negatif": 0}

analyzed_comments = []
video_data = []

positive_words = []
negative_words = []

for index, row in df.iterrows():
    transcription_url = row['transcription_url']
    comments_url = row['comments_url']

    # Récupérer et analyser la transcription
    if transcription_url:
        transcription = get_transcription_from_bucket(transcription_url)
        transcription_score = analyze_sentiment(transcription)
        transcription_sentiment = detect_sentiment(transcription_score)
        transcription_sentiments[transcription_sentiment] += 1

    # Analyser les commentaires dans le bucket
    if comments_url:
        comments_data = get_comments_from_bucket(comments_url)
        for comment in comments_data:
            comment_score = analyze_sentiment(comment)
            sentiment = detect_sentiment(comment_score)
            comments_sentiments[sentiment] += 1
            analyzed_comments.append({"text": comment, "sentiment": sentiment})

        # Récupérer les mots fréquents pour les commentaires positifs et négatifs
        positive_words = get_most_frequent_words(comments_data, 'positif')
        negative_words = get_most_frequent_words(comments_data, 'negatif')

    # Ajouter les données vidéo
    video_data.append({
        'video_id': row['video_id'],
        'comm_sentiment_score': transcription_score,
        'view_count': row['view_count'],
        'like_count': row['like_count']
    })

# Ajouter les mots fréquents positifs et négatifs dans le résultat
result = {
    'transcription_sentiments': transcription_sentiments,
    'comments_sentiments': comments_sentiments,
    'comments': analyzed_comments,
    'video_data': video_data,
    'positive_words': positive_words,  # Mots les plus utilisés dans les commentaires positifs
    'negative_words': negative_words,  # Mots les plus utilisés dans les commentaires négatifs
}

# ✅ Seul cet print() est autorisé
print(json.dumps(result))

sys.stdout.flush()
sys.exit(0)
