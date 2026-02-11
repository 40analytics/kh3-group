import React from 'react';
import { StatCardProps } from '@/lib/types';

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
}) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
      <div
        className={`p-2 rounded-lg ${trendUp !== false ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <div className="mt-4 flex items-center">
      <span
        className={`text-xs font-medium ${trendUp !== false ? 'text-green-600' : 'text-red-500'}`}>
        {trend}
      </span>
    </div>
  </div>
);

export default StatCard;
