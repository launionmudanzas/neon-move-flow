import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import MiFleteLanding from "./pages/MiFleteLanding.tsx";
import AdminMiFleteLeads from "./pages/AdminMiFleteLeads.tsx";
import Auth from "./pages/Auth.tsx";
import Cuenta from "./pages/Cuenta.tsx";
import Admin from "./pages/Admin.tsx";
import AdminRutas from "./pages/AdminRutas.tsx";
import AdminCRM from "./pages/AdminCRM.tsx";
import AdminProveedores from "./pages/AdminProveedores.tsx";
import AdminMarketplace from "./pages/AdminMarketplace.tsx";
import AdminServicios from "./pages/AdminServicios.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminIncidencias from "./pages/AdminIncidencias.tsx";
import AdminSeguimientos from "./pages/AdminSeguimientos.tsx";
import AdminCiudades from "./pages/AdminCiudades.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import PortalProveedor from "./pages/PortalProveedor.tsx";
import TerminosCondiciones from "./pages/TerminosCondiciones.tsx";
import AvisoPrivacidad from "./pages/AvisoPrivacidad.tsx";
import NotFound from "./pages/NotFound.tsx";
import OrdenPublica from "./pages/OrdenPublica.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/mi-flete" element={<MiFleteLanding />} />
            <Route path="/admin/mi-flete-leads" element={<AdminMiFleteLeads />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/cuenta" element={<Cuenta />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/rutas" element={<AdminRutas />} />
            <Route path="/admin/crm" element={<AdminCRM />} />
            <Route path="/admin/proveedores" element={<AdminProveedores />} />
            <Route path="/admin/marketplace" element={<AdminMarketplace />} />
            <Route path="/admin/servicios" element={<AdminServicios />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/incidencias" element={<AdminIncidencias />} />
            <Route path="/admin/seguimientos" element={<AdminSeguimientos />} />
            <Route path="/admin/ciudades" element={<AdminCiudades />} />
            <Route path="/portal-proveedor" element={<PortalProveedor />} />
            <Route path="/terminos-y-condiciones" element={<TerminosCondiciones />} />
            <Route path="/aviso-de-privacidad" element={<AvisoPrivacidad />} />
            <Route path="/orden/:folio" element={<OrdenPublica />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
