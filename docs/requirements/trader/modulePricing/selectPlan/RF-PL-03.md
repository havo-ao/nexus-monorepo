## RF-PL-03 – Procesar pago de plan premium

### Descripción  
El sistema debe procesar el pago del plan Premium mediante un servicio externo de pagos.

### Actor(es)  
- Trader  

### Precondiciones  
- El usuario selecciona el plan Premium  

### Flujo básico  
1. El sistema redirige al módulo de pago  
2. El usuario ingresa los datos de pago  
3. El sistema procesa la transacción  
4. El sistema valida el resultado del pago  
5. El sistema registra la transacción  
6. El sistema asigna el plan Premium al usuario  

### Flujos alternos  
- 3A. Pago rechazado  
  - El sistema informa al usuario  
  - Permite reintento  

- 3B. Error técnico en pago  
  - El sistema registra el error  
  - Permite reintento  

### Postcondiciones  
- El usuario obtiene acceso al plan Premium (si el pago es exitoso)  

### Reglas de negocio  
- RN-PL-04: Todo pago debe ser registrado para auditoría  
- RN-PL-05: El acceso a funcionalidades premium solo se habilita tras pago exitoso  
