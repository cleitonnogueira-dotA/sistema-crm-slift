import React, { useState } from 'react';
import { Settings } from '../types';
import { saveSettings } from '../services/storageService';

interface SettingsManagerProps {
  currentSettings: Settings;
  refreshData: () => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ currentSettings, refreshData }) => {
  const [settings, setSettings] = useState<Settings>(currentSettings);
  const [saved, setSaved] = useState(false);

  const handleChange = (key: keyof Settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: parseFloat(value) }));
    setSaved(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, logo: reader.result as string }));
        setSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, logo: undefined }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    refreshData();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 max-w-3xl animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Configurações</h2>
      <p className="text-slate-500 mb-8">Personalize o sistema e defina valores base.</p>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-8">
        
        {/* Logo Section */}
        <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase border-b pb-1 mb-4">Identidade Visual</h3>
            <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative">
                    {settings.logo ? (
                        <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-slate-400 text-xs text-center p-2">Sem Logo</span>
                    )}
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Logo da Empresa</label>
                    <div className="flex gap-3">
                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                            Escolher Imagem
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </label>
                        {settings.logo && (
                            <button onClick={handleRemoveLogo} className="text-red-500 hover:text-red-700 text-sm font-medium">
                                Remover
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Recomendado: Imagem quadrada ou retangular (PNG/JPG).</p>
                </div>
            </div>
        </div>

        {/* Values Section */}
        <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase border-b pb-1 mb-4">Faturamento (Valor Recebido)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Base Ressonância (MRI)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400">R$</span>
                        <input 
                            type="number" 
                            value={settings.mriRate}
                            onChange={e => handleChange('mriRate', e.target.value)}
                            className="w-full pl-8 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Base Tomografia (CT)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400">R$</span>
                        <input 
                            type="number" 
                            value={settings.ctRate}
                            onChange={e => handleChange('ctRate', e.target.value)}
                            className="w-full pl-8 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase border-b pb-1 mb-4">Pagamento Ajudantes (Prêmios FDS)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Prêmio por MRI (Sáb/Dom)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400">R$</span>
                        <input 
                            type="number" 
                            value={settings.helperBonusMRI}
                            onChange={e => handleChange('helperBonusMRI', e.target.value)}
                            className="w-full pl-8 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Prêmio por CT (Sáb/Dom)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400">R$</span>
                        <input 
                            type="number" 
                            value={settings.helperBonusCT}
                            onChange={e => handleChange('helperBonusCT', e.target.value)}
                            className="w-full pl-8 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase border-b pb-1 mb-4">Custos Operacionais</h3>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Custo Combustível Estimado/KM</label>
            <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400">R$</span>
                <input 
                    type="number" 
                    step="0.01"
                    value={settings.fuelCostPerKm}
                    onChange={e => handleChange('fuelCostPerKm', e.target.value)}
                    className="w-full pl-8 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            {saved ? (
                <span className="text-green-600 font-medium flex items-center animate-bounce">
                    ✓ Configurações salvas!
                </span>
            ) : <span></span>}
            <button 
                onClick={handleSave}
                className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all"
            >
                Salvar Alterações
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;