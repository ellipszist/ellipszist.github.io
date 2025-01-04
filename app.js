const MESSAGES = {
    ERROR: {
        SELECT_GAME: 'กรุณาเลือกม็อด',
        DOWNLOAD_FAILED: 'ดาวน์โหลดไม่สำเร็จ',
        INSTALL_FAILED: 'เกิดข้อผิดพลาดในการติดตั้งม็อด',
        LOAD_FAILED: 'เกิดข้อผิดพลาดในการโหลดม็อด',
        MOD_NOT_FOUND: 'ไม่พบข้อมูลสำหรับเกมที่เลือก',
        SELECT_FOLDER: 'กรุณาเลือกโฟลเดอร์',
        UPDATE_MOD: 'พบเวอร์ชันใหม่ของม็อด! ต้องการอัปเดตหรือไม่?',
    },
    STATUS: {
        DOWNLOADING_INSTALLING: 'กำลังดาวน์โหลดและติดตั้งม็อด...',
        INSTALL_SUCCESS: 'ติดตั้งม็อดสำเร็จ',
    }
};

const statusMessages = new Map([
    ['notAvailable', 'ไม่พร้อมใช้งาน'],
    ['waitingForUpdate', 'รออัปเดต'],
    ['inTranslation', 'กำลังแปล'],
    ['underReview', 'กำลังตรวจสอบ']
]);

let isInstalling = false;
let modList = {};
let selectedGameId = null;

// Show status messages
function renderProgressMessage(message) {
    const progressMessage = document.getElementById('progress-message');
    progressMessage.textContent = message;
}

// Validate if a game is selected
function isGameSelected() {
    if (!selectedGameId) {
        renderProgressMessage(MESSAGES.ERROR.SELECT_GAME);
        return false;
    }
    return true;
}

// Load mod list
async function loadModList() {
    try {
        const response = await fetch('modlist.json');
        if (!response.ok) throw new Error('Network response was not ok');
        modList = await response.json();
        renderTranslators(modList.translators);
    } catch (error) {
        renderProgressMessage(MESSAGES.ERROR.LOAD_FAILED);
        console.error(error);
    }
}

// Render translators and mods
function renderTranslators(translators) {
    const container = document.getElementById('translator-select-container');
    container.innerHTML = '';
    Object.keys(translators).forEach(translator => {
        const translatorData = translators[translator];
        renderMods(container, translatorData.mods);
        container.appendChild(document.createElement('br'));
    });
}

// Render mods for each translator
function renderMods(container, mods) {
    const modsContainer = document.createElement('div');
    modsContainer.classList.add('translator-mods');
    container.appendChild(modsContainer);

    mods.forEach(mod => {
        const card = document.createElement('div');
        card.classList.add('game-card');
        card.dataset.game = mod.id;

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'game';
        radio.value = mod.id;
        radio.style.display = 'none';

        const img = document.createElement('img');
        img.src = mod.image;
        img.alt = mod.name;
        img.loading = 'lazy';

        if (statusMessages.has(mod.status)) {
            const statusMessage = document.createElement('div');
            statusMessage.classList.add('status-message');
            statusMessage.textContent = statusMessages.get(mod.status);
            card.appendChild(statusMessage);
        }

        card.appendChild(radio);
        card.appendChild(img);
        modsContainer.appendChild(card);

        card.addEventListener('click', () => handleModSelection(card, mod));
    });
}

// Handle mod card selection
function handleModSelection(card, mod) {
    const installBtn = document.getElementById('install-mod-btn');

    if (statusMessages.has(mod.status)) {
        installBtn.disabled = true;
        installBtn.title = 'ม็อดนี้ไม่สามารถติดตั้งได้';
    } else {
        installBtn.disabled = false;
        installBtn.title = 'คลิกเพื่อติดตั้งม็อด';
    }

    resetSelection();
    card.classList.add('selected');
    card.querySelector('input').checked = true;
    selectedGameId = mod.id;

    installBtn.textContent = mod.manual_url ? 'ดาวน์โหลดม็อด' : 'ติดตั้งม็อด';
    renderProgressMessage(`ม็อดภาษาไทยเกม: ${mod.name}`);

    //console.log('mod.platform:', mod.platform);

    const platform = mod.platform && Array.isArray(mod.platform)
        ? mod.platform.join(', ')
        : 'ไม่ทราบข้อมูล';
    let platformLabel = card.querySelector('.platform-label');
    if (!platformLabel) {
        platformLabel = document.createElement('div');
        platformLabel.classList.add('platform-label');
        card.appendChild(platformLabel);
    }
    platformLabel.textContent = `${platform}`;
}

// Reset the game selection
function resetSelection() {
    document.querySelectorAll('.game-card').forEach(card => {
        card.classList.remove('selected');
        card.querySelector('input').checked = false;
    });
}

// Install mod
async function installMod() {
    if (isInstalling || !isGameSelected()) return;

    const selectedMod = getSelectedMod();
    if (!selectedMod) {
        renderProgressMessage(MESSAGES.ERROR.MOD_NOT_FOUND);
        return;
    }

    if (selectedMod.manual_url) {
        window.open(selectedMod.manual_url, '_self');
        return;
    }

    try {
        const dirHandle = await window.showDirectoryPicker();
        if (!validateInstallation(dirHandle)) return;

        isInstalling = true;
        await downloadAndInstallMod(selectedMod, dirHandle);

        renderProgressMessage(MESSAGES.STATUS.INSTALL_SUCCESS);
    } catch (error) {
        renderProgressMessage(MESSAGES.ERROR.INSTALL_FAILED);
        console.error(error);
    } finally {
        isInstalling = false;
    }
}

// Validate installation prerequisites
function validateInstallation(dirHandle) {
    if (!selectedGameId) {
        renderProgressMessage(MESSAGES.ERROR.SELECT_GAME);
        return false;
    }
    if (!dirHandle) {
        renderProgressMessage(MESSAGES.ERROR.SELECT_FOLDER);
        return false;
    }
    return true;
}

// Download and install mod
async function downloadAndInstallMod(selectedMod, dirHandle) {
    try {
        renderProgressMessage(MESSAGES.STATUS.DOWNLOADING_INSTALLING);

        const response = await fetch(selectedMod.url);
        if (!response.ok) throw new Error(MESSAGES.ERROR.DOWNLOAD_FAILED);

        const contentLength = response.headers.get('Content-Length');
        if (!contentLength) throw new Error('ไม่สามารถตรวจสอบขนาดไฟล์ได้');

        const totalBytes = parseInt(contentLength, 10);
        let loadedBytes = 0;

        const formatBytes = (bytes) => {
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            if (bytes === 0) return '0 Bytes';
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
        };

        const reader = response.body.getReader();
        const chunks = [];
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            loadedBytes += value.length;

            const progress = Math.round((loadedBytes / totalBytes) * 100);
            renderProgressMessage(
                `ดาวน์โหลดแล้ว ${formatBytes(loadedBytes)} / ${formatBytes(totalBytes)} (${progress}%)`
            );
        }

        renderProgressMessage('กำลังติดตั้งม็อด...');
        const blob = new Blob(chunks);
        const zip = await JSZip.loadAsync(blob);
        await extractZipToDirectory(zip, dirHandle);
    } catch (error) {
        throw error;
    }
}

// Extract ZIP to directory
async function extractZipToDirectory(zip, dirHandle) {
    const files = Object.entries(zip.files);
    const totalFiles = files.length;
    let completedFiles = 0;

    const updateInstallationProgress = () => {
        const progress = Math.round((completedFiles / totalFiles) * 100);
        renderProgressMessage(`กำลังติดตั้งม็อด... (${progress}%)`);
    };

    const filesPromises = files.map(async ([relativePath, file]) => {
        const pathParts = relativePath.split('/');
        let currentDir = dirHandle;

        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            currentDir = await currentDir.getDirectoryHandle(part, { create: true });
        }

        if (!file.dir) {
            const fileName = pathParts[pathParts.length - 1];
            const fileData = await file.async('blob');
            const newFileHandle = await currentDir.getFileHandle(fileName, { create: true });
            const writableStream = await newFileHandle.createWritable();
            await writableStream.write(fileData);
            await writableStream.close();
        }

        completedFiles++;
        updateInstallationProgress();
    });

    await Promise.all(filesPromises);
}

// Retrieve the selected mod
function getSelectedMod() {
    for (let translator in modList.translators) {
        for (let mod of modList.translators[translator].mods) {
            if (mod.id === selectedGameId) return mod;
        }
    }
    return null;
}

// Load mod list on startup
loadModList();

// Add event listener for the install button
document.getElementById('install-mod-btn').addEventListener('click', installMod);
