import pandas as pd
import re
from textblob_fr import PatternTagger, PatternAnalyzer
from textblob import TextBlob # Import TextBlob from the correct module
import matplotlib.pyplot as plt

# Fonction de nettoyage de texte pour du français
def clean_text(text):
    text = str(text).lower()  # conversion en minuscules
    # Suppression d'URLs, mentions et caractères spéciaux
    text = re.sub(r'http\S+|@\S+|#\S+', '', text)
    text = re.sub(r'[^a-zàâçéèêëîïôûùüÿñæœ\s]', '', text)
    return text.strip()

# Charger le fichier Excel
df = pd.read_excel('/content/results-20250223-021124.xlsx')

# Vérifier que les colonnes nécessaires existent (ici 'description' et 'comments')
if 'description' not in df.columns or 'comments' not in df.columns:
    raise ValueError("Le fichier Excel doit contenir les colonnes 'description' et 'comments'.")

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
