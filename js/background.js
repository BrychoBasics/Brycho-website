// Track stable hardware dimensions to bypass Firefox zoom quirks
let hardwareWidth = window.screen.width;
let hardwareHeight = window.screen.height;
let baselineDPR = window.devicePixelRatio || 1;

function updateGridSizing() {
    const currentDPR = window.devicePixelRatio || 1;

    // Detect if screen width changed (Monitor swap OR Firefox zoom)
    if (window.screen.width !== hardwareWidth) {
        const isFirefoxZoom = Math.abs((window.screen.width * currentDPR) - (hardwareWidth * baselineDPR)) < 10;
        
        if (!isFirefoxZoom) {
            // Genuine monitor swap
            hardwareWidth = window.screen.width;
            hardwareHeight = window.screen.height;
            baselineDPR = currentDPR; 
        }
    }

    // Measure the longest side using the stable hardware values
    const monitorBase = Math.max(hardwareWidth, hardwareHeight);
    
    // Dynamically adjust the scale percentage
    let percentage = 0.055; 
    
    if (monitorBase <= 1920) percentage = 0.065; 
    if (monitorBase <= 1366) percentage = 0.08;  
    if (monitorBase <= 1024) percentage = 0.11;  
    if (monitorBase <= 850)  percentage = 0.16;  
    
    let baseSize = monitorBase * percentage;
    if (baseSize < 65) baseSize = 65; 
    
    document.documentElement.style.setProperty('--base-cell-size', `${baseSize}px`);

    // Neutralize active browser zoom
    const zoomRatio = currentDPR / baselineDPR;
    document.documentElement.style.setProperty('--zoom-ratio', zoomRatio);
}

window.addEventListener('resize', updateGridSizing);
updateGridSizing();

(function() {
    // ========================================
    // CONFIGURATION
    // ========================================
    const papers = [
        'BlackPaper004', 
        'BlackPaper006', 
        'BlackPaper008', 
        'BlackPaper010'
    ];

    const iconFiles = [
        'BatteryX_small.webp', 'CameraApertureX_small.webp', 'CameraBodyX_small.webp',
        'CameraLensX_small.webp', 'CautionTriangleSymbolX_small.webp', 'ClapperboardX_small.webp',
        'Code MarkdownX_small.webp', 'Compass 2 (Drawing)X_small.webp', 'Compass(exploring)X_small.webp',
        'Computer GraphicsXblue_1_small.webp', 'ComputerCPUX_small.webp', 'ControlX_small.webp',
        'CursorArrowX_small.webp', 'DroneX_small.webp', 'Face-SkullX_1_small.webp',
        'FloppyDiskX_1_small.webp', 'GalagaAlienX_1_small.webp', 'GalagaShipX_small.webp',
        'GameboyX_small.webp', 'games-UFOX_small.webp', 'Gear1X_small.webp',
        'GhostX_small.webp', 'Hammer1X_small.webp', 'HeadphonesX_small.webp',
        'Hex Bolt BodyX_small.webp', 'LinksX_small.webp', 'MagnetX_small.webp',
        'MagnifyingGlassX_small.webp', 'Mic1X_small.webp',
        'Paint-SprayPaintCanX.webp', 'PaperclipX_small.webp', 'PaperplaneX_small.webp',
        'PeaceSignX_small.webp', 'Pencil1X_small.webp', 'Pen-WrenchX_small.webp',
        'RulerX_small.webp', 'ScissorsX_small.webp', 'ShovelX_small.webp',
        'Skateboard1X_small.webp', 'Weapon-BowArrowX_small.webp', 'Weapon-ChefKnifeX_small.webp',
        'Weapon-Shield1X_small.webp', 'Weapon-SwordsX_small.webp', 'Weapon-TankX_small.webp',
        'Woodwork-HandsawX_small.webp', 'Woodwork-SawBladeX_small.webp', 
        'Woodwork-SquareTriangleX_small.webp', 'Woodwork-TapeMeasureX_small.webp'
    ];

    const iconAdjustments = {
        'BatteryX_small.webp': { scale: 1, rotate: -45, offsetX: 1, offsetY: -1 },
        'Mic1X_small.webp': { scale: 1, offsetX: 4, offsetY: 0 },
        'ClapperboardX_small.webp': { offsetX: -2, offsetY: -2 },
        'Woodwork-TapeMeasureX_small.webp': { scale: 1, rotate: -45, offsetX: -1, offsetY: -7 },
        'Paint-SprayPaintCanX.webp': { offsetX: 3, offsetY: 0 },
        'Hex Bolt BodyX_small.webp': { scale: 1.1, rotate: 0, offsetX: 0, offsetY: 0 },
        'Computer GraphicsXblue_1_small.webp': { scale: 1.05, rotate: 45, offsetX: 4, offsetY: -2 },
        'Weapon-TankX_small.webp': { scale: 1.15, rotate: 0, offsetX: 1, offsetY: 0 },
        'MagnifyingGlassX_small.webp': { scale: .95, rotate: 0, offsetX: 1, offsetY: -1 },
        'CursorArrowX_small.webp': { scale: .9, rotate: 0, offsetX: 0, offsetY: 0 },
        'PaperplaneX_small.webp': { scale: .85, rotate: 0, offsetX: -2, offsetY: 0 }
    };

    // State Variables
    let currentPaperIndex = 0;
    let paperElements = [];
    let gridCells = []; 
    let gridCols = 0;
    let gridRows = 0;
    let tickCount = 0;
    let animatingCells = [];
    
    let recentIcons = []; 
    const RECENT_HISTORY_SIZE = 10; 

    const PARALLAX_SPEED = 0.1; 
    const SCROLL_STEP_MS = 450/8; 

    // ========================================
    // STEPPED PARALLAX ENGINE
    // ========================================
    function initSteppedScroll() {
        const parallaxGridWrapper = document.querySelector('.parallax-wrapper');
        
        if (parallaxGridWrapper) {
            parallaxGridWrapper.style.transform = `translateY(${-(window.scrollY * PARALLAX_SPEED)}px)`;
        }
        
        setInterval(() => {
            if (parallaxGridWrapper) {
                const scrollOffset = -(window.scrollY * PARALLAX_SPEED);
                parallaxGridWrapper.style.transform = `translateY(${scrollOffset}px)`;
            }
        }, SCROLL_STEP_MS);
    }

    // ========================================
    // UTILS & MATH
    // ========================================
    function getTextureVariant(baseFileName) {
        const monitorBase = Math.max(window.screen.width, window.screen.height);
        const dpr = window.devicePixelRatio || 1;
        const physicalPixels = monitorBase * dpr;

        let suffix = "-small"; 
        
        if (physicalPixels > 3000) {
            suffix = "-large"; 
        } else if (physicalPixels > 1900) {
            suffix = "-medium"; 
        }
        
        return `images/textures/${baseFileName}${suffix}.webp`;
    }


    function getRandomPaperTransform() {
        const flipH = Math.random() < 0.5 ? -1 : 1;
        const flipV = Math.random() < 0.5 ? -1 : 1;
        
        // Tighter 1.05 scale to prevent blur. No rotation included.
        const scaleValue = 1.05; 
        
        const panX = (Math.random() - 0.5) * 10;
        const panY = (Math.random() - 0.5) * 10;
        
        return `translate(-50%, -50%) scaleX(${flipH * scaleValue}) scaleY(${flipV * scaleValue}) translate(${panX}%, ${panY}%)`;
    }

    function getIconStyle(filename) {
        const adjust = iconAdjustments[filename] || {};
        const scale = adjust.scale || 1;
        const rotate = adjust.rotate || 0;
        const x = adjust.offsetX !== undefined ? adjust.offsetX : -1;
        const y = adjust.offsetY !== undefined ? adjust.offsetY : -2;
        return `transform: translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`;
    }

    function shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    // ========================================
    // STRICT ANTI-CLUMPING LOGIC
    // ========================================
    function getNearbyIcons(col, row, radius) {
        const nearby = new Set();
        for (let r = Math.max(0, row - radius); r <= Math.min(gridRows - 1, row + radius); r++) {
            for (let c = Math.max(0, col - radius); c <= Math.min(gridCols - 1, col + radius); c++) {
                const index = r * gridCols + c;
                if (gridCells[index]) {
                    if (gridCells[index].currentIcon) {
                        nearby.add(gridCells[index].currentIcon);
                    }
                    const animating = animatingCells.find(a => a.cell === gridCells[index]);
                    if (animating) nearby.add(animating.newIcon);
                }
            }
        }
        return nearby;
    }

    function getBestIconForCell(col, row) {
        const counts = {};
        iconFiles.forEach(icon => counts[icon] = 0);
        gridCells.forEach(cell => {
            if (cell && cell.currentIcon) counts[cell.currentIcon]++;
        });

        let nearbyIcons = getNearbyIcons(col, row, 3);
        
        let candidates = iconFiles.filter(icon => !nearbyIcons.has(icon) && !recentIcons.includes(icon));

        if (candidates.length === 0) {
            candidates = iconFiles.filter(icon => !nearbyIcons.has(icon));
            if (candidates.length === 0) candidates = [...iconFiles];
        }

        candidates.sort((a, b) => counts[a] - counts[b]);
        const bestPool = candidates.slice(0, 3);
        return bestPool[Math.floor(Math.random() * bestPool.length)];
    }

    // ========================================
    // GENERATION
    // ========================================
    function createBackground() {
        const bg = document.createElement('div');
        bg.className = 'animated-background';
        bg.innerHTML = `
            <div class="gradient-layer"></div>
            <div class="parallax-wrapper">
                <div class="rotated-layer">
                    <div class="grid-container" id="gridContainer"></div>
                </div>
            </div>
            <div class="paper-texture" id="paperTexture"></div>
        `;
        document.body.insertBefore(bg, document.body.firstChild);

        initSystem(document.getElementById('paperTexture'));
        initSteppedScroll();
    }

    function generateGrid() {
        const container = document.getElementById('gridContainer');
        if (!container) return;
        container.innerHTML = '';
        gridCells = [];
        animatingCells = [];

        gridCols = 25; 
        gridRows = 40; 
        
        container.style.gridTemplateColumns = `repeat(${gridCols}, var(--cell-size))`;

        const fragment = document.createDocumentFragment();

        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                const cellDiv = document.createElement('div');
                cellDiv.className = 'grid-cell';

                const wrapperDiv = document.createElement('div');
                wrapperDiv.className = 'icon-wrapper';

                const iconImg = document.createElement('img');
                iconImg.className = 'grid-icon';
                
                const cellState = {
                    imgElement: iconImg,
                    wrapperElement: wrapperDiv,
                    col: col,
                    row: row,
                    currentIcon: null,
                    lastUpdated: 0
                };
                gridCells.push(cellState);
                
                const iconFile = getBestIconForCell(col, row);
                cellState.currentIcon = iconFile;
                
                wrapperDiv.style.cssText = getIconStyle(iconFile);
                iconImg.src = `images/background-icons/${iconFile}`;
                
                wrapperDiv.appendChild(iconImg);
                cellDiv.appendChild(wrapperDiv);
                fragment.appendChild(cellDiv);
            }
        }
        container.appendChild(fragment);
    }

    // ========================================
    // THE MASTER LOOP (FRAME BY FRAME AT 450ms)
    // ========================================
    function initSystem(paperContainer) {
        papers.forEach((baseName, index) => {
            const img = document.createElement('img');
            
            // Dynamically load -small, -medium, or -large .webp
            img.src = getTextureVariant(baseName);
            
            img.style.transform = getRandomPaperTransform();
            if (index === 0) img.classList.add('active');
            paperContainer.appendChild(img);
            paperElements.push(img);
        });

        generateGrid();

        setInterval(() => {
            tickCount++;

            // --- 1. CYCLE PAPER TEXTURE ---
            paperElements[currentPaperIndex].classList.remove('active');
            currentPaperIndex = (currentPaperIndex + 1) % papers.length;
            paperElements[currentPaperIndex].style.transform = getRandomPaperTransform();
            paperElements[currentPaperIndex].classList.add('active');

            // --- 2. ADVANCE ICON ANIMATION FRAMES ---
            animatingCells.forEach(anim => {
                if (anim.state === 1) {
                    anim.cell.imgElement.className = 'grid-icon anim-frame-1';
                    anim.state = 2;
                } else if (anim.state === 2) {
                    anim.cell.imgElement.className = 'grid-icon anim-frame-2';
                    anim.state = 3;
                } else if (anim.state === 3) {
                    anim.cell.currentIcon = anim.newIcon;
                    anim.cell.imgElement.src = `images/background-icons/${anim.newIcon}`;
                    anim.cell.wrapperElement.style.cssText = getIconStyle(anim.newIcon);
                    
                    anim.cell.imgElement.className = 'grid-icon anim-frame-3';
                    anim.state = 4;
                } else if (anim.state === 4) {
                    anim.cell.imgElement.className = 'grid-icon anim-frame-4';
                    anim.state = 5;
                } else if (anim.state === 5) {
                    anim.cell.imgElement.className = 'grid-icon'; 
                    anim.state = 6;
                }
            });

            animatingCells = animatingCells.filter(anim => anim.state < 6);

            // --- 3. QUEUE NEW ANIMATIONS ---
            const swapsThisTick = Math.floor(Math.random() * 2) + 1; 
            
            const availableCells = gridCells.filter(c => (tickCount - c.lastUpdated) > 15 && !animatingCells.some(a => a.cell === c));
            
            if (availableCells.length > 0) {
                shuffle(availableCells);
                const cellsToAnimate = availableCells.slice(0, swapsThisTick);

                cellsToAnimate.forEach(cell => {
                        cell.lastUpdated = tickCount;
                        const newIcon = getBestIconForCell(cell.col, cell.row);
                        
                        recentIcons.push(newIcon);
                        if (recentIcons.length > RECENT_HISTORY_SIZE) {
                            recentIcons.shift(); 
                        }
                        
                        animatingCells.push({
                            cell: cell,
                            newIcon: newIcon,
                            state: 1
                        });
                    });
            }
        }, 450);
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    document.addEventListener('DOMContentLoaded', () => {
        createBackground();
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                generateGrid();
            }, 300);
        });
    });

})();