import type { Customer } from '../types';

export const customers: Customer[] = [
{
  id: 'C-1001', name: 'Ananya Mehra', mobile: '+91 98110 24567', whatsapp: '+91 98110 24567', whatsappAvailable: true,
  email: 'ananya.mehra@gmail.com', city: 'New Delhi', since: '2024-02-14', tier: 'VIP', designer: 'Nisha Arora',
  preferences: ['Pastel and jewel tones', 'Heavy zardozi', 'Deep back necklines', 'Saturday morning trials'],
  notes: 'Wedding on 18 Oct. Sister Ira is also a client. Prefers WhatsApp voice notes over calls.', remote: false, behaviour: 'Particular',
  measurementProfiles: [
  { id: 'MP-1001-A', label: 'Blouse — Wedding 2026', category: 'Blouse', source: 'Designer', verified: true, takenBy: 'Nisha Arora', date: '2026-09-21', values: { Shoulder: 14.5, Bust: 34, 'Under Bust': 29, Waist: 28, 'Blouse Length': 14, 'Sleeve Length': 10, 'Sleeve Round': 11, Armhole: 16, 'Front Neck Depth': 7, 'Back Neck Depth': 9 } },
  { id: 'MP-1001-B', label: 'Lehenga — Wedding 2026', category: 'Lehenga', source: 'Designer', verified: true, takenBy: 'Nisha Arora', date: '2026-09-21', values: { Waist: 28, Hip: 38, Length: 41, Flare: 120 } }]

},
{
  id: 'C-1002', name: 'Rohan Kapoor', mobile: '+91 98731 55021', whatsapp: '+91 98731 55021', whatsappAvailable: true,
  email: 'rohan.kapoor@outlook.com', city: 'Gurugram', since: '2025-01-09', tier: 'Returning', designer: 'Aarav Bedi',
  preferences: ['Structured shoulders', 'Muted metallics'], notes: 'Groom. Reception look pending decision.', remote: false, behaviour: 'Easy-going',
  measurementProfiles: [
  { id: 'MP-1002-A', label: 'Sherwani', category: 'Sherwani', source: 'Designer', verified: true, takenBy: 'Aarav Bedi', date: '2026-09-28', values: { Shoulder: 18, Chest: 40, Waist: 34, Hip: 39, Length: 42, 'Sleeve Length': 25, Neck: 15.5, Bicep: 13 } },
  { id: 'MP-1002-B', label: 'Kurta', category: 'Kurta', source: 'Profile', verified: true, takenBy: 'Aarav Bedi', date: '2026-09-28', values: { Shoulder: 18, Chest: 40, Waist: 34, Hip: 39, 'Kurta Length': 40, 'Sleeve Length': 25, Armhole: 19, Neck: 15.5 } }]

},
{
  id: 'C-1003', name: 'Kavya Iyer', mobile: '+91 99100 73314', whatsapp: '+91 99100 73314', whatsappAvailable: true,
  email: 'kavya.iyer@gmail.com', city: 'Noida', since: '2025-06-22', tier: 'Returning', designer: 'Nisha Arora',
  preferences: ['Flowy silhouettes', 'Minimal sleeves'], notes: '', remote: false, behaviour: 'Easy-going',
  measurementProfiles: [
  { id: 'MP-1003-A', label: 'Anarkali', category: 'Anarkali', source: 'Designer', verified: true, takenBy: 'Nisha Arora', date: '2026-09-24', values: { Shoulder: 14, Bust: 33, Waist: 27, 'Yoke Length': 13, 'Full Length': 56, Flare: 180, 'Sleeve Length': 6, Armhole: 15.5 } }]

},
{
  id: 'C-1004', name: 'Meera Shah', mobile: '+91 98101 88902', whatsapp: '+91 98101 88902', whatsappAvailable: true,
  email: 'meera.shah@yahoo.in', city: 'New Delhi', since: '2023-11-02', tier: 'Returning', designer: 'Tanvi Kohli',
  preferences: ['Saree blouses', 'Elbow sleeves'], notes: 'Fit around the bust has needed adjustment twice before.', remote: false, behaviour: 'Demanding',
  measurementProfiles: [
  { id: 'MP-1004-A', label: 'Saree blouse', category: 'Blouse', source: 'Sample garment', verified: true, takenBy: 'Tanvi Kohli', date: '2026-09-15', values: { Shoulder: 15, Bust: 37, 'Under Bust': 32, Waist: 31, 'Blouse Length': 15, 'Sleeve Length': 11, 'Sleeve Round': 12.5, Armhole: 17, 'Front Neck Depth': 6.5, 'Back Neck Depth': 8 } }]

},
{
  id: 'C-1005', name: 'Priya Nair', mobile: '+91 97170 40211', whatsapp: '+91 97170 40211', whatsappAvailable: true,
  email: 'priya.nair@gmail.com', city: 'New Delhi', since: '2026-10-06', tier: 'New', designer: 'Aarav Bedi',
  preferences: [], notes: 'Needs kurta for a work event on 9 Oct evening.', remote: false, behaviour: 'Easy-going',
  measurementProfiles: [
  { id: 'MP-1005-A', label: 'Kurta', category: 'Kurta', source: 'Designer', verified: true, takenBy: 'Aarav Bedi', date: '2026-10-06', values: { Shoulder: 14, Chest: 34, Waist: 29, Hip: 37, 'Kurta Length': 38, 'Sleeve Length': 22, Armhole: 16, Neck: 13.5 } }]

},
{
  id: 'C-1006', name: 'Ishaan Malhotra', mobile: '+91 98990 12876', whatsapp: '', whatsappAvailable: false,
  email: 'ishaan.m@gmail.com', city: 'New Delhi', since: '2025-03-18', tier: 'Returning', designer: 'Aarav Bedi',
  preferences: ['Slim fit'], notes: 'No WhatsApp — send SMS and email only.', remote: false, behaviour: 'Particular',
  measurementProfiles: [
  { id: 'MP-1006-A', label: 'Bandhgala', category: 'Bandhgala', source: 'Designer', verified: true, takenBy: 'Aarav Bedi', date: '2026-09-12', values: { Shoulder: 17.5, Chest: 39, Waist: 33, Hip: 38, Length: 30, 'Sleeve Length': 24.5, Neck: 15, Bicep: 12.5 } }]

},
{
  id: 'C-1007', name: 'Zoya Khan', mobile: '+91 99580 64420', whatsapp: '+91 99580 64420', whatsappAvailable: true,
  email: 'zoya.khan@gmail.com', city: 'Gurugram', since: '2026-09-19', tier: 'New', designer: 'Tanvi Kohli',
  preferences: ['Velvet', 'Off-shoulder'], notes: '', remote: false, behaviour: 'Difficult',
  measurementProfiles: [
  { id: 'MP-1007-A', label: 'Gown', category: 'Gown', source: 'Designer', verified: true, takenBy: 'Tanvi Kohli', date: '2026-09-19', values: { Shoulder: 14, Bust: 34, Waist: 27, Hip: 37, 'Full Length': 60, 'Sleeve Length': 0 } }]

},
{
  id: 'C-1008', name: 'Nikhil Rao', mobile: '+91 98186 30097', whatsapp: '+91 98186 30097', whatsappAvailable: true,
  email: 'nikhil.rao@gmail.com', city: 'New Delhi', since: '2026-10-05', tier: 'New', designer: 'Aarav Bedi',
  preferences: [], notes: '', remote: false,
  measurementProfiles: [
  { id: 'MP-1008-A', label: 'Kurta set', category: 'Kurta', source: 'Designer', verified: true, takenBy: 'Aarav Bedi', date: '2026-10-05', values: { Shoulder: 17.5, Chest: 38, Waist: 33, Hip: 38, 'Kurta Length': 39, 'Sleeve Length': 24, Armhole: 18.5, Neck: 15 } }]

},
{
  id: 'C-1009', name: "Sara D'Souza", mobile: '+971 50 418 2290', whatsapp: '+971 50 418 2290', whatsappAvailable: true,
  email: 'sara.dsouza@gmail.com', city: 'Dubai, UAE', since: '2026-09-02', tier: 'New', designer: 'Nisha Arora',
  preferences: ['Light organza', 'Lightweight for travel'], notes: 'International client. Measurements self-submitted, verified over video call.', remote: true, behaviour: 'Particular',
  measurementProfiles: [
  { id: 'MP-1009-A', label: 'Lehenga — remote', category: 'Lehenga', source: 'Customer', verified: true, takenBy: "Sara D'Souza", date: '2026-09-10', values: { Waist: 27, Hip: 36, Length: 40, Flare: 110 } }]

},
{
  id: 'C-1010', name: 'Tara Bhatia', mobile: '+91 99711 20348', whatsapp: '+91 99711 20348', whatsappAvailable: true,
  email: 'tara.bhatia@gmail.com', city: 'New Delhi', since: '2026-09-27', tier: 'New', designer: 'Tanvi Kohli',
  preferences: ['Linen', 'Relaxed fits'], notes: '', remote: false, behaviour: 'Easy-going',
  measurementProfiles: [
  { id: 'MP-1010-A', label: 'Kurta', category: 'Kurta', source: 'Designer', verified: true, takenBy: 'Tanvi Kohli', date: '2026-09-27', values: { Shoulder: 14, Chest: 35, Waist: 30, Hip: 39, 'Kurta Length': 42, 'Sleeve Length': 21, Armhole: 16, Neck: 13.5 } }]

}];