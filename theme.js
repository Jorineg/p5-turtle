document.addEventListener('DOMContentLoaded', () => {
    // Add no-transition class to body immediately
    document.body.classList.add('no-transition');
    const themeToggle = document.getElementById('themeToggle');

    // Set initial theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        initializeTurtleExecution();
    });

    function updateThemeIcon(theme) {
        themeToggle.innerHTML = theme === 'dark'
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
               </svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
               </svg>`;
    }

    const leftPanel = document.querySelector('.side-panel');
    const rightPanel = document.querySelector('.side-panel-right');
    const leftButton = document.querySelector('.collapse-left');
    const rightButton = document.querySelector('.collapse-right');

    // Set initial collapse states from localStorage or default to not collapsed
    const leftCollapsed = localStorage.getItem('leftPanelCollapsed') === 'true';
    const rightCollapsed = localStorage.getItem('rightPanelCollapsed') === 'true';

    // Apply initial states
    if (leftCollapsed) {
        leftPanel.classList.add('collapsed');
        leftButton.classList.add('collapsed');
    }
    if (rightCollapsed) {
        rightPanel.classList.add('collapsed');
        rightButton.classList.add('collapsed');
    }
    // Remove no-transition class after a brief timeout
    setTimeout(() => {
        document.body.classList.remove('no-transition');
    }, 500);

    leftButton.addEventListener('click', () => {
        leftPanel.classList.toggle('collapsed');
        leftButton.classList.toggle('collapsed');
        localStorage.setItem('leftPanelCollapsed', leftPanel.classList.contains('collapsed'));
    });

    rightButton.addEventListener('click', () => {
        rightPanel.classList.toggle('collapsed');
        rightButton.classList.toggle('collapsed');
        localStorage.setItem('rightPanelCollapsed', rightPanel.classList.contains('collapsed'));
    });
}); 