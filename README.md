# رفع SITEYFY + DoCloroo على Linux

ارفع **هذا المجلد فقط** أو ملف `siteyfy-production.zip`. لا ترفع المشروع الأصلي أو قواعد بياناته أو ملفات `.env` المحلية. لا توجد بيانات عملاء/طلبات أو كميات مخزون داخل الحزمة.

المطلوب على السيرفر: Docker Engine مع Compose v2، ودومين/ثلاثة subdomains. وجّه DNS A إلى IP السيرفر؛ احذف أي AAAA قديم إذا لم تستخدم IPv6. افتح TCP 80 و443. PostgreSQL وRedis وواجهات Node لا تنشر أي ports عامة؛ Caddy هو نقطة الدخول ويدير HTTPS وتجديده تلقائيًا.

## 1. إعداد البيئة وبناء الصور

```bash
cd /opt/siteyfy/siteyfy-production
cp .env.example .env
chmod 600 .env
nano .env
# لكل سر من الأسرار الخمسة، استخدم قيمة مختلفة:
openssl rand -hex 32

docker compose config --quiet
docker compose build
docker compose up -d postgres redis
```

اكتب الدومينات الثلاثة وإيميل HTTPS والأسرار الجديدة في `.env`. لا تستخدم `REPLACE_WITH…` كقيمة فعلية. استخدم كلمة مرور قاعدة البيانات وRedis بصيغة hex حتى لا تحتاج لترميز URL. اترك `MEDUSA_PUBLISHABLE_KEY` فارغًا مؤقتًا، ورايات البيع والبريد `false`.

## 2. أول تشغيل على قاعدة جديدة فقط

هذه أوامر إعداد صريحة تُنفذ على **السيرفر الجديد**؛ لا تُشغّل تلقائيًا عند تشغيل/إعادة تشغيل الخدمات. لا توجد عملية استعادة للبيانات المحلية.

```bash
docker compose run --rm medusa pnpm exec medusa db:migrate --skip-scripts
docker compose run --rm -e CONFIRM_INITIALIZE_FRESH_PRODUCTION=true medusa pnpm exec medusa exec ./src/scripts/initialize-production.js

# إنشاء مسؤول جديد، دون نقل حسابات أو كلمات مرور الجهاز المحلي:
read -r -p 'Admin email: ' ADMIN_EMAIL
read -r -s -p 'Admin password: ' ADMIN_PASSWORD; echo
docker compose run --rm medusa pnpm exec medusa user -e "$ADMIN_EMAIL" -p "$ADMIN_PASSWORD"
unset ADMIN_PASSWORD

docker compose up -d
docker compose ps
```

التهيئة اليدوية تستخدم workflows الموجودة: متجر/منطقة مصر/قناة بيع ومفتاح Publishable، وثلاثة تصميمات **Draft** بـ899 جنيه، خصومات 10% لقطعتين و20% لثلاث قطع فأكثر وشحن 70 جنيه مرة واحدة. لا تنشئ مخزونًا أو طلبات أو عملاء. ترفض التنفيذ إذا وجدت بيانات عملاء أو طلبات.

افتح `https://api.YOUR_DOMAIN/app` بحساب المسؤول الجديد. من **Settings → Publishable API Keys** انسخ مفتاح **DoCloroo Storefront** من قاعدة السيرفر الجديدة إلى `MEDUSA_PUBLISHABLE_KEY` في `.env`، ثم:

```bash
docker compose up -d storefront
```

روابطك: `https://STOREFRONT_DOMAIN` للمتجر، `https://ADMIN_DOMAIN` لـSITEYFY، و`https://MEDUSA_DOMAIN/app` للإدارة الأصلية. SITEYFY يستخدم حساب Medusa الجديد نفسه.

## 3. قبل تفعيل البيع

- أدخل المخزون الحقيقي واعتمد الصور من SITEYFY؛ التصميمات تبقى Draft لحين ذلك. الصور المرفقة هي صور المشروع الحالية مؤقتًا، وليست اعتمادًا تجاريًا.
- لا تستخدم روابط `localhost` للصور على السيرفر. التهيئة تستخدم الدومين الحقيقي، والصور المرفوعة الجديدة تستخدم دومين Medusa.
- اضبط SMTP الحقيقي ثم اجعل `DOCLOROO_MAIL_ENABLED=true`. البريد وOTP لن يدّعيا نجاح الإرسال دون مزوّد يعمل؛ لا توجد Mailpit ضمن الإنتاج.
- بعد الاعتماد واختبار COD على السيرفر، فعّل `DOCLOROO_CHECKOUT_VERIFIED=true` و`DOCLOROO_PRODUCTION_LAUNCH_APPROVED=true` ثم `docker compose up -d medusa storefront`.
- CMS يبدأ بالمحتوى الافتراضي الموجود بالكود؛ أي محتوى محفوظ فقط في قاعدة جهازك المحلي لا يُنقل تلقائيًا. استخدم SITEYFY لإعادة حفظ/نشر المحتوى المطلوب على السيرفر.

## التشغيل اللاحق والتخزين

```bash
docker compose up -d
docker compose logs --tail=100 medusa
```

الأوامر أعلاه لا تعيد تهيئة البيانات ولا تنفذ migrations. عند تحديث كود ذي migration جديد، خذ نسخة احتياطية للسيرفر أولًا ثم نفّذ ترحيله صراحةً. إعادة بناء الصور لا تستبدل بيانات named volumes. لا تستخدم `docker compose down -v`.

التخزين الدائم: `postgres-data` لقاعدة البيانات، `medusa-uploads` للصور، `redis-data` للطوابير والكاش، و`caddy-data`/`caddy-config` للشهادات. احتفظ بنسخة احتياطية مستقلة لقاعدة السيرفر والصور؛ Docker volumes وحدها ليست backup.

هذه أبسط حزمة لسيرفر واحد: مزوّد الصور الحالي محفوظ مع volume دائم. للتوسع إلى عدة سيرفرات تحتاج لاحقًا مخزن ملفات مشتركًا مثل S3؛ لم نضف ذلك الآن.

**الفحص الذي أُجري:** وجود المصادر والأصول وملفات lock والبناء والإعدادات، صلاحية Compose، عدم وجود أسرار/اختبارات/Git/بيانات محلية، وسلامة المصادر الأصلية. لم يُنفذ نشر أو Build إنتاج أو تهيئة قاعدة محلية ضمن هذه المهمة؛ التحقق من التشغيل الفعلي سيتم على السيرفر بعد توفير بياناته.

المراجع: [Medusa production build](https://docs.medusajs.com/learn/build)، [Medusa deployment](https://docs.medusajs.com/learn/deployment/general)، [Local file provider](https://docs.medusajs.com/resources/architectural-modules/file/local).
