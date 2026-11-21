import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal, SearchModal, ToastStack } from './components/UI';
import { HomePage } from './pages/HomePage';
import { ListingsPage } from './pages/ListingsPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import {
  ProjectsPage,
  AboutPage,
  ServicesPage,
  BlogPage,
  BlogDetailPage,
  ContactPage,
  LegalPage,
} from './pages/ContentPages';
import { ListPropertyPage, AccountPage } from './pages/UserPages';
import { AdminPage } from './pages/AdminPage';

const AppRouter: React.FC = () => {
  const { path } = useApp();

  if (path === '/admin' || path.startsWith('/admin/')) {
    return (
      <>
        <AdminPage />
        <ToastStack />
      </>
    );
  }

  let page: React.ReactNode = <HomePage />;

  if (path === '/listings') {
    page = <ListingsPage />;
  } else if (path.startsWith('/property/')) {
    const slugOrId = path.replace('/property/', '').split('/')[0];
    page = <PropertyDetailPage slugOrId={slugOrId} />;
  } else if (path === '/projects') {
    page = <ProjectsPage />;
  } else if (path === '/about') {
    page = <AboutPage />;
  } else if (path === '/services') {
    page = <ServicesPage />;
  } else if (path === '/blog') {
    page = <BlogPage />;
  } else if (path.startsWith('/blog/')) {
    const slug = path.replace('/blog/', '').split('/')[0];
    page = <BlogDetailPage slug={slug} />;
  } else if (path === '/contact') {
    page = <ContactPage />;
  } else if (path === '/privacy') {
    page = <LegalPage mode="privacy" />;
  } else if (path === '/terms') {
    page = <LegalPage mode="terms" />;
  } else if (path === '/list-property') {
    page = <ListPropertyPage />;
  } else if (path === '/account') {
    page = <AccountPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1A2433]">
      <Navbar />
      <main className="flex-1">{page}</main>
      <Footer />
      <AuthModal />
      <SearchModal />
      <ToastStack />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
