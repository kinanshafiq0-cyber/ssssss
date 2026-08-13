const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log(`
╔═══════════════════════════════════════════╗
║     🤖 Discord Protection Bot v3.0       ║
║      إعداد البوت التفاعلي                 ║
╚═══════════════════════════════════════════╝
`);

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer));
    });
}

async function setup() {
    console.log('📝 الرجاء إدخال المعلومات التالية:\n');

    const token = await ask('🔑 توكن البوت (من Discord Developer Portal): ');
    const ownerId = await ask('👤 آيدي حسابك في دسكورد: ');
    const username = await ask('👤 اسم المستخدم للوحة التحكم [Admin]: ') || 'Admin';
    const password = await ask('🔒 كلمة مرور لوحة التحكم: ');
    const port = await ask('🌐 بورت لوحة التحكم [3000]: ') || '3000';

    if (!token || token === '') {
        console.log('\n❌ خطأ: التوكن مطلوب!');
        rl.close();
        return;
    }

    if (!ownerId || ownerId === '') {
        console.log('\n❌ خطأ: آيدي المالك مطلوب!');
        rl.close();
        return;
    }

    if (!password || password === '') {
        console.log('\n❌ خطأ: كلمة مرور لوحة التحكم مطلوبة!');
        rl.close();
        return;
    }

    const sessionSecret = crypto.randomBytes(32).toString('hex');

    const envContent = `# توكن البوت من Discord Developer Portal (مطلوب)
TOKEN=${token}

# بيانات تسجيل الدخول للوحة التحكم
DASHBOARD_USERNAME=${username}
DASHBOARD_PASSWORD=${password}

# معرف مالك البوت (Discord ID) - مطلوب
OWNER_ID=${ownerId}

# بورت لوحة التحكم (افتراضي 3000)
PORT=${port}

# رابط لوحة التحكم
DASHBOARD_URL=http://localhost:${port}

# مفتاح جلسات الداشبورد (اتركه فارغ يتولد تلقائياً)
SESSION_SECRET=${sessionSecret}
`;

    fs.writeFileSync('.env', envContent);
    console.log('\n✅ تم حفظ الإعدادات في ملف .env');

    console.log('\n📦 جاري تثبيت الحزم...');
    const { execSync } = require('child_process');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('\n✅ تم تثبيت جميع الحزم بنجاح!');
    } catch (e) {
        console.log('\n⚠️ فشل تثبيت الحزم، شغّل: npm install');
    }

    console.log(`
╔═══════════════════════════════════════════╗
║   ✅ تم الإعداد بنجاح!                    ║
║                                           ║
║   شغل البوت: npm start أو start.bat       ║
║   لوحة التحكم: http://localhost:${port}     ║
╚═══════════════════════════════════════════╝
    `);

    rl.close();
}

setup().catch(console.error);
