import React, { useState, useMemo } from 'react';
import { Staff, Trip, StaffRole, Payment, TripStatus } from '../types';
import { savePayment, deletePayment } from '../services/storageService';

interface FreightManagerProps {
  staff: Staff[];
  trips: Trip[];
  payments: Payment[];
  refreshData: () => void;
}

const FreightManager: React.FC<FreightManagerProps> = ({ staff, trips, payments, refreshData }) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [showHistory, setShowHistory] = useState<Record<string, boolean>>({});

  const drivers = staff.filter(s => s.role === StaffRole.DRIVER && s.active);

  // Core Logic: Calculate Earnings vs Payments per Driver (All Time)
  const driverStats = useMemo(() => {
    return drivers.map(driver => {
        // 1. Get ALL trips and payments for this driver
        const allMyTrips = trips.filter(t => {
            const ids = t.driverIds || (t.driverId ? [t.driverId] : []);
            return ids.includes(driver.id) && t.status === TripStatus.FINISHED;
        });

        const allMyPayments = payments.filter(p => p.staffId === driver.id);

        // 2. Calculate Global Balance (Accumulated Debt)
        let globalEarned = 0;
        const details = allMyTrips.map(t => {
            const rate = driver.kmRate || 0;
            const amount = t.distanceKm * rate;
            globalEarned += amount;
            return { ...t, freightAmount: amount };
        });

        const globalPaid = allMyPayments.reduce((acc, p) => acc + p.amount, 0);
        const globalBalance = globalEarned - globalPaid;

        return {
            driver,
            globalBalance,
            globalEarned, 
            globalPaid, 
            trips: details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            payments: allMyPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        };
    });
  }, [drivers, trips, payments]);

  const handlePayment = (driverId: string) => {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) return alert("Valor inválido");

      const newPayment: Payment = {
          id: Date.now().toString(),
          staffId: driverId,
          amount,
          date: new Date().toISOString(),
          notes: paymentNote
      };

      savePayment(newPayment);
      refreshData();
      setPaymentAmount('');
      setPaymentNote('');
      setSelectedDriverId(null);
  };

  const toggleHistory = (id: string) => {
      setShowHistory(prev => ({...prev, [id]: !prev[id]}));
  }

  const handleDeletePayment = (id: string) => {
      if(confirm('Cancelar este pagamento? O saldo será recalculado.')) {
          deletePayment(id);
          refreshData();
      }
  }

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Fretes Motoristas</h2>
        <p className="text-slate-500">Controle financeiro e pagamentos de fretes (Todas as viagens Finalizadas).</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {driverStats.map(stat => (
            <div key={stat.driver.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Header Card */}
                <div className="p-6 flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-2xl shadow-inner">
                            {stat.driver.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">{stat.driver.name}</h3>
                            <div className="flex gap-3 text-sm text-slate-500 mt-1">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                                    {stat.trips.length} viagens total
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-8 w-full lg:w-auto justify-between lg:justify-end bg-slate-50 p-4 rounded-xl border border-slate-100 lg:bg-transparent lg:p-0 lg:border-none">
                        <div className="flex gap-8">
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Total Histórico</p>
                                <p className="text-slate-700 font-bold text-lg">R$ {stat.globalEarned.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Total Pago</p>
                                <p className="text-slate-700 font-bold text-lg">R$ {stat.globalPaid.toFixed(2)}</p>
                            </div>
                        </div>
                        
                        <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>

                        <div className="text-right flex flex-col items-end">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Saldo Devedor Atual</p>
                            <p className={`text-2xl font-black ${stat.globalBalance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                R$ {stat.globalBalance.toFixed(2)}
                            </p>
                            {stat.globalBalance > 0 && <span className="text-[10px] text-red-400 font-medium">Pagamento Pendente</span>}
                        </div>
                        
                        <button 
                            onClick={() => setSelectedDriverId(selectedDriverId === stat.driver.id ? null : stat.driver.id)}
                            className={`px-5 py-2.5 rounded-lg font-bold shadow-md transition-transform active:scale-95 ${
                                selectedDriverId === stat.driver.id 
                                ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' 
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30'
                            }`}
                        >
                            {selectedDriverId === stat.driver.id ? 'Fechar' : 'Pagar'}
                        </button>
                    </div>
                </div>

                {/* Payment Form Area */}
                {selectedDriverId === stat.driver.id && (
                    <div className="bg-blue-50 p-6 border-t border-blue-100 animate-fade-in relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <span>💸</span> Registrar Pagamento para {stat.driver.name}
                        </h4>
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-bold text-blue-800 mb-1">Valor (R$)</label>
                                <input 
                                    type="number" 
                                    value={paymentAmount} 
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 font-semibold text-blue-900"
                                />
                            </div>
                            <div className="flex-[2] w-full">
                                <label className="block text-xs font-bold text-blue-800 mb-1">Observação (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={paymentNote} 
                                    onChange={e => setPaymentNote(e.target.value)}
                                    placeholder="Ex: Pix adiantamento"
                                    className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>
                            <button 
                                onClick={() => handlePayment(stat.driver.id)}
                                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-green-600/20 transition-colors"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                )}

                {/* Expandable History Details */}
                <div className="border-t border-slate-100">
                    <button 
                        onClick={() => toggleHistory(stat.driver.id)}
                        className="w-full p-3 text-center text-sm text-slate-500 hover:bg-slate-50 transition-colors flex justify-center items-center gap-2 font-medium"
                    >
                        {showHistory[stat.driver.id] ? 'Ocultar Extrato' : 'Ver Extrato Completo'} 
                        <span className={`text-xs transition-transform ${showHistory[stat.driver.id] ? 'rotate-180' : ''}`}>▼</span>
                    </button>

                    {showHistory[stat.driver.id] && (
                        <div className="p-6 bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in border-t border-slate-200">
                            {/* Trips History */}
                            <div>
                                <h4 className="font-bold text-slate-700 mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Fretes Realizados (Créditos)
                                </h4>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {stat.trips.length === 0 ? (
                                        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
                                            <p className="text-slate-400 text-xs">Nenhuma viagem encontrada.</p>
                                        </div>
                                    ) : (
                                     stat.trips.map(trip => (
                                         <div key={trip.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center text-sm hover:border-blue-300 transition-colors">
                                             <div>
                                                 <p className="font-bold text-slate-700 text-xs mb-1">{new Date(trip.date).toLocaleDateString('pt-BR')}</p>
                                                 <p className="text-xs text-slate-500 font-medium">{trip.origin} → {trip.destination}</p>
                                                 <p className="text-[10px] text-slate-400 mt-0.5">{trip.distanceKm}km</p>
                                             </div>
                                             <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded text-xs border border-green-100">
                                                + R$ {trip.freightAmount.toFixed(2)}
                                             </span>
                                         </div>
                                     ))
                                    )}
                                </div>
                            </div>

                            {/* Payments History */}
                            <div>
                                <h4 className="font-bold text-slate-700 mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    Histórico de Pagamentos (Débitos)
                                </h4>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {stat.payments.length === 0 ? (
                                        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
                                            <p className="text-slate-400 text-xs">Nenhum pagamento encontrado.</p>
                                        </div>
                                    ) : (
                                     stat.payments.map(pay => (
                                         <div key={pay.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center text-sm hover:border-red-200 transition-colors">
                                             <div>
                                                 <p className="font-bold text-slate-700 text-xs mb-1">{new Date(pay.date).toLocaleDateString('pt-BR')}</p>
                                                 {pay.notes ? (
                                                     <p className="text-xs text-slate-600 italic">"{pay.notes}"</p>
                                                 ) : <p className="text-xs text-slate-300 italic">Sem observação</p>}
                                             </div>
                                             <div className="flex items-center gap-3">
                                                <span className="font-bold text-red-500 bg-red-50 px-2 py-1 rounded text-xs border border-red-100">
                                                    - R$ {pay.amount.toFixed(2)}
                                                </span>
                                                <button 
                                                    onClick={() => handleDeletePayment(pay.id)}
                                                    className="text-slate-300 hover:text-red-500 text-xs p-1 hover:bg-red-50 rounded" 
                                                    title="Excluir lançamento"
                                                >
                                                    ✕
                                                </button>
                                             </div>
                                         </div>
                                     ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        ))}
        {driverStats.length === 0 && (
            <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
                <p className="text-slate-400">Nenhum motorista ativo cadastrado.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default FreightManager;