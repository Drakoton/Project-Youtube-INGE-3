import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Enregistrer les composants nécessaires de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

  const chartData = sentimentData ? {
    labels: ['Positif', 'Neutre', 'Négatif'],
    datasets: [
      {
        label: 'Sentiments des Descriptions',
        data: [
          sentimentData.description_sentiments['positif'] || 0,
          sentimentData.description_sentiments['neutre'] || 0,
          sentimentData.description_sentiments['négatif'] || 0
        ],
        backgroundColor: ['green', 'gray', 'red'],
      },
      {
        label: 'Sentiments des Commentaires',
        data: [
          sentimentData.comments_sentiments['positif'] || 0,
          sentimentData.comments_sentiments['neutre'] || 0,
          sentimentData.comments_sentiments['négatif'] || 0
        ],
        backgroundColor: ['green', 'gray', 'red'],
      }
    ]
  } : null;

  return (
    <div>
      <h1>Analyse des Sentiments</h1>

      {/* Affichage des erreurs éventuelles */}
      {error && <p style={{ color: 'red' }}>Erreur: {error}</p>}

      {/* Affichage des graphiques */}
      {sentimentData ? (
        <div>
          <h2>Distribution des Sentiments</h2>
          <Bar data={chartData} />
        </div>
      ) : (
        <p>Chargement des données...</p>
      )}
    </div>
  );
}
