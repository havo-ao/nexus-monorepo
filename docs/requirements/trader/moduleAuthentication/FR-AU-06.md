## RF-AU-06 – Consultar estado de validación

### Descripción  
El sistema debe permitir al usuario visualizar el estado actual de su proceso de validación financiera.

### Actor(es)  
- Trader  

### Precondiciones  
- El usuario ha iniciado sesión  

### Flujo básico  
1. El sistema muestra el estado actual:
   - PENDIENTE_ENVIO  
   - EN_VALIDACION  
   - APROBADO  
   - RECHAZADO  
   - ERROR_TECNICO  

### Flujos alternos  
- N/A  

### Postcondiciones  
- El usuario conoce su estado  

### Reglas de negocio  
- RN-AU-07: El estado debe estar actualizado en tiempo real lógico  
