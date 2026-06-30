<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:adsend-rules -->
# AdSend — כללי מדיה להעלאת קריאייטיבים

## תמונות וסרטונים מ-WhatsApp

- רזולוציה מינימלית: **1080px רוחב**
- פחות מ-1080px → resize ל-1080px תוך שמירת aspect ratio
- 1080px ומעלה → לא לגעת
- resize מבוצע ב-**Baileys server** (לפני webhook) באמצעות Sharp
- לא לדחות — תמיד לתקן אוטומטית

## Whitelist מספרים מורשים (default-deny — עודכן 06/2026)

- טבלה: `whatsapp_allowed_numbers (user_id, phone_number, label)`
- **הבעלים (המספר המחובר עצמו) תמיד מורשה** — מובנה בקוד, גם עם רשימה ריקה
- רשימה ריקה = רק הבעלים מורשה (זר → התעלמות שקטה). זה default-deny, לא "כולם מורשים"
- יש רשומות = הבעלים + המספרים ברשימה; השאר — התעלמות שקטה
- ההשוואה: `canonPhone` = 9 ספרות אחרונות (סובלני ל-972/0/מקפים, immune ל-suffix-collision). **לא** `includes`/`endsWith`
- בחיבור ראשון (רשימה ריקה) — מספר הבעלים נכנס אוטומטית לרשימה הנראית
<!-- END:adsend-rules -->
