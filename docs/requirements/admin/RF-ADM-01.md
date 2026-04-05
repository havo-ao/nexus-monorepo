# Requisitos Funcionales – Administrador
## Sistema: Nexus

---

## RF-ADM-01 – Iniciar sesión en el sistema

### Descripción
El sistema debe permitir al administrador autenticarse mediante correo electrónico y contraseña desde el portal interno de acceso.

### Actor(es)
- Administrador

### Precondiciones
- El administrador ha sido creado previamente en el sistema.

### Flujo básico

1. El administrador accede al portal interno.
2. El sistema solicita:
   - correo electrónico
   - contraseña.
3. El sistema valida las credenciales.
4. Si son correctas, el sistema redirige al panel administrativo.

### Flujos alternos

**3A – Credenciales inválidas**

- El sistema informa error.
- Permite reintentar autenticación.