import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TripsManager from './components/TripsManager';
import StaffManager from './components/StaffManager'; 
import BonusesManager from './components/BonusesManager';
import FreightManager from './components/FreightManager';
import SettingsManager from './components/SettingsManager';
import { ViewState, Staff, Trip, Settings, Payment } from './types';
import * as storage from './services/storageService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  
  // App State - Initialize directly from storage to ensure values are available immediately
  const [staff, setStaff] = useState<Staff[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<Settings>(storage.getSettings());

  const loadData = () => {
    setStaff(storage.getStaff());
    setTrips(storage.getTrips());
    setSettings(storage.getSettings());
    setPayments(storage.getPayments());
  };

  useEffect(() => {
    loadData();
  }, []);

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard trips={trips} settings={settings} />;
      case 'trips':
        return <TripsManager trips={trips} staff={staff} settings={settings} refreshData={loadData} />;
      case 'staff':
        return <StaffManager staffList={staff} refreshData={loadData} />;
      case 'freights':
        return <FreightManager staff={staff} trips={trips} payments={payments} refreshData={loadData} />;
      case 'bonuses':
        return <BonusesManager staff={staff} trips={trips} settings={settings} payments={payments} refreshData={loadData} />;
      case 'settings':
        return <SettingsManager currentSettings={settings} refreshData={loadData} />;
      default:
        return <Dashboard trips={trips} settings={settings} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar currentView={view} setView={setView} />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;