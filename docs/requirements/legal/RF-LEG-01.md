# Requisitos Funcionales – Área Jurídica
## Sistema: Nexus

---

## RF-LEG-01 – Iniciar sesión en el sistema

### Descripción
El sistema debe permitir a los usuarios del área jurídica autenticarse mediante correo electrónico y contraseña desde el portal interno de acceso de Nexus.

### Actor(es)
- Usuario Área Jurídica

### Precondiciones
- El usuario ha sido creado previamente por un administrador.

### Flujo básico

1. El usuario accede al portal interno.
2. El sistema solicita:
   - correo electrónico
   - contraseña.
3. El sistema valida las credenciales.
4. El sistema redirige al panel del área jurídica.

### Flujos alternos

**3A – Credenciales inválidas**

- El sistema informa error de autenticación.
- Permite reintentar.
