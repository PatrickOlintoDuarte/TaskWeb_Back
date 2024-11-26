import React, { useState, useEffect } from 'react';
import { XYPlot, VerticalBarSeries, XAxis, YAxis, VerticalGridLines, HorizontalGridLines } from 'react-vis';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';

// Configurações do Firebase
const firebaseConfig = {
  apiKey: "Sua chave de API",
  authDomain: "Seu authDomain",
  projectId: "Seu projectId",
  storageBucket: "Seu storageBucket",
  messagingSenderId: "Seu messagingSenderId",
  appId: "Sua appId",
  measurementId: "Sua measurementId"
};

// Inicializar o Firebase
//initializeApp(firebaseConfig);

const App = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase();
      const atividadesRef = ref(db, 'atividades');

      // Listener de alterações nos dados
      onValue(atividadesRef, (snapshot) => {
        const newData = snapshot.val();
        if (newData) {
          const dataArray = Object.entries(newData).map(([key, value]) => ({ x: key, y: value }));
          setData(dataArray);
        }
      });
    };

    fetchData();

    // Remove o listener ao desmontar o componente
    return () => {
      const db = getDatabase();
      const ref = ref(db, 'atividades');
      ref.off();
    };
  }, []);

  return (
    <div>
      <h1>Gráfico de Barras com Dados do Firebase</h1>
      <XYPlot xType="ordinal" width={600} height={400}>
        <VerticalGridLines />
        <HorizontalGridLines />
        <XAxis />
        <YAxis />
        <VerticalBarSeries data={data} />
      </XYPlot>
    </div>
  );
};

export default App;
