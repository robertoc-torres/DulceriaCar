import { Route, Switch } from "wouter";
import { OrderProvider } from "@/context/OrderContext";
import HomePage from "@/pages/HomePage";
import ConfiguradorPage from "@/pages/ConfiguradorPage";
import ArtePage from "@/pages/ArtePage";
import CotizacionPage from "@/pages/CotizacionPage";
import ConfirmacionPage from "@/pages/ConfirmacionPage";
import GaleriaPage from "@/pages/GaleriaPage";
import PedidosPage from "@/pages/PedidosPage";
import ContactoPage from "@/pages/ContactoPage";
import CondicionesPage from "@/pages/CondicionesPage";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminConfigPage from "@/pages/admin/AdminConfigPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <div className="app-shell">
      <OrderProvider>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/configurador" component={ConfiguradorPage} />
          <Route path="/arte" component={ArtePage} />
          <Route path="/cotizacion" component={CotizacionPage} />
          <Route path="/confirmacion" component={ConfirmacionPage} />
          <Route path="/galeria-etiquetas" component={GaleriaPage} />
          <Route path="/pedidos-anteriores" component={PedidosPage} />
          <Route path="/contacto" component={ContactoPage} />
          <Route path="/condiciones" component={CondicionesPage} />
          <Route path="/admin/login" component={AdminLoginPage} />
          <Route path="/admin/config" component={AdminConfigPage} />
          <Route path="/admin" component={AdminConfigPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </OrderProvider>
    </div>
  );
}
