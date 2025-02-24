import { useEffect, useState } from 'react';

export default function Home() {
  const [sentimentData, setSentimentData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSentimentData = async () => {
      try {
        const res = await fetch('/api/sentiment');
        if (!res.ok) {
          throw new Error('Erreur de récupération des données');
        }
        const data = await res.json();
        setSentimentData(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchSentimentData();
  }, []);

  return (
    <div>
      <h1>Analyse des Sentiments</h1>
      
      {/* Affichage des erreurs éventuelles */}
      {error && <p style={{ color: 'red' }}>Erreur: {error}</p>}

      {/* Affichage des résultats d'analyse de sentiment */}
      {sentimentData ? (
        <div>
          <h2>Résultats de l'analyse :</h2>
          <pre>{JSON.stringify(sentimentData, null, 2)}</pre>
        </div>
      ) : (
        <p>Chargement des données...</p>
      )}
    </div>
  );
}
