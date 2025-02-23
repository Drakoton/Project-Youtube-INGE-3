# pip install pandas openpyxl textblob-fr matplotlib

import pandas as pd
import re
from textblob_fr import PatternTagger, PatternAnalyzer
from textblob import TextBlob  # Import TextBlob from the correct module
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

#########################################
# Génération de statistiques supplémentaires
#########################################

# 1. Pourcentage de commentaires positifs, négatifs et neutres
total_comments = df.shape[0]
positive_comments = df[df['comm_sentiment'] == 'positif'].shape[0]
negative_comments = df[df['comm_sentiment'] == 'négatif'].shape[0]
neutral_comments  = df[df['comm_sentiment'] == 'neutre'].shape[0]

print("Pourcentage de commentaires positifs: {:.2f}%".format(positive_comments / total_comments * 100))
print("Pourcentage de commentaires négatifs: {:.2f}%".format(negative_comments / total_comments * 100))
print("Pourcentage de commentaires neutres: {:.2f}%".format(neutral_comments / total_comments * 100))

# 2. Sentiment moyen par vidéo
# Ici, on suppose qu'une ligne correspond à une vidéo unique.
df['video_sentiment_moyen'] = df['comm_sentiment_score']
moyenne_sentiment = df['video_sentiment_moyen'].mean()
print("Sentiment moyen (score) par vidéo: {:.3f}".format(moyenne_sentiment))

# 3. Corrélation entre sentiment et nombre de vues ou de likes
colonnes_corr = []
if 'view_count' in df.columns:
    colonnes_corr.append('view_count')
if 'like_count' in df.columns:
    colonnes_corr.append('like_count')

if colonnes_corr:
    correlation = df[['comm_sentiment_score'] + colonnes_corr].corr()
    print("Corrélations entre le sentiment et les indicateurs:")
    print(correlation)
else:
    print("Les colonnes 'view_count' et/ou 'like_count' n'existent pas dans le fichier.")

if colonnes_corr:
    for col in colonnes_corr:
        plt.figure(figsize=(8,5))
        plt.scatter(df['comm_sentiment_score'], df[col], alpha=0.5)
        plt.title("Corrélation entre le sentiment et " + col)
        plt.xlabel("Score de sentiment (Commentaires)")
        plt.ylabel(col)
        plt.show()

#########################################
# Visualisation temporelle du sentiment
#########################################

# Graphique quotidien
if 'published_at' in df.columns and df['published_at'].notnull().sum() > 0:
    # Trier le DataFrame par date
    df_sorted = df.sort_values('published_at')
    
    # Création d'une série temporelle pour le sentiment moyen des commentaires par jour
    sentiment_daily = df_sorted.groupby(df_sorted['published_at'].dt.date)['comm_sentiment_score'].mean()
    
    plt.figure(figsize=(10,6))
    sentiment_daily.plot(marker='o')
    plt.title("Évolution quotidienne du sentiment moyen (Commentaires)")
    plt.xlabel("Date")
    plt.ylabel("Sentiment moyen")
    plt.xticks(rotation=45)
    plt.grid(True)
    plt.show()
else:
    print("La colonne 'published_at' n'est pas présente ou ne contient pas de données valides pour la visualisation quotidienne.")

# Graphique mensuel
if 'published_at' in df.columns and df['published_at'].notnull().sum() > 0:
    # Utiliser le DataFrame trié précédemment
    df_sorted['year_month'] = df_sorted['published_at'].dt.to_period('M')
    sentiment_monthly = df_sorted.groupby('year_month')['comm_sentiment_score'].mean()
    
    # Conversion de l'index (période) en datetime pour un meilleur affichage
    sentiment_monthly.index = sentiment_monthly.index.to_timestamp()
    
    plt.figure(figsize=(10,6))
    sentiment_monthly.plot(marker='o')
    plt.title("Évolution mensuelle du sentiment moyen (Commentaires)")
    plt.xlabel("Date")
    plt.ylabel("Sentiment moyen")
    plt.xticks(rotation=45)
    plt.grid(True)
    plt.show()
else:
    print("La colonne 'published_at' n'est pas présente ou ne contient pas de données valides pour la visualisation mensuelle.")
