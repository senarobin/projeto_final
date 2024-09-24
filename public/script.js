document.addEventListener('DOMContentLoaded', function() {
    function openModal(modalId) {
        var modal = document.getElementById(modalId);
        modal.style.display = 'block';
    }

    function closeModal(modalId) {
        var modal = document.getElementById(modalId);
        modal.style.display = 'none';
    }

    var loginBtn = document.getElementById('loginBtn');
    var cadastroBtn = document.getElementById('cadastroBtn');
    var loginModal = document.getElementById('loginModal');
    var cadastroModal = document.getElementById('cadastroModal');
    var closeLogin = document.getElementById('closeLogin');
    var closeCadastro = document.getElementById('closeCadastro');
    var openCadastro = document.getElementById('openCadastro');

    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            openModal('loginModal');
        });
    }

    if (cadastroBtn) {
        cadastroBtn.addEventListener('click', function() {
            openModal('cadastroModal');
        });
    }

    if (closeLogin) {
        closeLogin.addEventListener('click', function() {
            closeModal('loginModal');
        });
    }

    if (closeCadastro) {
        closeCadastro.addEventListener('click', function() {
            closeModal('cadastroModal');
        });
    }

    if (openCadastro) {
        openCadastro.addEventListener('click', function(event) {
            event.preventDefault(); // Impede o comportamento padrão do link
            closeModal('loginModal'); // Fecha o modal de login se estiver aberto
            openModal('cadastroModal'); // Abre o modal de cadastro
        });
    }

    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            closeModal('loginModal');
        }
        if (event.target === cadastroModal) {
            closeModal('cadastroModal');
        }
    });
});
