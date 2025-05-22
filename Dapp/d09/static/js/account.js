export function setUpAccount() {
    // Recuperation des elements necessaires
    const authForm = document.getElementById('auth-form');
    const logoutBtn = document.getElementById('logout-btn');
    const authConnected = document.getElementById('auth-connected');
    const authMessage = document.getElementById('auth-message');
    const authErrors = document.getElementById('auth-errors');
    const authFormDisplay = document.getElementById('auth-form-display');
    
    function handleLogin(event){
        event.preventDefault();
        const formData = new FormData(authForm);
        // Retire le token du formulaire et on linclus dans le header 
        formData.delete('csrfmiddlewaretoken');
    
        fetch('/login/', {
            method: 'POST',
            body: formData,
            headers: {'X-CSRFToken': getCookie('csrftoken')}
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                authMessage.innerHTML = `<p id="auth-message">Logged as ${data.username}</p>`

                authConnected.style.display = 'block';
                authFormDisplay.style.display = 'none';
                authErrors.style.display = 'none';
            } else {
                authErrors.innerHTML = ``;
                for (const field in data.errors) {
                    if (data.errors.hasOwnProperty(field)){
                        const errorMessages = data.errors[field];
                        errorMessages.forEach(message => {
                            authErrors.innerHTML += `<div class="alert alert-warning">${message}</div>`;
                        });
                    }
                }
                authErrors.style.display = 'block';
            }
        })
        .catch(error => console.error('Error during connection:', error))
    }
    
    function handleLogout(event) {
        event.preventDefault();
        console.log('Appel a HandleLogout')
        fetch('/logout/', {
            method: 'POST',
            headers: {'X-CSRFToken': getCookie('csrftoken')}
            // headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                authForm.reset();//vider les donnees du form
                authFormDisplay.style.display = 'block';
                authConnected.style.display = 'none';
                fetch('/csrf/', {
                    method: 'GET'
                })
                .then(response => response.json())
                .then(data => {
                    console.log('fecth csrf OK')
                })
                .catch(error => console.error('Error during csrf:', error))
            }
        })
        .catch(error => console.error('Error during logout:', error))
    }
    
    function initEventListeners() {
        authForm.addEventListener('submit', handleLogin);
        logoutBtn.addEventListener('click', handleLogout);
    }
    initEventListeners();
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.slice(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}