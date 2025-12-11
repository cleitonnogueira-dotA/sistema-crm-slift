import React, { useState, useMemo } from 'react';
import { Staff, Trip, Settings, StaffRole, JobType, Payment, TripStatus } from '../types';
import { savePayment, deletePayment } from '../services/storageService';

interface BonusesManagerProps {
  staff: Staff[];
  trips: Trip[];
  settings: Settings;
  payments: Payment[];
  refreshData: () => void;
}

const BonusesManager: React.FC<BonusesManagerProps> = ({ staff, trips, settings, payments, refreshData }) => {
  const [selectedHelperId, setSelectedHelperId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [showHistory, setShowHistory] = useState<Record<string, boolean>>({});

  const helpers = staff.filter(s => s.role === StaffRole.HELPER && s.active);

  // Core Logic: Calculate Earnings vs Payments per Helper
  const helperStats = useMemo(() => {
    return helpers.map(helper => {
        // Filter trips: Must be weekend AND helper participated AND Status is FINISHED
        const workedTrips = trips.filter(t => 
          t.isWeekend && 
          t.helperIds.includes(helper.id) &&
          t.status === TripStatus.FINISHED // Only confirmed trips count
        );
        
        let totalEarned = 0;
        const details = workedTrips.map(t => {
            let amount = 0;
            // Use fallback if settings are missing (0) to prevent confusion
            if (t.jobType === JobType.MRI) {
                amount = settings.helperBonusMRI || 0;
            } else if (t.jobType === JobType.CT) {
                amount = settings.helperBonusCT || 0;
            }
            
            totalEarned += amount;
            return { ...t, bonusAmount: amount };
        });

        // Calculate Paid (Updated to use staffId)
        const myPayments = payments.filter(p => p.staffId === helper.id);
        const totalPaid = myPayments.reduce((acc, p) => acc + p.amount, 0);

        return {
            helper,
            totalEarned,
            totalPaid,
            balance: totalEarned - totalPaid,
            trips: details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            payments: myPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        };
    });
  }, [helpers, trips, payments, settings]);

  const handlePayment = (helperId: string) => {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) return alert("Valor inválido");

      const newPayment: Payment = {
          id: Date.now().toString(),
          staffId: helperId, // Updated
          amount,
          date: new Date().toISOString(),
          notes: paymentNote
      };

      savePayment(newPayment);
      refreshData();
      setPaymentAmount('');
      setPaymentNote('');
      setSelectedHelperId(null);
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
        <h2 className="text-2xl font-bold text-slate-800">Prêmios de Final de Semana</h2>
        <p className="text-slate-500">Controle de pagamentos de ajudantes por serviços em Sábados e Domingos (Apenas viagens Finalizadas).</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {helperStats.map(stat => (
            <div key={stat.helper.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Header Card */}
                <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl">
                            {stat.helper.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">{stat.helper.name}</h3>
                            <p className="text-sm text-slate-500">{stat.trips.length} viagens finalizadas (FDS)</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold">Total Recebido</p>
                            <p className="text-slate-600 font-semibold">R$ {stat.totalPaid.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold">Saldo a Pagar</p>
                            <p className={`text-2xl font-bold ${stat.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                R$ {stat.balance.toFixed(2)}
                            </p>
                        </div>
                        <button 
                            onClick={() => setSelectedHelperId(selectedHelperId === stat.helper.id ? null : stat.helper.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm"
                        >
                            {selectedHelperId === stat.helper.id ? 'Fechar' : 'Pagar'}
                        </button>
                    </div>
                </div>

                {/* Payment Form Area */}
                {selectedHelperId === stat.helper.id && (
                    <div className="bg-blue-50 p-6 border-t border-blue-100 animate-fade-in">
                        <h4 className="font-bold text-blue-900 mb-4">Registrar Pagamento para {stat.helper.name}</h4>
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
                                    placeholder="Ex: Pix referente a Outubro"
                                    className="w-full p-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>
                            <button 
                                onClick={() => handlePayment(stat.helper.id)}
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
                        onClick={() => toggleHistory(stat.helper.id)}
                        className="w-full p-3 text-center text-sm text-slate-500 hover:bg-slate-50 transition-colors flex justify-center items-center gap-2"
                    >
                        {showHistory[stat.helper.id] ? 'Ocultar Detalhes' : 'Ver Extrato de Viagens e Pagamentos'} 
                        <span className="text-xs">▼</span>
                    </button>

                    {showHistory[stat.helper.id] && (
                        <div className="p-6 bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                            {/* Trips History */}
                            <div>
                                <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase">Histórico de Viagens (Créditos)</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {stat.trips.length === 0 ? <p className="text-slate-400 text-sm">Nenhuma viagem de FDS finalizada.</p> : 
                                     stat.trips.map(trip => (
                                         <div key={trip.id} className="bg-white p-3 rounded border border-slate-200 flex justify-between items-center text-sm">
                                             <div>
                                                 <p className="font-semibold text-slate-700">{new Date(trip.date).toLocaleDateString('pt-BR')}</p>
                                                 <p className="text-xs text-slate-500">{trip.jobType} - {trip.destination}</p>
                                                 {/* Debug/Info line for rate used */}
                                                 <p className="text-[10px] text-slate-400">
                                                     Taxa: R$ {trip.bonusAmount.toFixed(2)} 
                                                     {trip.bonusAmount === 0 && ' (Verifique Configurações)'}
                                                 </p>
                                             </div>
                                             <span className={`font-bold ${trip.bonusAmount > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                                                 + R$ {trip.bonusAmount.toFixed(2)}
                                             </span>
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
        {helperStats.length === 0 && (
            <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
                <p className="text-slate-400">Nenhum ajudante ativo cadastrado.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default BonusesManager;