@echo off
title 🔧 Discord Protection Bot - Setup
color 0a
echo ============================================
echo    🔧 Discord Protection Bot v3.0
echo    إعداد وتثبيت البوت
echo ============================================
echo.
echo [*] جاري تثبيت الحزم المطلوبة...
echo.
call npm install
if %errorlevel% neq 0 (
    echo [✗] فشل التثبيت! تأكد من تثبيت Node.js
    pause
    exit /b 1
)
echo.
echo [✓] تم تثبيت جميع الحزم بنجاح!
echo.
if not exist ".env" (
    echo [i] يتم إنشاء ملف .env...
    (
        echo TOKEN=YOUR_BOT_TOKEN_HERE
        echo DASHBOARD_USERNAME=Admin
        echo DASHBOARD_PASSWORD=YourStrongPassword123
        echo OWNER_ID=YOUR_DISCORD_ID_HERE
        echo PORT=3000
        echo DASHBOARD_URL=http://localhost:3000
    ) > .env
    echo [✓] تم إنشاء ملف .env
    echo.
    echo [!] مهم: افتح ملف .env وعدل البيانات التالية:
    echo     - TOKEN: توكن البوت من Discord Developer Portal
    echo     - DASHBOARD_PASSWORD: كلمة مرور قوية
    echo     - OWNER_ID: ايدي حسابك في دسكورد
    echo.
) else (
    echo [✓] ملف .env موجود مسبقاً
)
echo.
echo ============================================
echo    ✅ تم الانتهاء من الإعداد!
echo    شغل البوت عن طريق start.bat
echo ============================================
pause
