import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import './Components.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function ForecastChart() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/forecast')
      .then(response => {
        const forecast = response.data;

        if (forecast.error) {
          console.error('Forecast error:', forecast.error);
          setLoading(false);
          return;
        }

        const filteredForecast = forecast.filter((item, index) => index % 7 === 0);

        const labels = filteredForecast.map(item => new Date(item.ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        const predictedValues = filteredForecast.map(item => item.yhat);

        const dataForChart = {
          labels: labels,
          datasets: [
            {
              label: 'Predicted Expenses',
              data: predictedValues,
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#8b5cf6',
              pointRadius: 3,
              pointHoverRadius: 6,
              borderWidth: 3
            }
          ]
        };
        setChartData(dataForChart);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching forecast data!", error);
        setLoading(false);
      });
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(26, 34, 51, 0.95)',
        titleColor: '#e0e6f0',
        bodyColor: '#8a99b3',
        borderColor: '#2a3449',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function (context) {
            return '₹' + context.parsed.y.toLocaleString('en-IN');
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: '#8a99b3',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: '#8a99b3',
          font: {
            size: 11
          },
          callback: function (value) {
            if (value >= 100000) {
              return '₹' + (value / 100000).toFixed(1) + 'L';
            }
            return '₹' + (value / 1000).toFixed(0) + 'K';
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Expense Forecast</h2>
          <p className="card-subtitle">ML-powered prediction of your future spend</p>
        </div>
      </div>
      <div className="chart-container" style={{ height: '350px' }}>
        {loading ? (
          <div className="loading-state">Loading forecast...</div>
        ) : chartData ? (
          <Line options={options} data={chartData} />
        ) : (
          <div className="empty-state">Not enough data for forecasting. Add more transactions.</div>
        )}
      </div>
    </div>
  );
}

export default ForecastChart;
