self.addEventListener('push', event => {
 event.waitUntil(self.registration.showNotification('Time to hydrate! 💧', {body:'Take a break and drink a glass of water.',icon:'/icon-192.png',tag:'hydrate-reminder',renotify:true}));
});
self.addEventListener('notificationclick', event => {
 event.notification.close();
 event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{const client=list.find(c=>new URL(c.url).origin===self.location.origin);return client?client.focus():clients.openWindow('/');}));
});
