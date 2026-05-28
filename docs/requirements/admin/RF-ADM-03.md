## RF-ADM-03 – Gestionar usuarios internos

### Descripción
El sistema debe permitir al administrador gestionar los usuarios internos de la plataforma.

### Actor(es)
- Administrador

### Tipos de usuario gestionados

- Comisionista
- Administrador
- Usuario de área jurídica

---

### RF-ADM-03.1 – Crear usuario interno

#### Flujo básico

1. El administrador accede al módulo de gestión de usuarios.
2. Selecciona crear usuario.
3. El sistema solicita:
   - nombre
   - correo
   - rol
   - datos personales requeridos.
4. El sistema crea el usuario.

---

### RF-ADM-03.2 – Editar usuario interno

#### Flujo básico

1. El administrador selecciona un usuario existente.
2. El sistema permite modificar sus datos.
3. El sistema guarda los cambios.

---

### RF-ADM-03.3 – Eliminar usuario interno

#### Flujo básico

1. El administrador selecciona un usuario.
2. El sistema solicita confirmación.
3. El sistema desactiva el usuario.

### Reglas de negocio

RN-ADM-03: Un comisionista con contratos activos no puede ser eliminado.

RN-ADM-04: La eliminación de usuarios se realiza mediante desactivación lógica.
