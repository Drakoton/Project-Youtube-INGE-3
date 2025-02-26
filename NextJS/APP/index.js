import { useEffect, useState } from 'react';
import { Bar, Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend);

export default function Home() {
  const [sentimentData, setSentimentData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSentimentData = async () => {
      try {
        const res = await fetch('/api/sentiment');
        if (!res.ok) {
          throw new Error('Erreur de récupération des données');
        }
        const data = await res.json();
        console.log("Données reçues :", data);  // ✅ Vérification
        setSentimentData(data);
      } catch (err) {
        console.error("Erreur lors de la récupération des données :", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSentimentData();
  }, []);

  // Vérification des données pour le graphique de sentiment
  console.log("sentimentData.video_data :", sentimentData?.video_data);  // ✅ Debug

  const chartData = sentimentData?.description_sentiments && sentimentData?.comments_sentiments ? {
    labels: ['Positif', 'Neutre', 'Négatif'],
    datasets: [
      {
        label: 'Sentiments des Descriptions',
        data: [
          sentimentData.description_sentiments?.positif || 0,
          sentimentData.description_sentiments?.neutre || 0,
          sentimentData.description_sentiments?.négatif || 0
        ],
        backgroundColor: ['green', 'gray', 'red'],
      },
      {
        label: 'Sentiments des Commentaires',
        data: [
          sentimentData.comments_sentiments?.positif || 0,
          sentimentData.comments_sentiments?.neutre || 0,
          sentimentData.comments_sentiments?.négatif || 0
        ],
        backgroundColor: ['green', 'gray', 'red'],
      }
    ]
  } : null;  
  

  // Correction de la gestion des données pour la corrélation
  const correlationData = sentimentData?.video_data && sentimentData.video_data.length > 0 ? {
    datasets: [
      {
        label: 'Corrélation Sentiment - Vues',
        data: sentimentData.video_data.map(video => {
          console.log("Vérification vidéo_data:", video);  // ✅ Debug
          return {
            x: video.comm_sentiment_score ?? 0,
            y: video.view_count ?? 0
          };
        }),
        backgroundColor: 'blue'
      },
      {
        label: 'Corrélation Sentiment - Likes',
        data: sentimentData.video_data.map(video => ({
          x: video.comm_sentiment_score ?? 0,
          y: video.like_count ?? 0
        })),
        backgroundColor: 'orange'
      }
    ]
  } : null;

  return (
    <div>
      <h1>Analyse des Sentiments</h1>

      {error && <p style={{ color: 'red' }}>Erreur: {error}</p>}

      {loading ? (
        <p>Chargement des données...</p>
      ) : sentimentData ? (
        <div>
          <h2>Distribution des Sentiments</h2>
          {chartData ? <Bar data={chartData} /> : <p>Pas de données disponibles pour les sentiments.</p>}

          <h2>Corrélation Sentiments - Vues/Likes</h2>
          {correlationData && correlationData.datasets[0].data.length > 0 ? (
            <Scatter data={correlationData} />
          ) : (
            <p>Pas assez de données pour afficher la corrélation.</p>
          )}
        </div>
      ) : (
        <p>Aucune donnée disponible.</p>
      )}
    </div>
  );
}
