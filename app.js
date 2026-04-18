// PNG to SVG Converter - Client-side implementation using ImageTracer.js library

class PNGToSVGConverter {
    constructor() {
        this.currentImageData = null;
        this.currentSVG = null;
        
        // DOM Elements
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.uploadContent = document.getElementById('uploadContent');
        this.previewOriginal = document.getElementById('previewOriginal');
        this.controlsPanel = document.getElementById('controlsPanel');
        this.resultArea = document.getElementById('resultArea');
        this.svgContainer = document.getElementById('svgContainer');
        this.convertBtn = document.getElementById('convertBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.alphaThreshold = document.getElementById('alphaThreshold');
        this.scale = document.getElementById('scale');
        this.colors = document.getElementById('colors');
        this.detail = document.getElementById('detail');
        
        this.init();
    }
    
    init() {
        // Event listeners
        this.dropZone.addEventListener('click', (e) => {
            if (!this.currentImageData) {
                this.fileInput.click();
            }
        });
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('dragover');
        });
        
        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('dragover');
        });
        
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processFile(files[0]);
            }
        });
        
        // Controls
        this.convertBtn.addEventListener('click', () => this.convert());
        this.downloadBtn.addEventListener('click', () => this.downloadSVG());
        this.resetBtn.addEventListener('click', () => this.reset());
    }
    
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }
    
    processFile(file) {
        if (!file.type.match('image/png')) {
            alert('Пожалуйста, выберите PNG файл');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.previewOriginal.src = e.target.result;
                this.currentImageData = e.target.result;
                
                // Hide upload content, show image
                this.uploadContent.classList.add('hidden');
                this.previewOriginal.classList.remove('hidden');
                this.dropZone.classList.add('has-image');
                
                // Show controls
                this.controlsPanel.classList.remove('hidden');
                this.downloadBtn.disabled = true;
                this.resultArea.classList.add('hidden');
                this.svgContainer.innerHTML = '<span class="placeholder-text">Нажмите "Конвертировать"</span>';
                
                // Update original image in result area
                const originalImageEl = document.getElementById('originalImage');
                if (originalImageEl) {
                    originalImageEl.src = e.target.result;
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    convert() {
        if (!this.currentImageData) {
            alert('Сначала загрузите изображение');
            return;
        }
        
        this.convertBtn.disabled = true;
        this.convertBtn.textContent = 'Конвертация...';
        
        // Use setTimeout to allow UI to update
        setTimeout(() => {
            try {
                const alphaThreshold = parseInt(this.alphaThreshold.value);
                const scale = parseFloat(this.scale.value);
                const numberOfColors = parseInt(this.colors.value);
                const detail = parseInt(this.detail.value);
                
                // Настройки для ImageTracer.js
                const options = {
                    ltres: detail / 10,
                    qtres: detail / 10,
                    pathomit: 8,
                    colorsampling: 2,
                    numberofcolors: numberOfColors,
                    mincolorratio: 0,
                    colorquantcycles: 3,
                    scale: scale,
                    simplify: 0,
                    strokewidth: 0,
                    linefilter: false,
                    viewbox: true,
                    blurradius: detail * 2,
                    blurdelta: 20
                };

                // Используем библиотеку ImageTracer для конвертации
                ImageTracer.imageToSVG(
                    this.currentImageData,
                    (svgString) => {
                        this.currentSVG = svgString;
                        this.svgContainer.innerHTML = svgString;
                        this.downloadBtn.disabled = false;
                        this.resultArea.classList.remove('hidden');
                        this.convertBtn.disabled = false;
                        this.convertBtn.textContent = 'Конвертировать';
                    },
                    options
                );
            } catch (error) {
                alert('Ошибка конвертации: ' + error.message);
                this.convertBtn.disabled = false;
                this.convertBtn.textContent = 'Конвертировать';
            }
        }, 100);
    }
    
    downloadSVG() {
        if (!this.currentSVG) {
            alert('Нет SVG для скачивания');
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
    }
    
    reset() {
        this.currentImageData = null;
        this.currentSVG = null;
        this.fileInput.value = '';
        this.previewOriginal.src = '';
        this.svgContainer.innerHTML = '';
        
        // Reset UI
        this.uploadContent.classList.remove('hidden');
        this.previewOriginal.classList.add('hidden');
        this.dropZone.classList.remove('has-image');
        this.controlsPanel.classList.add('hidden');
        this.resultArea.classList.add('hidden');
        this.downloadBtn.disabled = true;
        this.convertBtn.disabled = false;
        this.convertBtn.textContent = 'Конвертировать';
        
        // Reset sliders
        this.alphaThreshold.value = 128;
        this.scale.value = 1;
        this.colors.value = 16;
        this.detail.value = 1;
    }
}

// Initialize the converter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PNGToSVGConverter();
});
