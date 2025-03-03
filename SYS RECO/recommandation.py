import os
import json
import sys
import pandas as pd
import numpy as np  # Importer numpy ici
from google.cloud import bigquery
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
from scipy.sparse import hstack
import nltk
from nltk.corpus import stopwords
from datetime import timedelta

# Assurez-vous que le script reçoit un video_id comme argument
if len(sys.argv) < 2:
    print(json.dumps({'error': 'Aucun videoId fourni'}))
    sys.exit(1)

video_id = sys.argv[1]

# Configurer l'authentification pour BigQuery
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "C:/Users/PC/Downloads/We/dashboard-nextjs/keys/trendly-key_bigquery.json"
client = bigquery.Client()

# Définir le dataset et la table BigQuery
dataset_id = 'trendly-446310.youtube_data'
table_id = 'FINAL_CHANNELS'

# Requête pour récupérer les vidéos
query = f"""
    SELECT video_id, title, description, tags, duration, view_count, like_count, transcription, comments, channel_name
    FROM {dataset_id}.{table_id}
"""
query_job = client.query(query)
df = query_job.result().to_dataframe()

# Trouver l'index de la vidéo dans le DataFrame en fonction du video_id
try:
    video_idx = df[df['video_id'] == video_id].index[0]  # Trouver l'index de la vidéo
except IndexError:
    print(json.dumps({'error': f'Vidéo avec l\'ID {video_id} non trouvée.'}))
    sys.exit(1)

# Préparation du texte pour la recommandation
df['combined_text'] = df['transcription'].astype(str) + " " + df['comments'].astype(str) + " " + df['tags'].astype(str) + " " + df['title'].astype(str) + " " + df['description'].astype(str)

# Nettoyage du texte
def nettoyer_texte(text):
    text = text.lower()
    return text

df['combined_text'] = df['combined_text'].apply(nettoyer_texte)

# Vectorisation du texte avec TF-IDF
french_stop_words = stopwords.words('french')
vectorizer = TfidfVectorizer(stop_words=french_stop_words)
tfidf_matrix = vectorizer.fit_transform(df['combined_text'])

# Variables numériques à inclure dans la recommandation
numeric_features = ['view_count', 'like_count']

# Remplacer les valeurs manquantes dans les colonnes numériques par 0
df[numeric_features] = df[numeric_features].fillna(0)

# Mise à l'échelle des variables numériques
scaler = StandardScaler()
numeric_matrix = scaler.fit_transform(df[numeric_features])

# Combinaison de la matrice TF-IDF et des variables numériques
from scipy import sparse
numeric_sparse = sparse.csr_matrix(numeric_matrix)

poids_text = 1.0
poids_numeric = 0.5

combined_matrix = hstack([tfidf_matrix * poids_text, numeric_sparse * poids_numeric])

# Fonction de recommandation
def recommander_video(idx_video):
    similarities = cosine_similarity(combined_matrix[idx_video], combined_matrix).flatten()

    # Exclure la vidéo cible
    indices_similaires = np.argsort(similarities)[::-1]
    indices_similaires = [i for i in indices_similaires if i != idx_video]

    # Sélection des 5 vidéos les plus similaires
    top_5_indices = indices_similaires[:5]
    top_5_videos = df.iloc[top_5_indices]

    return top_5_videos[['video_id', 'channel_name', 'title', 'tags', 'duration', 'view_count', 'like_count']]

# Exécution de la recommandation pour la vidéo donnée
recommended_videos = recommander_video(video_idx)  # Utiliser l'index de la vidéo recherchée

# Convertir les recommandations en liste avant de les passer à json.dumps()
print(json.dumps({
    'recommendations': recommended_videos.to_dict(orient='records')
}, default=str))  # Utilisez 'default=str' pour convertir les objets non sérialisables en chaîne de caractères.
