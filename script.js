const API_KEY = "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";

// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const patientForm = document.getElementById('patientForm');
const submitBtn = document.getElementById('submitBtn');
const downloadBtn = document.getElementById('downloadBtn');
const analysisResult = document.getElementById('analysisResult');
const analysisText = document.getElementById('analysisText');
const cameraContainer = document.getElementById('cameraContainer');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const takePhotoBtn = document.getElementById('takePhotoBtn');
const photoGallery = document.getElementById('photoGallery');
const photoContainer = document.getElementById('photoContainer');
const addPhotoBtn = document.getElementById('addPhotoBtn');
const ocrResult = document.getElementById('ocrResult');

let patientPhotos = [];
let prescriptionImage = null;
let ocrResultText = '';

// Tab functionality
const tabTriggers = document.querySelectorAll('.tab-trigger');
const tabContents = document.querySelectorAll('.tab-content');

tabTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
        const tabName = trigger.getAttribute('data-tab');
        tabContents.forEach(content => {
            content.style.display = content.id === `${tabName}Tab` ? 'block' : 'none';
        });
    });
});

// File upload handlers
document.getElementById('prescription').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        prescriptionImage = await fileToDataUrl(file);
        simulateGoogleDriveSave(file.name, 'Prescription');
        const ocrText = await performOCR(file);
        displayOCRResult(ocrText);
    }
});

document.getElementById('photo').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const photoUrl = await fileToDataUrl(file);
        addPhotoToGallery(photoUrl);
        simulateGoogleDriveSave(file.name, 'Patient Photo');
    }
});

// Camera functionality
captureBtn.addEventListener('click', handleCameraCapture);
takePhotoBtn.addEventListener('click', captureImage);
addPhotoBtn.addEventListener('click', handleCameraCapture);

async function handleCameraCapture() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        cameraContainer.style.display = 'block';
    } catch (err) {
        console.error("Error accessing camera:", err);
    }
}

function captureImage() {
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, 640, 480);
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    addPhotoToGallery(imageDataUrl);
    simulateGoogleDriveSave('patient_photo.jpg', 'Patient Photo');
    cameraContainer.style.display = 'none';
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
}

function addPhotoToGallery(photoUrl) {
    patientPhotos.push(photoUrl);
    const img = document.createElement('img');
    img.src = photoUrl;
    img.alt = `Patient ${patientPhotos.length}`;
    img.className = 'w-24 h-24 object-cover rounded';
    photoContainer.insertBefore(img, addPhotoBtn);
    photoGallery.style.display = 'block';
}

// OCR and analysis functions
async function performOCR(imageFile) {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('language', 'eng');

    try {
        const response = await fetch('https://api.openai.com/v1/engines/davinci/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('OCR request failed');
        }

        const result = await response.json();
        return result.text;
    } catch (error) {
        console.error('Error performing OCR:', error);
        return 'Error performing OCR. Please try again.';
    }
}

function displayOCRResult(text) {
    ocrResultText = text;
    ocrResult.style.display = 'block';
    ocrResult.querySelector('p').textContent = text;
}

async function simulateLLMAnalysis(text) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `Based on the prescription analysis, the patient is diagnosed with hypertension and mild anxiety. Recommended treatment plan:
    1. Lisinopril 10mg, once daily for blood pressure management
    2. Propranolol 10mg, as needed for anxiety symptoms
    3. Lifestyle modifications including regular exercise and stress reduction techniques
    4. Follow-up appointment scheduled in 4 weeks to assess treatment efficacy`;
}

function simulateGoogleDriveSave(fileName, fileType) {
    console.log(`File ${fileName} of type ${fileType} saved to Google Drive`);
}

// Form submission
submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="icon">⏳</span> Analyzing...';
    
    const analysis = await simulateLLMAnalysis(ocrResultText);
    displayAnalysisResult(analysis);
    
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="icon">📤</span> Analyze Prescription';
});

function displayAnalysisResult(text) {
    analysisText.textContent = text;
    analysisResult.style.display = 'block';
}

// PDF generation and download
downloadBtn.addEventListener('click', handleDownload);

function handleDownload() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add watermark
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(30);
    doc.text('DECCAANOW-VEMBU MED AI EMULATOR', 20, 100, { angle: 45 });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Add header
    doc.setFontSize(20);
    doc.text('VEMBU MedAI Report', 105, 15, { align: 'center' });
    
    // Add patient details
    doc.setFontSize(12);
    doc.text(`Name: ${document.getElementById('name').value}`, 20, 30);
    doc.text(`Age: ${document.getElementById('age').value}`,   20, 40);
    doc.text(`Blood Group: ${document.getElementById('bloodGroup').value}`, 20, 50);
    doc.text(`Gender: ${document.getElementById('gender').value}`, 20, 60);
    doc.text(`Phone: ${document.getElementById('phone').value}`, 20, 70);
    doc.text(`Address: ${document.getElementById('address').value}`, 20, 80);
    
    // Add timestamp
    const now = new Date();
    doc.text(`Report generated on: ${now.toLocaleString()}`, 20, 90);
    
    // Add patient photos
    patientPhotos.forEach((photo, index) => {
        if (index === 0) {
            doc.addImage(photo, 'JPEG', 130, 30, 60, 60);
        } else {
            doc.addPage();
            doc.addImage(photo, 'JPEG', 20, 20, 170, 170);
        }
    });
    
    // Add OCR result
    doc.addPage();
    doc.setFontSize(14);
    doc.text('OCR Result:', 20, 20);
    doc.setFontSize(10);
    doc.text(ocrResultText, 20, 30, { maxWidth: 170 });
    
    // Add analysis results
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Analysis Results:', 20, 20);
    doc.setFontSize(10);
    doc.text(analysisText.textContent, 20, 30, { maxWidth: 170 });
    
    // Add prescription image on last page
    if (prescriptionImage) {
        doc.addPage();
        doc.addImage(prescriptionImage, 'JPEG', 0, 0, 210, 297); // A4 size
    }
    
    // Save the PDF
    doc.save(`${document.getElementById('name').value}_VEMBU_MedAI_Report.pdf`);
    simulateGoogleDriveSave(`${document.getElementById('name').value}_VEMBU_MedAI_Report.pdf`, 'PDF Report');
}

// Utility function
function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}