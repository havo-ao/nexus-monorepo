## RF-PL-09 – Cancelar plan premium

### Descripción  
El sistema debe permitir al usuario cancelar su plan Premium en cualquier momento.

### Actor(es)  
- Trader Premium  

### Precondiciones  
- El usuario posee un plan Premium activo  

### Flujo básico  
1. El usuario accede a la gestión de suscripción  
2. El usuario selecciona cancelar plan  
3. El sistema registra la cancelación  
4. El sistema mantiene el plan activo hasta la fecha de expiración  

### Flujos alternos  
- N/A  

### Postcondiciones  
- El plan queda marcado como no renovable  

### Reglas de negocio  
- RN-PL-11: La cancelación no implica reembolso del periodo ya pagado  
