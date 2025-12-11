import { Staff, Trip, Settings, StaffRole, JobType, Payment } from '../types';

const KEYS = {
  STAFF: 'slift_staff',
  TRIPS: 'slift_trips',
  SETTINGS: 'slift_settings',
  PAYMENTS: 'slift_payments'
};

const DEFAULT_SETTINGS: Settings = {
  mriRate: 150,
  ctRate: 100,
  helperBonusMRI: 60, // Ex: Pay 60 to helper for MRI on weekend
  helperBonusCT: 40,  // Ex: Pay 40 to helper for CT on weekend
  fuelCostPerKm: 2.50
};

const MOCK_STAFF: Staff[] = [
  { 
    id: '1', 
    name: 'Carlos Silva', 
    role: StaffRole.DRIVER, 
    active: true, 
    phone: '(11) 99999-1234', 
    vehicleType: 'Fiat Fiorino', 
    plate: 'ABC-1234', 
    kmRate: 2.50 
  },
  { 
    id: '2', 
    name: 'Roberto Santos', 
    role: StaffRole.DRIVER, 
    active: true, 
    phone: '(11) 98888-5678', 
    vehicleType: 'Renault Master', 
    plate: 'XYZ-9876', 
    kmRate: 3.20 
  },
  { 
    id: '3', 
    name: 'João Souza', 
    role: StaffRole.HELPER, 
    active: true, 
    phone: '(11) 97777-1111' 
  },
  { 
    id: '4', 
    name: 'Pedro Alves', 
    role: StaffRole.HELPER, 
    active: true, 
    phone: '(11) 96666-2222' 
  },
];

export const getStaff = (): Staff[] => {
  const data = localStorage.getItem(KEYS.STAFF);
  return data ? JSON.parse(data) : MOCK_STAFF;
};

export const saveStaff = (staff: Staff[]) => {
  localStorage.setItem(KEYS.STAFF, JSON.stringify(staff));
};

export const getTrips = (): Trip[] => {
  const data = localStorage.getItem(KEYS.TRIPS);
  return data ? JSON.parse(data) : [];
};

export const saveTrip = (trip: Trip) => {
  const trips = getTrips();
  trips.push(trip);
  localStorage.setItem(KEYS.TRIPS, JSON.stringify(trips));
};

export const deleteTrip = (id: string) => {
  const trips = getTrips().filter(t => t.id !== id);
  localStorage.setItem(KEYS.TRIPS, JSON.stringify(trips));
}

export const getPayments = (): Payment[] => {
  const data = localStorage.getItem(KEYS.PAYMENTS);
  return data ? JSON.parse(data) : [];
};

export const savePayment = (payment: Payment) => {
  const payments = getPayments();
  payments.push(payment);
  localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(payments));
};

export const deletePayment = (id: string) => {
  const payments = getPayments().filter(p => p.id !== id);
  localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(payments));
};

export const getSettings = (): Settings => {
  const data = localStorage.getItem(KEYS.SETTINGS);
  if (!data) return DEFAULT_SETTINGS;
  
  // Safe merge to ensure new keys or missing keys in local storage don't break the app
  const parsed = JSON.parse(data);
  return { ...DEFAULT_SETTINGS, ...parsed };
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};