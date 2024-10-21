function proximaSecao(sectionId) {
    const currentSection = document.querySelector('.section-box:not([style*="display: none"])');
    const nextSection = document.getElementById(sectionId);
    currentSection.style.display = 'none';
    nextSection.style.display = 'block';
}

function secaoAnterior(sectionId) {
    const currentSection = document.querySelector('.section-box:not([style*="display: none"])');
    const previousSection = document.getElementById(sectionId);
    currentSection.style.display = 'none';
    previousSection.style.display = 'block';
}