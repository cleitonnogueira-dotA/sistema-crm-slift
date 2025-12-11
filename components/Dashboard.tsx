import React, { useMemo, useState } from 'react';
import { Trip, Settings } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  trips: Trip[];
  settings: Settings;
}

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#1E40AF'];

const Dashboard: React.FC<DashboardProps> = ({ trips, settings }) => {
  // Filter State
  const currentYear = new Date().getFullYear();
  const [filterMode, setFilterMode] = useState<'year' | 'period'>('year');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Helper to check date filters
  const isInPeriod = (dateStr: string) => {
      const d = new Date(dateStr);
      // Ajustar timezone para garantir comparação correta do dia (apenas data)
      const checkDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      if (filterMode === 'year') {
          return checkDate.getFullYear() === selectedYear;
      } else {
          // Se não tiver datas definidas, mostra tudo (ou padrão mês atual se preferir, aqui mostra tudo)
          if (!dateRange.start && !dateRange.end) return true;
          
          const start = dateRange.start ? new Date(dateRange.start + 'T00:00:00') : new Date('2000-01-01T00:00:00');
          const end = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : new Date('2100-12-31T23:59:59');
          
          return d >= start && d <= end;
      }
  };

  // Filter Data
  const filteredTrips = useMemo(() => {
    return trips.filter(t => isInPeriod(t.date));
  }, [trips, filterMode, selectedYear, dateRange]);
  
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
    const grouped: Record<string, number> = {};
    filteredTrips.forEach(t => {
      // Group by Month/Year label
      const date = new Date(t.date);
      const label = date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
      grouped[label] = (grouped[label] || 0) + t.totalCost;
    });
    
    // Sort logic depends on date, simplified here to just take entries
    // For a better chart, we might want to sort by date.
    return Object.keys(grouped).slice(0, 20).map(key => ({ name: key, custo: grouped[key] }));
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
      return Object.keys(grouped)
        .map(key => ({ name: key, count: grouped[key] }))
        .sort((a,b) => b.count - a.count)
        .slice(0, 5);
  }, [filteredTrips]);

  // Generate Year Options
  const yearOptions = Array.from({length: 4}, (_, i) => currentYear - 2 + i);

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <header className="mb-8 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
            <p className="text-slate-500">Resumo financeiro e operacional.</p>
        </div>
        
        {/* Date Filter Controls */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-4">
             <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Visualizar:</span>
                 <div className="flex bg-slate-100 p-1 rounded-lg">
                     <button 
                        onClick={() => setFilterMode('year')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterMode === 'year' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        Por Ano
                     </button>
                     <button 
                        onClick={() => setFilterMode('period')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterMode === 'period' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        Calendário
                     </button>
                 </div>
             </div>

             <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

             {filterMode === 'year' ? (
                 <select 
                    value={selectedYear} 
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="p-2 pl-3 pr-8 border border-slate-300 rounded-lg text-sm bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:border-blue-400 transition-colors"
                 >
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
             ) : (
                 <div className="flex items-center gap-2">
                     <input 
                        type="date" 
                        value={dateRange.start} 
                        onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))}
                        className="p-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                     />
                     <span className="text-slate-400 font-medium text-xs">até</span>
                     <input 
                        type="date" 
                        value={dateRange.end} 
                        onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))}
                        className="p-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                     />
                 </div>
             )}
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-6xl">💰</span>
          </div>
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Faturamento Total</span>
          <span className="text-3xl font-black text-slate-800 mt-2 tracking-tight">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalCost)}
          </span>
          <span className="text-xs text-slate-400 mt-1">No período selecionado</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-6xl">🛣️</span>
          </div>
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Quilometragem</span>
          <span className="text-3xl font-black text-slate-800 mt-2 tracking-tight">{stats.totalKm} km</span>
          <span className="text-xs text-slate-400 mt-1">Total rodado</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-6xl">🚚</span>
          </div>
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Viagens Realizadas</span>
          <span className="text-3xl font-black text-slate-800 mt-2 tracking-tight">{stats.count}</span>
          <span className="text-xs text-slate-400 mt-1">Volume de serviços</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-6xl">📅</span>
          </div>
           <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Finais de Semana</span>
           <span className="text-3xl font-black text-blue-600 mt-2 tracking-tight">{stats.weekendTrips}</span>
           <span className="text-xs text-slate-400 mt-1">Viagens em Sáb/Dom</span>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-700 mb-6">Custos por Dia/Período</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} tick={{fontSize: 11}} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} tick={{fontSize: 11}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="custo" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-700 mb-6">Top 5 Clientes</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} stroke="#64748b" tickLine={false} axisLine={false} tick={{fontSize: 11, fontWeight: 500}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Charts Row 2 */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-700 mb-6">Distribuição por Serviço</h3>
          <div className="h-64 flex justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
              </PieChart>
             </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600 mt-4">
             {typeData.map((entry, index) => (
               <div key={entry.name} className="flex items-center">
                 <span className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                 <span className="font-medium">{entry.name}</span>
                 <span className="ml-1 text-slate-400">({entry.value})</span>
               </div>
             ))}
          </div>
        </div>
        
        {/* Placeholder for future insights or simple list */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 text-white flex flex-col justify-between">
            <div>
                <h3 className="text-lg font-bold mb-2">Resumo Rápido</h3>
                <p className="text-slate-300 text-sm opacity-80">
                    Use os filtros acima para navegar pelo histórico da empresa.
                    Os dados são calculados em tempo real com base nas viagens lançadas.
                </p>
            </div>
            <div className="mt-8">
                <div className="flex justify-between items-center border-t border-slate-700 pt-4">
                    <span className="text-slate-400 text-sm">Viagens Filtradas</span>
                    <span className="text-2xl font-bold">{stats.count}</span>
                </div>
                 <div className="flex justify-between items-center border-t border-slate-700 pt-4 mt-2">
                    <span className="text-slate-400 text-sm">Faturamento Médio/Viagem</span>
                    <span className="text-xl font-bold text-blue-300">
                        {stats.count > 0 
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalCost / stats.count)
                            : 'R$ 0,00'
                        }
                    </span>
                </div>
            </div>
        </div>
       </div>
    </div>
  );
};

export default Dashboard;