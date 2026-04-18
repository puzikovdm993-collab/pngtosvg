// PNG to SVG Converter - Client-side implementation using ImageTracer.js library

class PNGToSVGConverter {
    constructor() {
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
                this.currentImageData = e.target.result; // Store data URL for ImageTracer
                this.previewContainer.style.display = 'grid';
                this.controls.style.display = 'block';
                this.downloadBtn.disabled = true;
                this.svgPreview.innerHTML = '';
                // Скрываем зону загрузки после успешной загрузки файла
                this.uploadArea.style.display = 'none';
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
                const ltres = parseFloat(this.thresholdSlider.value) / 100;
                const qtres = parseFloat(this.thresholdSlider.value) / 100;
                const numberOfColors = parseInt(this.scaleSlider.value) * 4;
                
                // Настройки для ImageTracer.js
                const options = {
                    ltres: ltres, // Linear error threshold
                    qtres: qtres, // Quadratic error threshold
                    pathomit: 8, // Ignore small paths
                    colorsampling: 2, // 0: disabled, 1: random, 2: deterministic
                    numberofcolors: numberOfColors, // Number of colors to use
                    mincolorratio: 0,
                    colorquantcycles: 3,
                    scale: 1,
                    simplify: 0,
                    strokewidth: 0,
                    linefilter: false,
                    viewbox: true
                };

                // Используем библиотеку ImageTracer для конвертации
                ImageTracer.imageToSVG(
                    this.currentImageData,
                    (svgString) => {
                        this.currentSVG = svgString;
                        this.svgPreview.innerHTML = svgString;
                        this.downloadBtn.disabled = false;
                        this.showStatus('Конвертация завершена успешно!', 'success');
                        this.convertBtn.disabled = false;
                    },
                    options
                );
            } catch (error) {
                this.showStatus('Ошибка конвертации: ' + error.message, 'error');
                this.convertBtn.disabled = false;
            }
        }, 100);
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
