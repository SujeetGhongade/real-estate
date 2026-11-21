import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface ChartProps {
  labels: string[];
  values: number[];
  title: string;
  type: 'bar' | 'doughnut';
}

export const AdminMetricChart: React.FC<ChartProps> = ({ labels, values, title, type }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const palette = ['#0D1B2A', '#C49A5C', '#1D4E4F', '#4A6FA5', '#7C8BA1', '#9E7B42'];

    chartRef.current = new Chart(canvasRef.current, {
      type,
      data: {
        labels,
        datasets: [
          {
            label: title,
            data: values,
            backgroundColor: type === 'doughnut' ? palette : '#0D1B2A',
            borderRadius: type === 'bar' ? 6 : 0,
            borderWidth: type === 'doughnut' ? 2 : 0,
            borderColor: '#FFFFFF',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: type === 'doughnut',
            position: 'bottom',
            labels: {
              boxWidth: 10,
              font: { family: 'Plus Jakarta Sans', size: 11 },
              color: '#334155',
            },
          },
        },
        scales:
          type === 'bar'
            ? {
                y: {
                  beginAtZero: true,
                  ticks: { precision: 0, color: '#64748B', font: { size: 11 } },
                  grid: { color: '#F1F5F9' },
                },
                x: {
                  ticks: { color: '#334155', font: { size: 11 } },
                  grid: { display: false },
                },
              }
            : undefined,
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [labels.join('|'), values.join('|'), title, type]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="font-serif text-base font-semibold text-[#0D1B2A] mb-4">{title}</h3>
      <div className="h-56 relative">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};
