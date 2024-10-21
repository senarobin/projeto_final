document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('search-button');
    const searchModal = document.getElementById('search-modal');
    const closeButton = document.getElementsByClassName('close')[0];
    const advancedSearchForm = document.getElementById('advanced-search-form');

    searchButton.addEventListener('click', function() {
        searchModal.style.display = "block";
    });

    closeButton.addEventListener('click', function() {
        searchModal.style.display = "none";
    });

    window.addEventListener('click', function(event) {
        if (event.target == searchModal) {
            searchModal.style.display = "none";
        }
    });

    advancedSearchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Pesquisa avançada submetida');
        searchModal.style.display = "none";
    });

    window.onclick = function(event) {
        if (!event.target.matches('.avatar-dropdown')) {
            var dropdowns = document.getElementsByClassName("dropdown-content");
            var i;
            for (i = 0; i < dropdowns.length; i++) {
                var openDropdown = dropdowns[i];
                if (openDropdown.style.display === 'block') {
                    openDropdown.style.display = 'none';
                }
            }
        }
    }

    $(document).click(function (e) {
        var container = $(".avatar-dropdown");
        if (!container.is(e.target) && container.has(e.target).length === 0) {
        $(".avatar-dropdown .dropdown-menu").dropdown("hide");
    }
    });


    function loadProjects() {
        const projectsList = document.getElementById('lista-projetos'); 
        projectsList.innerHTML = '<p>Carregando projetos...</p>'; 
    
        fetch('/api/projetos') 
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar projetos');
                }
                return response.json(); 
            })
            .then(projects => {
                projectsList.innerHTML = projects.slice(-3).map((projeto, index) => `
                    <div class="col-md-4 mb-4 fade-in" style="animation-delay: ${index * 0.1}s;">
                        <div class="card project-card">
                            <div class="card-body">
                                <h5 class="card-title">${projeto.nome}</h5>
                                <p class="card-text"><strong>Área:</strong> ${projeto.area}</p>
                                <p class="card-text"><strong>Professor Orientador:</strong> ${projeto.professor_orientador}</p>
                                <p class="card-text"><strong>Data de Início:</strong> ${new Date(projeto.data_inicio).toLocaleDateString('pt-BR')}</p>
                                <p class="card-text"><strong>Data de Término:</strong> ${new Date(projeto.data_termino).toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                `).join('');
            })
            .catch(error => {
                console.error('Erro:', error);
                projectsList.innerHTML = '<p>Erro ao carregar projetos. Tente novamente mais tarde.</p>';
            });
    }
    
    loadProjects(); 
});