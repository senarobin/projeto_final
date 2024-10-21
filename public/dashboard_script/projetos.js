function mostrarSecao(sectionId) {
    const secoes = ['secao1', 'secao2', 'secao3', 'secao4'];
    secoes.forEach(section => {
        document.getElementById(section).style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

document.getElementById('arquivosProjeto').addEventListener('change', function(e) {
    const fileList = Array.from(e.target.files).map(file => file.name).join(', ');
    document.getElementById('arquivosSelecionados').textContent = `Arquivos selecionados: ${fileList}`;
});

document.getElementById('projetosForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Projeto submetido com sucesso!'); 
    this.submit()
});
