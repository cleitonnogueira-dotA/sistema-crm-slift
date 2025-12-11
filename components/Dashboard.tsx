import React, { useMemo, useState } from 'react';
import { Trip, Settings } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  trips: Trip[];
  settings: Settings;
}

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#1E40AF'];

const Dashboard: React.FC<DashboardProps> = ({ trips, settings }) => {
  // Date Filters State
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  // Filter Data
  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
        return t.date >= startDate && t.date <= endDate;
    });
  }, [trips, startDate, endDate]);
  
  const stats = useMemo(() => {
    let totalCost = 0;
    let totalKm = 0;
    let weekendTrips = 0;
    
    filteredTrips.forEach(t => {
      totalCost += t.totalCost;
      totalKm += t.distanceKm;
      if (t.isWeekend) weekendTrips++;
    });

    return { totalCost, totalKm, weekendTrips, count: filteredTrips.length };
  }, [filteredTrips]);

  const costData = useMemo(() => {
    // Group by Month (simplified based on filter)
    // If filter range is small, show days? Let's stick to Month/Day for now or just aggregate
    // Since we filter by date, let's group by Client or Date. Let's keep month grouping but only for the filtered range.
    const grouped: Record<string, number> = {};
    filteredTrips.forEach(t => {
      const month = new Date(t.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
      grouped[month] = (grouped[month] || 0) + t.totalCost;
    });
    // Limit to top 10 labels to avoid clutter
    return Object.keys(grouped).slice(0, 15).map(key => ({ name: key, custo: grouped[key] }));
  }, [filteredTrips]);

  const typeData = useMemo(() => {
     const grouped: Record<string, number> = {};
     filteredTrips.forEach(t => {
       grouped[t.jobType] = (grouped[t.jobType] || 0) + 1;
     });
     return Object.keys(grouped).map(key => ({ name: key, value: grouped[key] }));
  }, [filteredTrips]);

  const clientData = useMemo(() => {
      const grouped: Record<string, number> = {};
      filteredTrips.forEach(t => {
          grouped[t.clientName] = (grouped[t.clientName] || 0) + 1;
      });
      // Sort and take top 5
      return Object.keys(grouped)
        .map(key => ({ name: key, count: grouped[key] }))
        .sort((a,b) => b.count - a.count)
        .slice(0, 5);
  }, [filteredTrips]);

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
            <p className="text-slate-500">Resumo financeiro e operacional.</p>
        </div>
        
        {/* Date Filter Controls */}
        <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 flex items-center gap-2">
            <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold text-slate-400 px-1">De</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm bg-transparent outline-none text-slate-700 px-1"/>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold text-slate-400 px-1">Até</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm bg-transparent outline-none text-slate-700 px-1"/>
            </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Faturamento (Período)</span>
          <span className="text-3xl font-bold text-slate-800 mt-2">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalCost)}
          </span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Quilometragem</span>
          <span className="text-3xl font-bold text-slate-800 mt-2">{stats.totalKm} km</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Viagens</span>
          <span className="text-3xl font-bold text-slate-800 mt-2">{stats.count}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
           <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Finais de Semana</span>
           <span className="text-3xl font-bold text-blue-600 mt-2">{stats.weekendTrips}</span>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-700 mb-6">Custos por Dia/Viagem</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} tick={{fontSize: 12}} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="custo" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-700 mb-6">Top 5 Clientes (Volume)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} stroke="#64748b" tickLine={false} axisLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Charts Row 2 */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-700 mb-6">Distribuição por Serviço</h3>
          <div className="h-64 flex justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
             </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 text-sm text-slate-600 mt-2">
             {typeData.map((entry, index) => (
               <div key={entry.name} className="flex items-center">
                 <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                 {entry.name}
               </div>
             ))}
          </div>
        </div>
       </div>
    </div>
  );
};

export default Dashboard;