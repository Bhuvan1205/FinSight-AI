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

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/forecast')
      .then(response => {
        const forecast = response.data;
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
              pointRadius: 4,
              pointHoverRadius: 6,
            }
          ]
        };
        setChartData(dataForChart);
      })
      .catch(error => {
        console.error("Error fetching forecast data!", error);
      });
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#9ca3af'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value) {
            return '₹' + value / 1000 + 'k';
          }
        }
      }
    }
  };

  return (
    <div className="chart-card">
        <div className="card-header">
            <div>
                <h2 className="card-title">Expense Forecast</h2>
                <p className="card-subtitle">ML-powered prediction of your future spend.</p>
            </div>
        </div>
      <div className="chart-container" style={{height: '350px'}}>
        {chartData ? (
          <Line options={options} data={chartData} />
        ) : (
          <p>Loading forecast chart...</p>
        )}
      </div>
    </div>
  );
}

export default ForecastChart;