import os
import json
import sys
from google.cloud import bigquery, storage
from textblob import TextBlob  # Ajout de TextBlob pour l'analyse de sentiment

# Vérifier si un videoId est passé en argument
if len(sys.argv) < 2:
    print(json.dumps({'error': 'Aucun videoId fourni'}))
    sys.exit(1)

video_id = sys.argv[1]

# Configurer l'authentification avec votre fichier de clé JSON
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "C:/Users/PC/Downloads/trendly-key_bigquery.json"
client = bigquery.Client()

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "C:/Users/PC/Downloads/trendly_key_bucket.json"
storage_client = storage.Client()

# Spécifier le dataset et la table
dataset_id = 'trendly-446310.youtube_data'
table_id = 'ProLearning_videos_20250226'

# Requête SQL pour récupérer les données de la vidéo
query = f"""
    SELECT *
    FROM `{dataset_id}.{table_id}`
    WHERE video_id = '{video_id}'
"""

# Exécuter la requête
query_job = client.query(query)
rows = query_job.result().to_dataframe()

# Vérifier si la vidéo existe dans la base
if not rows.empty:
    comments_url = rows.iloc[0]['comments_url']

    if comments_url:
        # Extraire le bucket et le fichier
        bucket_name = comments_url.split('/')[2]
        blob_name = '/'.join(comments_url.split('/')[3:])

        # Accéder au fichier dans le bucket
        bucket = storage_client.get_bucket(bucket_name)
        blob = bucket.blob(blob_name)

        # Télécharger et lire le fichier JSON des commentaires
        comments_data = json.loads(blob.download_as_text())

        # Fonction d'analyse des sentiments avec TextBlob
        def detect_sentiment(comment):
            analysis = TextBlob(comment)
            polarity = analysis.sentiment.polarity  # Score entre -1 (négatif) et 1 (positif)

            if polarity > 0:
                return "positif"
            elif polarity < 0:
                return "negatif"
            else:
                return "neutre"

        # Associer chaque commentaire à un sentiment
        sentiments = {"positif": 0, "neutre": 0, "negatif": 0}
        analyzed_comments = []

        for comment in comments_data:
            sentiment = detect_sentiment(comment)
            sentiments[sentiment] += 1
            analyzed_comments.append({"text": comment, "sentiment": sentiment})

        # Retourner les données JSON avec l'analyse des sentiments
        print(json.dumps({
            'video_id': video_id,
            'comment_count': len(comments_data),
            'comments': analyzed_comments,
            'sentiments': sentiments
        }))

    else:
        print(json.dumps({'video_id': video_id, 'comment_count': 0, 'comments': [], 'sentiments': {}}))
else:
    print(json.dumps({'video_id': video_id, 'comment_count': 0, 'comments': [], 'sentiments': {}}))
