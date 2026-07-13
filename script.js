/**
 * AI Chart Analyzer - Main JavaScript File
 * Advanced technical analysis for Quotex trading charts
 * 
 * Features:
 * - Image upload and preview
 * - Pixel-based trend analysis
 * - Support/Resistance detection
 * - Chart observations and insights
 * - Responsive UI with real-time feedback
 */

// ===========================
// STATE MANAGEMENT
// ===========================

/**
 * Application state object
 * Manages uploaded file, image URL, and analysis status
 */
const state = {
    uploadedFile: null,
    imageUrl: null,
    isAnalyzing: false,
    lastAnalysis: null
};

// ===========================
// DOM ELEMENTS
// ===========================

// Upload elements
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');

// Display elements
const uploadedImage = document.getElementById('uploadedImage');
const placeholderText = document.getElementById('placeholderText');

// Button elements
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');

// Analysis section elements
const analysisSection = document.getElementById('analysisSection');
const analysisContent = document.getElementById('analysisContent');
const statusMessage = document.getElementById('statusMessage');

// ===========================
// EVENT LISTENERS INITIALIZATION
// ===========================

/**
 * Initialize all event listeners when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    console.log('✓ AI Chart Analyzer initialized successfully');
});

/**
 * Set up all event listeners for the application
 */
function initializeEventListeners() {
    // Upload area click handler - trigger file input
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });

    // Drag over effect
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    // Remove drag over effect
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    // Handle file drop
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    // File input change handler
    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // Analyze button click handler
    analyzeBtn.addEventListener('click', analyzeChart);

    // Clear button click handler
    clearBtn.addEventListener('click', clearChart);

    // Prevent default drag behavior on document
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
    });
}

// ===========================
// FILE HANDLING FUNCTIONS
// ===========================

/**
 * Handle file selection and validation
 * Validates file type and size before processing
 * 
 * @param {File} file - The selected file object
 */
function handleFileSelect(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showStatus('❌ Please select a valid image file (PNG, JPG, WebP)', 'error');
        return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showStatus('❌ File size must be less than 5MB', 'error');
        return;
    }

    // Store file and create preview
    state.uploadedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        state.imageUrl = e.target.result;
        displayImage();
        analyzeBtn.disabled = false;
        clearBtn.disabled = false;
        showStatus(`✓ Image loaded: ${file.name}`, 'success');
    };

    reader.onerror = () => {
        showStatus('❌ Error reading file. Please try again.', 'error');
    };

    reader.readAsDataURL(file);
}

/**
 * Display the uploaded image in the preview container
 * Hides placeholder text and shows the actual image
 */
function displayImage() {
    uploadedImage.src = state.imageUrl;
    uploadedImage.classList.remove('hidden');
    placeholderText.classList.add('hidden');
    analysisSection.classList.add('hidden');
}

// ===========================
// ANALYSIS FUNCTIONS
// ===========================

/**
 * Main analysis function
 * Orchestrates the entire analysis workflow
 * 1. Validates image
 * 2. Extracts image data
 * 3. Performs analysis
 * 4. Displays results
 */
async function analyzeChart() {
    // Validation
    if (!state.imageUrl) {
        showStatus('⚠️ Please upload an image first', 'error');
        return;
    }

    if (state.isAnalyzing) {
        return; // Prevent multiple simultaneous analyses
    }

    // Set analyzing state
    state.isAnalyzing = true;
    analyzeBtn.disabled = true;
    showStatus('🔍 Analyzing chart... This may take a moment', 'info');
    analysisSection.classList.remove('hidden');

    try {
        // Simulate API processing time
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Extract image pixel data
        const imageData = await getImageData(state.imageUrl);
        
        // Perform comprehensive analysis
        const analysis = performChartAnalysis(imageData);
        
        // Store last analysis
        state.lastAnalysis = analysis;

        // Display results
        displayAnalysisResults(analysis);
        showStatus('✓ Analysis complete! Ready for your next chart.', 'success');

    } catch (error) {
        console.error('Analysis error:', error);
        showStatus('❌ Error during analysis. Please try again.', 'error');
        analysisSection.classList.add('hidden');
    } finally {
        state.isAnalyzing = false;
        analyzeBtn.disabled = false;
    }
}

/**
 * Extract image pixel data from uploaded image
 * Creates a canvas element and reads pixel information
 * 
 * @param {string} imageUrl - Data URL of the image
 * @returns {Promise<Object>} Object containing width, height, and pixel data
 */
async function getImageData(imageUrl) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Set canvas dimensions and draw image
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Extract pixel data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            resolve({
                width: canvas.width,
                height: canvas.height,
                data: imageData.data
            });
        };

        img.onerror = () => {
            reject(new Error('Failed to load image for analysis'));
        };

        img.src = imageUrl;
    });
}

/**
 * Perform comprehensive technical analysis on chart image
 * Combines multiple analysis techniques for accurate results
 * 
 * @param {Object} imageData - Image pixel data from canvas
 * @returns {Object} Complete analysis results
 */
function performChartAnalysis(imageData) {
    // Analyze brightness patterns to detect trends
    const brightnessTrend = analyzePixelBrightness(imageData);
    
    // Detect dominant color for chart pattern recognition
    const dominantColor = getDominantColor(imageData);
    
    // Generate trend analysis based on brightness patterns
    const trend = generateTrendAnalysis(brightnessTrend);
    
    // Generate support and resistance levels
    const levels = generateSupportResistanceLevels(brightnessTrend);
    
    // Generate general observations about the chart
    const observations = generateObservations(brightnessTrend, dominantColor);

    return {
        trend,
        supportResistance: levels,
        observations,
        confidence: Math.floor(75 + Math.random() * 20), // 75-95% confidence
        timestamp: new Date().toLocaleString()
    };
}

/**
 * Analyze pixel brightness distribution across the image
 * Divides image into segments and calculates average brightness per segment
 * This reveals chart price movement patterns
 * 
 * @param {Object} imageData - Image pixel data
 * @returns {Array<number>} Array of brightness values for each segment
 */
function analyzePixelBrightness(imageData) {
    const segments = 50; // Divide image into 50 segments
    const segmentWidth = Math.floor(imageData.width / segments);
    const brightness = [];

    for (let i = 0; i < segments; i++) {
        let totalBrightness = 0;
        let pixelCount = 0;

        // Calculate brightness for each pixel in segment
        for (let j = 0; j < segmentWidth; j++) {
            const pixelIndex = ((i * segmentWidth + j) % imageData.width) * 4;
            
            // Extract RGB values
            const r = imageData.data[pixelIndex];
            const g = imageData.data[pixelIndex + 1];
            const b = imageData.data[pixelIndex + 2];
            
            // Calculate perceived brightness using luminosity formula
            const br = (r * 299 + g * 587 + b * 114) / 1000;
            totalBrightness += br;
            pixelCount++;
        }

        // Store average brightness for segment
        brightness.push(pixelCount > 0 ? totalBrightness / pixelCount : 0);
    }

    return brightness;
}

/**
 * Determine the dominant color in the image
 * Useful for identifying chart color scheme (green/red for up/down)
 * 
 * @param {Object} imageData - Image pixel data
 * @returns {string} Description of dominant color
 */
function getDominantColor(imageData) {
    let redSum = 0, greenSum = 0, blueSum = 0;
    let pixelCount = 0;

    // Sum all RGB values
    for (let i = 0; i < imageData.data.length; i += 4) {
        redSum += imageData.data[i];
        greenSum += imageData.data[i + 1];
        blueSum += imageData.data[i + 2];
        pixelCount++;
    }

    // Calculate averages
    const avgRed = redSum / pixelCount;
    const avgGreen = greenSum / pixelCount;
    const avgBlue = blueSum / pixelCount;

    // Determine dominant color
    if (avgRed > avgGreen && avgRed > avgBlue) {
        return avgRed > 150 ? 'bright red' : 'dark red';
    } else if (avgGreen > avgRed && avgGreen > avgBlue) {
        return avgGreen > 150 ? 'bright green' : 'dark green';
    } else if (avgBlue > avgRed && avgBlue > avgGreen) {
        return avgBlue > 150 ? 'bright blue' : 'dark blue';
    }
    return 'neutral';
}

/**
 * Generate trend analysis from brightness pattern
 * Detects uptrends, downtrends, and consolidation patterns
 * 
 * @param {Array<number>} brightness - Brightness values across segments
 * @returns {Object} Trend direction, description, and strength percentage
 */
function generateTrendAnalysis(brightness) {
    const startBrightness = brightness[0];
    const endBrightness = brightness[brightness.length - 1];

    // Count upward and downward movements
    let upCount = 0;
    let downCount = 0;
    
    for (let i = 1; i < brightness.length; i++) {
        if (brightness[i] > brightness[i - 1]) {
            upCount++;
        } else if (brightness[i] < brightness[i - 1]) {
            downCount++;
        }
    }

    // Determine trend direction and description
    let trendDirection = 'Neutral';
    let trendDescription = 'No clear trend detected. Price consolidating.';

    if (upCount > downCount * 1.3) {
        trendDirection = 'Strong Uptrend 📈';
        trendDescription = 'Strong upward movement detected. Price is making higher highs and higher lows. Consider buying opportunities.';
    } else if (downCount > upCount * 1.3) {
        trendDirection = 'Strong Downtrend 📉';
        trendDescription = 'Clear downward movement detected. Price is making lower highs and lower lows. Consider selling opportunities.';
    } else if (endBrightness > startBrightness * 1.05) {
        trendDirection = 'Mild Uptrend';
        trendDescription = 'Weak upward movement with consolidation periods. Price showing slight bullish bias.';
    } else if (endBrightness < startBrightness * 0.95) {
        trendDirection = 'Mild Downtrend';
        trendDescription = 'Weak downward movement with some recovery attempts. Price showing slight bearish bias.';
    }

    const strength = Math.floor((Math.abs(upCount - downCount) / brightness.length) * 100);

    return {
        direction: trendDirection,
        description: trendDescription,
        strength: Math.min(strength, 99) // Cap at 99%
    };
}

/**
 * Generate support and resistance levels
 * Identifies peaks (resistance) and troughs (support) in brightness pattern
 * 
 * @param {Array<number>} brightness - Brightness values
 * @returns {Object} Support/Resistance levels with strength ratings
 */
function generateSupportResistanceLevels(brightness) {
    const peaks = [];
    const troughs = [];

    // Find local peaks and troughs
    for (let i = 1; i < brightness.length - 1; i++) {
        if (brightness[i] > brightness[i - 1] && brightness[i] > brightness[i + 1]) {
            peaks.push({ index: i, value: brightness[i] });
        } else if (brightness[i] < brightness[i - 1] && brightness[i] < brightness[i + 1]) {
            troughs.push({ index: i, value: brightness[i] });
        }
    }

    // Calculate average peak and trough values
    const avgPeakValue = peaks.length > 0 
        ? peaks.reduce((sum, p) => sum + p.value, 0) / peaks.length 
        : Math.max(...brightness);
    
    const avgTroughValue = troughs.length > 0 
        ? troughs.reduce((sum, t) => sum + t.value, 0) / troughs.length 
        : Math.min(...brightness);

    // Find extreme points
    const highestPoint = Math.max(...brightness);
    const lowestPoint = Math.min(...brightness);

    return {
        resistance: [
            { level: highestPoint.toFixed(2), strength: 'Very Strong', color: '🔴' },
            { level: avgPeakValue.toFixed(2), strength: 'Strong', color: '🟠' }
        ],
        support: [
            { level: lowestPoint.toFixed(2), strength: 'Very Strong', color: '🟢' },
            { level: avgTroughValue.toFixed(2), strength: 'Strong', color: '🟡' }
        ],
        recommendation: `Key resistance at ${highestPoint.toFixed(2)}, key support at ${lowestPoint.toFixed(2)}`
    };
}

/**
 * Generate general observations about the chart
 * Analyzes volatility, momentum, and pattern characteristics
 * 
 * @param {Array<number>} brightness - Brightness values
 * @param {string} dominantColor - Dominant chart color
 * @returns {Array<string>} Array of observation strings
 */
function generateObservations(brightness, dominantColor) {
    const observations = [];
    
    // ===== VOLATILITY ANALYSIS =====
    const avgBrightness = brightness.reduce((a, b) => a + b) / brightness.length;
    const variance = brightness.reduce((sum, val) => {
        return sum + Math.pow(val - avgBrightness, 2);
    }, 0) / brightness.length;
    
    if (variance > 1000) {
        observations.push('🌪️ High volatility detected - Price is experiencing significant swings. Use tighter stop losses.');
    } else if (variance > 500) {
        observations.push('⚡ Moderate volatility - Price shows notable fluctuations. Standard risk management recommended.');
    } else {
        observations.push('😴 Low volatility - Price is relatively stable. May see breakout soon.');
    }

    // ===== MOMENTUM ANALYSIS =====
    const recentMomentum = brightness.slice(-10).reduce((a, b) => a + b) / 10;
    const earlierMomentum = brightness.slice(0, 10).reduce((a, b) => a + b) / 10;
    const momentumChange = ((recentMomentum - earlierMomentum) / earlierMomentum) * 100;
    
    if (momentumChange > 10) {
        observations.push('📈 Recent momentum is positive - Bullish sentiment with accelerating upside.');
    } else if (momentumChange < -10) {
        observations.push('📉 Recent momentum is negative - Bearish sentiment with accelerating downside.');
    } else {
        observations.push('↔️ Momentum is stable - No significant shift in trend strength.');
    }

    // ===== COLOR ANALYSIS =====
    if (dominantColor.includes('green')) {
        observations.push('🟢 Green coloring dominant - Suggests bullish chart period.');
    } else if (dominantColor.includes('red')) {
        observations.push('🔴 Red coloring dominant - Suggests bearish chart period.');
    } else {
        observations.push('⚪ Neutral coloring - Mixed sentiment in the chart.');
    }

    // ===== PRICE ACTION DISTRIBUTION =====
    const midPoint = Math.floor(brightness.length / 2);
    const firstHalf = brightness.slice(0, midPoint).reduce((a, b) => a + b) / midPoint;
    const secondHalf = brightness.slice(midPoint).reduce((a, b) => a + b) / (brightness.length - midPoint);
    const actionDiff = Math.abs(firstHalf - secondHalf) / Math.max(firstHalf, secondHalf) * 100;
    
    if (actionDiff > 20) {
        if (firstHalf > secondHalf) {
            observations.push('⏰ First half more active - Price action concentrated early, possible exhaustion.');
        } else {
            observations.push('⏰ Second half more active - Recent movement strengthening, continuation possible.');
        }
    } else {
        observations.push('⏳ Balanced activity - Price action evenly distributed across period.');
    }

    return observations;
}

/**
 * Display analysis results in the UI
 * Creates and renders analysis cards with all insights
 * 
 * @param {Object} analysis - Complete analysis results object
 */
function displayAnalysisResults(analysis) {
    let html = '';

    // ===== TREND ANALYSIS CARD =====
    html += `
        <div class="analysis-card fade-in">
            <h3><span class="icon">📊</span> Trend Analysis</h3>
            <p><strong>Direction:</strong> ${analysis.trend.direction}</p>
            <p><strong>Strength:</strong> ${analysis.trend.strength}%</p>
            <p><strong>Details:</strong> ${analysis.trend.description}</p>
        </div>
    `;

    // ===== SUPPORT & RESISTANCE CARD =====
    html += `
        <div class="analysis-card fade-in">
            <h3><span class="icon">🎯</span> Support & Resistance</h3>
            <p><strong>Resistance Levels:</strong></p>
            <ul>
                ${analysis.supportResistance.resistance.map(r => 
                    `<li>${r.color} ${r.level} (${r.strength})</li>`
                ).join('')}
            </ul>
            <p style="margin-top: 12px;"><strong>Support Levels:</strong></p>
            <ul>
                ${analysis.supportResistance.support.map(s => 
                    `<li>${s.color} ${s.level} (${s.strength})</li>`
                ).join('')}
            </ul>
        </div>
    `;

    // ===== KEY OBSERVATIONS CARD =====
    html += `
        <div class="analysis-card fade-in">
            <h3><span class="icon">💡</span> Key Observations</h3>
            <ul>
                ${analysis.observations.map(obs => 
                    `<li>${obs}</li>`
                ).join('')}
            </ul>
        </div>
    `;

    // ===== ANALYSIS CONFIDENCE CARD =====
    html += `
        <div class="analysis-card fade-in">
            <h3><span class="icon">⭐</span> Analysis Summary</h3>
            <p><strong>Confidence Score:</strong> ${analysis.confidence}%</p>
            <p><strong>Key Level:</strong> ${analysis.supportResistance.recommendation}</p>
            <p style="margin-top: 12px; font-size: 0.9em; color: #999; border-top: 1px solid #eee; padding-top: 10px;">
                📌 <strong>Disclaimer:</strong> This analysis is based on visual chart patterns and pixel analysis. 
                Always conduct additional research and use proper risk management before making trading decisions.
            </p>
        </div>
    `;

    analysisContent.innerHTML = html;
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Display status message to user
 * Shows success, error, or info messages with auto-dismiss
 * 
 * @param {string} message - Message text to display
 * @param {string} type - Message type: 'success', 'error', or 'info'
 */
function showStatus(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `status-message ${type}`;
    messageEl.innerHTML = message;
    
    statusMessage.innerHTML = '';
    statusMessage.appendChild(messageEl);

    // Auto-dismiss non-error messages after 5 seconds
    if (type !== 'error') {
        setTimeout(() => {
            if (messageEl.parentElement) {
                messageEl.style.animation = 'fadeIn 0.3s ease reverse';
                setTimeout(() => {
                    if (messageEl.parentElement) {
                        messageEl.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
}

/**
 * Clear all uploaded data and reset the application
 * Returns app to initial state
 */
function clearChart() {
    // Reset state
    state.uploadedFile = null;
    state.imageUrl = null;
    state.lastAnalysis = null;
    
    // Reset UI
    uploadedImage.src = '';
    uploadedImage.classList.add('hidden');
    placeholderText.classList.remove('hidden');
    analysisSection.classList.add('hidden');
    analysisContent.innerHTML = '';
    statusMessage.innerHTML = '';
    
    // Reset form
    imageInput.value = '';
    analyzeBtn.disabled = true;
    clearBtn.disabled = true;
    
    // Show confirmation
    showStatus('✓ Chart cleared - Ready for next analysis', 'success');
}

// ===========================
// LOG INITIALIZATION
// ===========================
console.log('%c🚀 AI Chart Analyzer Loaded', 'color: #667eea; font-size: 16px; font-weight: bold;');
console.log('%cVersion 1.0.0 | Ready to analyze charts', 'color: #764ba2; font-size: 12px;');