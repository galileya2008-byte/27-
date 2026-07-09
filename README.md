# 27-
Сайт для портфолио

## Админка статистики

Сейчас работает сразу:
- визиты отправляются в ваш Telegram (бот уже настроен в `js/main.js`)
- одно уведомление на сессию вкладки

Дополнительно (веб-админка):
- `admin.html` — вход и просмотр статистики через Supabase
- `js/main.js` — дублирует визиты в таблицу `visits` (если Supabase подключен)
- `js/supabase-config.js` — публичный конфиг Supabase

Скрытая ссылка на админку: точка `·` в футере сайта.

### Подключение Supabase (для веб-админки)

1. Создайте проект на https://supabase.com
2. В `js/supabase-config.js` вставьте `url` и `anonKey`
3. В SQL Editor выполните `supabase/schema.sql`
4. В Authentication -> Users создайте email+password пользователя
5. Откройте `admin.html` и войдите
