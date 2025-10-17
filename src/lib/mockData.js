export const mockBarbers = [
  {
    id: 1,
    name: "Marco",
    status: "busy",
    pin: "1234",
    image: "https://i.pravatar.cc/150?u=marco",
  },
  {
    id: 2,
    name: "Antonio",
    status: "available",
    pin: "5678",
    image: "https://i.pravatar.cc/150?u=antonio",
  },
  {
    id: 3,
    name: "Giuseppe",
    status: "busy",
    pin: "9012",
    image: "https://i.pravatar.cc/150?u=giuseppe",
  },
];

export const mockServices = [
  {
    id: 1,
    name: "Classic Haircut",
    price: 25,
    duration: 30,
    image: "https://picsum.photos/id/237/400/300",
  },
  {
    id: 2,
    name: "Fade Haircut",
    price: 30,
    duration: 45,
    image: "https://picsum.photos/id/236/400/300",
  },
  {
    id: 3,
    name: "Beard Trim",
    price: 15,
    duration: 20,
    image: "https://picsum.photos/id/235/400/300",
  },
  {
    id: 4,
    name: "Full Grooming",
    price: 50,
    duration: 60,
    image: "https://picsum.photos/id/234/400/300",
  },
];

export const mockProducts = [
  {
    id: 1,
    name: "Matte Pomade",
    salePrice: 18,
    costPerUse: 0.5,
    stock: 42,
    image: "https://picsum.photos/id/233/400/300",
  },
  {
    id: 2,
    name: "Beard Oil",
    salePrice: 22,
    costPerUse: 0.75,
    stock: 35,
    image: "https://picsum.photos/id/232/400/300",
  },
  {
    id: 3,
    name: "Sea Salt Spray",
    salePrice: 15,
    costPerUse: 0.4,
    stock: 50,
    image: "https://picsum.photos/id/231/400/300",
  },
];

export const mockClients = [
  { id: 1, name: "John Doe", phone: "555-0101", lastVisit: "2025-10-10" },
  { id: 2, name: "Michael Smith", phone: "555-0102", lastVisit: "2025-10-08" },
  { id: 3, name: "David Johnson", phone: "555-0103", lastVisit: "2025-10-05" },
  {
    id: 4,
    name: "Robert Williams",
    phone: "555-0104",
    lastVisit: "2025-09-28",
  },
];

export const mockTickets = [
  {
    id: 101,
    clientName: "John Doe",
    service: "Classic Haircut",
    barber: "Marco",
    status: "completed",
    time: "10:30",
  },
  {
    id: 102,
    clientName: "Michael Smith",
    service: "Fade Haircut",
    barber: "Giuseppe",
    status: "in-progress",
    time: "11:00",
  },
  {
    id: 103,
    clientName: "David Johnson",
    service: "",
    barber: "Giuseppe",
    status: "waiting",
    time: "11:30",
  },
  // Add this new ticket to test the payment flow
  {
    id: 104,
    clientName: "Robert Brown",
    service: "Full Grooming",
    barber: "Antonio",
    status: "ready-to-pay",
    time: "12:15",
  },
];
