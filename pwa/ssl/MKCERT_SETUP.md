# mkcert - Кращий спосіб для локального HTTPS

Safari не приймає самопідписані сертифікати від OpenSSL.
Використовуй `mkcert` - він створює довірені сертифікати.

## Встановлення mkcert (macOS)

```bash
# 1. Встанови mkcert через Homebrew
brew install mkcert

# 2. Встанови локальний CA
mkcert -install

# 3. Створи сертифікат для localhost
cd /Users/ivankarbashevskyi/Projects/Myself/patterns-2025/pwa/ssl/certs
mkcert localhost 127.0.0.1 ::1

# 4. Перейменуй файли
mv localhost+2.pem localhost.crt
mv localhost+2-key.pem localhost.key

# 5. Перезапусти сервер
cd ../..
node server.js
```

## Чому mkcert краще?

✅ Автоматично додає CA в системне сховище (Keychain)
✅ Safari довіряє цим сертифікатам
✅ Працює на всіх браузерах (Chrome, Firefox, Safari)
✅ Не потрібно вручну додавати в Keychain

## Швидкий старт

```bash
# Одна команда для всього:
brew install mkcert && \
mkcert -install && \
cd ssl/certs && \
mkcert localhost 127.0.0.1 ::1 && \
mv localhost+2.pem localhost.crt && \
mv localhost+2-key.pem localhost.key && \
cd ../.. && \
node server.js
```

Після цього Safari відкриє https://localhost:8443 без помилок! 🎉

---

## Поки що використовуй HTTP

Для розробки PWA на localhost, HTTP цілком достатньо:

```
http://localhost:8000/Application/static/index.html
```

Service Worker, Notifications, Install - все працює на localhost через HTTP!
