AOS.init({
    duration: 1000,
    once: true
});

// Navbar scroll effect
window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
        document.querySelector('.navbar').classList.add('navbar-scrolled');
    } else {
        document.querySelector('.navbar').classList.remove('navbar-scrolled');
    }
});

// Modal triggers
document.getElementById('loginBtn').addEventListener('click', function() {
    var loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
});

document.getElementById('cadastroBtn').addEventListener('click', function() {
    var cadastroModal = new bootstrap.Modal(document.getElementById('cadastroModal'));
    cadastroModal.show();
});

// Animate stats numbers
const statsNumbers = document.querySelectorAll('.stats-number');
statsNumbers.forEach(number => {
    const target = parseInt(number.getAttribute('data-target'));
    const increment = target / 200;
    let current = 0;

    const updateNumber = () => {
        if (current < target) {
            current += increment;
            number.textContent = Math.ceil(current);
            setTimeout(updateNumber, 10);
        } else {
            number.textContent = target;
        }
    };

    updateNumber();
});