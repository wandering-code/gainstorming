self.addEventListener('install', e => {
    e.waitUntil(
      caches.open('gym-app-cache').then(cache => {
        return cache.addAll([
          './',
          '../index.html',
          '../styles/phone.css',
          '../styles/pc.css',
          './main.js',
          './sessionManager.js',
          './dataBaseManager.js',
          '../manifest.json',
          '../images/logos/onlygains-logo.png'
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', e => {
    e.respondWith(
      caches.match(e.request).then(response => {
        return response || fetch(e.request);
      })
    );
  });

  self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activated');
  });
  
  self.addEventListener('fetch', (event) => {
    console.log('[ServiceWorker] Fetching:', event.request.url);
  });
  