import pandas as pd
import re
from textblob_fr import PatternTagger, PatternAnalyzer
from textblob import TextBlob  # Import TextBlob from the correct module
import matplotlib.pyplot as plt
from google.cloud import bigquery
import os
import sys
import io

# Force the output encoding to UTF-8 for Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Chargement de l'authentification BigQuery
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "C:/Users/PC/Downloads/Youtube/mon-projet/config/trendly-446310-1a3b86c5d915.json"

# Créer un client BigQuery
client = bigquery.Client()

# Fonction de nettoyage de texte pour du français, incluant la gestion des emojis
def clean_text(text):
    text = str(text).lower()  # conversion en minuscules
    # Suppression des URLs, mentions et hashtags
    text = re.sub(r'http\S+|@\S+|#\S+', '', text)
    # Suppression des caractères non ASCII (y compris les emojis)
    text = text.encode('ascii', 'ignore').decode()  # Ignore les caractères non ASCII
    # Suppression des caractères spéciaux non alphabétiques
    text = re.sub(r'[^a-zàâçéèêëîïôûùüÿñæœ\s]', '', text)
    return text.strip()


# Exemple de récupération des données depuis BigQuery
query = """
    SELECT description, comments, published_at
    FROM trendly-446310.youtube_data.TEST_CHANNELS
"""
# Exécution de la requête et récupération des données
df = client.query(query).to_dataframe()

# Vérifier que les colonnes nécessaires existent (ici 'description' et 'comments')
if 'description' not in df.columns or 'comments' not in df.columns:
    raise ValueError("Le fichier doit contenir les colonnes 'description' et 'comments'.")

# Convertir la colonne 'published_at' en datetime (si elle existe)
if 'published_at' in df.columns:
    df['published_at'] = pd.to_datetime(df['published_at'], errors='coerce')

# Appliquer le nettoyage sur les textes
df['description_clean'] = df['description'].astype(str).apply(clean_text)
df['comments_clean'] = df['comments'].astype(str).apply(clean_text)

# Fonction pour analyser le sentiment avec TextBlob-fr
def analyze_sentiment(text):
    blob = TextBlob(text, pos_tagger=PatternTagger(), analyzer=PatternAnalyzer())
    # Le score va de -1 (très négatif) à +1 (très positif)
    return blob.sentiment[0]

# Appliquer l'analyse de sentiment sur les descriptions et commentaires
df['desc_sentiment_score'] = df['description_clean'].apply(analyze_sentiment)
df['comm_sentiment_score'] = df['comments_clean'].apply(analyze_sentiment)

# Classification basique du sentiment selon un seuil (ici 0.05)
def classify_sentiment(score, threshold=0.05):
    if score > threshold:
        return 'positif'
    elif score < -threshold:
        return 'négatif'
    else:
        return 'neutre'

df['desc_sentiment'] = df['desc_sentiment_score'].apply(classify_sentiment)
df['comm_sentiment'] = df['comm_sentiment_score'].apply(classify_sentiment)

# Afficher un aperçu des résultats
print(df[['description', 'desc_sentiment_score', 'desc_sentiment', 'comments', 'comm_sentiment_score', 'comm_sentiment']].head())

# Visualisation de la distribution des sentiments pour les descriptions
sentiment_counts_desc = df['desc_sentiment'].value_counts()
plt.figure(figsize=(8,5))
sentiment_counts_desc.plot(kind='bar', color=['green', 'gray', 'red'])
plt.title("Distribution des sentiments (Descriptions)")
plt.xlabel("Sentiment")
plt.ylabel("Nombre d'occurrences")
plt.show()

# Visualisation de la distribution des sentiments pour les commentaires
sentiment_counts_comm = df['comm_sentiment'].value_counts()
plt.figure(figsize=(8,5))
sentiment_counts_comm.plot(kind='bar', color=['green', 'gray', 'red'])
plt.title("Distribution des sentiments (Commentaires)")
plt.xlabel("Sentiment")
plt.ylabel("Nombre d'occurrences")
plt.show()

# Génération de statistiques supplémentaires et visualisation (comme dans votre code original)...
