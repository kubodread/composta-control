"use client";

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ServiceWorkerRegistrar() {
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/Service_Worker.js', { scope: '/' })
          .then((registration) => {
            console.log('Service Worker registrado con éxito:', registration.scope);
            // Opcional: mostrar un toast de éxito
            // toast({
            //   title: "Aplicación Lista Offline",
            //   description: "El Service Worker se ha registrado correctamente.",
            // });
          })
          .catch((error) => {
            console.error('Error al registrar el Service Worker:', error);
            toast({
              variant: 'destructive',
              title: 'Error de Service Worker',
              description: 'No se pudo registrar el Service Worker para la funcionalidad offline.',
            });
          });
      });
    } else {
      console.log('Service Worker no es soportado en este navegador.');
      // Opcional: mostrar un toast si SW no es soportado
      // toast({
      //   variant: 'default',
      //   title: 'Funcionalidad Offline Limitada',
      //   description: 'Tu navegador no soporta Service Workers completamente.',
      // });
    }
  }, [toast]); // Añade toast al array de dependencias

  return null; // Este componente no renderiza nada visualmente
}
