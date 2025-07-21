
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('togglePanelBtn');
  const controlPanel = document.getElementById('controlPanel');

  if (!toggleBtn || !controlPanel) return;

  function updateLabel() {
    toggleBtn.textContent = controlPanel.classList.contains('hidden') ? 'Show Tools' : 'Hide Tools';
  }

  function togglePanel() {
    controlPanel.classList.toggle('hidden');
    updateLabel();
  }

  toggleBtn.addEventListener('click', togglePanel);
  toggleBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    togglePanel();
  }, { passive: false });

  function adjustForViewport() {
    const desktop = window.matchMedia('(min-width: 768px)').matches;
    if (desktop) {
      controlPanel.classList.remove('hidden');
      toggleBtn.classList.add('hidden');
    } else {
      toggleBtn.classList.remove('hidden');
      updateLabel();
    }
  }

  window.addEventListener('resize', adjustForViewport);
  adjustForViewport();
});

