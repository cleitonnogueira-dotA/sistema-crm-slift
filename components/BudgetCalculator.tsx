import React, { useState, useMemo } from 'react';

// --- DATA & CONSTANTS ---

const VEHICLE_RATES: Record<string, number> = {
  'Carreta': 7.00,
  'Truck': 6.00,
  'Toco': 4.00,
  'Vuc': 3.00,
  'Carro de Apoio': 2.40,
  'Van': 2.00,
  'Fiorino': 1.90,
};

const CRANE_PRICES: Record<string, number> = {
  '30 ton': 8100,
  '50 ton': 9150,
  '70 ton': 10350,
  '90 ton': 12520,
  '110 ton': 24900,
  '120 ton': 26500,
  '160 ton': 27800,
  '200 ton': 37000,
  '220 ton': 47320,
  '250 ton': 63000,
  '300 ton': 86100,
  '500 ton': 170000,
};

const HELPER_PRICE = 350;
const MUNK_PRICE = 2500;

// --- TYPES ---

interface VehicleRow {
  id: string;
  type: string;
  quantity: number;
  km: number;
}

interface CraneRow {
  id: string;
  type: string;
  quantity: number;
}

const BudgetCalculator: React.FC = () => {
  // --- STATE ---
  
  // 1. Vehicles
  const [vehicles, setVehicles] = useState<VehicleRow[]>([
    { id: '1', type: 'Truck', quantity: 1, km: 0 }
  ]);

  // 2. Staff
  const [helpersQty, setHelpersQty] = useState(0);

  // 3. Insurance
  const [merchandiseValue, setMerchandiseValue] = useState(0);
  const [insurancePercent, setInsurancePercent] = useState(0.5);

  // 4. Equipment
  const [munkQty, setMunkQty] = useState(0);
  const [cranes, setCranes] = useState<CraneRow[]>([]);

  // 5. Others
  const [othersValue, setOthersValue] = useState(0);

  // 6. Configs (Tax & Margin)
  const [marginPercent, setMarginPercent] = useState(30);
  const [taxRate, setTaxRate] = useState(18);

  // --- CALCULATIONS ---

  const totalVehicles = useMemo(() => {
    return vehicles.reduce((acc, v) => {
      const rate = VEHICLE_RATES[v.type] || 0;
      return acc + (v.quantity * v.km * rate);
    }, 0);
  }, [vehicles]);

  const totalHelpers = useMemo(() => {
    return helpersQty * HELPER_PRICE;
  }, [helpersQty]);

  const totalInsurance = useMemo(() => {
    return merchandiseValue * (insurancePercent / 100);
  }, [merchandiseValue, insurancePercent]);

  const totalMunk = useMemo(() => {
    return munkQty * MUNK_PRICE;
  }, [munkQty]);

  const totalCranes = useMemo(() => {
    return cranes.reduce((acc, c) => {
      const price = CRANE_PRICES[c.type] || 0;
      return acc + (c.quantity * price);
    }, 0);
  }, [cranes]);

  const subTotal = useMemo(() => {
    return totalVehicles + totalHelpers + totalInsurance + totalMunk + totalCranes + othersValue;
  }, [totalVehicles, totalHelpers, totalInsurance, totalMunk, totalCranes, othersValue]);

  const totalTax = useMemo(() => {
    return subTotal * (taxRate / 100);
  }, [subTotal, taxRate]);

  const finalCost = useMemo(() => {
    return subTotal + totalTax;
  }, [subTotal, totalTax]);

  // Preço de Venda = Custo * (1 + Margem%)
  const salePriceExact = useMemo(() => {
    return finalCost * (1 + (marginPercent / 100));
  }, [finalCost, marginPercent]);

  const salePriceRounded = useMemo(() => {
      return Math.ceil(salePriceExact);
  }, [salePriceExact]);

  // --- HANDLERS ---

  const addVehicle = () => {
    setVehicles([...vehicles, { id: Date.now().toString(), type: 'Truck', quantity: 1, km: 0 }]);
  };

  const removeVehicle = (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const updateVehicle = (id: string, field: keyof VehicleRow, value: any) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const addCrane = () => {
    setCranes([...cranes, { id: Date.now().toString(), type: '30 ton', quantity: 1 }]);
  };

  const removeCrane = (id: string) => {
    setCranes(prev => prev.filter(c => c.id !== id));
  };

  const updateCrane = (id: string, field: keyof CraneRow, value: any) => {
    setCranes(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const fmt = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex justify-between items-end mb-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Calculadora de Custos</h2>
                <p className="text-slate-500 text-sm">Ferramenta interna para composição de fretes e serviços.</p>
            </div>
            <button 
                onClick={() => window.print()}
                className="text-slate-500 hover:text-blue-600 font-medium text-sm flex items-center gap-1"
            >
                <span>🖨️</span> Imprimir
            </button>
        </div>

        {/* 1. VEÍCULOS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 p-1.5 rounded text-lg">🚚</span> Veículos e Frete
            </h3>
            <div className="space-y-3">
                {vehicles.map((v, idx) => (
                    <div key={v.id} className="grid grid-cols-12 gap-3 items-end bg-slate-50 p-3 rounded-lg border border-slate-100">
                         <div className="col-span-3">
                            <label className="text-xs font-bold text-slate-500 block mb-1">Tipo Veículo</label>
                            <select 
                                value={v.type}
                                onChange={e => updateVehicle(v.id, 'type', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {Object.keys(VEHICLE_RATES).map(type => (
                                    <option key={type} value={type}>{type} (R$ {VEHICLE_RATES[type]})</option>
                                ))}
                            </select>
                         </div>
                         <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 block mb-1">Qtd</label>
                            <input 
                                type="number" min="1"
                                value={v.quantity}
                                onChange={e => updateVehicle(v.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full p-2 border border-slate-300 rounded text-sm text-center"
                            />
                         </div>
                         <div className="col-span-3">
                            <label className="text-xs font-bold text-slate-500 block mb-1">KM Rodado</label>
                            <div className="relative">
                                <input 
                                    type="number" min="0"
                                    value={v.km}
                                    onChange={e => updateVehicle(v.id, 'km', parseFloat(e.target.value) || 0)}
                                    className="w-full p-2 border border-slate-300 rounded text-sm text-center"
                                />
                                <span className="absolute right-8 top-2 text-xs text-slate-400 hidden sm:block">km</span>
                            </div>
                         </div>
                         <div className="col-span-3">
                            <label className="text-xs font-bold text-slate-500 block mb-1 text-right">Total Frete</label>
                            <div className="w-full p-2 bg-white border border-slate-200 rounded text-sm font-bold text-right text-slate-700">
                                {fmt(v.quantity * v.km * (VEHICLE_RATES[v.type] || 0))}
                            </div>
                         </div>
                         <div className="col-span-1 flex justify-center pb-2">
                             <button onClick={() => removeVehicle(v.id)} className="text-red-400 hover:text-red-600 font-bold">✕</button>
                         </div>
                    </div>
                ))}
                <button onClick={addVehicle} className="text-sm text-blue-600 font-bold hover:underline mt-2">+ Adicionar Veículo</button>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                 <span className="text-sm text-slate-500">Total Veículos</span>
                 <span className="font-bold text-slate-800">{fmt(totalVehicles)}</span>
            </div>
        </div>

        {/* 2. EQUIPE E SEGURO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colaboradores */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <span className="bg-green-100 text-green-600 p-1.5 rounded text-lg">👷</span> Colaboradores
                </h3>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 block mb-1">Quantidade</label>
                        <input 
                            type="number" min="0"
                            value={helpersQty}
                            onChange={e => setHelpersQty(parseFloat(e.target.value) || 0)}
                            className="w-full p-2 border border-slate-300 rounded text-sm"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 block mb-1 text-right">Custo (R$ 350 un.)</label>
                        <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-right">
                            {fmt(totalHelpers)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Seguro */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <span className="bg-yellow-100 text-yellow-600 p-1.5 rounded text-lg">🛡️</span> Seguro Carga
                </h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Valor Mercadoria</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-400 text-xs">R$</span>
                            <input 
                                type="number" 
                                value={merchandiseValue}
                                onChange={e => setMerchandiseValue(parseFloat(e.target.value) || 0)}
                                className="w-full pl-8 p-2 border border-slate-300 rounded text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-24">
                             <label className="text-xs font-bold text-slate-500 block mb-1">Taxa (%)</label>
                             <input 
                                type="number" step="0.1"
                                value={insurancePercent}
                                onChange={e => setInsurancePercent(parseFloat(e.target.value) || 0)}
                                className="w-full p-2 border border-slate-300 rounded text-sm text-center"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 block mb-1 text-right">Valor Seguro</label>
                            <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-right">
                                {fmt(totalInsurance)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. EQUIPAMENTOS (MUNK E GUINDASTE) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <span className="bg-orange-100 text-orange-600 p-1.5 rounded text-lg">🏗️</span> Equipamentos
            </h3>
            
            {/* Munk */}
            <div className="mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold text-slate-700 text-sm">Caminhão Munk (R$ 2.500,00)</label>
                </div>
                <div className="flex items-center gap-4">
                     <div className="w-32">
                        <label className="text-xs font-bold text-slate-500 block mb-1">Quantidade</label>
                        <input 
                            type="number" min="0"
                            value={munkQty}
                            onChange={e => setMunkQty(parseFloat(e.target.value) || 0)}
                            className="w-full p-2 border border-slate-300 rounded text-sm text-center"
                        />
                     </div>
                     <div className="flex-1">
                         <label className="text-xs font-bold text-slate-500 block mb-1 text-right">Total Munk</label>
                         <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-right">
                            {fmt(totalMunk)}
                        </div>
                     </div>
                </div>
            </div>

            {/* Guindastes */}
            <div className="space-y-3">
                 <label className="font-semibold text-slate-700 text-sm">Guindastes</label>
                 {cranes.map((c) => (
                    <div key={c.id} className="grid grid-cols-12 gap-3 items-end bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="col-span-5">
                            <label className="text-xs font-bold text-slate-500 block mb-1">Capacidade</label>
                            <select 
                                value={c.type}
                                onChange={e => updateCrane(c.id, 'type', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {Object.keys(CRANE_PRICES).map(type => (
                                    <option key={type} value={type}>{type} (R$ {fmt(CRANE_PRICES[type])})</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 block mb-1">Qtd</label>
                            <input 
                                type="number" min="1"
                                value={c.quantity}
                                onChange={e => updateCrane(c.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full p-2 border border-slate-300 rounded text-sm text-center"
                            />
                        </div>
                        <div className="col-span-4">
                            <label className="text-xs font-bold text-slate-500 block mb-1 text-right">Total</label>
                            <div className="w-full p-2 bg-white border border-slate-200 rounded text-sm font-bold text-right text-slate-700">
                                {fmt(c.quantity * (CRANE_PRICES[c.type] || 0))}
                            </div>
                        </div>
                        <div className="col-span-1 flex justify-center pb-2">
                            <button onClick={() => removeCrane(c.id)} className="text-red-400 hover:text-red-600 font-bold">✕</button>
                        </div>
                    </div>
                 ))}
                 <button onClick={addCrane} className="text-sm text-blue-600 font-bold hover:underline mt-1">+ Adicionar Guindaste</button>
            </div>
            <div className="mt-4 pt-4 flex justify-end">
                <p className="text-sm font-bold text-slate-600">Subtotal Equipamentos: <span className="text-slate-800 ml-2">{fmt(totalMunk + totalCranes)}</span></p>
            </div>
        </div>

        {/* 4. OUTROS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <span className="text-lg">📦</span>
            <div className="flex-1">
                <label className="text-sm font-bold text-slate-700 block mb-1">Outros Custos / Despesas Extras</label>
                <div className="relative">
                     <span className="absolute left-3 top-2 text-slate-400 text-sm">R$</span>
                     <input 
                        type="number" 
                        value={othersValue}
                        onChange={e => setOthersValue(parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>
        </div>

        {/* 5. EXTRATO DETALHADO */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="bg-slate-50 p-4 border-b border-slate-100">
                 <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Extrato Financeiro</h4>
             </div>
             <div className="p-4 space-y-2 text-sm">
                 <div className="flex justify-between border-b border-slate-100 pb-2">
                     <span className="text-slate-600">Total Veículos (Frete)</span>
                     <span className="font-semibold">{fmt(totalVehicles)}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-100 pb-2">
                     <span className="text-slate-600">Total Colaboradores</span>
                     <span className="font-semibold">{fmt(totalHelpers)}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-100 pb-2">
                     <span className="text-slate-600">Total Seguro</span>
                     <span className="font-semibold">{fmt(totalInsurance)}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-100 pb-2">
                     <span className="text-slate-600">Total Equipamentos</span>
                     <span className="font-semibold">{fmt(totalMunk + totalCranes)}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-100 pb-2">
                     <span className="text-slate-600">Outros</span>
                     <span className="font-semibold">{fmt(othersValue)}</span>
                 </div>
                 
                 <div className="flex justify-between items-center pt-2 text-slate-800">
                     <span className="font-bold">Subtotal Operacional</span>
                     <span className="font-bold">{fmt(subTotal)}</span>
                 </div>

                 <div className="flex justify-between items-center pt-2 text-blue-800 bg-blue-50 -mx-4 px-4 py-2 mt-2">
                     <div className="flex items-center gap-2">
                        <span className="font-bold">Impostos</span>
                        <div className="flex items-center gap-1 bg-white px-2 rounded border border-blue-200">
                             <input 
                                type="number" 
                                value={taxRate} 
                                onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                                className="w-10 text-right font-bold text-blue-600 outline-none text-xs py-1"
                             />
                             <span className="text-xs text-blue-600">%</span>
                        </div>
                     </div>
                     <span className="font-bold">+ {fmt(totalTax)}</span>
                 </div>
             </div>
        </div>

        {/* 6. CUSTO TOTAL */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex justify-between items-center">
             <span className="text-sm font-bold uppercase tracking-wider text-slate-300">Custo Total da Viagem</span>
             <span className="text-3xl font-black tracking-tight">{fmt(finalCost)}</span>
        </div>

        {/* 7. MARGEM E PREÇO FINAL */}
        <div className="mt-4 bg-green-50 border border-green-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
             <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-2xl">
                    💲
                </div>
                <div>
                     <label className="block font-bold text-green-900 text-lg">Margem de Lucro</label>
                     <p className="text-green-700 text-xs">Porcentagem a ganhar em cima do custo.</p>
                </div>
                <div className="flex items-center">
                     <input 
                        type="number" 
                        value={marginPercent}
                        onChange={(e) => setMarginPercent(parseFloat(e.target.value) || 0)}
                        className="w-24 p-2 text-2xl font-black text-green-700 border-b-2 border-green-500 bg-transparent outline-none text-center"
                    />
                    <span className="text-green-700 font-bold text-xl ml-1">%</span>
                </div>
             </div>

             <div className="h-px w-full md:h-16 md:w-px bg-green-200"></div>

             <div className="text-right">
                <p className="text-sm font-bold text-green-700 uppercase tracking-wider">Valor Sugerido de Venda</p>
                <div className="flex flex-col items-end">
                    <p className="text-4xl font-black text-green-800 tracking-tight">{fmt(salePriceRounded)}</p>
                    <p className="text-xs text-green-600 mt-1 font-medium">
                        Valor Exato: {fmt(salePriceExact)}
                    </p>
                    <p className="text-[10px] text-green-600 uppercase font-bold tracking-wide mt-1 bg-green-100 px-2 py-0.5 rounded-full">
                        Arredondado para Cima
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default BudgetCalculator;