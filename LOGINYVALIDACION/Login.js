document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if(username && password) {
        // Realizamos la validación en el servidor con AJAX
        fetch('login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `username=${username}&password=${password}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Login exitoso');
                // Redirigir al usuario a la página de inicio o a su perfil
            } else {
                alert('Nombre de usuario o contraseña incorrectos');
            }
        });
    } else {
        alert('Por favor, ingresa un nombre de usuario y contraseña');
    }
});

document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    if(username && password) {
        // Registramos el usuario en el servidor
        fetch('register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `username=${username}&password=${password}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Usuario registrado exitosamente');
            } else {
                alert('El nombre de usuario ya existe');
            }
        });
    } else {
        alert('Por favor, ingresa un nombre de usuario y contraseña');
    }
});