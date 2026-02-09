import { LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
}

export default function StatCard({ icon, label, value }: StatCardProps) {
  // Dynamically get icon
  const Icon = Icons[icon.charAt(0).toUpperCase() + icon.slice(1) as keyof typeof Icons] as LucideIcon;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      <div className="relative z-10 flex flex-col justify-between h-40">
        <div>
           <p className="text-5xl font-bold text-[#111827] tracking-tight">{value}</p>
        </div>
        <div>
           <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">{label}</p>
        </div>
      </div>
      
      {/* Decorative Icon Background */}
      <div className="absolute -right-6 -bottom-6 text-gray-100 group-hover:text-[#F43F5E]/5 transition-colors duration-300">
        {Icon && <Icon size={140} strokeWidth={1} />}
      </div>
    </div>
  );
}
