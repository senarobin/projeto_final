
function mostrarSecao(sectionId) {
    const secoes = ['secao1', 'secao2', 'secao3', 'secao4'];
    secoes.forEach(section => {
        document.getElementById(section).style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}
