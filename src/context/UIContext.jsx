import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const location = useLocation();

    // Auto-close mobile sidebar on route change
    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [location.pathname]);

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
    const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);
    const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

    return (
        <UIContext.Provider
            value={{
                isSidebarCollapsed,
                isMobileSidebarOpen,
                toggleSidebar,
                toggleMobileSidebar,
                closeMobileSidebar,
                setIsSidebarCollapsed
            }}
        >
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
