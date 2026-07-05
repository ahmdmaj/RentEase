import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import './App.css';

function App() {
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('count', { count: 'exact', head: true });

        if (error) throw error;
        setStatus('✅ Connected to Supabase successfully!');
      } catch (error: any) {
        setStatus('❌ Error: ' + error.message);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="app">
      <h1>RentEase Admin Panel</h1>
      <p style={{ fontSize: '18px', marginTop: '20px' }}>{status}</p>
    </div>
  );
}

export default App;