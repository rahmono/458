// Mock "Global Blacklist" for cross-check simulation
export const BLACKLIST_NUMBERS = [
  '900000001',
  '900123456',
  '935555555'
];

export const CURRENCY_SUFFIX = 'TJS';

export const INITIAL_DEBTORS_MOCK = [
  {
    id: '1',
    name: 'Фаррух Алиев',
    phone: '900555001',
    balance: 150.00,
    lastActivity: new Date(Date.now() - 86400000 * 2).toISOString(),
    transactions: [
      {
        id: 't1',
        amount: 200,
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
        type: 'DEBT',
        description: 'Маҳсулоти хӯрокворӣ',
        createdBy: 'Соҳибкор'
      },
      {
        id: 't2',
        amount: 50,
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        type: 'PAYMENT',
        description: 'Қисман пардохт',
        createdBy: 'Фурӯшанда А'
      }
    ],
    createdBy: 'Соҳибкор'
  },
  {
    id: '2',
    name: 'Сомон Раҳимов',
    phone: '935555555', // Blacklisted
    balance: 420.50,
    lastActivity: new Date(Date.now() - 86400000 * 10).toISOString(),
    transactions: [
      {
        id: 't3',
        amount: 420.50,
        date: new Date(Date.now() - 86400000 * 10).toISOString(),
        type: 'DEBT',
        description: 'Орд ва равған',
        createdBy: 'Соҳибкор'
      }
    ],
    createdBy: 'Соҳибкор'
  },
  {
    id: '3',
    name: 'Мадина Каримова',
    phone: '918777888',
    balance: 0,
    lastActivity: new Date(Date.now() - 86400000 * 1).toISOString(),
    transactions: [],
    createdBy: 'Фурӯшанда А'
  }
];