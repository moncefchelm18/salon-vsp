# Sallon Picasso - Luxury Barbershop Management System

A modern, full-featured barbershop management application built with Vite React. Manage clients, barbers, services, payments, and generate detailed financial reports.

## Features

### Receptionist Dashboard
- **Dashboard Overview**: View key metrics (total barbers, pending tickets, completed services)
- **Ticket Management**: Create and manage service tickets for clients
- **Client Management**: Add, view, and manage client information
- **Payment Tracking**: Record and track all payments with revenue analytics
- **Financial Reports**: View detailed charts and reports on revenue and service distribution

### Barber Interface
- **Barber Login**: Secure PIN-based authentication for each barber
- **Queue Management**: View pending tickets and current service status
- **Service Selection**: Choose services and add optional products
- **Receipt Generation**: Complete services and generate receipts

## Project Structure

\`\`\`
src/
├── main.jsx                 # Entry point
├── App.jsx                  # Main router configuration
├── index.css               # Global styles
├── pages/
│   ├── Login.jsx           # Login page
│   ├── Receptionist.jsx    # Receptionist page
│   └── Barber.jsx          # Barber page
├── components/
│   ├── LoginForm.jsx       # Login form component
│   ├── receptionist/
│   │   ├── ReceptionistLayout.jsx
│   │   ├── ReceptionistDashboard.jsx
│   │   ├── ClientsManager.jsx
│   │   ├── PaymentsManager.jsx
│   │   └── ReportsView.jsx
│   └── barber/
│       ├── BarberLayout.jsx
│       ├── BarberLogin.jsx
│       └── BarberQueue.jsx
├── context/
│   └── AuthContext.jsx     # Authentication context
└── lib/
    └── mockData.js         # Mock data for demo
\`\`\`

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd sallon-picasso
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Start the development server
\`\`\`bash
npm run dev
\`\`\`

The app will open at `http://localhost:3000`

### Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

## Demo Credentials

### Receptionist Login
- **Email**: receptionist@gmail.com
- **PIN**: 0000

### Barber Login
- **Email**: barbers@gmail.com
- **PIN**: 0000

#### Barber PINs
- **Marco**: 1234
- **Antonio**: 5678
- **Giuseppe**: 9012

## Technology Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Context API

## Features Overview

### Mock Data
All data is stored in component state using mock data. The app demonstrates:
- Client management with CRUD operations
- Ticket creation and status tracking
- Payment recording and revenue calculation
- Service and product selection
- Real-time queue management

### Design
- Premium dark theme with warm gold accents
- Responsive layout for desktop and tablet
- Smooth transitions and hover effects
- Professional typography with serif headings

## Future Enhancements

- Backend API integration
- Real database (MongoDB/PostgreSQL)
- User authentication with JWT
- Real-time updates with WebSockets
- Thermal printer integration
- Email notifications
- Advanced reporting and analytics

## License

MIT
