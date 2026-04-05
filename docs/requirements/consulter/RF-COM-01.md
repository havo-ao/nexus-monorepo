# Requisitos Funcionales – Comisionista
## Sistema: Nexus


## RF-COM-01 – Iniciar sesión en el sistema

### Descripción
El sistema debe permitir al usuario comisionista autenticarse mediante correo electrónico y contraseña a través del portal interno de acceso para comisionistas, administradores y área jurídica.

### Actor(es)
- Comisionista

### Precondiciones
- El usuario comisionista ha sido creado previamente por un administrador del sistema.

### Flujo básico

1. El comisionista accede al portal interno de autenticación.
2. El sistema solicita:
   - correo electrónico
   - contraseña.
3. El sistema valida las credenciales ingresadas.
4. Si las credenciales son válidas, el sistema redirige al panel principal del comisionista.

### Flujos alternos

**3A – Credenciales inválidas**

- El sistema informa que las credenciales no son válidas.
- El sistema permite reintentar el acceso.
