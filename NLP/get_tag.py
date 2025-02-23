import json
import pandas as pd
import nltk
from collections import Counter
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

# Assurez-vous d'avoir téléchargé les ressources NLTK nécessaires
nltk.download('punkt')
nltk.download('stopwords')

file_path = '/content/bquxjob_2407f9d9_195305be2e9.json'  # Remplace par le chemin réel du fichier JSON

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Fonction pour extraire les mots les plus utilisés dans le texte
def get_most_common_words(text):
    # Tokenization des mots
    words = word_tokenize(text.lower())  # On convertit tout en minuscule
    words = [word for word in words if word.isalpha()]  # On garde que les mots (pas les chiffres ou symboles)
    
    # Retirer les mots vides (stopwords)
    stop_words = set(stopwords.words('french'))
    words = [word for word in words if word not in stop_words]
    
    # Compter les mots
    word_counts = Counter(words)
    return word_counts.most_common(10)  # Afficher les 10 mots les plus fréquents

# Extraire les tags et analyser la transcription pour chaque vidéo
tags_all = []
words_all = []

for video in data:
    # Ajouter les tags de chaque vidéo à la liste
    tags_all.extend(video["tags"])
    
    # Analyser les mots dans la transcription
    transcription = video["transcription"]
    common_words = get_most_common_words(transcription)
    words_all.extend([word[0] for word in common_words])

# Comptage des tags les plus fréquents
tags_counts = Counter(tags_all).most_common(20)

# Comptage des mots les plus fréquents dans les transcriptions
words_counts = Counter(words_all).most_common(20)

# Afficher les résultats
print("Les 10 tags les plus utilisés :")
print(tags_counts)

print("\nLes 10 mots les plus fréquents dans les transcriptions :")
print(words_counts)
