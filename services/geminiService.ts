import { GoogleGenAI } from "@google/genai";
import { Trip, Staff, Settings } from "../types";

export const generateInsights = async (
  trips: Trip[],
  staff: Staff[],
  settings: Settings
): Promise<string> => {
  const apiKey = process.env.API_KEY; 
  
  if (!apiKey) {
    return "API Key não encontrada. Por favor, configure a chave da API.";
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare data context
  const dataContext = JSON.stringify({
    totalTrips: trips.length,
    settings: settings,
    recentTrips: trips.slice(0, 20), // Analyze last 20 trips to save context
    staff: staff.filter(s => s.active).map(s => ({ name: s.name, role: s.role }))
  });

  const prompt = `
    Atue como um analista financeiro e gerente de logística para uma pequena empresa de transportes médicos.
    Abaixo estão os dados JSON recentes das operações da empresa (viagens, equipe e configurações de custo).
    
    Analise os dados e forneça um relatório curto, direto e profissional em Markdown.
    
    Foque em:
    1. Eficiência de custos (Gastos com finais de semana vs dias úteis).
    2. Motoristas ou Ajudantes mais ativos.
    3. Sugestões para economia baseadas no padrão de 'JobType' (Ressonância vs Tomografia).
    4. Identifique se há algum gasto anomalamente alto.

    Dados:
    ${dataContext}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao conectar com a inteligência artificial. Verifique sua chave de API.";
  }
};