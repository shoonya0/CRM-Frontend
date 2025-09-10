import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LeadsList from "./pages/LeadsList";
import ConversionRate from "./pages/ConversionRate";
import LeadDetail from "./pages/LeadDetail";
import LeadEdit from "./pages/LeadEdit";
import UsersList from "./pages/UsersList";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/leads" element={
              <ProtectedRoute>
                <Layout><LeadsList /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/leads/my" element={
              <ProtectedRoute>
                <Layout><LeadsList filter="my" /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/leads/new-leads" element={
              <ProtectedRoute>
                <Layout><LeadsList filter="new" /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/leads/qualified" element={
              <ProtectedRoute>
                <Layout><LeadsList filter="qualified" /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/leads/conversion-rate" element={
              <ProtectedRoute>
                <Layout><ConversionRate /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/leads/new" element={
              <ProtectedRoute adminOnly>
                <Layout><LeadEdit /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/leads/:id" element={
              <ProtectedRoute>
                <Layout><LeadDetail /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/leads/:id/edit" element={
              <ProtectedRoute>
                <Layout><LeadEdit /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute adminOnly>
                <Layout><UsersList /></Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
