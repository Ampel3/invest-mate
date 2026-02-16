import React from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, color = "bg-white" }) => {
  return (
    <div className={`${color} p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between`}>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {trend && <p className="text-xs text-emerald-600 mt-1">{trend}</p>}
      </div>
      <div className="p-3 bg-slate-50 rounded-full text-slate-600">
        {icon}
      </div>
    </div>
  );
};