#!pip install nltk
#import nltk
#nltk.download('stopwords')
#from nltk.corpus import stopwords

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
from scipy.sparse import hstack
import nltk  # Make sure nltk is imported
nltk.download('stopwords')  # Download stopwords if not already downloaded
from nltk.corpus import stopwords

# 1. Chargement des données
df = pd.read_excel('/content/results-20250223-021124.xlsx')

# 2. Préparation du texte en combinant les colonnes pertinentes
df['combined_text'] = df['tags'].astype(str) + " " + df['title'].astype(str) + " " + df['description'].astype(str)

# Fonction de nettoyage de texte simple
def nettoyer_texte(text):
    text = text.lower()
    # Vous pouvez ajouter d'autres étapes de nettoyage ici (suppression de ponctuation, stop words, etc.)
    return text

df['combined_text'] = df['combined_text'].apply(nettoyer_texte)

# 3. Vectorisation du texte avec TF-IDF
french_stop_words = stopwords.words('french') 
vectorizer = TfidfVectorizer(stop_words=french_stop_words) # Changed line
tfidf_matrix = vectorizer.fit_transform(df['combined_text'])

# 4. Préparation des variables numériques à inclure dans la recommandation
# Ici nous prenons par exemple 'duration', 'view_count', et 'like_count'
# Assurez-vous que ces colonnes sont au format numérique
numeric_features = ['duration', 'view_count', 'like_count']

# Convert 'duration' to numeric (assuming it's in datetime.time format)
# Extract total seconds from datetime.time objects and replace 'duration'
if pd.api.types.is_object_dtype(df['duration']):  
  df['duration'] = df['duration'].apply(lambda x: x.hour * 3600 + x.minute * 60 + x.second if isinstance(x, pd.Timestamp) else (x.hour * 3600 + x.minute * 60 + x.second if hasattr(x, 'hour') else x) if x is not None and x is not np.nan else 0)

# Remplacer les valeurs manquantes par 0 (ou une autre stratégie)
df[numeric_features] = df[numeric_features].fillna(0)

# Mise à l'échelle (StandardScaler) pour que ces variables soient comparables
scaler = StandardScaler()
numeric_matrix = scaler.fit_transform(df[numeric_features])

# Convertir la matrice numérique en format sparse et la combiner avec la matrice TF-IDF
from scipy import sparse
numeric_sparse = sparse.csr_matrix(numeric_matrix)

# On peut ajuster le poids des variables textuelles et numériques en multipliant les matrices par un facteur
# Par exemple, on peut donner plus d'importance au texte ou aux variables numériques
poids_text = 1.0
poids_numeric = 0.5

combined_matrix = hstack([tfidf_matrix * poids_text, numeric_sparse * poids_numeric])

# 5. Calcul de la similarité cosinus entre vidéos
# Choisissez la vidéo cible (par exemple, index 0)
idx_video = 0
similarities = cosine_similarity(combined_matrix[idx_video], combined_matrix).flatten()

# Exclure la vidéo cible
indices_similaires = np.argsort(similarities)[::-1]
indices_similaires = [i for i in indices_similaires if i != idx_video]

# 6. Sélection des 5 vidéos les plus similaires
top_5_indices = indices_similaires[:5]
top_5_videos = df.iloc[top_5_indices]

# Affichage des résultats
print("Les 5 vidéos recommandées (en combinant texte et variables numériques) sont :")
print(top_5_videos[['video_id', 'title', 'tags', 'duration', 'view_count', 'like_count']])
