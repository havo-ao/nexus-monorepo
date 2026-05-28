## RF-CM-05 – Generar contrato con comisionista

### Descripción  
El sistema debe permitir al trader generar un contrato con un comisionista.

### Actor(es)  
- Trader  

### Precondiciones  
- El usuario no posee un contrato activo o ha cancelado el existente  

### Flujo básico  
1. El usuario selecciona "Generar contrato"  
2. El sistema solicita:
   - Tipo de contrato (asesoría u operación)  
   - Duración  
   - Permisos  
3. El sistema registra contrato con estado `EN_NEGOCIACION`  

### Flujos alternos  
- 1A. Usuario con contrato activo  
  - El sistema impide creación  
  - Solicita cancelar contrato existente  

### Postcondiciones  
- El contrato queda en estado de negociación  

### Reglas de negocio  
- RN-CM-03: Un trader solo puede tener un contrato activo  
