## RF-AU-01 – Registrar usuario trader

### Descripción  
El sistema debe permitir a un usuario no autenticado registrarse como trader mediante el diligenciamiento de un formulario con sus datos personales y de acceso.

### Actor(es)  
- Trader (no autenticado)

### Precondiciones  
- El usuario accede al formulario de registro  

### Flujo básico  
1. El sistema solicita los siguientes datos:
   - Correo electrónico  
   - Contraseña  
   - Número telefónico  
   - Nombres  
   - Apellidos  
   - Sexo  
   - Nacionalidad  
   - Zona horaria  
   - Experiencia en trading (Principiante, Intermedio, Experto)  
2. El usuario diligencia el formulario  
3. El sistema valida el formato de los datos  
4. El sistema registra al usuario en la plataforma  
5. El sistema asigna estado inicial: `REGISTRADO`  

### Flujos alternos  
- 3A. Datos inválidos  
  - El sistema muestra errores y solicita corrección  

- 4A. Correo ya registrado  
  - El sistema informa al usuario y bloquea el registro  

### Postcondiciones  
- El usuario queda registrado en el sistema  

### Reglas de negocio  
- RN-AU-01: El correo electrónico debe ser único  
- RN-AU-02: La contraseña debe cumplir políticas de seguridad  
