

import React, { createContext, useContext, useState, useMemo } from 'react';

const BreadcrumbsContext = createContext(null);

export const useBreadcrumbs = () => useContext(BreadcrumbsContext);

export const BreadcrumbsProvider = ({ children }) => {
    const [breadcrumbs, setBreadcrumbs] = useState([]);

    const value = useMemo(() => ({
        breadcrumbs,
        setBreadcrumbs,
    }), [breadcrumbs]);

    return (
        <BreadcrumbsContext.Provider value={value}>
            {children}
        </BreadcrumbsContext.Provider>
    );
};