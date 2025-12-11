import React, { useState } from 'react';
import { Staff, StaffRole } from '../types';
import { saveStaff } from '../services/storageService';

interface StaffManagerProps {
  staffList: Staff[];
  refreshData: () => void;
}

const StaffManager: React.FC<StaffManagerProps> = ({ staffList, refreshData }) => {
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>(StaffRole.DRIVER);
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [plate, setPlate] = useState('');
  const [kmRate, setKmRate] = useState(0);

  const startEdit = (staff: Staff) => {
      setEditingId(staff.id);
      setName(staff.name);
      setRole(staff.role);
      setPhone(staff.phone || '');
      setVehicleType(staff.vehicleType || '');
      setPlate(staff.plate || '');
      setKmRate(staff.kmRate || 0);
      setShowForm(true);
  };

  const resetForm = () => {
      setEditingId(null);
      setName('');
      setPhone('');
      setVehicleType('');
      setPlate('');
      setKmRate(0);
      setRole(StaffRole.DRIVER);
  }

  const toggleForm = () => {
      if (showForm) {
          resetForm();
          setShowForm(false);
      } else {
          setShowForm(true);
      }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const staffData: Staff = {
      id: editingId || Date.now().toString(), // Use existing ID if editing
      name,
      role,
      active: true,
      phone,
      vehicleType: role === StaffRole.DRIVER ? vehicleType : undefined,
      plate: role === StaffRole.DRIVER ? plate : undefined,
      kmRate: role === StaffRole.DRIVER ? kmRate : undefined,
    };
    
    let updatedList;
    if (editingId) {
        updatedList = staffList.map(s => s.id === editingId ? staffData : s);
    } else {
        updatedList = [...staffList, staffData];
    }

    saveStaff(updatedList);
    refreshData();
    setShowForm(false);
    resetForm();
  };


  const handleDelete = (id: string) => {
      if(confirm('Remover membro da equipe?')) {
          const updated = staffList.filter(s => s.id !== id);
          saveStaff(updated);
          refreshData();
      }
  }

  return (
    <div className="p-8 h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Gestão de Equipe</h2>
           <p className="text-slate-500">Cadastre e edite motoristas e ajudantes.</p>
        </div>
        <button 
          onClick={toggleForm}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30"
        >
          {showForm ? 'Cancelar' : '+ Novo Membro'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 mb-8 animate-fade-in">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase border-b pb-1">
                    {editingId ? 'Editar Dados' : 'Dados Pessoais'}
                </h3>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / Celular</label>
                    <input type="text" required placeholder="(00) 00000-0000" value={phone} onChange={e => setPhone(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Função</label>
                    <select value={role} onChange={e => setRole(e.target.value as StaffRole)}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        {Object.values(StaffRole).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
            </div>

            {role === StaffRole.DRIVER && (
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-400 uppercase border-b pb-1">Dados do Veículo e Frete</h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Veículo</label>
                        <input type="text" placeholder="Ex: Fiorino, Van, Caminhão" value={vehicleType} onChange={e => setVehicleType(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
                        <input type="text" placeholder="ABC-1234" value={plate} onChange={e => setPlate(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Valor do Km (R$)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-400">R$</span>
                            <input type="number" step="0.01" required value={kmRate} onChange={e => setKmRate(parseFloat(e.target.value))}
                                className="w-full pl-8 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                </div>
            )}

            <div className="md:col-span-2 pt-4">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md">
                    {editingId ? 'Salvar Alterações' : 'Cadastrar Membro'}
                </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.map(s => (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">{s.name}</h3>
                        <p className="text-sm text-slate-500">{s.phone}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${s.role === StaffRole.DRIVER ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {s.role}
                    </span>
                </div>
                
                {s.role === StaffRole.DRIVER && (
                    <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-2 mb-4">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Veículo:</span>
                            <span className="font-medium text-slate-700">{s.vehicleType}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Placa:</span>
                            <span className="font-medium text-slate-700 uppercase">{s.plate}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2">
                            <span className="text-slate-500">Valor/Km:</span>
                            <span className="font-bold text-blue-600">R$ {s.kmRate?.toFixed(2)}</span>
                        </div>
                    </div>
                )}

                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                    <button onClick={() => startEdit(s)} className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                        ✏️ Editar
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600 text-sm font-medium">
                        Excluir
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default StaffManager;