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

  // Core Logic: Calculate Earnings vs Payments per Driver
  const driverStats = useMemo(() => {
    return drivers.map(driver => {
        // Filter trips: Performed by this driver AND Status is FINISHED
        const myTrips = trips.filter(t => {
            const ids = t.driverIds || (t.driverId ? [t.driverId] : []);
            return ids.includes(driver.id) && t.status === TripStatus.FINISHED; // Only confirmed trips count
        });
        
        let totalEarned = 0;
        const details = myTrips.map(t => {
            // Calculate freight SPECIFIC to this driver on this trip
            // Formula: Distance * DriverRate
            const rate = driver.kmRate || 0;
            const amount = t.distanceKm * rate;
            
            totalEarned += amount;
            return { ...t, freightAmount: amount };
        });

        // Calculate Paid (Using staffId)
        const myPayments = payments.filter(p => p.staffId === driver.id);
        const totalPaid = myPayments.reduce((acc, p) => acc + p.amount, 0);

        return {
            driver,
            totalEarned,
            totalPaid,
            balance: totalEarned - totalPaid,
            trips: details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            payments: myPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Fretes Motoristas</h2>
        <p className="text-slate-500">Controle de pagamentos de fretes (Apenas viagens Finalizadas).</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {driverStats.map(stat => (
            <div key={stat.driver.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Header Card */}
                <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl">
                            {stat.driver.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">{stat.driver.name}</h3>
                            <p className="text-sm text-slate-500">{stat.trips.length} viagens finalizadas</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold">Total Fretes</p>
                            <p className="text-slate-600 font-semibold">R$ {stat.totalEarned.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold">Total Pago</p>
                            <p className="text-slate-600 font-semibold">R$ {stat.totalPaid.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold">Saldo a Pagar</p>
                            <p className={`text-2xl font-bold ${stat.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                R$ {stat.balance.toFixed(2)}
                            </p>
                        </div>
                        <button 
                            onClick={() => setSelectedDriverId(selectedDriverId === stat.driver.id ? null : stat.driver.id)}
                            className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium shadow-sm"
                        >
                            {selectedDriverId === stat.driver.id ? 'Fechar' : 'Pagar'}
                        </button>
                    </div>
                </div>

                {/* Payment Form Area */}
                {selectedDriverId === stat.driver.id && (
                    <div className="bg-blue-50 p-6 border-t border-blue-100 animate-fade-in">
                        <h4 className="font-bold text-blue-900 mb-4">Registrar Pagamento para {stat.driver.name}</h4>
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-bold text-blue-800 mb-1">Valor (R$)</label>
                                <input 
                                    type="number" 
                                    value={paymentAmount} 
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full p-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>
                            <div className="flex-[2] w-full">
                                <label className="block text-xs font-bold text-blue-800 mb-1">Observação (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={paymentNote} 
                                    onChange={e => setPaymentNote(e.target.value)}
                                    placeholder="Ex: Pix adiantamento"
                                    className="w-full p-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>
                            <button 
                                onClick={() => handlePayment(stat.driver.id)}
                                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded shadow-md"
                            >
                                Confirmar Pagamento
                            </button>
                        </div>
                    </div>
                )}

                {/* Expandable History Details */}
                <div className="border-t border-slate-100">
                    <button 
                        onClick={() => toggleHistory(stat.driver.id)}
                        className="w-full p-3 text-center text-sm text-slate-500 hover:bg-slate-50 transition-colors flex justify-center items-center gap-2"
                    >
                        {showHistory[stat.driver.id] ? 'Ocultar Detalhes' : 'Ver Extrato de Fretes e Pagamentos'} 
                        <span className="text-xs">▼</span>
                    </button>

                    {showHistory[stat.driver.id] && (
                        <div className="p-6 bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                            {/* Trips History */}
                            <div>
                                <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase">Fretes Realizados (Créditos)</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {stat.trips.length === 0 ? <p className="text-slate-400 text-sm">Nenhuma viagem finalizada encontrada.</p> : 
                                     stat.trips.map(trip => (
                                         <div key={trip.id} className="bg-white p-3 rounded border border-slate-200 flex justify-between items-center text-sm">
                                             <div>
                                                 <p className="font-semibold text-slate-700">{new Date(trip.date).toLocaleDateString('pt-BR')}</p>
                                                 <p className="text-xs text-slate-500">{trip.origin} → {trip.destination} ({trip.distanceKm}km)</p>
                                             </div>
                                             <span className="font-bold text-green-600">+ R$ {trip.freightAmount.toFixed(2)}</span>
                                         </div>
                                     ))
                                    }
                                </div>
                            </div>

                            {/* Payments History */}
                            <div>
                                <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase">Histórico de Pagamentos (Débitos)</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {stat.payments.length === 0 ? <p className="text-slate-400 text-sm">Nenhum pagamento realizado.</p> : 
                                     stat.payments.map(pay => (
                                         <div key={pay.id} className="bg-white p-3 rounded border border-slate-200 flex justify-between items-center text-sm">
                                             <div>
                                                 <p className="font-semibold text-slate-700">{new Date(pay.date).toLocaleDateString('pt-BR')}</p>
                                                 {pay.notes && <p className="text-xs text-slate-500 italic">{pay.notes}</p>}
                                             </div>
                                             <div className="flex items-center gap-3">
                                                <span className="font-bold text-red-500">- R$ {pay.amount.toFixed(2)}</span>
                                                <button 
                                                    onClick={() => handleDeletePayment(pay.id)}
                                                    className="text-slate-300 hover:text-red-500 text-xs" 
                                                    title="Excluir lançamento"
                                                >
                                                    ✕
                                                </button>
                                             </div>
                                         </div>
                                     ))
                                    }
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        ))}
        {driverStats.length === 0 && (
            <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
                <p className="text-slate-400">Nenhum motorista ativo cadastrado ou nenhuma viagem realizada.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default FreightManager;