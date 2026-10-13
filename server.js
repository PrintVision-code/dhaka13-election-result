const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// এডমিন অ্যাকশন (নতুন প্রার্থী ও নতুন কেন্দ্র যোগ) এর জন্য অনুমোদিত নম্বর
const ADMIN_ALLOWED_PHONES = ["01974411803"];

// ১০ জন প্রার্থীর প্রাথমিক তালিকা
let candidates = [
    { id: 1, name: "অজ্ঞাত ১", symbol: "লাঙ্গল" },
    { id: 2, name: "অজ্ঞাত ২", symbol: "ডাব" },
    { id: 3, name: "প্রার্থী ৩", symbol: "মই" },
    { id: 4, name: "প্রার্থী ৪", symbol: "ছাতা" },
    { id: 5, name: "প্রার্থী ৫", symbol: "গোলাপ ফুল" },
    { id: 6, name: "প্রার্থী ৬", symbol: "মাছ" },
    { id: 7, name: "প্রার্থী ৭", symbol: "বই" },
    { id: 8, name: "প্রার্থী ৮", symbol: "ঘড়ি" },
    { id: 9, name: "প্রার্থী ৯", symbol: "ফুটবল" },
    { id: 10, name: "প্রার্থী ১০", symbol: "টেলিফোন" }
];

// কেন্দ্রগুলোর তালিকা (প্রথম ৪টিতে নির্দিষ্ট নম্বর)
let centers = [
    { id: 24, name: "কেন্দ্র ২৪: আল জাহারা গার্লস একাডেমী, সেকশন-১৩, বাইশটেকী, কাফরুল", allowedPhones: ["01974411803"], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 25, name: "কেন্দ্র ২৫: মনিপুর উচ্চ বিদ্যালয় (বালক শাখা), বড়বাগ (মহিলা-১)", allowedPhones: ["01341590658"], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 26, name: "কেন্দ্র ২৬: মনিপুর উচ্চ বিদ্যালয় (বালক শাখা), বড়বাগ (মহিলা-২)", allowedPhones: ["01896092944"], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 27, name: "কেন্দ্র ২৭: মনিপুর উচ্চ বিদ্যালয় (বালক শাখা), বড়বাগ (পুরুষ-১)", allowedPhones: ["01911425382"], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 28, name: "কেন্দ্র ২৮: মনিপুর উচ্চ বিদ্যালয় (বালক শাখা), বড়বাগ (পুরুষ-২)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 29, name: "কেন্দ্র ২৯: পীরেরবাগ সরকারী প্রাথমিক বিদ্যালয়, উত্তর পীরেরবাগ (মহিলা-১)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 30, name: "কেন্দ্র ৩০: পীরেরবাগ সরকারী প্রাথমিক বিদ্যালয়, উত্তর পীরেরবাগ (মহিলা-২)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 31, name: "কেন্দ্র ৩১: পীরেরবাগ সরকারী প্রাথমিক বিদ্যালয়, উত্তর পীরেরবাগ (মহিলা-৩)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 32, name: "কেন্দ্র ৩২: পীরেরবাগ সরকারী প্রাথমিক বিদ্যালয়, উত্তর পীরেরবাগ (পুরুষ-১)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 33, name: "কেন্দ্র ৩৩: নলেজ হেভেন হাই স্কুল, উত্তর পীরেরবাগ (পুরুষ-২)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 34, name: "কেন্দ্র ৩৪: জাহানারা প্রি-ক্যাডেট স্কুল, উত্তর পীরেরবাগ (পুরুষ-৩)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 35, name: "কেন্দ্র ৩৫: আলীম উদ্দিন উচ্চ বিদ্যালয়, পীরেরবাগ (মহিলা-১)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 36, name: "কেন্দ্র ৩৬: আলীম উদ্দিন উচ্চ বিদ্যালয়, পীরেরবাগ (মহিলা-২)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 37, name: "কেন্দ্র ৩৭: আলীম উদ্দিন উচ্চ বিদ্যালয়, পীরেরবাগ (মহিলা-৩)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 38, name: "কেন্দ্র ৩৮: আলীম উদ্দিন উচ্চ বিদ্যালয়, পীরেরবাগ (মহিলা-৪)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 39, name: "কেন্দ্র ৩৯: লিটল ফ্লাওয়ার একাডেমি, মধ্য পীরেরবাগ (পুরুষ-১)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 40, name: "কেন্দ্র ৪০: ঢাকা এডওয়ার্ড স্কুল এন্ড কলেজ, দক্ষিণ পীরেরবাগ (পুরুষ-২)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 41, name: "কেন্দ্র ৪১: নিউ ভিক্টোরিয়া ইন্টারন্যাশনাল স্কুল, মধ্যপীরেরবাগ (পুরুষ-৩)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 42, name: "কেন্দ্র ৪২: আলীম উদ্দিন উচ্চ বিদ্যালয়, পীরেরবাগ (পুরুষ-৪)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 43, name: "কেন্দ্র ৪৩: মনিপুর সরকারী প্রাথমিক বিদ্যালয়, মনিপুর (মহিলা-১)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 44, name: "কেন্দ্র ৪৪: মনিপুর সরকারী প্রাথমিক বিদ্যালয়, মনিপুর (মহিলা-২)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 45, name: "কেন্দ্র ৪৫: মনিপুর সরকারী প্রাথমিক বিদ্যালয়, মনিপুর (মহিলা-৩)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 46, name: "কেন্দ্র ৪৬: কসমোপোলিটান ল্যাবরেটরী ইনস্টিটিউট, মনিপুর (পুরুষ-১)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 47, name: "কেন্দ্র ৪৭: আরফান মডেল স্কুল, মধ্য মনিপুর (পুরুষ-২)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 48, name: "কেন্দ্র ৪৮: গ্রীন ভিউ হাই স্কুল, মনিপুর (পুরুষ-৩)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 49, name: "কেন্দ্র ৪৯: মনিপুর উচ্চ বিদ্যালয় (বালিকা শাখা), মনিপুর (মহিলা-১)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 50, name: "কেন্দ্র ৫০: মনিপুর উচ্চ বিদ্যালয় (বালিকা শাখা), মনিপুর (মহিলা-২)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 51, name: "কেন্দ্র ৫১: মনিপুর উচ্চ বিদ্যালয় (বালিকা শাখা), মনিপুর (মহিলা-৩)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 52, name: "কেন্দ্র ৫২: মনিপুর উচ্চ বিদ্যালয় (বালিকা শাখা), মনিপুর (মহিলা-৪)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 53, name: "কেন্দ্র ৫৩: মনিপুর উচ্চ বিদ্যালয় (বালিকা শাখা), মনিপুর (পুরুষ-১)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 54, name: "কেন্দ্র ৫৪: মনিপুর উচ্চ বিদ্যালয় (বালিকা শাখা), মনিপুর (পুরুষ-২)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 55, name: "কেন্দ্র ৫৫: মনিপুর উচ্চ বিদ্যালয় (বালিকা শাখা), মনিপুর (পুরুষ-৩)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null },
    { id: 56, name: "কেন্দ্র ৫৬: মনিপুর উচ্চ বিদ্যালয় (বালিকা শাখা), মনিপুর (পুরুষ-৪)", allowedPhones: [], votes: {}, image: null, status: 'Pending', submittedBy: null }
];

// API: তথ্য ড্যাশবোর্ডে পাঠাতে
app.get('/api/data', (req, res) => {
    res.json({ centers, candidates });
});

// API: সিকিউরড নতুন প্রার্থী যোগ করার জন্য
app.post('/api/add-candidate', (req, res) => {
    const { name, symbol, adminMobile } = req.body;

    if (!adminMobile || !ADMIN_ALLOWED_PHONES.includes(adminMobile.trim())) {
        return res.status(403).json({ success: false, message: 'অনুমোদিত এডমিন নম্বর ব্যতীত প্রার্থী যোগ করা যাবে না!' });
    }

    if (!name || !symbol) {
        return res.status(400).json({ success: false, message: 'প্রার্থীর নাম ও প্রতীক দিন!' });
    }

    const newId = candidates.length > 0 ? Math.max(...candidates.map(c => c.id)) + 1 : 1;
    candidates.push({ id: newId, name: name.trim(), symbol: symbol.trim() });
    
    broadcastUpdate();
    res.json({ success: true, message: 'সফলভাবে নতুন প্রার্থী যোগ করা হয়েছে!' });
});

// API: সিকিউরড নতুন কেন্দ্র যোগ করার জন্য
app.post('/api/add-center', (req, res) => {
    const { centerName, adminMobile } = req.body;

    if (!adminMobile || !ADMIN_ALLOWED_PHONES.includes(adminMobile.trim())) {
        return res.status(403).json({ success: false, message: 'অনুমোদিত এডমিন নম্বর ব্যতীত নতুন কেন্দ্র যোগ করা যাবে না!' });
    }

    if (!centerName || centerName.trim() === '') {
        return res.status(400).json({ success: false, message: 'কেন্দ্রের নাম প্রদান করুন!' });
    }

    const newId = centers.length > 0 ? Math.max(...centers.map(c => c.id)) + 1 : 1;
    const newCenter = {
        id: newId,
        name: centerName.trim(),
        allowedPhones: [],
        votes: {},
        image: null,
        status: 'Pending',
        submittedBy: null
    };

    centers.push(newCenter);
    broadcastUpdate();
    res.json({ success: true, message: 'সফলভাবে নতুন কেন্দ্র যোগ করা হয়েছে!' });
});

// API: ফলাফল সাবমিট করার জন্য
app.post('/api/submit', upload.single('resultImage'), (req, res) => {
    const { centerId, mobileNumber } = req.body;
    const centerIndex = centers.findIndex(c => c.id == centerId);

    if (centerIndex === -1) {
        return res.status(400).json({ success: false, message: 'কেন্দ্র পাওয়া যায়নি!' });
    }

    const center = centers[centerIndex];

    if (center.allowedPhones && center.allowedPhones.length > 0) {
        if (!center.allowedPhones.includes(mobileNumber ? mobileNumber.trim() : '')) {
            return res.status(403).json({ 
                success: false, 
                message: 'ভুল মোবাইল নম্বর! এই নম্বরটি এই কেন্দ্রের জন্য অনুমোদিত নয়।' 
            });
        }
    }

    let centerVotes = {};
    candidates.forEach(cand => {
        centerVotes[cand.id] = parseInt(req.body[`candidate_${cand.id}`]) || 0;
    });

    center.votes = centerVotes;
    center.status = 'Submitted';
    center.submittedBy = mobileNumber ? mobileNumber.trim() : 'অজ্ঞাত';
    if (req.file) {
        center.image = '/uploads/' + req.file.filename;
    }

    broadcastUpdate();
    res.json({ success: true, message: 'সফলভাবে ফলাফল জমা হয়েছে!' });
});

function broadcastUpdate() {
    const data = JSON.stringify({ type: 'UPDATE', centers, candidates });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(` সিকিউরড নির্বাচন অ্যাপ চালু হয়েছে: http://localhost:${PORT}`);
    console.log(`========================================\n`);
});