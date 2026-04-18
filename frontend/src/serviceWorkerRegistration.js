// Registro del Service Worker para PWA
export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('✅ PWA: Service Worker registrado');
          
          // Verificar actualizaciones cada hora
          setInterval(() => {
            registration.update();
          }, 1000 * 60 * 60);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // Nueva versión disponible
                  console.log('📦 Nueva versión disponible! Recarga la página.');
                  
                  // Mostrar notificación al usuario (opcional)
                  if (window.confirm('Nueva versión disponible. ¿Recargar ahora?')) {
                    window.location.reload();
                  }
                } else {
                  console.log('✅ Contenido cacheado para uso offline.');
                }
              }
            };
          };
        })
        .catch((error) => {
          console.error('❌ Error registrando Service Worker:', error);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Verificar si la app está instalada como PWA
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

// Prompt de instalación
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevenir que Chrome muestre el prompt automáticamente
  e.preventDefault();
  deferredPrompt = e;
  
  // Guardar el evento para mostrarlo después
  console.log('💡 PWA instalable detectada');
});

export function showInstallPrompt() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ Usuario aceptó instalar la PWA');
      } else {
        console.log('❌ Usuario rechazó instalar la PWA');
      }
      deferredPrompt = null;
    });
  }
}
