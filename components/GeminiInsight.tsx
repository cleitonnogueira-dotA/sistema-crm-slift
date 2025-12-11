import React, { useState } from 'react';
import { Trip, Staff, Settings } from '../types';
import { generateInsights } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface GeminiInsightProps {
  trips: Trip[];
  staff: Staff[];
  settings: Settings;
}

const GeminiInsight: React.FC<GeminiInsightProps> = ({ trips, staff, settings }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateInsights(trips, staff, settings);
    setReport(result);
    setLoading(false);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <span className="text-4xl">🧠</span> Inteligência Artificial
        </h2>
        <p className="text-slate-500 mt-2">
          Utilize a tecnologia Gemini do Google para analisar seus gastos, detectar padrões e otimizar sua logística.
        </p>
      </div>

      {!report && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">✨</span>
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Pronto para Analisar</h3>
            <p className="text-slate-500 max-w-md mb-8">
                O sistema irá ler todas as viagens cadastradas, cruzar com os valores de pagamento e sugerir melhorias.
            </p>
            <button 
                onClick={handleGenerate}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-blue-500/30 transition-all transform hover:-translate-y-1"
            >
                Gerar Relatório Inteligente
            </button>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-slate-600 font-medium animate-pulse">A IA está analisando seus dados...</p>
        </div>
      )}

      {report && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col overflow-hidden animate-fade-in">
            <div className="bg-slate-900 p-4 flex justify-between items-center">
                <h3 className="text-white font-bold">Relatório Gerado</h3>
                <button onClick={() => setReport(null)} className="text-slate-400 hover:text-white text-sm">Nova Análise</button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[60vh] prose prose-slate max-w-none">
                 {/* Rendering Markdown safely */}
                 <ReactMarkdown>{report}</ReactMarkdown>
            </div>
        </div>
      )}
    </div>
  );
};

export default GeminiInsight;