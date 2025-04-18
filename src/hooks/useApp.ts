import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

// Re-export the hook from the context
export const useApp = () => useContext(AppContext);
