import { createContext, useContext, useState, useEffect } from 'react';

export const ROLES = [
    { key: 'admin',         label: 'Admin',         initials: 'JA' },
    { key: 'field_officer', label: 'Field Officer',  initials: 'FO' },
    { key: 'grower',        label: 'Grower',         initials: 'G'  },
];

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
    const [role, setRole]               = useState(() => localStorage.getItem('_demo_role') ?? 'admin');
    const [growerAppId, setGrowerAppId] = useState(() => localStorage.getItem('_demo_grower_id') ?? null);

    useEffect(() => { localStorage.setItem('_demo_role', role); }, [role]);
    useEffect(() => {
        growerAppId
            ? localStorage.setItem('_demo_grower_id', growerAppId)
            : localStorage.removeItem('_demo_grower_id');
    }, [growerAppId]);

    function clearGrowerApp() { setGrowerAppId(null); }

    return (
        <RoleContext.Provider value={{ role, setRole, growerAppId, setGrowerAppId, clearGrowerApp }}>
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    return useContext(RoleContext);
}
