## RF-GP-04 – Editar datos financieros

### Descripción  
El sistema debe permitir modificar la información financiera del usuario.

### Flujo básico  
1. El usuario edita información  
2. El sistema valida datos  
3. El sistema guarda información  
4. El sistema cambia estado a `PENDIENTE_ENVIO`  
5. Se inicia nuevo proceso de validación  

### Reglas de negocio  
- RN-GP-04: Toda modificación requiere nueva validación externa  
