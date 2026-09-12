const CACHE_NAME = "danyalcode-ai-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// نصب نسخه جدید
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );

  // نسخه جدید را منتظر بسته‌شدن نسخه قبلی نگذار
  self.skipWaiting();
});

// فعال‌سازی نسخه جدید و حذف کش‌های قدیمی
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

// مدیریت درخواست‌ها
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // درخواست‌های API همیشه از اینترنت
  if (url.hostname.includes("huggingface.co")) {
    event.respondWith(fetch(request));
    return;
  }

  // فقط درخواست‌های GET را کش کن
  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // پاسخ معتبر را در کش ذخیره کن
        if (response && response.status === 200) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
        }

        // وقتی آنلاین هستیم همیشه نسخه جدید را برگردان
        return response;
      })
      .catch(() => {
        // اگر اینترنت قطع بود، از نسخه ذخیره‌شده استفاده کن
        return caches.match(request).then((cached) => {
          return cached || caches.match("./index.html");
        });
      })
  );
});
