/**
 * main.jsx - Punto de entrada de la aplicación React
 * 
 * Este archivo es el primero que se ejecuta cuando la aplicación se inicia.
 * Su única responsabilidad es:
 * 1. Importar el componente principal (App)
 * 2. Renderizarlo en el elemento HTML con id="root"
 * 
 * Archivos relacionados:
 * - index.html: Contiene el <div id="root"></div> donde se monta React
 * - App.jsx: El componente principal de la aplicación
 * - index.css: Estilos globales (Tailwind CSS)
 * - print.css: Estilos específicos para la exportación PDF
 */

import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/montserrat/latin-400.css";
import "@fontsource/montserrat/latin-500.css";
import "@fontsource/montserrat/latin-600.css";
import "@fontsource/montserrat/latin-700.css";
import "@fontsource/montserrat/latin-800.css";
import App from "./App";       // Componente principal
import "./index.css";          // Estilos globales
import "./print.css";          // Estilos para impresión/PDF

// Crear la raíz de React y renderizar la aplicación
// React.StrictMode: Activa verificaciones adicionales en desarrollo
// para ayudar a encontrar problemas potenciales en el código.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
