    document.addEventListener('DOMContentLoaded', function() {
        // Main Elements
        const imageUpload = document.getElementById('imageUpload');
        const loadedFileNameEl = document.getElementById('loadedFileName');
        const imageSelectorContainer = document.getElementById('imageSelectorContainer');
        const imageSelectorList = document.getElementById('imageSelectorList');
        const imageCanvas = document.getElementById('imageCanvas');
        const ctx = imageCanvas.getContext('2d');
        const drawingCanvas = document.getElementById('drawingCanvas');
        const drawCtx = drawingCanvas.getContext('2d');
        const canvasMessage = document.getElementById('canvasMessage');
        const notificationArea = document.getElementById('notificationArea');

        // Header & Info
        const undoButton = document.getElementById('undoButton');
        const resetImageBtn = document.getElementById('resetImage');
        const activeImageNameEl = document.getElementById('activeImageName');
        const originalDimensionsEl = document.getElementById('originalDimensions');
        const originalFileSizeEl = document.getElementById('originalFileSize');
        const currentDimensionsEl = document.getElementById('currentDimensions');

        const togglePanelBtn = document.getElementById('togglePanelBtn');
        const controlPanel = document.getElementById('controlPanel');

        // Tabs
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        // Resize Tab
        const resizePercent = document.getElementById('resizePercent');
        const resizePercentValue = document.getElementById('resizePercentValue');
        const resizeWidthInput = document.getElementById('resizeWidth'); 
        const resizeHeightInput = document.getElementById('resizeHeight'); 
        const aspectLock = document.getElementById('aspectLock');
        const applyResizeBtn = document.getElementById('applyResize');

        // Crop Tab
        const aspectRatioSelect = document.getElementById('aspectRatio');
        const cropWidthEl = document.getElementById('cropWidth');
        const cropHeightEl = document.getElementById('cropHeight');
        const startCropBtn = document.getElementById('startCrop');
        const applyCropBtn = document.getElementById('applyCrop');
        const cancelCropBtn = document.getElementById('cancelCrop');

        // Adjust Tab
        const rotateLeftBtn = document.getElementById('rotateLeft');
        const rotateRightBtn = document.getElementById('rotateRight');
        const flipHorizontalBtn = document.getElementById('flipHorizontal');
        const flipVerticalBtn = document.getElementById('flipVertical');
        const brightnessSlider = document.getElementById('brightness');
        const brightnessValue = document.getElementById('brightnessValue');
        const contrastSlider = document.getElementById('contrast');
        const contrastValue = document.getElementById('contrastValue');
        const saturationSlider = document.getElementById('saturation');
        const saturationValue = document.getElementById('saturationValue');
        const grayscaleSlider = document.getElementById('grayscale');
        const grayscaleValue = document.getElementById('grayscaleValue');
        const applyAdjustmentsBtn = document.getElementById('applyAdjustments');
        const resetAdjustmentsBtn = document.getElementById('resetAdjustments');

        // Draw Tab
        const penToolBtn = document.getElementById('penTool');
        const arrowToolBtn = document.getElementById('arrowTool');
        const drawColorInput = document.getElementById('drawColor');
        const lineWidthSlider = document.getElementById('lineWidth');
        const lineWidthValue = document.getElementById('lineWidthValue');
        const startDrawBtn = document.getElementById('startDraw');
        const applyDrawBtn = document.getElementById('applyDraw');
        const cancelDrawBtn = document.getElementById('cancelDraw');

        // Optimize Tab
        const optimizeWebBtn = document.getElementById('optimizeWeb');
        const optimizeShopifyBtn = document.getElementById('optimizeShopify');
        const optimizeFirebaseBtn = document.getElementById('optimizeFirebase');
        const optimizeLoader = document.getElementById('optimizeLoader');

        // Export Tab
        const fileNameInput = document.getElementById('fileName');
        const fileFormatSelect = document.getElementById('fileFormat');
        const qualityContainer = document.getElementById('qualityContainer');
        const qualitySlider = document.getElementById('quality');
        const qualityValue = document.getElementById('qualityValue');
        const targetFileSizeInput = document.getElementById('targetFileSize');
        const downloadActiveButton = document.getElementById('downloadActiveButton');
        const downloadAllButton = document.getElementById('downloadAllButton');
        const exportLoader = document.getElementById('exportLoader');
        const exportMessage = document.getElementById('exportMessage');

        // Zoom Controls
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const zoomResetBtn = document.getElementById('zoomResetBtn');
        const zoomLevelDisplay = document.getElementById('zoomLevelDisplay');
       
        // State Variables
        let imageStore = [];
        let activeImageIndex = -1; 
        let currentZoomLevel = 1.0;
        const ZOOM_STEP = 0.1;

        let isCropping = false;
        let cropRect = { x: 0, y: 0, width: 0, height: 0 };
        let cropSelectionDiv = null;
        let cropHandles = [];
        let cropGridLines = [];
        let dragInfo = { active: false, target: null, startX: 0, startY: 0, originalRect: {} };

        let isDrawing = false;
        let isPainting = false;
        let drawingTool = 'pen'; // 'pen' or 'arrow'
        let lastPaintPoint = { x: 0, y: 0 };
        let startPaintPoint = { x: 0, y: 0 };

        let tempFilters = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 };

        // --- INITIALIZATION ---
        disableAllControls(); 
        setupTabs(); 
        updateQualityVisibility();
        updatePanelVisibilityForViewport();

        function toggleControlPanel() {
            controlPanel.classList.toggle('hidden');
            togglePanelBtn.textContent = controlPanel.classList.contains('hidden') ? 'Show Tools' : 'Hide Tools';
        }

        togglePanelBtn.addEventListener('click', toggleControlPanel);
        togglePanelBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            toggleControlPanel();
        }, { passive: false });

        window.addEventListener('resize', updatePanelVisibilityForViewport);

        // --- UTILITY FUNCTIONS ---
        function showNotification(message, type = 'success', duration = 3000) {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            notificationArea.appendChild(notification);
            void notification.offsetWidth; 
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                notification.classList.add('fade-out');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 500); 
            }, duration);
        }

        function formatBytes(bytes, decimals = 2) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }

        function dataURLtoBlob(dataurl) { return fetch(dataurl).then(res => res.blob()); }
       
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => { clearTimeout(timeout); func(...args); };
                clearTimeout(timeout); timeout = setTimeout(later, wait);
            };
        }

        // --- STATE MANAGEMENT (Undo/Redo) ---
        function saveState(operationName = "Unknown operation") {
            if (activeImageIndex === -1 || !imageStore[activeImageIndex]) return;
            const activeImgData = imageStore[activeImageIndex];
           
            if (activeImgData.historyPointer < activeImgData.history.length - 1) {
                activeImgData.history = activeImgData.history.slice(0, activeImgData.historyPointer + 1);
            }

            const currentStateSrc = activeImgData.current.src;
            if (activeImgData.history.length > 0 && activeImgData.history[activeImgData.history.length - 1] === currentStateSrc) {
                return;
            }

            activeImgData.history.push(currentStateSrc);
            activeImgData.historyPointer = activeImgData.history.length - 1;
            undoButton.disabled = activeImgData.historyPointer <= 0;
        }

        undoButton.addEventListener('click', () => {
            if (activeImageIndex === -1 || !imageStore[activeImageIndex]) return;
            const activeImgData = imageStore[activeImageIndex];

            if (activeImgData.historyPointer > 0) {
                activeImgData.historyPointer--;
                const previousStateSrc = activeImgData.history[activeImgData.historyPointer];
                const img = new Image();
                img.onload = () => {
                    activeImgData.current = img;
                    setActiveImage(activeImageIndex, false); 
                    showNotification('Undo successful.', 'success', 1500);
                };
                img.onerror = () => showNotification('Error loading previous state.', 'error');
                img.src = previousStateSrc;
                undoButton.disabled = activeImgData.historyPointer <= 0;
            }
        });
       
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (!undoButton.disabled) {
                    e.preventDefault();
                    undoButton.click();
                }
            }
        });

        // --- UI SETUP & CONTROL ---
        function setupTabs() {
            const activeClasses = ['bg-blue-500', 'text-white']; 
            const inactiveClasses = ['text-gray-400', 'hover:text-gray-200', 'hover:bg-gray-700'];

            tabButtons.forEach(button => {
                if (button.classList.contains('active')) {
                    button.classList.add(...activeClasses);
                    button.classList.remove(...inactiveClasses);
                } else {
                    button.classList.add(...inactiveClasses);
                    button.classList.remove(...activeClasses);
                }

                button.addEventListener('click', () => {
                    tabButtons.forEach(btn => {
                        btn.classList.remove('active', ...activeClasses);
                        btn.classList.add(...inactiveClasses);
                    });
                    button.classList.add('active', ...activeClasses);
                    button.classList.remove(...inactiveClasses);
                   
                    tabContents.forEach(content => content.classList.remove('active'));
                    document.getElementById(`tab-${button.dataset.tab}`).classList.add('active');
                   
                    if (button.dataset.tab !== 'crop' && isCropping) cancelCropMode();
                    if (button.dataset.tab !== 'draw' && isDrawing) cancelDrawMode();
                    if (button.dataset.tab !== 'adjust') {
                        resetTempAdjustmentFilters(false); 
                    } else {
                        if (activeImageIndex !== -1) {
                            drawImageToCanvasWithFilters(imageStore[activeImageIndex].current, tempFilters);
                        }
                    }
                });
            });
        }

        function disableAllControls() { 
            const controls = [
                applyResizeBtn, startCropBtn, applyCropBtn, cancelCropBtn, downloadActiveButton, 
                downloadAllButton, resetImageBtn, undoButton, rotateLeftBtn, rotateRightBtn,
                flipHorizontalBtn, flipVerticalBtn, applyAdjustmentsBtn, resetAdjustmentsBtn,
                resizePercent, resizeWidthInput, resizeHeightInput, aspectLock, fileNameInput, 
                fileFormatSelect, qualitySlider, targetFileSizeInput, aspectRatioSelect,
                brightnessSlider, contrastSlider, saturationSlider, grayscaleSlider,
                penToolBtn, arrowToolBtn, drawColorInput, lineWidthSlider, startDrawBtn,
                applyDrawBtn, cancelDrawBtn, optimizeWebBtn, optimizeShopifyBtn, optimizeFirebaseBtn
            ];
            controls.forEach(el => el.disabled = true);
        }

        function enableAllControls() { 
            if (activeImageIndex === -1 || !imageStore[activeImageIndex]) return; 
            const activeImgData = imageStore[activeImageIndex];
           
            const controls = [
                applyResizeBtn, downloadActiveButton, resetImageBtn, rotateLeftBtn, rotateRightBtn,
                flipHorizontalBtn, flipVerticalBtn, applyAdjustmentsBtn, resetAdjustmentsBtn,
                resizePercent, resizeWidthInput, resizeHeightInput, aspectLock, fileNameInput, 
                fileFormatSelect, qualitySlider, targetFileSizeInput, aspectRatioSelect,
                brightnessSlider, contrastSlider, saturationSlider, grayscaleSlider,
                penToolBtn, arrowToolBtn, drawColorInput, lineWidthSlider, startDrawBtn,
                optimizeWebBtn, optimizeShopifyBtn, optimizeFirebaseBtn
            ];

            controls.forEach(el => el.disabled = false);

            startCropBtn.disabled = false; 
            downloadAllButton.disabled = imageStore.length === 0; 
            undoButton.disabled = activeImgData.historyPointer <= 0;
        }
       
        // --- IMAGE LOADING (UPLOAD & PASTE) ---
        document.addEventListener('paste', async (e) => {
            e.preventDefault();
            const items = (e.clipboardData || window.clipboardData).items;
            let file = null;
            for (const item of items) {
                if (item.type.indexOf('image') === 0) {
                    file = item.getAsFile();
                    break;
                }
            }
            if (file) {
                showNotification('Pasted image detected!', 'info', 2000);
                await handleFiles([file]);
            } else {
                showNotification('No image found in clipboard.', 'warning');
            }
        });

        imageUpload.addEventListener('change', async (event) => {
            const files = event.target.files;
            if (!files || files.length === 0) return;
            await handleFiles(Array.from(files));
        });

        async function handleFiles(files) {
            if (!files || files.length === 0) {
                disableAllControls();
                imageSelectorContainer.classList.add('hidden');
                imageSelectorList.innerHTML = '';
                loadedFileNameEl.textContent = '';
                imageStore = [];
                activeImageIndex = -1;
                drawImageToCanvas(null); 
                updateDimensionDisplaysForActive();
                return;
            }

            imageStore = [];
            imageSelectorList.innerHTML = ''; 
            canvasMessage.innerHTML = '<div class="loader"></div><p class="mt-2">Loading images...</p>';
            canvasMessage.classList.remove('hidden');
            ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
            disableAllControls(); 

            let loadPromises = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                const promise = new Promise((resolve, reject) => {
                    reader.onload = (e) => {
                        const originalImg = new Image();
                        originalImg.onload = () => {
                            const currentImg = new Image(); 
                            currentImg.onload = () => {
                                const initialStateSrc = currentImg.src; 
                                resolve({ 
                                    id: `img-${Date.now()}-${i}`, 
                                    original: originalImg, 
                                    current: currentImg, 
                                    history: [initialStateSrc], 
                                    historyPointer: 0,     
                                    name: file.name.split('.')[0].replace(/[^a-zA-Z0-9_-]/g, '_') || `pasted_image_${i}`,
                                    ext: file.name.split('.').pop().toLowerCase() || 'png',
                                    originalFileSizeBytes: file.size
                                });
                            };
                            currentImg.onerror = () => reject(new Error(`Failed to load current state for ${file.name}`));
                            currentImg.src = e.target.result; 
                        };
                        originalImg.onerror = () => reject(new Error(`Failed to load original ${file.name}`));
                        originalImg.src = e.target.result;
                    };
                    reader.onerror = () => reject(new Error(`FileReader error for ${file.name}`));
                    reader.readAsDataURL(file);
                });
                loadPromises.push(promise);
            }

            try {
                imageStore = await Promise.all(loadPromises);
                populateImageSelector();
                if (imageStore.length > 0) {
                    setActiveImage(0, false); 
                    loadedFileNameEl.textContent = files.length > 1 ? `${files.length} files loaded` : files[0].name;
                } else {
                    canvasMessage.innerHTML = '<p>Upload image(s) to start editing.</p>';
                    activeImageIndex = -1;
                    updateDimensionDisplaysForActive(); 
                }
            } catch (error) {
                console.error("Error loading images:", error);
                showNotification(`Error loading images: ${error.message}`, 'error');
                canvasMessage.innerHTML = '<p>Error loading images. Please try again.</p>';
            }
        }

        function populateImageSelector() {
            imageSelectorList.innerHTML = '';
            if (imageStore.length > 1) { 
                imageStore.forEach((imgData, index) => {
                    const button = document.createElement('button');
                    button.textContent = `${imgData.name}.${imgData.ext}`;
                    button.onclick = () => setActiveImage(index, false); 
                    imageSelectorList.appendChild(button);
                });
                imageSelectorContainer.classList.remove('hidden');
            } else {
                imageSelectorContainer.classList.add('hidden');
            }
        }

        function setActiveImage(index, shouldSaveState = true) {
            if (index < 0 || index >= imageStore.length) return;
           
            if (isCropping) cancelCropMode(); 
            if (isDrawing) cancelDrawMode();

            activeImageIndex = index;

            Array.from(imageSelectorList.children).forEach((btn, i) => {
                btn.classList.toggle('active-image', i === activeImageIndex);
            });
           
            const activeImgData = imageStore[activeImageIndex];
            if (imageStore.length === 1) { 
                loadedFileNameEl.textContent = `${activeImgData.name}.${activeImgData.ext}`;
            }

            resetTempAdjustmentFilters(false); 
            drawImageToCanvasWithFilters(activeImgData.current, tempFilters); 
            updateDimensionDisplaysForActive();
            resetResizeControlsForActive();
            resetAdjustmentControls(); 
            fileNameInput.value = `${activeImgData.name}_edited`; 
            enableAllControls(); 
            canvasMessage.classList.add('hidden');
            currentZoomLevel = 1.0; 
            applyZoom();

            undoButton.disabled = activeImgData.historyPointer <= 0;
        }
       
        // --- CANVAS DRAWING & ZOOM ---
        function drawImageToCanvas(imageToDraw, zoom = currentZoomLevel, filters = null) {
            if (!imageToDraw) {
                ctx.clearRect(0,0,imageCanvas.width, imageCanvas.height);
                canvasMessage.classList.remove('hidden');
                canvasMessage.innerHTML = '<p>No image selected or loaded.</p>';
                imageCanvas.style.transform = `scale(1)`;
                imageCanvas.style.width = 'auto';
                imageCanvas.style.height = 'auto';
                return;
            }
            canvasMessage.classList.add('hidden');
            const localCanvasContainer = document.querySelector('.canvas-container'); 
            if (!localCanvasContainer) { console.error("drawImageToCanvas: .canvas-container not found!"); return; }

            const containerWidth = localCanvasContainer.clientWidth;
            const containerHeight = localCanvasContainer.clientHeight;
           
            let baseDrawWidth = imageToDraw.width;
            let baseDrawHeight = imageToDraw.height;
            const imageAspectRatio = baseDrawWidth / baseDrawHeight;
           
            let displayWidth, displayHeight;
            if (containerWidth / containerHeight > imageAspectRatio) {
                displayHeight = containerHeight;
                displayWidth = displayHeight * imageAspectRatio;
            } else {
                displayWidth = containerWidth;
                displayHeight = displayWidth / imageAspectRatio;
            }
           
            imageCanvas.width = Math.round(baseDrawWidth); 
            imageCanvas.height = Math.round(baseDrawHeight);

            imageCanvas.style.width = `${Math.round(displayWidth)}px`;
            imageCanvas.style.height = `${Math.round(displayHeight)}px`;
            imageCanvas.style.transformOrigin = 'center center'; 
            imageCanvas.style.transform = `scale(${zoom})`;


            ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);

            let filterString = '';
            if (filters) {
                if (filters.brightness !== 100) filterString += `brightness(${filters.brightness}%) `;
                if (filters.contrast !== 100) filterString += `contrast(${filters.contrast}%) `;
                if (filters.saturation !== 100) filterString += `saturate(${filters.saturation}%) `;
                if (filters.grayscale !== 0) filterString += `grayscale(${filters.grayscale}%) `;
            }
            ctx.filter = filterString.trim();
            ctx.drawImage(imageToDraw, 0, 0, imageCanvas.width, imageCanvas.height);
            ctx.filter = 'none'; 

            // Sync drawing canvas
            const rect = imageCanvas.getBoundingClientRect();
            drawingCanvas.style.width = `${rect.width}px`;
            drawingCanvas.style.height = `${rect.height}px`;
            drawingCanvas.style.left = `${imageCanvas.offsetLeft}px`;
            drawingCanvas.style.top = `${imageCanvas.offsetTop}px`;
            drawingCanvas.width = rect.width;
            drawingCanvas.height = rect.height;
        }

        function drawImageToCanvasWithFilters(imageToDraw, filtersToApply) {
            drawImageToCanvas(imageToDraw, currentZoomLevel, filtersToApply);
        }
       
        function updateDimensionDisplaysForActive() {
            if (activeImageIndex !== -1 && imageStore[activeImageIndex]) {
                const activeImgData = imageStore[activeImageIndex];
                activeImageNameEl.textContent = `${activeImgData.name}.${activeImgData.ext}`;
                originalDimensionsEl.textContent = `${activeImgData.original.width} x ${activeImgData.original.height} px`;
                originalFileSizeEl.textContent = formatBytes(activeImgData.originalFileSizeBytes);
                currentDimensionsEl.textContent = `${Math.round(activeImgData.current.width)} x ${Math.round(activeImgData.current.height)} px`;
            } else {
                activeImageNameEl.textContent = 'N/A';
                originalDimensionsEl.textContent = 'N/A';
                originalFileSizeEl.textContent = 'N/A';
                currentDimensionsEl.textContent = 'N/A';
            }
        }

        zoomInBtn.addEventListener('click', () => {
            currentZoomLevel = Math.min(3.0, currentZoomLevel + ZOOM_STEP); 
            applyZoom();
        });
        zoomOutBtn.addEventListener('click', () => {
            currentZoomLevel = Math.max(0.1, currentZoomLevel - ZOOM_STEP); 
            applyZoom();
        });
        zoomResetBtn.addEventListener('click', () => {
            currentZoomLevel = 1.0;
            applyZoom();
        });

        function applyZoom() {
            if (activeImageIndex !== -1 && imageStore[activeImageIndex]) {
                drawImageToCanvasWithFilters(imageStore[activeImageIndex].current, tempFilters);
            }
            zoomLevelDisplay.textContent = `${Math.round(currentZoomLevel * 100)}%`;
            if (isCropping && cropSelectionDiv) {
                updateCropSelectionVisuals();
            }
        }
       
        resetImageBtn.addEventListener('click', () => {
            if (activeImageIndex === -1 || !imageStore[activeImageIndex]) return;
           
            const activeImgData = imageStore[activeImageIndex];
            const newCurrentImage = new Image();
            newCurrentImage.onload = () => {
                activeImgData.current = newCurrentImage; 
                activeImgData.history = [newCurrentImage.src]; 
                activeImgData.historyPointer = 0;
                setActiveImage(activeImageIndex, false); 
                resetTempAdjustmentFilters(); 
                showNotification(`"${activeImgData.name}.${activeImgData.ext}" reset to original.`);
            };
            newCurrentImage.onerror = () => showNotification('Error loading original image for reset.', 'error');
            newCurrentImage.src = activeImgData.original.src; 
        });

        // --- RESIZE LOGIC ---
        function resetResizeControlsForActive() {
            resizePercent.value = 100;
            resizePercentValue.textContent = '100';
            if (activeImageIndex !== -1 && imageStore[activeImageIndex]) { 
                const activeImg = imageStore[activeImageIndex].current;
                resizeWidthInput.value = activeImg.width;
                resizeHeightInput.value = activeImg.height;
            } else {
                resizeWidthInput.value = '';
                resizeHeightInput.value = '';
            }
        }

        resizePercent.addEventListener('input', () => {
            if (activeImageIndex === -1) return;
            const percent = parseInt(resizePercent.value);
            resizePercentValue.textContent = percent;
            const activeImg = imageStore[activeImageIndex].current; 
           
            const newWidth = Math.round(activeImg.width * (percent / 100));
            const newHeight = Math.round(activeImg.height * (percent / 100));
            resizeWidthInput.value = newWidth > 0 ? newWidth : 1; 
            resizeHeightInput.value = newHeight > 0 ? newHeight : 1;
        });

        resizeWidthInput.addEventListener('input', () => {
            if (activeImageIndex === -1) return;
            const newWidth = parseInt(resizeWidthInput.value);
            if (isNaN(newWidth) || newWidth <=0) return;

            if (aspectLock.checked) {
                const activeImg = imageStore[activeImageIndex].current;
                const currentAspectRatio = activeImg.width / activeImg.height;
                resizeHeightInput.value = Math.max(1, Math.round(newWidth / currentAspectRatio));
            }
            updatePercentSliderFromDimensions(newWidth, parseInt(resizeHeightInput.value));
        });

        resizeHeightInput.addEventListener('input', () => {
            if (activeImageIndex === -1) return;
            const newHeight = parseInt(resizeHeightInput.value);
            if (isNaN(newHeight) || newHeight <=0) return;

            if (aspectLock.checked) {
                const activeImg = imageStore[activeImageIndex].current;
                const currentAspectRatio = activeImg.width / activeImg.height;
                resizeWidthInput.value = Math.max(1, Math.round(newHeight * currentAspectRatio));
            }
            updatePercentSliderFromDimensions(parseInt(resizeWidthInput.value), newHeight);
        });
       
        function updatePercentSliderFromDimensions(w, h) {
            if (activeImageIndex === -1 || !imageStore[activeImageIndex]) return;
            const activeImg = imageStore[activeImageIndex].current;
            if (activeImg.width === 0 || activeImg.height === 0) return; 
            const percentW = (w / activeImg.width) * 100;
            const percentH = (h / activeImg.height) * 100;
            const representativePercent = aspectLock.checked ? Math.round((percentW + percentH) / 2) : Math.round(percentW);
            resizePercent.value = representativePercent > 0 ? Math.min(representativePercent, 200) : 1;
            resizePercentValue.textContent = resizePercent.value;
        }

        applyResizeBtn.addEventListener('click', async () => {
            if (activeImageIndex === -1) return;
            applyResizeBtn.disabled = true; 

            const activeImgData = imageStore[activeImageIndex];
            let newW, newH;
            const originalCurrentWidth = activeImgData.current.width;
            const originalCurrentHeight = activeImgData.current.height;

            const currentPercentVal = parseInt(resizePercent.value);
            const currentWVal = parseInt(resizeWidthInput.value);
            const currentHVal = parseInt(resizeHeightInput.value);

            if (currentPercentVal !== 100 && currentWVal === originalCurrentWidth && currentHVal === originalCurrentHeight) {
                const targetPercent = currentPercentVal / 100;
                newW = Math.round(originalCurrentWidth * targetPercent);
                newH = Math.round(originalCurrentHeight * targetPercent);
            } else { 
                newW = currentWVal;
                newH = currentHVal;
                if (aspectLock.checked) {
                    const currentAspectRatio = originalCurrentWidth / originalCurrentHeight;
                    if (newW !== originalCurrentWidth && resizeWidthInput.value !== String(originalCurrentWidth)) { 
                        newH = Math.round(newW / currentAspectRatio);
                    } else if (newH !== originalCurrentHeight && resizeHeightInput.value !== String(originalCurrentHeight)) { 
                        newW = Math.round(newH * currentAspectRatio);
                    }
                    else if (newW !== originalCurrentWidth && newH !== originalCurrentHeight) {
                         newH = Math.round(newW / currentAspectRatio);
                    }
                }
            }
           
            newW = Math.max(1, newW || originalCurrentWidth); 
            newH = Math.max(1, newH || originalCurrentHeight);

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = newW;
            tempCanvas.height = newH;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(activeImgData.current, 0, 0, newW, newH);

            try {
                const newResizedImage = new Image();
                newResizedImage.onload = () => {
                    activeImgData.current = newResizedImage; 
                    saveState("Resize");
                    setActiveImage(activeImageIndex); 
                    showNotification(`"${activeImgData.name}.${activeImgData.ext}" resized successfully!`);
                };
                newResizedImage.onerror = () => showNotification('Error creating resized image data.', 'error');
                newResizedImage.src = tempCanvas.toDataURL();
            } catch (error) {
                console.error("Error resizing image:", error);
                showNotification(`Error resizing: ${error.message}`, 'error');
            } finally {
                if (activeImageIndex !== -1) applyResizeBtn.disabled = false; 
            }
        });

        // --- CROP LOGIC ---
        startCropBtn.addEventListener('click', () => {
            if (activeImageIndex === -1) {
                showNotification("Please select an image to crop.", "warning");
                return;
            }
            isCropping = true;
            startCropBtn.disabled = true;
            applyCropBtn.disabled = false;
            cancelCropBtn.disabled = false;
            applyResizeBtn.disabled = true; 
            imageCanvas.style.cursor = 'crosshair';
            initializeCropSelection();
        });
       
        cancelCropBtn.addEventListener('click', cancelCropMode);

        function cancelCropMode() {
            isCropping = false;
            startCropBtn.disabled = (activeImageIndex === -1);
            applyCropBtn.disabled = true;
            cancelCropBtn.disabled = true;
            applyResizeBtn.disabled = (activeImageIndex === -1); 
            imageCanvas.style.cursor = 'grab';
            removeCropVisuals();
        }

        function initializeCropSelection() {
            if (activeImageIndex === -1 || !imageStore[activeImageIndex]) {
                console.warn("initializeCropSelection called with no active image.");
                return;
            }
            const localCanvasHost = document.getElementById('canvasHost'); 
            if (!localCanvasHost) {
                console.error("CRITICAL: canvasHost is null in initializeCropSelection!");
                showNotification("Error: Canvas area not found. Cannot initialize crop.", "error");
                isCropping = false; startCropBtn.disabled = (activeImageIndex === -1);
                return;
            }
            const unzoomedCanvasClientWidth = imageCanvas.clientWidth;
            const unzoomedCanvasClientHeight = imageCanvas.clientHeight;

            if (unzoomedCanvasClientWidth === 0 || unzoomedCanvasClientHeight === 0) {
                console.warn("Crop init: Image canvas has no visual dimensions. Aborting crop initialization.");
                showNotification("Please ensure an image is fully displayed before cropping.", "warning");
                isCropping = false; startCropBtn.disabled = (activeImageIndex === -1);
                return;
            }

            removeCropVisuals(); 
            cropSelectionDiv = document.createElement('div');
            cropSelectionDiv.className = 'crop-selection';
           
            localCanvasHost.appendChild(cropSelectionDiv);

            const initialWidthUnzoomed = unzoomedCanvasClientWidth * 0.8;
            const initialHeightUnzoomed = unzoomedCanvasClientHeight * 0.8;
            const initialXUnzoomed = (unzoomedCanvasClientWidth - initialWidthUnzoomed) / 2;
            const initialYUnzoomed = (unzoomedCanvasClientHeight - initialHeightUnzoomed) / 2;
           
            cropRect = { x: initialXUnzoomed, y: initialYUnzoomed, width: initialWidthUnzoomed, height: initialHeightUnzoomed };
            updateCropSelectionVisuals(); 
           
            if(cropSelectionDiv) {
                cropSelectionDiv.addEventListener('mousedown', onCropMouseDown);
            }
            document.addEventListener('mousemove', onCropMouseMove);
            document.addEventListener('mouseup', onCropMouseUp);
        }
       
        function removeCropVisuals() {
            if (cropSelectionDiv) {
                cropSelectionDiv.removeEventListener('mousedown', onCropMouseDown);
                if (cropSelectionDiv.parentNode) { 
                    cropSelectionDiv.parentNode.removeChild(cropSelectionDiv);
                }
                cropSelectionDiv = null;
            }
            cropHandles.forEach(h => h.remove());
            cropHandles = [];
            cropGridLines.forEach(g => g.remove());
            cropGridLines = [];
            document.removeEventListener('mousemove', onCropMouseMove);
            document.removeEventListener('mouseup', onCropMouseUp);
        }

        function updateCropSelectionVisuals() {
            if (!cropSelectionDiv || !isCropping || activeImageIndex === -1 || !imageStore[activeImageIndex]) return;
            const activeImgData = imageStore[activeImageIndex];

            const localCanvasHost = document.getElementById('canvasHost');
            if (!localCanvasHost) { console.error("updateCropSelectionVisuals: canvasHost is null!"); return; }

            const canvasHostRect = localCanvasHost.getBoundingClientRect();
            const imageCanvasRect = imageCanvas.getBoundingClientRect();

            const visualCanvasLeftInHost = imageCanvasRect.left - canvasHostRect.left;
            const visualCanvasTopInHost = imageCanvasRect.top - canvasHostRect.top;

            cropSelectionDiv.style.left = `${visualCanvasLeftInHost + (cropRect.x * currentZoomLevel)}px`;
            cropSelectionDiv.style.top = `${visualCanvasTopInHost + (cropRect.y * currentZoomLevel)}px`;
            cropSelectionDiv.style.width = `${cropRect.width * currentZoomLevel}px`;
            cropSelectionDiv.style.height = `${cropRect.height * currentZoomLevel}px`;

            const unzoomedCanvasClientWidth = imageCanvas.clientWidth;
            const unzoomedCanvasClientHeight = imageCanvas.clientHeight;
           
            if (unzoomedCanvasClientWidth > 0 && unzoomedCanvasClientHeight > 0) {
                const scaleFactorX = activeImgData.current.width / unzoomedCanvasClientWidth;
                const scaleFactorY = activeImgData.current.height / unzoomedCanvasClientHeight;
                cropWidthEl.value = Math.round(cropRect.width * scaleFactorX); 
                cropHeightEl.value = Math.round(cropRect.height * scaleFactorY);
            } else {
                cropWidthEl.value = 0;
                cropHeightEl.value = 0;
            }
           
            if (cropSelectionDiv) {
                if (cropHandles.length === 0) {
                    const handlePositions = ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'];
                    handlePositions.forEach(pos => {
                        const handle = document.createElement('div');
                        handle.className = `crop-handle ${pos}`;
                        handle.dataset.type = pos;
                        cropSelectionDiv.appendChild(handle); 
                        cropHandles.push(handle);
                        handle.addEventListener('mousedown', onCropMouseDown);
                    });
                }
                if (cropGridLines.length === 0) { 
                    for (let i = 1; i < 3; i++) { 
                        const vLine = document.createElement('div');
                        vLine.className = 'crop-grid-line vertical';
                        vLine.style.left = `${(100/3) * i}%`;
                        cropSelectionDiv.appendChild(vLine);
                        cropGridLines.push(vLine);
                        const hLine = document.createElement('div');
                        hLine.className = 'crop-grid-line horizontal';
                        hLine.style.top = `${(100/3) * i}%`;
                        cropSelectionDiv.appendChild(hLine);
                        cropGridLines.push(hLine);
                    }
                }
            }
        }
       
        aspectRatioSelect.addEventListener('change', () => {
            if (!isCropping || !cropSelectionDiv || activeImageIndex === -1 || !imageStore[activeImageIndex]) return;
            const activeImg = imageStore[activeImageIndex].current; 
            const selectedRatio = aspectRatioSelect.value;
            if (selectedRatio === 'freeform') return;

            const unzoomedCanvasClientWidth = imageCanvas.clientWidth;
            const unzoomedCanvasClientHeight = imageCanvas.clientHeight;

            let ratioValue;
            if (selectedRatio === 'original') {
                ratioValue = activeImg.width / activeImg.height; 
            } else {
                const parts = selectedRatio.split(':').map(Number);
                ratioValue = parts[0] / parts[1];
            }
           
            let newUnzoomedWidth = cropRect.width; 
            let newUnzoomedHeight = newUnzoomedWidth / ratioValue;

            if (cropRect.y + newUnzoomedHeight > unzoomedCanvasClientHeight) { 
                newUnzoomedHeight = unzoomedCanvasClientHeight - cropRect.y;
                newUnzoomedWidth = newUnzoomedHeight * ratioValue; 
            }
            if (cropRect.x + newUnzoomedWidth > unzoomedCanvasClientWidth) {
                newUnzoomedWidth = unzoomedCanvasClientWidth - cropRect.x;
                newUnzoomedHeight = newUnzoomedWidth / ratioValue;
            }
           
            cropRect.width = Math.max(20, newUnzoomedWidth); 
            cropRect.height = Math.max(20, newUnzoomedHeight); 
            updateCropSelectionVisuals();
        });

        function onCropMouseDown(e) {
            if (!isCropping) return;
            const localCanvasHost = document.getElementById('canvasHost'); 
            if (!localCanvasHost) { console.error("onCropMouseDown: canvasHost not found!"); return; }

            e.preventDefault(); e.stopPropagation();
            dragInfo.active = true;
            dragInfo.target = e.target.classList.contains('crop-handle') ? e.target.dataset.type : 'selection';
           
            const hostBoundingRect = localCanvasHost.getBoundingClientRect();
            dragInfo.startX = e.clientX - hostBoundingRect.left;
            dragInfo.startY = e.clientY - hostBoundingRect.top;
           
            dragInfo.originalRect = { ...cropRect }; 
        }

        function onCropMouseMove(e) {
            if (!isCropping || !dragInfo.active || activeImageIndex === -1 || !imageStore[activeImageIndex]) return;
            const activeImgData = imageStore[activeImageIndex];
            const localCanvasHost = document.getElementById('canvasHost');
            if (!localCanvasHost) { console.error("onCropMouseMove: canvasHost not found!"); return; }

            e.preventDefault(); e.stopPropagation();
           
            const hostBoundingRect = localCanvasHost.getBoundingClientRect();
           
            const mouseXOnHost = e.clientX - hostBoundingRect.left;
            const mouseYOnHost = e.clientY - hostBoundingRect.top;

            const deltaX_screen = mouseXOnHost - dragInfo.startX;
            const deltaY_screen = mouseYOnHost - dragInfo.startY;

            const deltaX = deltaX_screen / currentZoomLevel;
            const deltaY = deltaY_screen / currentZoomLevel;
           
            let newX = dragInfo.originalRect.x;
            let newY = dragInfo.originalRect.y;
            let newWidth = dragInfo.originalRect.width;
            let newHeight = dragInfo.originalRect.height;
            const minSize = 20 / currentZoomLevel;

            if (dragInfo.target === 'selection') {
                newX = dragInfo.originalRect.x + deltaX;
                newY = dragInfo.originalRect.y + deltaY;
            } else { 
                if (dragInfo.target.includes('w')) { newX = dragInfo.originalRect.x + deltaX; newWidth = dragInfo.originalRect.width - deltaX; }
                if (dragInfo.target.includes('e')) { newWidth = dragInfo.originalRect.width + deltaX; }
                if (dragInfo.target.includes('n')) { newY = dragInfo.originalRect.y + deltaY; newHeight = dragInfo.originalRect.height - deltaY; }
                if (dragInfo.target.includes('s')) { newHeight = dragInfo.originalRect.height + deltaY; }
               
                const selectedRatioOption = aspectRatioSelect.value;
                if (selectedRatioOption !== 'freeform') {
                    let targetAspectRatio;
                    if (selectedRatioOption === 'original') {
                        targetAspectRatio = activeImgData.current.width / activeImgData.current.height; 
                    } else {
                        const parts = selectedRatioOption.split(':').map(Number);
                        targetAspectRatio = parts[0] / parts[1];
                    }

                    if (dragInfo.target.includes('w') || dragInfo.target.includes('e')) { 
                        const adjustedHeight = newWidth / targetAspectRatio;
                        if (dragInfo.target.includes('n')) newY += newHeight - adjustedHeight; 
                        newHeight = adjustedHeight;
                    } else if (dragInfo.target.includes('n') || dragInfo.target.includes('s')) { 
                        const adjustedWidth = newHeight * targetAspectRatio;
                         if (dragInfo.target.includes('w')) newX += newWidth - adjustedWidth; 
                        newWidth = adjustedWidth;
                    } else {
                        const tempNewHeight = newWidth / targetAspectRatio;
                        if (dragInfo.target.includes('n')) newY = (dragInfo.originalRect.y + dragInfo.originalRect.height) - tempNewHeight;
                        newHeight = tempNewHeight;
                    }
                }
            }
            if (newWidth < minSize) { 
                if (dragInfo.target.includes('w')) newX = (dragInfo.originalRect.x + dragInfo.originalRect.width) - minSize; 
                newWidth = minSize; 
            }
            if (newHeight < minSize) { 
                if (dragInfo.target.includes('n')) newY = (dragInfo.originalRect.y + dragInfo.originalRect.height) - minSize; 
                newHeight = minSize; 
            }

            const unzoomedCanvasClientWidth = imageCanvas.clientWidth;
            const unzoomedCanvasClientHeight = imageCanvas.clientHeight;

            newX = Math.max(0, Math.min(newX, unzoomedCanvasClientWidth - newWidth));
            newY = Math.max(0, Math.min(newY, unzoomedCanvasClientHeight - newHeight));
            newWidth = Math.min(newWidth, unzoomedCanvasClientWidth - newX);
            newHeight = Math.min(newHeight, unzoomedCanvasClientHeight - newY);

            cropRect.x = newX; cropRect.y = newY; cropRect.width = newWidth; cropRect.height = newHeight;
            updateCropSelectionVisuals();
        }

        function onCropMouseUp(e) {
             if (!isCropping || !dragInfo.active) return;
            dragInfo.active = false; dragInfo.target = null;
        }

        applyCropBtn.addEventListener('click', () => {
            if (activeImageIndex === -1 || !isCropping || !cropSelectionDiv || !imageStore[activeImageIndex]) return;
            const activeImgData = imageStore[activeImageIndex];

            const unzoomedCanvasClientWidth = imageCanvas.clientWidth;
            const unzoomedCanvasClientHeight = imageCanvas.clientHeight;

            if (unzoomedCanvasClientWidth === 0 || unzoomedCanvasClientHeight === 0) {
                showNotification('Error: Canvas display area is zero. Cannot crop.', 'error');
                return;
            }
           
            const scaleXToImage = activeImgData.current.width / unzoomedCanvasClientWidth;
            const scaleYToImage = activeImgData.current.height / unzoomedCanvasClientHeight;
           
            const sx = cropRect.x * scaleXToImage;
            const sy = cropRect.y * scaleYToImage;
            const sWidth = cropRect.width * scaleXToImage;
            const sHeight = cropRect.height * scaleYToImage;

            if (sWidth <= 0 || sHeight <= 0) {
                showNotification('Error: Invalid crop area. Dimensions are too small.', 'error');
                return;
            }
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = Math.round(sWidth); 
            tempCanvas.height = Math.round(sHeight);
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(activeImgData.current, sx, sy, sWidth, sHeight, 0, 0, tempCanvas.width, tempCanvas.height);
           
            const newCroppedImage = new Image();
            newCroppedImage.onload = () => {
                activeImgData.current = newCroppedImage; 
                saveState("Crop");
                setActiveImage(activeImageIndex); 
                showNotification(`"${activeImgData.name}.${activeImgData.ext}" cropped successfully!`);
            }
            newCroppedImage.onerror = () => showNotification('Error creating cropped image data.', 'error');
            newCroppedImage.src = tempCanvas.toDataURL();
            cancelCropMode(); 
        });

        // --- ADJUSTMENT & FILTER LOGIC ---
        function resetAdjustmentControls() {
            brightnessSlider.value = 100; brightnessValue.textContent = '100';
            contrastSlider.value = 100; contrastValue.textContent = '100';
            saturationSlider.value = 100; saturationValue.textContent = '100';
            grayscaleSlider.value = 0; grayscaleValue.textContent = '0';
            tempFilters = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 };
        }
       
        function resetTempAdjustmentFilters(shouldRedraw = true) {
             tempFilters = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 };
             resetAdjustmentControls(); 
             if (shouldRedraw && activeImageIndex !== -1 && imageStore[activeImageIndex]) {
                 drawImageToCanvasWithFilters(imageStore[activeImageIndex].current, tempFilters);
             }
        }

        [brightnessSlider, contrastSlider, saturationSlider, grayscaleSlider].forEach(slider => {
            slider.addEventListener('input', () => {
                if (activeImageIndex === -1 || !imageStore[activeImageIndex]) return;
                tempFilters.brightness = parseInt(brightnessSlider.value);
                tempFilters.contrast = parseInt(contrastSlider.value);
                tempFilters.saturation = parseInt(saturationSlider.value);
                tempFilters.grayscale = parseInt(grayscaleSlider.value);

                brightnessValue.textContent = tempFilters.brightness;
                contrastValue.textContent = tempFilters.contrast;
                saturationValue.textContent = tempFilters.saturation;
                grayscaleValue.textContent = tempFilters.grayscale;
               
                drawImageToCanvasWithFilters(imageStore[activeImageIndex].current, tempFilters);
            });
        });
       
        resetAdjustmentsBtn.addEventListener('click', () => {
            if (activeImageIndex === -1) return;
            resetTempAdjustmentFilters(); 
            showNotification('Adjustments preview reset.', 'info', 1500);
        });

        applyAdjustmentsBtn.addEventListener('click', () => {
            if (activeImageIndex === -1 || !imageStore[activeImageIndex]) return;
            const activeImgData = imageStore[activeImageIndex];
           
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = activeImgData.current.width;
            tempCanvas.height = activeImgData.current.height;
            const tempCtx = tempCanvas.getContext('2d');

            let filterString = '';
            if (tempFilters.brightness !== 100) filterString += `brightness(${tempFilters.brightness}%) `;
            if (tempFilters.contrast !== 100) filterString += `contrast(${tempFilters.contrast}%) `;
            if (tempFilters.saturation !== 100) filterString += `saturate(${tempFilters.saturation}%) `;
            if (tempFilters.grayscale !== 0) filterString += `grayscale(${tempFilters.grayscale}%) `;
           
            tempCtx.filter = filterString.trim();
            tempCtx.drawImage(activeImgData.current, 0, 0);
            tempCtx.filter = 'none'; 

            const newAdjustedImage = new Image();
            newAdjustedImage.onload = () => {
                activeImgData.current = newAdjustedImage;
                saveState("Adjustments Applied");
                setActiveImage(activeImageIndex); 
                resetTempAdjustmentFilters(false); 
                showNotification('Adjustments applied successfully!', 'success');
            };
            newAdjustedImage.onerror = () => showNotification('Error applying adjustments.', 'error');
            newAdjustedImage.src = tempCanvas.toDataURL();
        });

        // --- TRANSFORM LOGIC ---
        function applyTransformation(transformationType) {
            if (activeImageIndex === -1 || !imageStore[activeImageIndex]) return;
            const activeImgData = imageStore[activeImageIndex];
            const img = activeImgData.current;
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');

            if (transformationType === 'rotateLeft' || transformationType === 'rotateRight') {
                tempCanvas.width = img.height;
                tempCanvas.height = img.width;
                tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
                tempCtx.rotate(transformationType === 'rotateLeft' ? -Math.PI / 2 : Math.PI / 2);
                tempCtx.drawImage(img, -img.width / 2, -img.height / 2);
            } else if (transformationType === 'flipHorizontal') {
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                tempCtx.translate(img.width, 0);
                tempCtx.scale(-1, 1);
                tempCtx.drawImage(img, 0, 0);
            } else if (transformationType === 'flipVertical') {
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                tempCtx.translate(0, img.height);
                tempCtx.scale(1, -1);
                tempCtx.drawImage(img, 0, 0);
            }

            const newTransformedImage = new Image();
            newTransformedImage.onload = () => {
                activeImgData.current = newTransformedImage;
                saveState(transformationType);
                setActiveImage(activeImageIndex);
                showNotification(`${transformationType.replace(/([A-Z])/g, ' $1').trim()} applied.`, 'success');
            };
            newTransformedImage.onerror = () => showNotification(`Error applying ${transformationType}.`, 'error');
            newTransformedImage.src = tempCanvas.toDataURL();
        }

        rotateLeftBtn.addEventListener('click', () => applyTransformation('rotateLeft'));
        rotateRightBtn.addEventListener('click', () => applyTransformation('rotateRight'));
        flipHorizontalBtn.addEventListener('click', () => applyTransformation('flipHorizontal'));
        flipVerticalBtn.addEventListener('click', () => applyTransformation('flipVertical'));

        // --- DRAWING LOGIC ---
        penToolBtn.addEventListener('click', () => {
            drawingTool = 'pen';
            penToolBtn.classList.add('active');
            arrowToolBtn.classList.remove('active');
        });
        arrowToolBtn.addEventListener('click', () => {
            drawingTool = 'arrow';
            arrowToolBtn.classList.add('active');
            penToolBtn.classList.remove('active');
        });
        lineWidthSlider.addEventListener('input', () => {
            lineWidthValue.textContent = lineWidthSlider.value;
        });

        startDrawBtn.addEventListener('click', () => {
            if (activeImageIndex === -1) return;
            isDrawing = true;
            drawingCanvas.style.pointerEvents = 'auto';
            drawingCanvas.style.cursor = 'crosshair';
            imageCanvas.style.cursor = 'crosshair';
            startDrawBtn.disabled = true;
            applyDrawBtn.disabled = false;
            cancelDrawBtn.disabled = false;
            // Disable other main actions
            startCropBtn.disabled = true;
            applyResizeBtn.disabled = true;
            penToolBtn.classList.add('active');
            arrowToolBtn.classList.remove('active');
        });

        cancelDrawBtn.addEventListener('click', cancelDrawMode);

        function cancelDrawMode() {
            isDrawing = false;
            drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            drawingCanvas.style.pointerEvents = 'none';
            drawingCanvas.style.cursor = 'default';
            imageCanvas.style.cursor = 'grab';
            if (activeImageIndex !== -1) {
                startDrawBtn.disabled = false;
                startCropBtn.disabled = false;
                applyResizeBtn.disabled = false;
            }
            applyDrawBtn.disabled = true;
            cancelDrawBtn.disabled = true;
        }

        applyDrawBtn.addEventListener('click', () => {
            if (activeImageIndex === -1 || !imageStore[activeImageIndex]) return;
            const activeImgData = imageStore[activeImageIndex];

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = activeImgData.current.width;
            tempCanvas.height = activeImgData.current.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(activeImgData.current, 0, 0);
            tempCtx.drawImage(drawingCanvas, 0, 0, drawingCanvas.width, drawingCanvas.height, 0, 0, tempCanvas.width, tempCanvas.height);

            const newImageWithDrawing = new Image();
            newImageWithDrawing.onload = () => {
                activeImgData.current = newImageWithDrawing;
                saveState("Drawing Applied");
                setActiveImage(activeImageIndex);
                showNotification('Drawing applied successfully!', 'success');
            };
            newImageWithDrawing.onerror = () => showNotification('Error applying drawing.', 'error');
            newImageWithDrawing.src = tempCanvas.toDataURL();

            cancelDrawMode();
        });

        drawingCanvas.addEventListener('mousedown', (e) => {
            if (!isDrawing) return;
            isPainting = true;
            const rect = drawingCanvas.getBoundingClientRect();
            startPaintPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            lastPaintPoint = { ...startPaintPoint };

            if (drawingTool === 'pen') {
                drawCtx.beginPath();
                drawCtx.moveTo(lastPaintPoint.x, lastPaintPoint.y);
            }
        });

        drawingCanvas.addEventListener('mousemove', (e) => {
            if (!isPainting) return;
            const rect = drawingCanvas.getBoundingClientRect();
            const currentPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };

            if (drawingTool === 'pen') {
                drawCtx.strokeStyle = drawColorInput.value;
                drawCtx.lineWidth = lineWidthSlider.value;
                drawCtx.lineCap = 'round';
                drawCtx.lineJoin = 'round';
                drawCtx.lineTo(currentPoint.x, currentPoint.y);
                drawCtx.stroke();
                lastPaintPoint = currentPoint;
            } else if (drawingTool === 'arrow') {
                drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                drawArrow(drawCtx, startPaintPoint.x, startPaintPoint.y, currentPoint.x, currentPoint.y, drawColorInput.value, lineWidthSlider.value);
            }
        });

        drawingCanvas.addEventListener('mouseup', () => {
            isPainting = false;
            if (drawingTool === 'pen') {
                drawCtx.closePath();
            }
        });

        drawingCanvas.addEventListener('mouseleave', () => {
            isPainting = false;
            if (drawingTool === 'pen') {
                drawCtx.closePath();
            }
        });

        function drawArrow(ctx, fromx, fromy, tox, toy, color, width) {
            const headlen = Math.max(10, width * 2);
            const dx = tox - fromx;
            const dy = toy - fromy;
            const angle = Math.atan2(dy, dx);
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(fromx, fromy);
            ctx.lineTo(tox, toy);
            ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(tox, toy);
            ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        }

        // --- OPTIMIZATION LOGIC ---
        async function applyOptimization(options) {
            if (activeImageIndex === -1) return;

            optimizeLoader.style.display = 'flex';
            const { name, ...otherOptions } = options;
            const format = otherOptions.format;
            let fileExtension = format.split('/')[1];
            if (format === 'image/jpeg') fileExtension = 'jpg';

            try {
                const activeImgData = imageStore[activeImageIndex];
                const dataUrl = await processImageForOptimization(activeImgData.current, otherOptions);

                if (!dataUrl) {
                    throw new Error("Optimization failed to produce an image.");
                }

                // --- Download Logic ---
                const blob = await dataURLtoBlob(dataUrl);
                const finalFileName = `${activeImgData.name}_${name.toLowerCase().replace(/\s+/g, '-')}.${fileExtension}`;
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = finalFileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                // --- End Download Logic ---

                // Also update the image in the editor
                const newOptimizedImage = new Image();
                newOptimizedImage.onload = () => {
                    activeImgData.current = newOptimizedImage;
                    saveState(`Optimized for ${name}`);
                    setActiveImage(activeImageIndex, false); // Don't save state again
                    showNotification(`Optimized for ${name} and downloaded!`, 'success');
                    optimizeLoader.style.display = 'none';
                };
                newOptimizedImage.onerror = () => { throw new Error("Could not load optimized image data.") };
                newOptimizedImage.src = dataUrl;

            } catch (error) {
                console.error("Optimization Error:", error);
                showNotification(`Error during optimization: ${error.message}`, 'error');
                optimizeLoader.style.display = 'none';
            }
        }

        async function processImageForOptimization(img, { maxWidth, maxHeight, format, quality, targetKb }) {
            let newW = img.width;
            let newH = img.height;
            const ratio = img.width / img.height;

            if (maxWidth && maxHeight) {
                if (newW > maxWidth || newH > maxHeight) {
                     if (newW > newH) { // Landscape or square
                        if (newW > maxWidth) {
                            newH = Math.round(maxWidth / ratio);
                            newW = maxWidth;
                        }
                    } else { // Portrait
                        if (newH > maxHeight) {
                            newW = Math.round(maxHeight * ratio);
                            newH = maxHeight;
                        }
                    }
                }
            } else if (maxWidth && newW > maxWidth) {
                newW = maxWidth;
                newH = Math.round(newW / ratio);
            } else if (maxHeight && newH > maxHeight) {
                newH = maxHeight;
                newW = Math.round(newH * ratio);
            }
            newW = Math.round(newW);
            newH = Math.round(newH);

            const resizeCanvas = document.createElement('canvas');
            resizeCanvas.width = newW;
            resizeCanvas.height = newH;
            const resizeCtx = resizeCanvas.getContext('2d');
            resizeCtx.drawImage(img, 0, 0, newW, newH);

            if (targetKb && (format === 'image/jpeg' || format === 'image/webp')) {
                let currentQuality = quality || 0.9;
                let minQ = 0.01, maxQ = 1.0;
                let bestDataUrl = '';
                let bestBlobSizeDiff = Infinity;
               
                const highQualityDataUrl = resizeCanvas.toDataURL(format, maxQ);
                const highQualityBlob = await dataURLtoBlob(highQualityDataUrl);
                if (highQualityBlob.size / 1024 <= targetKb) {
                    return highQualityDataUrl;
                }

                for (let i = 0; i < 8; i++) {
                    const dataUrl = resizeCanvas.toDataURL(format, currentQuality);
                    const tempBlob = await dataURLtoBlob(dataUrl);
                    const currentSizeKB = tempBlob.size / 1024;
                    const diff = currentSizeKB - targetKb;

                    if (currentSizeKB <= targetKb) {
                        if (Math.abs(diff) < bestBlobSizeDiff) {
                            bestBlobSizeDiff = Math.abs(diff);
                            bestDataUrl = dataUrl;
                        }
                        minQ = currentQuality;
                    } else {
                        maxQ = currentQuality;
                    }
                    if ((maxQ - minQ) < 0.02) break;
                    currentQuality = (minQ + maxQ) / 2;
                }
                return bestDataUrl || resizeCanvas.toDataURL(format, minQ);
            } else {
                return resizeCanvas.toDataURL(format, quality);
            }
        }

        optimizeWebBtn.addEventListener('click', () => applyOptimization({ name: 'Web', maxWidth: 1920, maxHeight: 1920, format: 'image/webp', quality: 0.8 }));
        optimizeShopifyBtn.addEventListener('click', () => applyOptimization({ name: 'Shopify', maxWidth: 2000, maxHeight: 2000, format: 'image/jpeg', quality: 0.9 }));
        optimizeFirebaseBtn.addEventListener('click', () => applyOptimization({ name: 'Firebase', maxWidth: 1000, maxHeight: 1000, format: 'image/jpeg', quality: 0.9, targetKb: 300 }));


        // --- EXPORT LOGIC ---
        function updateQualityVisibility() {
            qualityContainer.style.display = (fileFormatSelect.value === 'image/png') ? 'none' : 'block';
            targetFileSizeInput.disabled = (fileFormatSelect.value === 'image/png');
        }
        fileFormatSelect.addEventListener('change', updateQualityVisibility);
        qualitySlider.addEventListener('input', () => {
             const qualitySpan = document.getElementById('qualityValue');
             if(qualitySpan) qualitySpan.textContent = qualitySlider.value;
        });

        async function exportSingleImage(imgData, baseFilename, exportFormat, exportQuality, targetKB) { 
            let fileExtension = exportFormat.split('/')[1];
            if (exportFormat === 'image/jpeg') fileExtension = 'jpg';
            const finalFileName = `${baseFilename}.${fileExtension}`;

            const dataUrl = await processImageForOptimization(imgData.current, {
                maxWidth: imgData.current.width,
                maxHeight: imgData.current.height,
                format: exportFormat,
                quality: exportQuality,
                targetKb: targetKB
            });
           
            if (!dataUrl) {
                throw new Error("Failed to generate image for download.");
            }

            const blob = await dataURLtoBlob(dataUrl);
           
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = finalFileName;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            return finalFileName; 
        }

        downloadActiveButton.addEventListener('click', async () => {
            if (activeImageIndex === -1 || !imageStore[activeImageIndex]) return; 
           
            exportLoader.style.display = 'flex'; 
            exportMessage.textContent = `Processing active image...`;
            downloadActiveButton.disabled = true;
            downloadAllButton.disabled = true;

            const activeImgData = imageStore[activeImageIndex];
            const baseName = fileNameInput.value || `${activeImgData.name}_edited`;
            const format = fileFormatSelect.value;
            let quality = parseFloat(qualitySlider.value);
            const targetSizeKB = parseFloat(targetFileSizeInput.value);

            try {
                const exportedName = await exportSingleImage(activeImgData, baseName, format, quality, targetSizeKB);
                showNotification(`"${exportedName}" downloaded successfully!`);
                exportMessage.textContent = `"${exportedName}" downloaded.`;
            } catch (error) {
                console.error(`Export error for active image:`, error);
                showNotification(`Error exporting active image: ${error.message}`, 'error');
                exportMessage.textContent = `Error exporting active image.`;
            } finally {
                exportLoader.style.display = 'none';
                enableAllControls();
            }
        });

        downloadAllButton.addEventListener('click', async () => {
            if (imageStore.length === 0) return;

            exportLoader.style.display = 'flex';
            downloadActiveButton.disabled = true;
            downloadAllButton.disabled = true;
            let successCount = 0;
            let errorCount = 0;

            const globalFormat = fileFormatSelect.value;
            const globalQuality = parseFloat(qualitySlider.value);
            const globalTargetSizeKB = parseFloat(targetFileSizeInput.value);

            for (let i = 0; i < imageStore.length; i++) {
                const imgData = imageStore[i];
                exportMessage.textContent = `Processing image ${i + 1} of ${imageStore.length}: ${imgData.name}.${imgData.ext}`;
                try {
                    const baseName = `${imgData.name}_edited_batch_${i+1}`; 
                    await exportSingleImage(imgData, baseName, globalFormat, globalQuality, globalTargetSizeKB);
                    successCount++;
                    await new Promise(resolve => setTimeout(resolve, 200)); 
                } catch (error) {
                    console.error(`Batch export error for ${imgData.name}:`, error);
                    errorCount++;
                }
            }

            exportLoader.style.display = 'none';
            enableAllControls();
            const finalMessage = `${successCount} image(s) downloaded. ${errorCount > 0 ? errorCount + ' error(s).' : ''}`;
            exportMessage.textContent = finalMessage;
            showNotification(finalMessage, errorCount > 0 ? 'warning' : (successCount > 0 ? 'success': 'info'));
        });

        function updatePanelVisibilityForViewport() {
            const isDesktop = window.matchMedia('(min-width: 768px)').matches;
            if (isDesktop) {
                controlPanel.classList.remove('hidden');
                togglePanelBtn.classList.add('hidden');
            } else {
                togglePanelBtn.classList.remove('hidden');
                togglePanelBtn.textContent = controlPanel.classList.contains('hidden') ? 'Show Tools' : 'Hide Tools';
            }
        }
       
        // --- WINDOW RESIZE ---
        const debouncedRedraw = debounce(() => {
            if (activeImageIndex !== -1 && imageStore[activeImageIndex]) { 
                drawImageToCanvasWithFilters(imageStore[activeImageIndex].current, tempFilters); 
                if (isCropping && cropSelectionDiv) updateCropSelectionVisuals();
            }
        }, 250); 

        window.addEventListener('resize', debouncedRedraw);
    });
