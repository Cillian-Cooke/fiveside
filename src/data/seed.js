import { currentWeekMonday, formatWeekRange } from '../lib/week-dates.js'

/* SHEET-WEEKS:START */
const WEEKS = [
  {
    startsOn: '2026-09-28',
    tab: 'Week 1 28th',
    matches: [
      { day: 'tuesday', time: '9-10am', venue: 'botany_bay', home: 'East Cavan Gaels', away: 'Dropouts FC', color: '#F9CB9C', division: 'Division 2' },
      { day: 'monday', time: '10-11am', venue: 'botany_bay', home: 'Pavillionaires', away: 'Integer Milan', color: '#EA9999', division: 'Division 1' },
      { day: 'tuesday', time: '10-11am', venue: 'botany_bay', home: 'HurriKanes', away: 'River dodder rodent', color: '#B4A7D6', division: 'Division 6' },
      { day: 'wednesday', time: '10-11am', venue: 'botany_bay', home: 'Liampool', away: 'Pavaria', color: '#F9CB9C', division: 'Division 2' },
      { day: 'thursday', time: '10-11am', venue: 'botany_bay', home: 'Lawds and Bizches', away: 'Fiery Middle Aged Women', color: '#6AA84F', division: 'Mixed Division' },
      { day: 'tuesday', time: '11-12pm', venue: 'botany_bay', home: 'The Fish Tank', away: 'Real Medrid', color: '#B6D7A8', division: 'Division 4' },
      { day: 'wednesday', time: '11-12pm', venue: 'botany_bay', home: 'Engibeering', away: 'Choose Football', color: '#EA9999', division: 'Division 1' },
      { day: 'thursday', time: '11-12pm', venue: 'botany_bay', home: 'git gud', away: 'Euro football studs', color: '#6AA84F', division: 'Mixed Division' },
      { day: 'friday', time: '11-12pm', venue: 'botany_bay', home: 'The BESS Around', away: 'Lads on toure', color: '#F9CB9C', division: 'Division 2' },
      { day: 'monday', time: '12-1pm', venue: 'botany_bay', home: 'PBB FC', away: 'Wings of a Sparrow', color: '#B4A7D6', division: 'Division 6' },
      { day: 'tuesday', time: '12-1pm', venue: 'botany_bay', home: 'Hangover97', away: 'Lochbessmonster', color: '#FFE599', division: 'Division 3' },
      { day: 'wednesday', time: '12-1pm', venue: 'botany_bay', home: 'Hedley Burnley', away: 'Navier Stokes', color: '#F9CB9C', division: 'Division 2' },
      { day: 'thursday', time: '12-1pm', venue: 'botany_bay', home: 'The Screaming Goafers', away: 'FC TRISS', color: '#6AA84F', division: 'Mixed Division' },
      { day: 'friday', time: '12-1pm', venue: 'botany_bay', home: 'Ponzie Prowlers', away: 'Strokes Academy', color: '#D5A6BD', division: 'Division 7' },
      { day: 'wednesday', time: '2-3pm', venue: 'botany_bay', home: 'Goaldiggers fc', away: 'Ateltico Unatletico', color: '#D5A6BD', division: 'Division 7' },
      { day: 'thursday', time: '2-3pm', venue: 'botany_bay', home: 'Ø Zone', away: 'Reels Betis', color: '#B6D7A8', division: 'Division 4' },
      { day: 'tuesday', time: '3-4pm', venue: 'botany_bay', home: 'Unathletic Bilbao', away: 'Inter Milanagement', color: '#B6D7A8', division: 'Division 4' },
      { day: 'wednesday', time: '3-4pm', venue: 'botany_bay', home: 'Real MAldrid', away: 'The Stoppable Force', color: '#D5A6BD', division: 'Division 7' },
      { day: 'thursday', time: '3-4pm', venue: 'botany_bay', home: 'CSB FC', away: 'Sools fc', color: '#B6D7A8', division: 'Division 4' },
      { day: 'friday', time: '3-4pm', venue: 'botany_bay', home: 'Chicken Chasers', away: 'SpVgg F.K. Spartak Ussher 04', color: '#A4C2F4', division: 'Division 5' },
      { day: 'monday', time: '4-5pm', venue: 'botany_bay', home: 'Egg Fried Reus', away: 'Barely Athletic FC', color: '#EA9999', division: 'Division 1' },
      { day: 'tuesday', time: '4-5pm', venue: 'botany_bay', home: 'Buenos Aires ballers XI', away: 'Pav Furniture', color: '#FFE599', division: 'Division 3' },
      { day: 'wednesday', time: '4-5pm', venue: 'botany_bay', home: 'Coolock says Goal', away: 'TPSG', color: '#FFE599', division: 'Division 3' },
      { day: 'thursday', time: '4-5pm', venue: 'botany_bay', home: 'Mountjoy FC', away: 'Eng ballers', color: '#EA9999', division: 'Division 1' },
      { day: 'friday', time: '4-5pm', venue: 'botany_bay', home: 'Trin Tigers', away: 'Roman Empire', color: '#B4A7D6', division: 'Division 6' },
    ],
    slotOverrides: [
      { day: 'friday', time: '10-11am', venue: 'botany_bay', status: 'free' },
      { day: 'friday', time: '12-1pm', venue: 'hall_a', status: 'unavailable' },
      { day: 'friday', time: '12-1pm', venue: 'hall_b', status: 'unavailable' },
      { day: 'friday', time: '2-3pm', venue: 'botany_bay', status: 'free' },
      { day: 'friday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
      { day: 'friday', time: '9-10am', venue: 'botany_bay', status: 'free' },
      { day: 'monday', time: '11-12pm', venue: 'botany_bay', status: 'free' },
      { day: 'monday', time: '12-1pm', venue: 'hall_a', status: 'free' },
      { day: 'monday', time: '12-1pm', venue: 'hall_b', status: 'free' },
      { day: 'monday', time: '2-3pm', venue: 'botany_bay', status: 'free' },
      { day: 'monday', time: '3-4pm', venue: 'botany_bay', status: 'free' },
      { day: 'monday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
      { day: 'monday', time: '9-10am', venue: 'botany_bay', status: 'free' },
      { day: 'thursday', time: '12-1pm', venue: 'hall_a', status: 'free' },
      { day: 'thursday', time: '12-1pm', venue: 'hall_b', status: 'free' },
      { day: 'thursday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
      { day: 'thursday', time: '9-10am', venue: 'botany_bay', status: 'free' },
      { day: 'tuesday', time: '12-1pm', venue: 'hall_a', status: 'free' },
      { day: 'tuesday', time: '12-1pm', venue: 'hall_b', status: 'free' },
      { day: 'tuesday', time: '2-3pm', venue: 'botany_bay', status: 'free' },
      { day: 'tuesday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
      { day: 'wednesday', time: '12-1pm', venue: 'hall_a', status: 'unavailable' },
      { day: 'wednesday', time: '12-1pm', venue: 'hall_b', status: 'unavailable' },
      { day: 'wednesday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
      { day: 'wednesday', time: '9-10am', venue: 'botany_bay', status: 'free' },
    ],
  },
  {
    startsOn: '2026-10-05',
    tab: 'Week 2 5th',
    matches: [
      { day: 'tuesday', time: '9-10am', venue: 'botany_bay', home: 'The Stoppable Force', away: 'Ateltico Unatletico', color: '#D5A6BD', division: 'Division 7' },
      { day: 'thursday', time: '9-10am', venue: 'botany_bay', home: 'Choose Football', away: 'Pavillionaires', color: '#EA9999', division: 'Division 1' },
      { day: 'friday', time: '9-10am', venue: 'botany_bay', home: 'River dodder rodent', away: 'PBB FC', color: '#B4A7D6', division: 'Division 6' },
      { day: 'thursday', time: '10-11am', venue: 'botany_bay', home: 'Roman Empire', away: 'Hack Tuah', color: '#B4A7D6', division: 'Division 6' },
      { day: 'tuesday', time: '11-12pm', venue: 'botany_bay', home: 'Euro football studs', away: 'FC TRISS', color: '#6AA84F', division: 'Mixed Division' },
      { day: 'wednesday', time: '11-12pm', venue: 'botany_bay', home: 'The BESS Around', away: 'Liampool', color: '#F9CB9C', division: 'Division 2' },
      { day: 'thursday', time: '11-12pm', venue: 'botany_bay', home: 'The Fish Tank', away: 'CSB FC', color: '#B6D7A8', division: 'Division 4' },
      { day: 'friday', time: '11-12pm', venue: 'botany_bay', home: 'Strokes Academy', away: 'Ajaxidative Phosphorylation', color: '#D5A6BD', division: 'Division 7' },
      { day: 'tuesday', time: '12-1pm', venue: 'botany_bay', home: 'The Palpators 2.0', away: 'Iteam', color: '#A4C2F4', division: 'Division 5' },
      { day: 'wednesday', time: '12-1pm', venue: 'botany_bay', home: 'Real MAldrid', away: 'Ponzie Prowlers', color: '#D5A6BD', division: 'Division 7' },
      { day: 'friday', time: '12-1pm', venue: 'botany_bay', home: 'Dropouts FC', away: 'Hedley Burnley', color: '#F9CB9C', division: 'Division 2' },
      { day: 'monday', time: '2-3pm', venue: 'botany_bay', home: 'Wings of a Sparrow', away: 'Ctrl Alt Defeat', color: '#B4A7D6', division: 'Division 6' },
      { day: 'wednesday', time: '2-3pm', venue: 'botany_bay', home: 'TPSG', away: 'Hangover97', color: '#FFE599', division: 'Division 3' },
      { day: 'thursday', time: '2-3pm', venue: 'botany_bay', home: 'Ctrl Alt Defeat', away: 'Hack Tuah', color: '#B4A7D6', division: 'Division 6' },
      { day: 'friday', time: '2-3pm', venue: 'botany_bay', home: 'SpVgg F.K. Spartak Ussher 04', away: 'Himmy Saville', color: '#A4C2F4', division: 'Division 5' },
      { day: 'tuesday', time: '3-4pm', venue: 'botany_bay', home: 'Shabadoo Balompié Calcio', away: 'The Screaming Goafers', color: '#6AA84F', division: 'Mixed Division' },
      { day: 'wednesday', time: '3-4pm', venue: 'botany_bay', home: 'Visiting Ballers', away: 'Goaldiggers fc', color: '#D5A6BD', division: 'Division 7' },
      { day: 'thursday', time: '3-4pm', venue: 'botany_bay', home: 'Real Medrid', away: 'Reels Betis', color: '#B6D7A8', division: 'Division 4' },
      { day: 'friday', time: '3-4pm', venue: 'botany_bay', home: 'Barely Athletic FC', away: 'Eng ballers', color: '#EA9999', division: 'Division 1' },
      { day: 'tuesday', time: '4-5pm', venue: 'botany_bay', home: 'Integer Milan', away: 'Mountjoy FC', color: '#EA9999', division: 'Division 1' },
      { day: 'wednesday', time: '4-5pm', venue: 'botany_bay', home: 'Pavaria', away: 'East Cavan Gaels', color: '#F9CB9C', division: 'Division 2' },
      { day: 'thursday', time: '4-5pm', venue: 'botany_bay', home: 'Iteam', away: 'TBXI', color: '#A4C2F4', division: 'Division 5' },
      { day: 'monday', time: '12-1pm', venue: 'hall_a', home: 'The Palpators 2.0', away: 'Mauled by the trinners', color: '#A4C2F4', division: 'Division 5' },
      { day: 'tuesday', time: '12-1pm', venue: 'hall_a', home: 'Lochbessmonster', away: 'Buenos Aires ballers XI', color: '#FFE599', division: 'Division 3' },
      { day: 'thursday', time: '12-1pm', venue: 'hall_a', home: 'Ajaxidative Phosphorylation', away: 'Visiting Ballers', color: '#D5A6BD', division: 'Division 7' },
      { day: 'tuesday', time: '12-1pm', venue: 'hall_b', home: 'FC TRISS', away: 'Lionel MSISS', color: '#FFE599', division: 'Division 3' },
      { day: 'thursday', time: '12-1pm', venue: 'hall_b', home: 'Lads on toure', away: 'Navier Stokes', color: '#F9CB9C', division: 'Division 2' },
    ],
    slotOverrides: [
      { day: 'friday', time: '10-11am', venue: 'botany_bay', status: 'free' },
      { day: 'friday', time: '12-1pm', venue: 'hall_a', status: 'unavailable' },
      { day: 'friday', time: '12-1pm', venue: 'hall_b', status: 'unavailable' },
      { day: 'friday', time: '4-5pm', venue: 'botany_bay', status: 'free' },
      { day: 'friday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
      { day: 'monday', time: '10-11am', venue: 'botany_bay', status: 'free' },
      { day: 'monday', time: '11-12pm', venue: 'botany_bay', status: 'free' },
      { day: 'monday', time: '12-1pm', venue: 'botany_bay', status: 'free' },
      { day: 'monday', time: '12-1pm', venue: 'hall_b', status: 'free' },
      { day: 'monday', time: '3-4pm', venue: 'botany_bay', status: 'free' },
      { day: 'monday', time: '4-5pm', venue: 'botany_bay', status: 'free' },
      { day: 'monday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
      { day: 'monday', time: '9-10am', venue: 'botany_bay', status: 'free' },
      { day: 'thursday', time: '12-1pm', venue: 'botany_bay', status: 'free' },
      { day: 'thursday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
      { day: 'tuesday', time: '10-11am', venue: 'botany_bay', status: 'free' },
      { day: 'tuesday', time: '2-3pm', venue: 'botany_bay', status: 'free' },
      { day: 'tuesday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
      { day: 'wednesday', time: '10-11am', venue: 'botany_bay', status: 'free' },
      { day: 'wednesday', time: '12-1pm', venue: 'hall_a', status: 'unavailable' },
      { day: 'wednesday', time: '12-1pm', venue: 'hall_b', status: 'unavailable' },
      { day: 'wednesday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
      { day: 'wednesday', time: '9-10am', venue: 'botany_bay', status: 'free' },
    ],
  },
  {
    startsOn: '2026-10-12',
    tab: 'Week 3 12th',
    matches: [
      { day: 'monday', time: '9-10am', venue: 'botany_bay', home: 'Pavillionaires', away: 'Egg Fried Reus', color: '#EA9999', division: 'Division 1' },
      { day: 'tuesday', time: '9-10am', venue: 'botany_bay', home: 'Visiting Ballers', away: 'Strokes Academy', color: '#D5A6BD', division: 'Division 7' },
      { day: 'wednesday', time: '9-10am', venue: 'botany_bay', home: 'Coolock says Goal', away: 'Pav Furniture', color: '#FFE599', division: 'Division 3' },
      { day: 'thursday', time: '9-10am', venue: 'botany_bay', home: 'Inter Milanagement', away: 'Sools fc', color: '#B6D7A8', division: 'Division 4' },
      { day: 'friday', time: '9-10am', venue: 'botany_bay', home: 'Ponzie Prowlers', away: 'Ateltico Unatletico', color: '#D5A6BD', division: 'Division 7' },
      { day: 'monday', time: '10-11am', venue: 'botany_bay', home: 'Dropouts FC', away: 'Pavaria', color: '#F9CB9C', division: 'Division 2' },
      { day: 'tuesday', time: '10-11am', venue: 'botany_bay', home: 'East Cavan Gaels', away: 'The BESS Around', color: '#F9CB9C', division: 'Division 2' },
      { day: 'wednesday', time: '10-11am', venue: 'botany_bay', home: 'Cillian O Croinin', away: 'FC TRISS', color: '#FFE599', division: 'Division 3' },
      { day: 'thursday', time: '10-11am', venue: 'botany_bay', home: 'FC TRISS', away: 'Fiery Middle Aged Women', color: '#6AA84F', division: 'Mixed Division' },
      { day: 'friday', time: '10-11am', venue: 'botany_bay', home: 'SpVgg F.K. Spartak Ussher 04', away: 'TBXI', color: '#A4C2F4', division: 'Division 5' },
      { day: 'monday', time: '11-12pm', venue: 'botany_bay', home: 'The Athletics', away: 'git gud', color: '#6AA84F', division: 'Mixed Division' },
      { day: 'tuesday', time: '11-12pm', venue: 'botany_bay', home: 'Engibeering', away: 'Eng ballers', color: '#EA9999', division: 'Division 1' },
      { day: 'wednesday', time: '11-12pm', venue: 'botany_bay', home: 'The Screaming Goafers', away: 'Lawds and Bizches', color: '#6AA84F', division: 'Mixed Division' },
      { day: 'thursday', time: '11-12pm', venue: 'botany_bay', home: 'Ajaxidative Phosphorylation', away: 'Real MAldrid', color: '#D5A6BD', division: 'Division 7' },
      { day: 'friday', time: '11-12pm', venue: 'botany_bay', home: 'PBB FC', away: 'Trin Tigers', color: '#B4A7D6', division: 'Division 6' },
      { day: 'monday', time: '12-1pm', venue: 'botany_bay', home: 'Botany Baes', away: 'The Screaming Goafers', color: '#6AA84F', division: 'Mixed Division' },
      { day: 'tuesday', time: '12-1pm', venue: 'botany_bay', home: 'Integer Milan', away: 'Choose Life', color: '#EA9999', division: 'Division 1' },
      { day: 'wednesday', time: '12-1pm', venue: 'botany_bay', home: 'Hedley Burnley', away: 'Lads on toure', color: '#F9CB9C', division: 'Division 2' },
      { day: 'thursday', time: '12-1pm', venue: 'botany_bay', home: 'Mountjoy FC', away: 'Barely Athletic FC', color: '#EA9999', division: 'Division 1' },
      { day: 'friday', time: '12-1pm', venue: 'botany_bay', home: 'Liampool', away: 'Navier Stokes', color: '#F9CB9C', division: 'Division 2' },
      { day: 'monday', time: '2-3pm', venue: 'botany_bay', home: 'Goaldiggers fc', away: 'The Stoppable Force', color: '#D5A6BD', division: 'Division 7' },
      { day: 'tuesday', time: '2-3pm', venue: 'botany_bay', home: 'Lochbessmonster', away: 'TPSG', color: '#FFE599', division: 'Division 3' },
      { day: 'wednesday', time: '2-3pm', venue: 'botany_bay', home: 'Buenos Aires ballers XI', away: 'Lionel MSISS', color: '#FFE599', division: 'Division 3' },
      { day: 'thursday', time: '2-3pm', venue: 'botany_bay', home: 'CSB FC', away: 'Reels Betis', color: '#B6D7A8', division: 'Division 4' },
      { day: 'friday', time: '2-3pm', venue: 'botany_bay', home: 'MAMAs Revenge', away: 'Shabadoo Balompié Calcio', color: '#6AA84F', division: 'Mixed Division' },
      { day: 'monday', time: '3-4pm', venue: 'botany_bay', home: 'Unathletic Bilbao', away: 'The Fish Tank', color: '#B6D7A8', division: 'Division 4' },
      { day: 'tuesday', time: '3-4pm', venue: 'botany_bay', home: 'Wings of a Sparrow', away: 'River dodder rodent', color: '#B4A7D6', division: 'Division 6' },
      { day: 'wednesday', time: '3-4pm', venue: 'botany_bay', home: 'Iteam', away: 'Carling F.C.', color: '#A4C2F4', division: 'Division 5' },
      { day: 'thursday', time: '3-4pm', venue: 'botany_bay', home: 'Ø Zone', away: 'Real Medrid', color: '#B6D7A8', division: 'Division 4' },
      { day: 'monday', time: '4-5pm', venue: 'botany_bay', home: 'Ctrl Alt Defeat', away: 'Roman Empire', color: '#B4A7D6', division: 'Division 6' },
      { day: 'tuesday', time: '4-5pm', venue: 'botany_bay', home: 'Himmy Saville', away: 'Mauled by the trinners', color: '#A4C2F4', division: 'Division 5' },
      { day: 'wednesday', time: '4-5pm', venue: 'botany_bay', home: 'Chicken Chasers', away: 'The Palpators 2.0', color: '#A4C2F4', division: 'Division 5' },
      { day: 'thursday', time: '4-5pm', venue: 'botany_bay', home: 'HurriKanes', away: 'Hack Tuah', color: '#B4A7D6', division: 'Division 6' },
      { day: 'tuesday', time: '12-1pm', venue: 'hall_b', home: 'Fiery Middle Aged Women', away: 'MAMAs Revenge', color: '#6AA84F', division: 'Mixed Division' },
    ],
    slotOverrides: [
      { day: 'friday', time: '12-1pm', venue: 'hall_a', status: 'unavailable' },
      { day: 'friday', time: '12-1pm', venue: 'hall_b', status: 'unavailable' },
      { day: 'friday', time: '3-4pm', venue: 'botany_bay', status: 'free' },
      { day: 'friday', time: '4-5pm', venue: 'botany_bay', status: 'free' },
      { day: 'friday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
      { day: 'monday', time: '12-1pm', venue: 'hall_a', status: 'free' },
      { day: 'monday', time: '12-1pm', venue: 'hall_b', status: 'free' },
      { day: 'monday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
      { day: 'thursday', time: '12-1pm', venue: 'hall_a', status: 'free' },
      { day: 'thursday', time: '12-1pm', venue: 'hall_b', status: 'free' },
      { day: 'thursday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
      { day: 'tuesday', time: '12-1pm', venue: 'hall_a', status: 'free' },
      { day: 'tuesday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
      { day: 'wednesday', time: '12-1pm', venue: 'hall_a', status: 'unavailable' },
      { day: 'wednesday', time: '12-1pm', venue: 'hall_b', status: 'unavailable' },
      { day: 'wednesday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
    ],
  },
  {
    startsOn: '2026-10-19',
    tab: 'Week 4 19th',
    matches: [
      { day: 'monday', time: '9-10am', venue: 'botany_bay', home: 'Lionel MSISS', away: 'Coolock says Goal', color: '#FFE599', division: 'Division 3' },
      { day: 'tuesday', time: '9-10am', venue: 'botany_bay', home: 'The Fish Tank', away: 'Inter Milanagement', color: '#B6D7A8', division: 'Division 4' },
      { day: 'wednesday', time: '9-10am', venue: 'botany_bay', home: 'Fiery Middle Aged Women', away: 'The Screaming Goafers', color: '#6AA84F', division: 'Mixed Division' },
      { day: 'thursday', time: '9-10am', venue: 'botany_bay', home: 'FC TRISS', away: 'MAMAs Revenge', color: '#6AA84F', division: 'Mixed Division' },
      { day: 'friday', time: '9-10am', venue: 'botany_bay', home: 'The Stoppable Force', away: 'Ponzie Prowlers', color: '#D5A6BD', division: 'Division 7' },
      { day: 'monday', time: '10-11am', venue: 'botany_bay', home: 'TBXI', away: 'Himmy Saville', color: '#A4C2F4', division: 'Division 5' },
      { day: 'tuesday', time: '10-11am', venue: 'botany_bay', home: 'Euro football studs', away: 'Lawds and Bizches', color: '#6AA84F', division: 'Mixed Division' },
      { day: 'wednesday', time: '10-11am', venue: 'botany_bay', home: 'Lads on toure', away: 'Liampool', color: '#F9CB9C', division: 'Division 2' },
      { day: 'thursday', time: '10-11am', venue: 'botany_bay', home: 'The Palpators 2.0', away: 'SpVgg F.K. Spartak Ussher 04', color: '#A4C2F4', division: 'Division 5' },
      { day: 'friday', time: '10-11am', venue: 'botany_bay', home: 'Navier Stokes', away: 'East Cavan Gaels', color: '#F9CB9C', division: 'Division 2' },
      { day: 'monday', time: '11-12pm', venue: 'botany_bay', home: 'Roman Empire', away: 'HurriKanes', color: '#B4A7D6', division: 'Division 6' },
      { day: 'tuesday', time: '11-12pm', venue: 'botany_bay', home: 'Egg Fried Reus', away: 'Integer Milan', color: '#EA9999', division: 'Division 1' },
      { day: 'wednesday', time: '11-12pm', venue: 'botany_bay', home: 'Choose Life', away: 'Mountjoy FC', color: '#EA9999', division: 'Division 1' },
      { day: 'thursday', time: '11-12pm', venue: 'botany_bay', home: 'Real Medrid', away: 'CSB FC', color: '#B6D7A8', division: 'Division 4' },
      { day: 'friday', time: '11-12pm', venue: 'botany_bay', home: 'Reels Betis', away: 'Unathletic Bilbao', color: '#B6D7A8', division: 'Division 4' },
      { day: 'monday', time: '12-1pm', venue: 'botany_bay', home: 'Hack Tuah', away: 'PBB FC', color: '#B4A7D6', division: 'Division 6' },
      { day: 'tuesday', time: '12-1pm', venue: 'botany_bay', home: 'Barely Athletic FC', away: 'Engibeering', color: '#EA9999', division: 'Division 1' },
      { day: 'wednesday', time: '12-1pm', venue: 'botany_bay', home: 'Real MAldrid', away: 'Visiting Ballers', color: '#D5A6BD', division: 'Division 7' },
      { day: 'thursday', time: '12-1pm', venue: 'botany_bay', home: 'git gud', away: 'Shabadoo Balompié Calcio', color: '#6AA84F', division: 'Mixed Division' },
      { day: 'friday', time: '12-1pm', venue: 'botany_bay', home: 'The BESS Around', away: 'Dropouts FC', color: '#F9CB9C', division: 'Division 2' },
      { day: 'monday', time: '2-3pm', venue: 'botany_bay', home: 'Pav Furniture', away: 'Cillian O Croinin', color: '#FFE599', division: 'Division 3' },
      { day: 'tuesday', time: '2-3pm', venue: 'botany_bay', home: 'Mauled by the trinners', away: 'Iteam', color: '#A4C2F4', division: 'Division 5' },
      { day: 'wednesday', time: '2-3pm', venue: 'botany_bay', home: 'FC TRISS', away: 'Lochbessmonster', color: '#FFE599', division: 'Division 3' },
      { day: 'thursday', time: '2-3pm', venue: 'botany_bay', home: 'Ateltico Unatletico', away: 'Ajaxidative Phosphorylation', color: '#D5A6BD', division: 'Division 7' },
      { day: 'friday', time: '2-3pm', venue: 'botany_bay', home: 'Botany Baes', away: 'The Athletics', color: '#6AA84F', division: 'Mixed Division' },
      { day: 'monday', time: '3-4pm', venue: 'botany_bay', home: 'River dodder rodent', away: 'Ctrl Alt Defeat', color: '#B4A7D6', division: 'Division 6' },
      { day: 'tuesday', time: '3-4pm', venue: 'botany_bay', home: 'TPSG', away: 'Buenos Aires ballers XI', color: '#FFE599', division: 'Division 3' },
      { day: 'wednesday', time: '3-4pm', venue: 'botany_bay', home: 'Pavaria', away: 'Hedley Burnley', color: '#F9CB9C', division: 'Division 2' },
      { day: 'thursday', time: '3-4pm', venue: 'botany_bay', home: 'Trin Tigers', away: 'Wings of a Sparrow', color: '#B4A7D6', division: 'Division 6' },
      { day: 'monday', time: '4-5pm', venue: 'botany_bay', home: 'Eng ballers', away: 'Pavillionaires', color: '#EA9999', division: 'Division 1' },
      { day: 'tuesday', time: '4-5pm', venue: 'botany_bay', home: 'Strokes Academy', away: 'Goaldiggers fc', color: '#D5A6BD', division: 'Division 7' },
      { day: 'wednesday', time: '4-5pm', venue: 'botany_bay', home: 'Carling F.C.', away: 'Chicken Chasers', color: '#A4C2F4', division: 'Division 5' },
      { day: 'thursday', time: '4-5pm', venue: 'botany_bay', home: 'Sools fc', away: 'Ø Zone', color: '#B6D7A8', division: 'Division 4' },
    ],
    slotOverrides: [
      { day: 'friday', time: '12-1pm', venue: 'hall_a', status: 'unavailable' },
      { day: 'friday', time: '12-1pm', venue: 'hall_b', status: 'unavailable' },
      { day: 'friday', time: '3-4pm', venue: 'botany_bay', status: 'free' },
      { day: 'friday', time: '4-5pm', venue: 'botany_bay', status: 'free' },
      { day: 'friday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
      { day: 'monday', time: '12-1pm', venue: 'hall_a', status: 'free' },
      { day: 'monday', time: '12-1pm', venue: 'hall_b', status: 'free' },
      { day: 'monday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
      { day: 'thursday', time: '12-1pm', venue: 'hall_a', status: 'free' },
      { day: 'thursday', time: '12-1pm', venue: 'hall_b', status: 'free' },
      { day: 'thursday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
      { day: 'tuesday', time: '12-1pm', venue: 'hall_a', status: 'free' },
      { day: 'tuesday', time: '12-1pm', venue: 'hall_b', status: 'free' },
      { day: 'tuesday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
      { day: 'wednesday', time: '12-1pm', venue: 'hall_a', status: 'unavailable' },
      { day: 'wednesday', time: '12-1pm', venue: 'hall_b', status: 'unavailable' },
      { day: 'wednesday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
    ],
  },
]
/* SHEET-WEEKS:END */

function slotId(weekId, day, time, venue) {
  return `${weekId}-${day}-${time}-${venue}`.replaceAll(' ', '')
}

export function buildFixtures(weekId, matches, slotOverrides = []) {
  const fixtures = []
  const matchKey = (day, time, venue) => `${day}|${time}|${venue}`
  const matchMap = new Map(
    matches.map((match) => [matchKey(match.day, match.time, match.venue), match]),
  )
  const overrideMap = new Map(
    slotOverrides.map((slot) => [matchKey(slot.day, slot.time, slot.venue), slot.status]),
  )

  for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']) {
    for (const time of [
      '8-9am',
      '9-10am',
      '10-11am',
      '11-12pm',
      '12-1pm',
      '1-2pm',
      '2-3pm',
      '3-4pm',
      '4-5pm',
    ]) {
      if (time === '1-2pm') {
        fixtures.push({
          id: slotId(weekId, day, time, 'botany_bay'),
          weekId,
          day,
          time,
          venue: 'botany_bay',
          status: 'unavailable',
        })
        continue
      }

      const match = matchMap.get(matchKey(day, time, 'botany_bay'))
      if (match) {
        fixtures.push({
          ...match,
          id: slotId(weekId, day, time, 'botany_bay'),
          weekId,
          status: 'match',
        })
      } else {
        const override = overrideMap.get(matchKey(day, time, 'botany_bay'))
        let status = override
        if (!status) {
          status = day === 'thursday' || day === 'friday' ? 'unavailable' : 'free'
        }
        fixtures.push({
          id: slotId(weekId, day, time, 'botany_bay'),
          weekId,
          day,
          time,
          venue: 'botany_bay',
          status,
        })
      }
    }
  }

  const hallMatches = matches.filter(
    (match) => match.venue === 'hall_a' || match.venue === 'hall_b',
  )

  for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']) {
    for (const venue of ['hall_a', 'hall_b']) {
      const time = '12-1pm'
      const group = hallMatches.filter(
        (match) => match.day === day && match.venue === venue && match.time === time,
      )
      if (group.length) {
        group.forEach((match, index) => {
          fixtures.push({
            ...match,
            id: `${slotId(weekId, day, time, venue)}${group.length > 1 ? `-${index}` : ''}`,
            weekId,
            status: 'match',
          })
        })
      } else {
        const override = overrideMap.get(matchKey(day, time, venue))
        const fallback = day === 'wednesday' || day === 'friday' ? 'unavailable' : 'free'
        fixtures.push({
          id: slotId(weekId, day, time, venue),
          weekId,
          day,
          time,
          venue,
          status: override || fallback,
        })
      }
    }
  }

  return fixtures
}

/** Default grid for weeks that have not been filled in yet. */
export function buildEmptyWeekFixtures(weekId) {
  const fixtures = []
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  const times = [
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

  for (const day of days) {
    for (const time of times) {
      const closed = time === '1-2pm' || time === '8-9am'
      fixtures.push({
        id: slotId(weekId, day, time, 'botany_bay'),
        weekId,
        day,
        time,
        venue: 'botany_bay',
        status: closed ? 'unavailable' : 'free',
      })
    }
    for (const venue of ['hall_a', 'hall_b']) {
      const closed = day === 'wednesday' || day === 'friday'
      fixtures.push({
        id: slotId(weekId, day, '12-1pm', venue),
        weekId,
        day,
        time: '12-1pm',
        venue,
        status: closed ? 'unavailable' : 'free',
      })
    }
  }

  return fixtures
}

export const seedWeeks = [...WEEKS]
  .sort((a, b) => a.startsOn.localeCompare(b.startsOn))
  .map((entry) => {
    const startsOn = entry.startsOn
    const isCurrent = startsOn === currentWeekMonday()
    const rangeLabel = formatWeekRange(startsOn)
    return {
      week: {
        id: startsOn,
        label: isCurrent ? 'Current week' : rangeLabel,
        rangeLabel,
        startsOn,
        isCurrent,
        tab: entry.tab,
      },
      fixtures: buildFixtures(startsOn, entry.matches, entry.slotOverrides),
    }
  })

const monday = currentWeekMonday()
const currentEntry =
  seedWeeks.find((entry) => entry.week.startsOn === monday) || seedWeeks[0] || null

export const seedWeek = currentEntry?.week || {
  id: monday,
  label: 'Current week',
  rangeLabel: formatWeekRange(monday),
  startsOn: monday,
  isCurrent: true,
}

export const seedFixtures = currentEntry?.fixtures || buildEmptyWeekFixtures(seedWeek.id)

/** Weeks before the current Monday — used for results / tables. */
export const pastWeeks = seedWeeks.filter((entry) => entry.week.startsOn < monday)
