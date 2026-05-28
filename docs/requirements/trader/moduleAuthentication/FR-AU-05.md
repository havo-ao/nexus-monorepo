## RF-AU-05 – Restringir acceso a funcionalidades según estado

### Descripción  
El sistema debe restringir el acceso a funcionalidades de trading según el estado del usuario.

### Actor(es)  
- Trader  

### Precondiciones  
- El usuario ha iniciado sesión  

### Flujo básico  
1. El sistema valida el estado del usuario  
2. Si estado ≠ `APROBADO`:
   - el sistema redirige al onboarding financiero  
3. Si estado = `APROBADO`:
   - el usuario accede a la plataforma completa  

### Flujos alternos  
- N/A  

### Postcondiciones  
- El usuario accede únicamente a funcionalidades permitidas  

### Reglas de negocio  
- RN-AU-06: Solo usuarios aprobados pueden operar en el mercado