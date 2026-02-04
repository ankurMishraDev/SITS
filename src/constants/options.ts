export const PAYMENT_MODES = [
  { label: 'UPI', value: 'UPI' },
  { label: 'Cash', value: 'Cash' },
  { label: 'Bank', value: 'Bank' },
  { label: 'Cheque', value: 'Cheque' },
  { label: 'Fuel', value: 'Fuel' },
  { label: 'Others', value: 'Others' },
] as const;

export const TRIP_STATUSES = [
  { label: 'Open', value: 'open' },
  { label: 'POD Received', value: 'pod_received' },
  { label: 'Settled', value: 'settled' },
] as const;

export const CHARGE_OPERATIONS = [
  { label: 'Add', value: 'add' },
  { label: 'Deduct', value: 'deduct' },
] as const;
