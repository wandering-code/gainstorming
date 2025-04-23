self.addEventListener('install', e => {
    e.waitUntil(
      caches.open('gym-app-cache').then(cache => {
        return cache.addAll([
          './',
          './index.html',
          './styles.css',
          './script.js',
          './manifest.json',
          './icon-192.png',
          './icon-512.png'
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
  