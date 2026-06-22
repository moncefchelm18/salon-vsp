import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AppRoutes from "./routes/realIndex";
import { AuthProvider } from "./context/AuthContext"; // <-- IMPORT IT HERE

export default function App() {
  return (
    <div style={{ fontFamily: "'RBNo3.1', sans-serif" }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            // lighter background for better contrast with dark mode
            background: "#333",
            color: "#fff",
            borderRadius: "0px",
            fontSize: "14px",
          },
          success: {
            iconTheme: { primary: "#fbbf24", secondary: "#fff" },
          },
        }}
      />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}
