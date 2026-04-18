// PNG to SVG Converter - Client-side implementation
// Uses pixel tracing to convert PNG to SVG

class PNGToSVGConverter {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.currentImageData = null;
        this.currentSVG = null;
        
        // DOM Elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.previewContainer = document.getElementById('previewContainer');
        this.originalImage = document.getElementById('originalImage');
        this.svgPreview = document.getElementById('svgPreview');
        this.controls = document.getElementById('controls');
        this.convertBtn = document.getElementById('convertBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.thresholdSlider = document.getElementById('threshold');
        this.scaleSlider = document.getElementById('scale');
        this.thresholdValue = document.getElementById('thresholdValue');
        this.scaleValue = document.getElementById('scaleValue');
        this.status = document.getElementById('status');
        
        this.init();
    }
    
    init() {
        // Event listeners
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });
        
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });
        
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processFile(files[0]);
            }
        });
        
        // Controls
        this.convertBtn.addEventListener('click', () => this.convert());
        this.downloadBtn.addEventListener('click', () => this.downloadSVG());
        
        this.thresholdSlider.addEventListener('input', (e) => {
            this.thresholdValue.textContent = e.target.value;
        });
        
        this.scaleSlider.addEventListener('input', (e) => {
            this.scaleValue.textContent = e.target.value;
        });
    }
    
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }
    
    processFile(file) {
        if (!file.type.match('image/png')) {
            this.showStatus('Пожалуйста, выберите PNG файл', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage.src = e.target.result;
                this.currentImageData = img;
                this.previewContainer.style.display = 'grid';
                this.controls.style.display = 'block';
                this.downloadBtn.disabled = true;
                this.svgPreview.innerHTML = '';
                this.showStatus('Файл загружен. Нажмите "Конвертировать"', 'info');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    convert() {
        if (!this.currentImageData) {
            this.showStatus('Сначала загрузите изображение', 'error');
            return;
        }
        
        this.showStatus('<span class="loading"></span>Конвертация...', 'info');
        this.convertBtn.disabled = true;
        
        // Use setTimeout to allow UI to update
        setTimeout(() => {
            try {
                const threshold = parseInt(this.thresholdSlider.value);
                const scale = parseFloat(this.scaleSlider.value);
                
                const svg = this.imageToSVG(this.currentImageData, threshold, scale);
                this.currentSVG = svg;
                
                this.svgPreview.innerHTML = svg;
                this.downloadBtn.disabled = false;
                this.showStatus('Конвертация завершена успешно!', 'success');
            } catch (error) {
                this.showStatus('Ошибка конвертации: ' + error.message, 'error');
            } finally {
                this.convertBtn.disabled = false;
            }
        }, 100);
    }
    
    imageToSVG(img, threshold, scale) {
        // Set canvas size
        const width = Math.floor(img.width * scale);
        const height = Math.floor(img.height * scale);
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Draw image on canvas
        this.ctx.drawImage(img, 0, 0, width, height);
        
        // Get image data
        const imageData = this.ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;
        
        // Create SVG with rectangles for each visible pixel
        const paths = this.createPixelSVG(pixels, width, height, threshold);
        
        // Build SVG string
        const svgContent = paths.join('\n');
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
${svgContent}
</svg>`;
    }
    
    traceShape(pixels, width, height, startX, startY, visited, threshold) {
        // Simple flood fill based shape detection
        const stack = [[startX, startY]];
        const points = [];
        const startIdx = (startY * width + startX) * 4;
        const baseAlpha = pixels[startIdx + 3];
        
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const idx = (y * width + x) * 4;
            
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            if (visited[y * width + x]) continue;
            if (pixels[idx + 3] < 128) continue;
            
            visited[y * width + x] = true;
            points.push({ x, y });
            
            // Check neighbors
            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }
        
        if (points.length === 0) return null;
        
        // Convert points to SVG path
        return this.pointsToPath(points);
    }
    
    pointsToPath(points) {
        if (points.length === 0) return '';
        
        // Sort points to create a coherent path
        // Simple approach: use convex hull or just connect all points
        
        // For simplicity, create rectangles for each point (pixel art style)
        // This is not optimal but works for basic conversion
        
        // Better approach: find bounding box and create a rectangle
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const point of points) {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        }
        
        const w = maxX - minX + 1;
        const h = maxY - minY + 1;
        
        return `M ${minX} ${minY} L ${minX + w} ${minY} L ${minX + w} ${minY + h} L ${minX} ${minY + h} Z`;
    }
    
    createPixelSVG(pixels, width, height, threshold) {
        const rects = [];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const alpha = pixels[idx + 3];
                
                if (alpha > threshold) {
                    const r = pixels[idx];
                    const g = pixels[idx + 1];
                    const b = pixels[idx + 2];
                    
                    rects.push(
                        `<rect x="${x}" y="${y}" width="1" height="1" fill="rgb(${r},${g},${b})"/>`
                    );
                }
            }
        }
        
        return rects;
    }
    
    downloadSVG() {
        if (!this.currentSVG) {
            this.showStatus('Нет SVG для скачивания', 'error');
            return;
        }
        
        const blob = new Blob([this.currentSVG], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted-image.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showStatus('SVG файл скачан!', 'success');
    }
    
    showStatus(message, type) {
        this.status.innerHTML = message;
        this.status.className = 'status ' + type;
    }
}

// Initialize the converter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PNGToSVGConverter();
});
