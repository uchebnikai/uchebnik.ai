import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './Layout';
import { Home } from './pages/Home';
import { Chat } from './pages/Chat';

export const App = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/chat/:subjectId" element={<Chat />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
};