import React from 'react';

interface KpiCardProps {
  title: string;
  value: number | string;
  trend?: {
    value: number;
    isPositive: boolean;
    text?: string;
  };
  description?: string;
  progress?: {
    current: number;
    target?: number;
    customWidth?: string;
  };
  color?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  trend,
  description,
  progress,
  color = "#E62F2A"
}) => {
  return (
    <div className="rounded-xl border bg-white shadow-lg p-5 flex flex-col gap-3">
      <div className="font-bold text-lg" style={{ color }}>
        {title}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-neutral-700">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {trend && (
          <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
          </span>
        )}
      </div>
      {description && (
        <div className="text-gray-500 text-xs">{description}</div>
      )}
      {progress && (
        <div className="w-full h-1.5 rounded-full bg-gray-200 mt-2">
          <div className="h-1.5 rounded-full transition-all"
            style={{
              backgroundColor: color,
              width: progress.customWidth || (progress.target && progress.target > 0
                ? `${Math.min(100, (progress.current / progress.target) * 100)}%`
                : '0%')
            }}>
          </div>
        </div>
      )}
    </div>
  );
};

export default KpiCard;
