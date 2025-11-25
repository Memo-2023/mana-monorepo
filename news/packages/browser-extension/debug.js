// Debug script for Extension Storage

async function checkStorage() {
    try {
        const result = await chrome.storage.local.get(null);
        document.getElementById('storageContent').textContent = JSON.stringify(result, null, 2);
        console.log('Chrome Storage contents:', result);
    } catch (error) {
        document.getElementById('storageContent').textContent = 'Error: ' + error.message;
        console.error('Error checking storage:', error);
    }
}

async function clearStorage() {
    try {
        await chrome.storage.local.clear();
        document.getElementById('storageContent').textContent = 'Storage cleared';
        console.log('Chrome Storage cleared');
    } catch (error) {
        console.error('Error clearing storage:', error);
    }
}

async function setTestData() {
    try {
        const testSession = {
            access_token: 'test-token',
            expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            refresh_token: 'test-refresh'
        };
        
        await chrome.storage.local.set({
            'supabase.auth.token': JSON.stringify(testSession)
        });
        
        document.getElementById('storageContent').textContent = 'Test data set';
        console.log('Test data set in Chrome Storage');
    } catch (error) {
        console.error('Error setting test data:', error);
    }
}

// Set up event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('checkBtn').addEventListener('click', checkStorage);
    document.getElementById('clearBtn').addEventListener('click', clearStorage);
    document.getElementById('testBtn').addEventListener('click', setTestData);
    
    // Auto-check on load
    checkStorage();
});