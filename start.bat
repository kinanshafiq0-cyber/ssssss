@echo off
title 🤖 Discord Protection Bot - System
color 0b
echo ============================================
echo    🤖 Discord Protection Bot v3.0
echo    نظام حماية السيرفرات المتكامل
echo ============================================
echo.
if not exist ".env" (
    echo [⚠] ملف .env غير موجود!
    echo [i] قم بنسخ .env.example إلى .env وعدل البيانات
    echo.
    pause
    exit /b 1
)
echo [✓] جاري تشغيل البوت...
echo [i] لوحة التحكم: http://localhost:3000
echo.
node index.js
pause
