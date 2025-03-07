import os
import json
import sys
import re
import numpy as np
from google.cloud import bigquery, storage
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from collections import Counter
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer

# Télécharger les ressources nécessaires de nltk
nltk.download('punkt')
nltk.download('stopwords')

# Liste des mots supplémentaires à exclure
additional_stopwords = [
    "ça", "si", "dit", "ouais", "dire", "donc", "fait", "parce", "peut", "faut", 
    "quoi", "là", "avoir", "sait", "euh", "dis", "el", "los", "del", "por", "las", "bah",
    "buf", "faire", "très", "où", "extrêmement", "bien", "ok", "fermer", "vient", "sans", 
    "jamais", "vois", "construit", "être", "deux", "vu", "vérifier", "remplir", "doit", 
    "va", "truc", "vraiment", "plus", "allez", "peu", "non", "devrait", "cette", "ni", 
    "tout", "quand", "faire", "cetera", "comme", "oui", "voilà", "hui", "aujourd", 
    "aussi", "car", "effectivement", "écoute", "comment", "commencé", "tellement", "veut",
    "utiliser", "alors", "pourquoi", "trois", "facon", "dont", "côté"
]

# Charger la liste des stopwords français et ajouter les mots supplémentaires
stop_words_fr = set(stopwords.words('french')) | set(additional_stopwords)

# Configurer l'authentification Google Cloud
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "C:/Users/PC/Downloads/We/dashboard-nextjs/keys/trendly-key_bigquery.json"
client = bigquery.Client()

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "C:/Users/PC/Downloads/We/dashboard-nextjs/keys/trendly_key_bucket.json"
storage_client = storage.Client()

# Requête SQL pour récupérer les données
query = """
    SELECT video_id, transcription_url, comments_url, published_at, view_count, like_count, tags, title
    FROM `trendly-446310.youtube_data.HowToBitcoin_videos_bronze_20250303`
"""
df = client.query(query).to_dataframe()

# Fonction de nettoyage de texte
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'http\S+|@\S+|#\S+', '', text)  # Supprime les liens, mentions, hashtags
    return text.strip()

# Fonction d'analyse des sentiments avec VADER
def analyze_sentiment(text):
    analyzer = SentimentIntensityAnalyzer()
    sentiment_score = analyzer.polarity_scores(text)
    return sentiment_score['compound']

def detect_sentiment(score):
    if score >= 0.05:
        return 'positif'
    elif score <= -0.05:
        return 'negatif'
    else:
        return 'neutre'

# Fonction pour récupérer la transcription depuis un bucket
def get_transcription_from_bucket(transcription_url):
    bucket_name = transcription_url.split('/')[2]
    blob_name = '/'.join(transcription_url.split('/')[3:])
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    return blob.download_as_text()

# Fonction pour récupérer les commentaires depuis un bucket
def get_comments_from_bucket(comments_url):
    bucket_name = comments_url.split('/')[2]
    blob_name = '/'.join(comments_url.split('/')[3:])
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    return json.loads(blob.download_as_text())

# Fonction pour analyser les mots fréquents dans les commentaires
def get_most_frequent_words(comments, sentiment):
    words = []
    for comment in comments:
        comment_sentiment = detect_sentiment(analyze_sentiment(comment))
        if comment_sentiment == sentiment:
            words.extend(word_tokenize(clean_text(comment)))

    # Filtrer les mots vides et non alphabétiques
    words = [word for word in words if word.isalnum() and word not in stop_words_fr]
    word_counts = Counter(words)
    return word_counts.most_common(50)

def extract_themes(text, tags, top_n=5):
    """
    Extrait les principaux thèmes d'un texte en utilisant TF-IDF,
    tout en priorisant les mots liés aux tags.
    """
    if not text.strip():
        return []

    tag_text = " ".join(tags)  # Ajouter les tags à la transcription pour améliorer la précision des thèmes
    text_with_tags = text + " " + tag_text  # Influence des tags sur la pondération

    # Convertir l'ensemble des stopwords en liste
    stop_words_fr_list = list(stop_words_fr)

    # TF-IDF en français
    vectorizer = TfidfVectorizer(stop_words=stop_words_fr_list)
    tfidf_matrix = vectorizer.fit_transform([text_with_tags])
    feature_array = vectorizer.get_feature_names_out()
    tfidf_sorting = tfidf_matrix.toarray().flatten().argsort()[::-1]

    # Récupérer les mots clés les plus pertinents
    top_words = [feature_array[i] for i in tfidf_sorting[:top_n]]
    return top_words

# Initialisation des résultats
comments_sentiments = {"positif": 0, "neutre": 0, "negatif": 0}
transcription_sentiments = {"positif": 0, "neutre": 0, "negatif": 0}

analyzed_comments = []
video_data = []
positive_words = []
negative_words = []
video_themes = []

# Parcours des vidéos et analyse des données
for index, row in df.iterrows():
    transcription_url = row['transcription_url']
    comments_url = row['comments_url']
    video_id = row['video_id']
    title = row['title']

    # Gestion des tags
    tags = row['tags']
    if isinstance(tags, str):  
        tags = tags.split(',')
    elif isinstance(tags, list) or isinstance(tags, np.ndarray):  
        tags = list(tags)  
    else:
        tags = []

    # Extraction des thèmes de la transcription
    themes = []
    if transcription_url:
        transcription = get_transcription_from_bucket(transcription_url)
        themes = extract_themes(transcription, tags)

    # Stockage des thèmes et des tags
    video_themes.append({
        'video_id': video_id,
        'tags': tags,
        'themes': themes,
        'title': title
    })

    # Analyse des sentiments dans la transcription
    transcription_score = 0
    if transcription_url:
        transcription = get_transcription_from_bucket(transcription_url)
        transcription_score = analyze_sentiment(transcription)
        transcription_sentiment = detect_sentiment(transcription_score)
        transcription_sentiments[transcription_sentiment] += 1

    # Analyse des commentaires
    if comments_url:
        comments_data = get_comments_from_bucket(comments_url)
        for comment in comments_data:
            comment_score = analyze_sentiment(comment)
            sentiment = detect_sentiment(comment_score)
            comments_sentiments[sentiment] += 1
            analyzed_comments.append({"text": comment, "sentiment": sentiment})

        # Extraction des mots les plus fréquents
        positive_words = get_most_frequent_words(comments_data, 'positif')
        negative_words = get_most_frequent_words(comments_data, 'negatif')

    # Stockage des données de la vidéo
    video_data.append({
        'video_id': video_id,
        'comm_sentiment_score': transcription_score,
        'view_count': row['view_count'],
        'like_count': row['like_count']
    })

# Préparation du résultat final
result = {
    'transcription_sentiments': transcription_sentiments,
    'comments_sentiments': comments_sentiments,
    'comments': analyzed_comments,
    'video_data': video_data,
    'positive_words': positive_words,
    'negative_words': negative_words,
    'video_themes': video_themes
}

# ✅ Correction de l'encodage pour éviter UnicodeEncodeError
import sys
import io

# Rediriger sys.stdout pour éviter l'erreur d'encodage dans le terminal
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Affichage du résultat en UTF-8
print(json.dumps(result, ensure_ascii=False))

sys.stdout.flush()
sys.exit(0)
