## RF-PL-10 – Renovar plan premium

### Descripción  
El sistema debe permitir al usuario renovar su plan Premium antes o después de la expiración.

### Actor(es)  
- Trader  

### Precondiciones  
- El usuario posee o poseyó un plan Premium  

### Flujo básico  
1. El usuario selecciona renovar plan  
2. El sistema redirige al módulo de pago  
3. El sistema procesa el pago  
4. El sistema reactiva el plan Premium  

### Flujos alternos  
- 3A. Pago rechazado  
  - El sistema informa y permite reintento  

### Postcondiciones  
- El plan Premium queda activo  

### Reglas de negocio  
- RN-PL-12: La renovación puede realizarse en cualquier momento  
