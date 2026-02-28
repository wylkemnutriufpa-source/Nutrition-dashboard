import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

/**
 * Gráfico Simples de Engajamento com SVG Nativo
 * @param {Object} props
 * @param {Object} props.data - { labels: Array, values: Array }
 * @param {string} props.title - Título do gráfico
 */
const SimpleEngagementChart = ({ data = { labels: [], values: [] }, title = 'Adesão ao Checklist (7 dias)' }) => {
  const { labels, values } = data;

  if (labels.length === 0 || values.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Dados insuficientes para gráfico</p>
        </CardContent>
      </Card>
    );
  }

  const width = 100;
  const height = 60;
  const padding = 5;
  const maxValue = Math.max(...values, 100);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;

  // Calcular pontos do gráfico
  const points = values
    .map((value, index) => {
      const x = padding + (index / (values.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((value - minValue) / range) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(' ');

  // Criar área preenchida
  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <Card className="border-indigo-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* SVG Gráfico */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-32"
          style={{ maxHeight: '128px' }}
        >
          {/* Grid horizontal */}
          <line
            x1={padding}
            y1={height / 2}
            x2={width - padding}
            y2={height / 2}
            stroke="#e5e7eb"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />

          {/* Área preenchida */}
          <polygon
            points={areaPoints}
            fill="url(#gradient)"
            opacity="0.3"
          />

          {/* Linha do gráfico */}
          <polyline
            points={points}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pontos */}
          {values.map((value, index) => {
            const x = padding + (index / (values.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((value - minValue) / range) * (height - 2 * padding);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1.5"
                fill="#6366f1"
              />
            );
          })}

          {/* Gradiente */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Labels */}
        <div className="flex justify-between mt-2 px-2">
          {labels.map((label, index) => (
            <span key={index} className="text-xs text-gray-500 font-medium">
              {label}
            </span>
          ))}
        </div>

        {/* Valor médio */}
        <div className="mt-3 pt-3 border-t border-gray-100 text-center">
          <span className="text-sm text-gray-600">Média: </span>
          <span className="text-lg font-bold text-indigo-600">
            {Math.round(values.reduce((a, b) => a + b, 0) / values.length)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleEngagementChart;
