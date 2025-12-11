import React, { useState, useMemo, useEffect } from 'react';
import { Trip, Staff, Settings, JobType, StaffRole, TripStatus } from '../types';
import { saveTrip, deleteTrip } from '../services/storageService';

interface TripsManagerProps {
  trips: Trip[];
  staff: Staff[];
  settings: Settings;
  refreshData: () => void;
}

const TripsManager: React.FC<TripsManagerProps> = ({ trips, staff, settings, refreshData }) => {
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientName, setClientName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distanceKm, setDistanceKm] = useState(0);
  const [jobType, setJobType] = useState<JobType>(JobType.MRI);
  const [status, setStatus] = useState<TripStatus>(TripStatus.OPEN);
  
  const [driverIds, setDriverIds] = useState<string[]>([]);
  const [helperIds, setHelperIds] = useState<string[]>([]);
  
  const drivers = staff.filter(s => s.role === StaffRole.DRIVER && s.active);
  const helpers = staff.filter(s => s.role === StaffRole.HELPER && s.active);

  const isWeekend = useMemo(() => {
    const [y, m, day] = date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, day);
    const dayOfWeek = dateObj.getDay();
    // 0 = Sunday, 6 = Saturday
    return dayOfWeek === 0 || dayOfWeek === 6; 
  }, [date]);

  // Live Cost Calculation
  const estimatedCost = useMemo(() => {
    let jobCost = 0;
    
    // Rule: Base Value (MRI/CT) is only paid/counted on Weekends
    if (isWeekend) {
        if (jobType === JobType.MRI) jobCost = settings.mriRate;
        else if (jobType === JobType.CT) jobCost = settings.ctRate;
    }

    // Helper Bonus: Only on Weekends
    let bonusRate = 0;
    if (isWeekend) {
        if (jobType === JobType.MRI) bonusRate = settings.helperBonusMRI;
        else if (jobType === JobType.CT) bonusRate = settings.helperBonusCT;
    }
    const totalBonusCost = helperIds.length * bonusRate;

    // Driver Freight: Always paid per KM, regardless of day
    let totalFreight = 0;
    driverIds.forEach(did => {
        const d = staff.find(s => s.id === did);
        if(d && d.kmRate) {
            totalFreight += (distanceKm * d.kmRate);
        }
    });

    return {
        base: jobCost,
        freight: totalFreight,
        bonus: totalBonusCost,
        total: jobCost + totalBonusCost + totalFreight
    };
  }, [jobType, isWeekend, helperIds, driverIds, distanceKm, staff, settings]);

  const startEdit = (trip: Trip) => {
    setEditingId(trip.id);
    setDate(trip.date);
    setClientName(trip.clientName);
    setOrigin(trip.origin);
    setDestination(trip.destination);
    setDistanceKm(trip.distanceKm);
    setJobType(trip.jobType);
    setStatus(trip.status);
    
    // Handle legacy driverId vs driverIds
    const dIds = trip.driverIds && trip.driverIds.length > 0 ? trip.driverIds : (trip.driverId ? [trip.driverId] : []);
    setDriverIds(dIds);
    setHelperIds(trip.helperIds || []);
    
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setClientName('');
    setOrigin('');
    setDestination('');
    setDistanceKm(0);
    setHelperIds([]);
    setDriverIds([]);
    setStatus(TripStatus.OPEN);
  }

  const toggleForm = () => {
      if(showForm) {
          resetForm();
          setShowForm(false);
      } else {
          setShowForm(true);
      }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (driverIds.length === 0) {
        alert("Selecione pelo menos um motorista.");
        return;
    }

    // Remove old trip if editing to replace it
    if (editingId) {
        deleteTrip(editingId);
    }

    const newTrip: Trip = {
      id: editingId || Date.now().toString(),
      date,
      clientName,
      origin,
      destination,
      distanceKm,
      jobType,
      status,
      driverIds: driverIds,
      helperIds,
      isWeekend,
      baseValue: estimatedCost.base,
      driverKmCost: estimatedCost.freight,
      totalCost: estimatedCost.total,
    };

    saveTrip(newTrip);
    refreshData();
    setShowForm(false);
    resetForm();
  };

  const toggleHelper = (id: string) => {
    setHelperIds(prev => 
      prev.includes(id) ? prev.filter(hid => hid !== id) : [...prev, id]
    );
  };

  const toggleDriver = (id: string) => {
    setDriverIds(prev => 
      prev.includes(id) ? prev.filter(did => did !== id) : [...prev, id]
    );
  };

  const handleDelete = (id: string) => {
    if(confirm('Tem certeza que deseja excluir esta viagem?')) {
        deleteTrip(id);
        refreshData();
    }
  }

  const getStatusColor = (s: TripStatus) => {
      switch(s) {
          case TripStatus.OPEN: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
          case TripStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800 border-blue-200';
          case TripStatus.FINISHED: return 'bg-green-100 text-green-800 border-green-200';
          default: return 'bg-gray-100';
      }
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Logística de Viagens</h2>
           <p className="text-slate-500">Gerencie rotas com múltiplos veículos e equipe.</p>
        </div>
        <button 
          onClick={toggleForm}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30"
        >
          {showForm ? 'Cancelar' : '+ Nova Viagem'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 mb-8 animate-fade-in">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h3 className="font-bold text-lg text-slate-700">{editingId ? 'Editar Viagem' : 'Nova Viagem'}</h3>
            {editingId && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Modo Edição</span>}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                
                {/* Coluna 1: Dados Gerais */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase border-b pb-1">Dados da Viagem</h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                        <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        {isWeekend ? (
                            <span className="text-xs text-green-600 font-bold mt-1 block">✅ Fim de Semana (Bônus Ajudante Ativo)</span>
                        ) : (
                             <span className="text-xs text-slate-400 font-medium mt-1 block">Dia Útil (Sem Bônus)</span>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                        <input type="text" required placeholder="Ex: Clínica Saúde" value={clientName} onChange={e => setClientName(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value as TripStatus)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                            {Object.values(TripStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Serviço</label>
                        <select value={jobType} onChange={e => setJobType(e.target.value as JobType)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                            {Object.values(JobType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                {/* Coluna 2: Rota e Motorista */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase border-b pb-1">Rota e Frota</h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Origem</label>
                        <input type="text" required placeholder="Ex: Garagem Slift" value={origin} onChange={e => setOrigin(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Destino</label>
                        <input type="text" required placeholder="Ex: Hospital Central" value={destination} onChange={e => setDestination(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Distância (KM)</label>
                        <div className="flex gap-2">
                            <input type="number" min="0" step="0.1" required value={distanceKm} onChange={e => setDistanceKm(parseFloat(e.target.value))}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Motoristas (Veículos)</label>
                        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-slate-200 p-2 rounded-lg bg-slate-50">
                        {drivers.map(d => (
                            <div key={d.id} onClick={() => toggleDriver(d.id)}
                            className={`cursor-pointer p-2 rounded text-sm flex justify-between items-center transition-colors border ${driverIds.includes(d.id) ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm' : 'bg-white hover:bg-slate-100 text-slate-600 border-transparent'}`}>
                                <div className="flex flex-col">
                                    <span className="font-semibold">{d.name}</span>
                                    <span className="text-[10px] text-slate-500">{d.vehicleType} ({d.plate}) - R${d.kmRate?.toFixed(2)}/km</span>
                                </div>
                                {driverIds.includes(d.id) && <span className="text-blue-600 font-bold">✓</span>}
                            </div>
                        ))}
                        </div>
                    </div>
                </div>

                {/* Coluna 3: Custos e Ajudantes */}
                <div className="space-y-4 flex flex-col h-full">
                    <h3 className="text-sm font-bold text-slate-400 uppercase border-b pb-1">Custos e Equipe</h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Ajudantes</label>
                        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border border-slate-200 p-2 rounded-lg">
                        {helpers.map(h => (
                            <div key={h.id} onClick={() => toggleHelper(h.id)}
                            className={`cursor-pointer p-2 rounded text-sm flex justify-between items-center transition-colors ${helperIds.includes(h.id) ? 'bg-green-100 text-green-700 font-semibold border border-green-300' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}>
                            <span>{h.name}</span>
                            {helperIds.includes(h.id) && <span>✓</span>}
                            </div>
                        ))}
                        </div>
                    </div>

                    <div className="mt-auto bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-2">Estimativa de Custos</p>
                        <div className="space-y-1 text-sm text-slate-600 border-b border-slate-200 pb-2 mb-2">
                            <div className="flex justify-between">
                                <span>Base ({jobType}):</span> 
                                <span className={!isWeekend ? 'text-slate-400' : ''}>
                                    R$ {estimatedCost.base.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Frete ({driverIds.length} veíc.):</span> 
                                <span>R$ {estimatedCost.freight.toFixed(2)}</span>
                            </div>
                            {helperIds.length > 0 && (
                                <div className={`flex justify-between ${isWeekend ? 'text-green-600 font-medium' : 'text-slate-400'}`}>
                                    <span>Prêmios Ajudantes ({helperIds.length}):</span> 
                                    <span>R$ {estimatedCost.bonus.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800">Total:</span>
                            <span className="text-xl font-bold text-blue-900">R$ {estimatedCost.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md transition-transform active:scale-95">
                        {editingId ? 'Salvar Alterações' : 'Lançar Viagem'}
                    </button>
                </div>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-600 text-xs uppercase">Status</th>
                <th className="p-4 font-semibold text-slate-600 text-xs uppercase">Data / Cliente</th>
                <th className="p-4 font-semibold text-slate-600 text-xs uppercase">Rota (Origem → Destino)</th>
                <th className="p-4 font-semibold text-slate-600 text-xs uppercase">Motoristas (Veículos)</th>
                <th className="p-4 font-semibold text-slate-600 text-xs uppercase text-right">Valor Final</th>
                <th className="p-4 font-semibold text-slate-600 text-xs uppercase text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trips.slice().reverse().map(trip => {
                // Compatibility for old trips with single driverId
                const tripDriverIds = trip.driverIds || (trip.driverId ? [trip.driverId] : []);
                
                const driverNames = tripDriverIds.map(id => {
                    const d = staff.find(s => s.id === id);
                    return d ? `${d.name.split(' ')[0]} (${d.vehicleType})` : 'Excluído';
                }).join(', ');

                // Helpers Names
                const tripHelperIds = trip.helperIds || [];
                const helperNames = tripHelperIds.map(id => {
                    const h = staff.find(s => s.id === id);
                    return h ? h.name : 'Excluído';
                }).join(', ');

                return (
                  <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(trip.status)}`}>
                            {trip.status}
                        </span>
                    </td>
                    <td className="p-4">
                        <div className="text-sm font-bold text-slate-700">{trip.clientName}</div>
                        <div className="text-xs text-slate-500">{new Date(trip.date).toLocaleDateString('pt-BR')}</div>
                        {trip.isWeekend && <div className="text-[10px] text-green-600 font-bold uppercase mt-1">Final de Semana</div>}
                    </td>
                    <td className="p-4">
                        <div className="text-xs text-slate-500">De: {trip.origin}</div>
                        <div className="text-sm font-medium text-slate-700">Para: {trip.destination}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{trip.distanceKm} km</div>
                    </td>
                    <td className="p-4">
                         <div className="text-sm text-slate-700 font-medium">{driverNames || '---'}</div>
                         <div className="text-xs text-slate-400">{tripDriverIds.length} veículo(s)</div>
                         {tripHelperIds.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">AJUDANTES:</span>
                                <span className="text-xs text-slate-600 font-medium">{helperNames}</span>
                            </div>
                         )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-blue-900 font-bold text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(trip.totalCost)}
                      </div>
                      <div className="text-xs text-slate-400">Frete Total: R$ {trip.driverKmCost?.toFixed(2)}</div>
                    </td>
                    <td className="p-4 text-center space-x-2">
                        <button onClick={() => startEdit(trip)} className="text-blue-500 hover:text-blue-700 font-medium text-xs">Editar</button>
                        <span className="text-slate-300">|</span>
                        <button onClick={() => handleDelete(trip.id)} className="text-red-400 hover:text-red-600 font-medium text-xs">Excluir</button>
                    </td>
                  </tr>
                );
              })}
              {trips.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Nenhuma viagem registrada ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TripsManager;