@echo off
title 📦 Discord Protection Bot - Quick Install
color 0d
echo ============================================
echo    📦 Discord Protection Bot v3.0
echo    التثبيت السريع
echo ============================================
echo.
echo [*] الخطوة 1: تثبيت الحزم...
call npm install --no-optional
if %errorlevel% neq 0 (
    echo [✗] فشل التثبيت!
    pause
    exit /b 1
)
echo [✓] تم تثبيت الحزم!
echo.
echo [*] الخطوة 2: إعداد البيئة...
if not exist ".env" (
    copy .env.example .env >nul
    echo [✓] تم إنشاء ملف .env من القالب
    echo.
    echo [!] الرجاء تعديل ملف .env بمعلوماتك:
    echo     افتح الملف وعدل:
    echo     - TOKEN
    echo     - DASHBOARD_PASSWORD
    echo     - OWNER_ID
) else (
    echo [✓] ملف .env موجود
)
echo.
echo ============================================
echo    ✅ تم التثبيت بنجاح!
echo    شغل البوت: start.bat
echo    أو: npm start
echo ============================================
pause
