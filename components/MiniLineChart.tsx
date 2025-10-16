import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Path, Line, Circle } from 'react-native-svg';

interface DataPoint {
  label: string;
  value: number;
}

interface MiniLineChartProps {
  data: DataPoint[];
  width?: number; // optional, default to container width
  height?: number;
  showDots?: boolean;
}

export function MiniLineChart({
  data,
  width,
  height = 60,
  showDots = false,
}: MiniLineChartProps) {
  const windowWidth = useWindowDimensions().width;
  const chartWidth = width ?? windowWidth - 32; // fallback to screen width minus padding

  const padding = 4;
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (chartWidth - padding * 2);
    const y = height - padding - ((d.value - minValue) / range) * (height - padding * 2);
    return { x, y, value: d.value };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Grid lines
  const horizontalLines = [];
  const verticalLines = [];
  const numHorizontal = 4;
  const numVertical = data.length;

  for (let i = 1; i <= numHorizontal; i++) {
    const y = (height / (numHorizontal + 1)) * i;
    horizontalLines.push(
      <Line key={`h-${i}`} x1={0} y1={y} x2={chartWidth} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
    );
  }

  for (let i = 0; i < numVertical; i++) {
    const x = padding + (i / (numVertical - 1)) * (chartWidth - padding * 2);
    verticalLines.push(
      <Line key={`v-${i}`} x1={x} y1={0} x2={x} y2={height} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
    );
  }

  return (
    <Svg width={chartWidth} height={height}>
      {horizontalLines}
      {verticalLines}

      {/* Area fill */}
      <Path
        d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
        fill="#2F6BFF"
        fillOpacity={0.08}
      />

      {/* Line */}
      <Path
        d={pathData}
        fill="none"
        stroke="#2F6BFF"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Last Dot */}
      {showDots && points.length > 0 && (
        <Circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={2.5}
          fill="#E9ECF1"
          stroke="#12151B"
          strokeWidth={2}
        />
      )}
    </Svg>
  );
}
