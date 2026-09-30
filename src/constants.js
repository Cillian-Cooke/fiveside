import divisionColors from './data/division-colors.json'

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

export const DAY_SHORT = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
}

export const DAY_LONG = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
}

export const BAY_TIMES = [
  '8-9am',
  '9-10am',
  '10-11am',
  '11-12pm',
  '12-1pm',
  '1-2pm',
  '2-3pm',
  '3-4pm',
  '4-5pm',
]

export const TIME_SHORT = {
  '8-9am': '8–9',
  '9-10am': '9–10',
  '10-11am': '10–11',
  '11-12pm': '11–12',
  '12-1pm': '12–1',
  '1-2pm': '1–2',
  '2-3pm': '2–3',
  '3-4pm': '3–4',
  '4-5pm': '4–5',
}

export const HALL_VENUES = ['hall_a', 'hall_b']

export const VENUE_LABEL = {
  botany_bay: 'Botany Bay',
  hall_a: 'Hall A',
  hall_b: 'Hall B',
}

const DIVISION_ORDER = [
  'Division 1',
  'Division 2',
  'Division 3',
  'Division 4',
  'Division 5',
  'Division 6',
  'Division 7',
  'Mixed Division',
]

export const DIVISIONS = DIVISION_ORDER.map((name) => ({
  name,
  color: divisionColors[name],
}))

export function divisionColor(name) {
  return divisionColors[name] || divisionColors['Mixed Division']
}

export const NAV = [
  { to: '/', label: 'Fixtures' },
  { to: '/tables', label: 'Tables' },
]

export const LEAGUE_FILTERS = [
  { id: 'all', label: 'All leagues' },
  { id: 'Division 1', label: 'Div 1' },
  { id: 'Division 2', label: 'Div 2' },
  { id: 'Division 3', label: 'Div 3' },
  { id: 'Division 4', label: 'Div 4' },
  { id: 'Division 5', label: 'Div 5' },
  { id: 'Division 6', label: 'Div 6' },
  { id: 'Division 7', label: 'Div 7' },
  { id: 'Mixed Division', label: 'Mixed' },
]
