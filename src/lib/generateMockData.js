import { startOfYear, endOfYear, subDays, formatISO } from 'date-fns';
import { mockServices } from './mockData'; // Assuming other data is in a separate file

// Helper to generate a random date within a range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// --- THIS FUNCTION WILL CREATE A RICH DATASET FOR OUR REPORTS ---
export const generateRealisticTickets = () => {
  const barbers = [{ name: 'Marco' }, { name: 'Antonio' }, { name: 'Giuseppe' }];
  const clients = ['John D.', 'Mike S.', 'Robert B.', 'David J.', 'Chris L.', 'James P.'];

  let tickets = [];
  const start = startOfYear(new Date());
  const end = new Date(); // Today

  for (let i = 0; i < 200; i++) { // Generate 200 completed transactions for the year
    const barber = barbers[Math.floor(Math.random() * barbers.length)];
    const client = clients[Math.floor(Math.random() * clients.length)];
    const service = mockServices[Math.floor(Math.random() * mockServices.length)];
    const date = randomDate(start, end);

    tickets.push({
      id: 200 + i,
      clientName: client,
      barber: barber.name,
      service: service.name,
      status: 'completed',
      createdAt: formatISO(date), // Using a standard date format
    });
  }

  // Ensure there are some tickets for today and this week for testing
  for (let i = 0; i < 5; i++) {
     const today = new Date();
     tickets.push({
      id: 400 + i,
      clientName: clients[i],
      barber: barbers[i % 3].name,
      service: mockServices[i % 4].name,
      status: 'completed',
      createdAt: formatISO(subDays(today, Math.floor(Math.random() * 2))), // Last couple of days
    });
  }
  
  return tickets;
};