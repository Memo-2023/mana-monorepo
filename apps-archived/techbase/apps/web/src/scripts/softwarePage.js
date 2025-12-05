// Software page Alpine.js initialization
function initSoftwarePage() {
  return {
    isCompareMode: false,
    selectedSoftwareId: null,
    currentViewSide: 'left',
    isLeftMinimized: false,
    isRightMinimized: false,
    
    init() {
      // Check URL for compare parameter
      const urlParams = new URLSearchParams(window.location.search);
      const compareWith = urlParams.get('compare');
      
      if (compareWith) {
        this.isCompareMode = true;
        this.selectedSoftwareId = compareWith;
      }
    },
    
    toggleCompareMode() {
      this.isCompareMode = !this.isCompareMode;
      if (!this.isCompareMode) {
        const url = new URL(window.location.href);
        url.searchParams.delete('compare');
        window.history.pushState({}, '', url.toString());
        this.selectedSoftwareId = null;
      }
    },
    
    switchViewSide(side) {
      this.currentViewSide = side;
    },
    
    toggleMinimize(side) {
      if (side === 'left') {
        this.isLeftMinimized = !this.isLeftMinimized;
        if (this.isLeftMinimized && this.isRightMinimized) {
          this.isRightMinimized = false;
        }
      } else {
        this.isRightMinimized = !this.isRightMinimized;
        if (this.isRightMinimized && this.isLeftMinimized) {
          this.isLeftMinimized = false;
        }
      }
    }
  };
}